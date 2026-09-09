import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

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
    const { amount, currency = 'INR', receipt } = await req.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order amount.' },
        { status: 400 }
      );
    }

    // Razorpay expects the smallest currency unit (paise for INR).
    const amountInPaise = Math.round(amount * 100);

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || `purnya_receipt_${Date.now()}`,
    });

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error('Razorpay create-order error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create Razorpay order.' },
      { status: 500 }
    );
  }
}