import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { priceCart, PricingError } from '../../../../lib/serverPricing';
import { sameAmount } from '../../../../lib/pricing';

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
    const { items, couponCode, expectedTotal, receipt } = await req.json();

    // The amount charged is always computed here from the database, never
    // taken from the browser.
    let pricing;
    try {
      pricing = await priceCart(items, couponCode);
    } catch (err) {
      if (err instanceof PricingError) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }
      throw err;
    }

    if (pricing.total <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order amount.' },
        { status: 400 }
      );
    }

    // If the bag the customer is looking at doesn't add up to what we'd charge
    // (stale prices, or a coupon that no longer applies), stop and let the
    // checkout page refresh the bag rather than charge a surprise amount.
    if (typeof expectedTotal !== 'number' || !sameAmount(expectedTotal, pricing.total)) {
      return NextResponse.json(
        { success: false, priceChanged: true, pricing, error: 'Prices in your bag have changed.' },
        { status: 409 }
      );
    }

    // Razorpay expects the smallest currency unit (paise for INR).
    const amountInPaise = Math.round(pricing.total * 100);

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: typeof receipt === 'string' && receipt ? receipt.slice(0, 40) : `purnya_receipt_${Date.now()}`,
    });

    return NextResponse.json({ success: true, order, pricing });
  } catch (err: any) {
    console.error('Razorpay create-order error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create Razorpay order.' },
      { status: 500 }
    );
  }
}
