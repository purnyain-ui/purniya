import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { priceCart, PricingError } from '../../../../lib/serverPricing';
import { sameAmount } from '../../../../lib/pricing';
import { getRequestUser } from '../../../../lib/supabaseServer';
import { saveCheckoutSnapshot } from '../../../../lib/orderServer';
import type { Address, OrderItem } from '../../../../types';

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('Razorpay API keys are not configured.');
  }
  return new Razorpay({ key_id, key_secret });
}

function text(value: unknown, max = 200): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function readShippingAddress(raw: any): Address | null {
  const address: Address = {
    id: text(raw?.id, 80) || `addr-checkout-${Date.now()}`,
    label: (['Home', 'Office', 'Other'].includes(raw?.label) ? raw.label : 'Home') as Address['label'],
    fullName: text(raw?.fullName, 120),
    phone: text(raw?.phone, 20),
    addressLine: text(raw?.addressLine, 300),
    city: text(raw?.city, 80),
    state: text(raw?.state, 80),
    pincode: text(raw?.pincode, 6),
  };
  const complete =
    address.fullName && address.phone && address.addressLine && address.city && address.state;
  return complete && /^[1-9]\d{5}$/.test(address.pincode) ? address : null;
}

export async function POST(req: NextRequest) {
  try {
    // Orders belong to the signed-in account, as on the checkout page.
    const auth = await getRequestUser(req);
    if ('error' in auth) {
      return NextResponse.json({ success: false, error: 'Please sign in again to place your order.' }, { status: 401 });
    }

    const { items, couponCode, expectedTotal, receipt, customer, shippingAddress } = await req.json();

    const customerName = text(customer?.name, 120);
    const customerPhone = text(customer?.phone, 20);
    const address = readShippingAddress(shippingAddress);
    if (!customerName || !customerPhone || !address) {
      return NextResponse.json(
        { success: false, error: 'Please complete your customer information and shipping address.' },
        { status: 400 }
      );
    }

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

    // What to turn into an order once Razorpay confirms payment (see lib/orderServer.ts).
    // Names and prices come from the server's pricing; image and category are display-only.
    const cartLines: any[] = Array.isArray(items) ? items : [];
    const orderItems: OrderItem[] = pricing.lines.map((line) => {
      const fromCart = cartLines.find((l) => l?.productId === line.productId);
      return {
        id: line.productId,
        name: line.name,
        price: line.unitPrice,
        quantity: line.quantity,
        image: text(fromCart?.image, 500),
        category: text(fromCart?.category, 120),
        variant: line.variant ? Object.values(line.variant).join(', ') : undefined,
      };
    });
    await saveCheckoutSnapshot(order.id, {
      userId: auth.user.id,
      customer: { name: customerName, email: auth.user.email, phone: customerPhone },
      shippingAddress: address,
      items: orderItems,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      couponCode: pricing.discount > 0 && typeof couponCode === 'string' ? couponCode.trim().toUpperCase() : undefined,
      shipping: pricing.shipping,
      total: pricing.total,
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
