import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { finalizePaidOrder, humanizeMethod } from '../../../../lib/orderServer';

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('Razorpay API keys are not configured.');
  }
  return new Razorpay({ key_id, key_secret });
}

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification details.' },
        { status: 400 }
      );
    }

    // Razorpay's documented signature scheme: HMAC-SHA256 of "order_id|payment_id"
    // signed with your key secret. This is the only trustworthy way to confirm
    // a payment actually succeeded — never trust the client-side callback alone.
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed.' },
        { status: 400 }
      );
    }

    // Look up which method the customer actually used inside Razorpay's checkout
    // (UPI, card, netbanking, wallet) so it can be saved against the order.
    let method: string | undefined;
    try {
      const razorpay = getRazorpay();
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      method = (payment as any).method;
    } catch (fetchErr) {
      console.warn('Could not fetch payment method detail:', fetchErr);
    }

    // Create the order on the server (or get it back if this payment was already processed).
    const order = await finalizePaidOrder({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentMethod: humanizeMethod(method),
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Payment received, but the order could not be found.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error('Razorpay verify-payment error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Verification error.' },
      { status: 500 }
    );
  }
}
