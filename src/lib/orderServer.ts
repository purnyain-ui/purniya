// lib/orderServer.ts
// Orders are created here, on the server, once Razorpay confirms payment, from
// the checkout snapshot that create-order saved. Server-only.
//
// finalizePaidOrder is safe to call more than once for the same payment (e.g. a
// retried verify-payment request): the first call creates the order, later
// calls get the same order back.

import { randomInt } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Address, Order, OrderItem } from '../types';
import { getServiceSupabase } from './supabaseServer';
import { orderToRow } from './supabase';

export interface CheckoutSnapshot {
  userId: string;
  customer: { name: string; email: string; phone: string };
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shipping: number;
  total: number;
}

export interface ConfirmedPayment {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature?: string;
  paymentMethod: string;
}

// Turns Razorpay's internal method codes into a friendly label for storage/display.
export function humanizeMethod(method?: string): string {
  switch (method) {
    case 'upi':
      return 'UPI';
    case 'card':
      return 'Card';
    case 'netbanking':
      return 'Netbanking';
    case 'wallet':
      return 'Wallet';
    case 'emi':
      return 'EMI';
    default:
      return 'Razorpay';
  }
}

const ORDER_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** e.g. PUR-2026-7K3MQ9XA: random enough that ids neither collide nor can be guessed. */
function newOrderId(): string {
  let suffix = '';
  for (let i = 0; i < 8; i++) suffix += ORDER_ID_CHARS[randomInt(ORDER_ID_CHARS.length)];
  return `PUR-${new Date().getFullYear()}-${suffix}`;
}

export async function saveCheckoutSnapshot(razorpayOrderId: string, snapshot: CheckoutSnapshot) {
  const { error } = await getServiceSupabase()
    .from('checkout_sessions')
    .insert([{ razorpay_order_id: razorpayOrderId, payload: snapshot }]);
  if (error) throw new Error(`Could not save checkout: ${error.message}`);
}

function buildOrder(id: string, snapshot: CheckoutSnapshot, payment: ConfirmedPayment): Order {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return {
    id,
    date: new Date().toISOString().split('T')[0],
    status: 'New',
    items: snapshot.items,
    subtotal: snapshot.subtotal,
    discount: snapshot.discount,
    couponCode: snapshot.couponCode,
    shipping: snapshot.shipping,
    total: snapshot.total,
    customer: snapshot.customer,
    shippingAddress: snapshot.shippingAddress,
    // Labels from humanizeMethod (e.g. 'Card'), as stored on earlier orders.
    paymentMethod: payment.paymentMethod as Order['paymentMethod'],
    razorpayOrderId: payment.razorpayOrderId,
    razorpayPaymentId: payment.razorpayPaymentId,
    razorpaySignature: payment.razorpaySignature,
    paymentStatus: 'paid',
    trackingNumber: `BD-${id.slice(-6)}IN`,
    courierPartner: 'BlueDart Express',
    estimatedDelivery: '3 - 5 Business Days',
    trackingHistory: [
      { status: 'Order Placed & Confirmed', time: `${today}, Just Now`, location: 'Purnya.in Online Platform', completed: true },
      { status: 'Order Verified & Preparing for Dispatch', time: 'Upcoming', location: 'Purnya Central Warehouse', completed: false },
      { status: 'Dispatched with Courier', time: 'Upcoming', location: 'Bengaluru Logistics Hub', completed: false },
      { status: 'Delivered', time: 'Upcoming', location: 'Customer Address', completed: false },
    ],
  };
}

async function orderExists(db: SupabaseClient, orderId: string): Promise<boolean> {
  // A concurrent call may still be inserting; give it a few seconds.
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data } = await db.from('orders').select('id').eq('id', orderId).maybeSingle();
    if (data) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function bumpCouponUsage(db: SupabaseClient, code: string) {
  const { data } = await db.from('coupons').select('usage_count').eq('code', code).maybeSingle();
  if (!data) return;
  await db.from('coupons').update({ usage_count: Number(data.usage_count || 0) + 1 }).eq('code', code);
}

/**
 * Creates the order for a confirmed payment, exactly once. Returns null when
 * there is no checkout snapshot for this Razorpay order.
 */
export async function finalizePaidOrder(payment: ConfirmedPayment): Promise<Order | null> {
  const db = getServiceSupabase();
  const { data: session, error } = await db
    .from('checkout_sessions')
    .select('payload, order_id')
    .eq('razorpay_order_id', payment.razorpayOrderId)
    .maybeSingle();
  if (error) throw new Error(`Could not load checkout: ${error.message}`);
  if (!session) return null;

  const snapshot = session.payload as CheckoutSnapshot;
  if (session.order_id) {
    return (await orderExists(db, session.order_id)) ? buildOrder(session.order_id, snapshot, payment) : null;
  }

  // Claim this checkout so a concurrent call can't create a second order.
  const orderId = newOrderId();
  const { data: claimed, error: claimError } = await db
    .from('checkout_sessions')
    .update({ order_id: orderId })
    .eq('razorpay_order_id', payment.razorpayOrderId)
    .is('order_id', null)
    .select('order_id');
  if (claimError) throw new Error(`Could not claim checkout: ${claimError.message}`);
  if (!claimed || claimed.length === 0) {
    const { data: winner } = await db
      .from('checkout_sessions')
      .select('order_id')
      .eq('razorpay_order_id', payment.razorpayOrderId)
      .maybeSingle();
    return winner?.order_id && (await orderExists(db, winner.order_id))
      ? buildOrder(winner.order_id, snapshot, payment)
      : null;
  }

  const order = buildOrder(orderId, snapshot, payment);
  const { error: insertError } = await db
    .from('orders')
    .insert([{ ...orderToRow(order), user_id: snapshot.userId, created_at: new Date().toISOString() }]);
  if (insertError) {
    // Release the claim so a retry can try again.
    await db
      .from('checkout_sessions')
      .update({ order_id: null })
      .eq('razorpay_order_id', payment.razorpayOrderId)
      .eq('order_id', orderId);
    throw new Error(`Could not save order: ${insertError.message}`);
  }

  if (snapshot.couponCode) {
    await bumpCouponUsage(db, snapshot.couponCode).catch((err) =>
      console.warn('Coupon usage update failed:', err)
    );
  }
  return order;
}
