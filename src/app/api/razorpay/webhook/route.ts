import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment, validSignature } from '../../../../lib/razorpayServer';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 });
  const body = await req.text();
  if (!validSignature(body, req.headers.get('x-razorpay-signature'), secret)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }
  try {
    const event = JSON.parse(body);
    if (!['payment.authorized', 'payment.captured', 'order.paid'].includes(event.event)) {
      return NextResponse.json({ received: true });
    }
    const payment = event.payload?.payment?.entity;
    if (typeof payment?.order_id !== 'string' || typeof payment?.id !== 'string') {
      return NextResponse.json({ error: 'Missing payment.' }, { status: 400 });
    }
    // Unknown checkouts may belong to another integration on the same account.
    await confirmPayment(payment.order_id, payment.id);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Payment webhook failed:', err);
    // Non-2xx asks Razorpay to retry temporary database/API failures.
    return NextResponse.json({ error: 'Please retry delivery.' }, { status: 503 });
  }
}
