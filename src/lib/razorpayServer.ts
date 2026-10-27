import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getServiceSupabase } from './supabaseServer';
import { finalizePaidOrder, humanizeMethod, type CheckoutSnapshot } from './orderServer';

export function validSignature(body: string, signature: unknown, secret: string): boolean {
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  return crypto.timingSafeEqual(
    crypto.createHmac('sha256', secret).update(body).digest(),
    Buffer.from(signature, 'hex')
  );
}

// Both the browser callback and webhook use the same verified, idempotent path.
export async function confirmPayment(orderId: string, paymentId: string, signature?: string) {
  const { data: session, error } = await getServiceSupabase().from('checkout_sessions')
    .select('payload').eq('razorpay_order_id', orderId).maybeSingle();
  if (error) throw new Error('Could not load checkout. Please retry.');
  if (!session) return null;
  const snapshot = session.payload as CheckoutSnapshot;
  const client = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  });
  let payment = await client.payments.fetch(paymentId);
  const amount = Math.round(snapshot.total * 100);
  if (payment.order_id !== orderId || Number(payment.amount) !== amount || payment.currency !== 'INR') {
    throw new Error('Payment does not match this checkout.');
  }
  if (payment.status === 'authorized') {
    try {
      payment = await client.payments.capture(paymentId, amount, 'INR');
    } catch {
      // Automatic capture or a concurrent callback may have captured it already.
      payment = await client.payments.fetch(paymentId);
    }
  }
  if (payment.status !== 'captured') throw new Error('Payment is awaiting capture. Please check My Orders shortly.');
  const order = await finalizePaidOrder({ razorpayOrderId: orderId, razorpayPaymentId: paymentId,
    razorpaySignature: signature, paymentMethod: humanizeMethod(payment.method) });
  if (!order) throw new Error('Order creation is still pending. Please retry.');
  return order;
}
