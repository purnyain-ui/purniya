import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment, validSignature } from '../../../../lib/razorpayServer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = await req.json();
    if (typeof orderId !== 'string' || typeof paymentId !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing payment details.' }, { status: 400 });
    }
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error('Payment service is not configured.');
    if (!validSignature(`${orderId}|${paymentId}`, signature, secret)) {
      return NextResponse.json({ success: false, error: 'Invalid payment signature.' }, { status: 400 });
    }
    const order = await confirmPayment(orderId, paymentId, signature);
    if (!order) throw new Error('Order confirmation is pending. Please check My Orders shortly.');
    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error('Payment confirmation failed:', err);
    return NextResponse.json({ success: false, error: 'Order confirmation is pending. Please check My Orders shortly.' }, { status: 503 });
  }
}
