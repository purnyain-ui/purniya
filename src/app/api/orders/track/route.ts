import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '../../../../lib/supabaseServer';
import { mapOrderRow } from '../../../../lib/supabase';

// Guest order tracking. An order is only shown to someone who knows both its
// order ID (or tracking number) and the email or phone number it was placed with.

function lastTenDigits(value: string) {
  return value.replace(/\D/g, '').slice(-10);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reference = typeof body?.reference === 'string' ? body.reference.trim() : '';
    const contact = typeof body?.contact === 'string' ? body.contact.trim().toLowerCase() : '';
    if (!reference || !contact) {
      return NextResponse.json(
        { success: false, error: 'Enter your order ID and the email or phone number used for the order.' },
        { status: 400 }
      );
    }

    const db = getServiceSupabase();
    const ref = reference.toUpperCase();
    const [byId, byTracking] = await Promise.all([
      db.from('orders').select('*').eq('id', ref).limit(1),
      db.from('orders').select('*').eq('tracking_number', ref).limit(1),
    ]);
    if (byId.error) throw byId.error;
    if (byTracking.error) throw byTracking.error;
    const row = byId.data?.[0] || byTracking.data?.[0];

    const contactDigits = lastTenDigits(contact);
    const matches =
      row &&
      ((contact.includes('@') && (row.customer_email || '').toLowerCase() === contact) ||
        (contactDigits.length === 10 &&
          [row.customer_phone, row.shipping_address?.phone].some(
            (phone) => typeof phone === 'string' && lastTenDigits(phone) === contactDigits
          )));

    // Same answer whether the order doesn't exist or the contact doesn't match,
    // so this can't be used to discover order IDs.
    if (!matches) {
      return NextResponse.json(
        { success: false, error: 'No order found with those details.' },
        { status: 404 }
      );
    }

    const order = mapOrderRow(row);
    delete order.razorpaySignature;
    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error('Order tracking error:', err);
    return NextResponse.json({ success: false, error: 'Could not look up the order right now.' }, { status: 500 });
  }
}
