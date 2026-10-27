import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase, requireAdmin } from '../../../../lib/supabaseServer';
import { mapOrderRow } from '../../../../lib/supabase';
import { buildShiprocketOrder, readParcel, shippingReference, ShippingInputError, shiprocketRequest, shiprocketToken } from '../../../../lib/shiprocketServer';

export const runtime = 'nodejs';
const fail = (error: string, status = 500) => NextResponse.json({ success: false, error }, { status });

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req, 'shipping');
    if ('error' in auth) return fail(auth.error, auth.status);
    const db = getServiceSupabase();
    const [orders, shipments] = await Promise.all([
      db.from('orders').select('*').order('created_at', { ascending: false }),
      db.from('shiprocket_shipments').select('*'),
    ]);
    if (orders.error || shipments.error) return fail('Could not load shipping. Run the Shiprocket SQL migration and check database access.');
    return NextResponse.json({ success: true, orders: (orders.data || []).map(mapOrderRow), shipments: shipments.data || [] });
  } catch {
    return fail('Could not load shipping. Check server configuration and sign in again.');
  }
}

export async function POST(req: NextRequest) {
  let claimedOrderId: string | undefined;
  try {
    const db = getServiceSupabase();
    const auth = await requireAdmin(req, 'shipping');
    if ('error' in auth) return fail(auth.error, auth.status);
    const body = await req.json();
    if (typeof body.orderId !== 'string' || !['create', 'awb', 'pickup'].includes(body.action)) return fail('Invalid shipping request.', 400);
    const { data: row, error: orderError } = await db.from('orders').select('*').eq('id', body.orderId).maybeSingle();
    if (orderError) return fail('Could not load order.');
    if (!row) return fail('Order not found.', 404);
    const order = mapOrderRow(row);
    if (!['New', 'Processing'].includes(order.status)) return fail('Only new or processing orders can be booked for shipping.', 409);
    if (order.paymentMethod !== 'Cash on Delivery' && order.paymentStatus !== 'paid') return fail('Payment must be captured before shipping.', 409);
    const { data: existing, error: readError } = await db.from('shiprocket_shipments').select('*').eq('order_id', order.id).maybeSingle();
    if (readError) return fail('Run the Shiprocket SQL migration before shipping.');

    // Authenticate before claiming the operation so a bad API login cannot lock an order.
    const token = await shiprocketToken();
    let patch: Record<string, unknown>;
    if (body.action === 'create') {
      if (existing) return fail('This order already has a shipping booking. Refresh to view its IDs; check Shiprocket before retrying.', 409);
      const parcel = readParcel(body);
      const payload = buildShiprocketOrder(order, parcel);
      const { error } = await db.from('shiprocket_shipments').insert({
        order_id: order.id, reference_id: shippingReference(order.id), pickup_location: parcel.pickupLocation,
        weight: parcel.weight, length: parcel.length, breadth: parcel.breadth, height: parcel.height, state: 'creating',
      });
      if (error) return fail('Could not reserve shipping booking. Refresh the page; another request may already have booked it.', 409);
      claimedOrderId = order.id;
      const result = await shiprocketRequest(token, '/orders/create/adhoc', payload);
      if (!Number.isSafeInteger(Number(result.order_id)) || Number(result.order_id) <= 0 || !Number.isSafeInteger(Number(result.shipment_id)) || Number(result.shipment_id) <= 0) {
        throw new Error('Shiprocket did not return valid order and shipment IDs. Check the dashboard before retrying.');
      }
      patch = { shiprocket_order_id: result.order_id, shipment_id: result.shipment_id, state: 'created' };
    } else {
      const expectedState = body.action === 'awb' ? 'created' : 'awb_assigned';
      const busyState = body.action === 'awb' ? 'assigning_awb' : 'requesting_pickup';
      if (!existing?.shipment_id || existing.state !== expectedState) return fail('This shipping action is not available. Refresh and check the booking status.', 409);
      const { data: claimed, error } = await db.from('shiprocket_shipments')
        .update({ state: busyState, updated_at: new Date().toISOString() }).eq('order_id', order.id).eq('state', expectedState).select('order_id');
      if (error || !claimed?.length) return fail('Another shipping action is in progress. Refresh shortly.', 409);
      claimedOrderId = order.id;
      if (body.action === 'awb') {
        const result = await shiprocketRequest(token, '/courier/assign/awb', { shipment_id: existing.shipment_id });
        const details = result.response?.data;
        if (Number(result.awb_assign_status) !== 1 || !details?.awb_code) throw new Error('AWB was not assigned. Check courier availability and wallet balance in Shiprocket.');
        patch = { state: 'awb_assigned', awb_code: String(details.awb_code), courier_name: details.courier_name || 'Shiprocket' };
      } else {
        const result = await shiprocketRequest(token, '/courier/generate/pickup', { shipment_id: [existing.shipment_id] });
        if (Number(result.pickup_status) !== 1) throw new Error('Pickup was not confirmed. Check this shipment in Shiprocket.');
        patch = { state: 'pickup_requested' };
      }
    }
    const { data: shipment, error: saveError } = await db.from('shiprocket_shipments')
      .update({ ...patch, last_error: null, updated_at: new Date().toISOString() }).eq('order_id', order.id).select('*').single();
    if (saveError) throw new Error('Shiprocket processed the request but its result could not be saved. Check the Shiprocket dashboard before taking further action.');
    // Booking/AWB/pickup request do not mean the parcel has physically shipped.
    const { error: syncError } = await db.from('orders').update({ status: 'Processing',
      ...(shipment.awb_code ? { tracking_number: shipment.awb_code, courier: shipment.courier_name || 'Shiprocket' } : {}),
    }).eq('id', order.id).in('status', ['New', 'Processing']);
    return NextResponse.json({ success: true, shipment,
      warning: syncError ? 'Booking saved. Customer tracking could not be updated; copy the AWB into Admin Orders.' : undefined });
  } catch (err) {
    const message = err instanceof Error && (err instanceof ShippingInputError || !['SyntaxError', 'TypeError'].includes(err.name))
      ? err.message : 'Shipping request failed. Check Shiprocket before retrying.';
    if (claimedOrderId) {
      // Ambiguous external failures must not trigger a second shipment or pickup.
      await getServiceSupabase().from('shiprocket_shipments').update({ state: 'needs_review', last_error: message,
        updated_at: new Date().toISOString() }).eq('order_id', claimedOrderId);
    }
    return fail(message, err instanceof ShippingInputError ? 400 : 502);
  }
}
