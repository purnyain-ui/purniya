import { createHash } from 'node:crypto';
import type { Order } from '../types';

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
export class ShippingInputError extends Error {}
export interface Parcel { weight: number; length: number; breadth: number; height: number; pickupLocation: string }

export function readParcel(input: Record<string, unknown>): Parcel {
  const parcel = {} as Parcel;
  for (const key of ['weight', 'length', 'breadth', 'height'] as const) {
    const value = input[key];
    const min = key === 'weight' ? 0.001 : 0.5;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > 10000) {
      throw new ShippingInputError(`${key}: enter a number between ${min} and 10000 (${key === 'weight' ? 'kg' : 'cm'}).`);
    }
    parcel[key] = value;
  }
  if (typeof input.pickupLocation !== 'string' || !input.pickupLocation.trim() || input.pickupLocation.length > 100) {
    throw new ShippingInputError('Enter the exact pickup location name from Shiprocket.');
  }
  parcel.pickupLocation = input.pickupLocation.trim();
  return parcel;
}

// Stable numeric reference; the local order ID stays unchanged.
export function shippingReference(orderId: string) {
  return BigInt('0x' + createHash('sha256').update(`purnya:${orderId}`).digest('hex').slice(0, 24)).toString();
}

export function buildShiprocketOrder(order: Order, parcel: Parcel) {
  if (!['UPI', 'Credit / Debit Card', 'Net Banking', 'Razorpay', 'Card', 'Netbanking', 'Wallet', 'EMI'].includes(order.paymentMethod)) {
    throw new ShippingInputError('Only prepaid online orders can be shipped.');
  }
  const address = order.shippingAddress;
  const phone = (address.phone || order.customer.phone || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  if (!address.fullName || !address.addressLine || !address.city || !address.state || !/^[1-9]\d{5}$/.test(address.pincode) || !/^[6-9]\d{9}$/.test(phone)) {
    throw new ShippingInputError('The order needs a complete Indian shipping address and a valid 10-digit phone number.');
  }
  if (!order.items.length || order.items.some(item => !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price < 0)) {
    throw new ShippingInputError('The order has invalid item quantities or prices.');
  }
  const subtotal = Math.round(order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
  if (!Number.isFinite(order.total) || order.total <= 0) throw new ShippingInputError('The order total must be positive.');
  const [firstName, ...rest] = address.fullName.trim().split(/\s+/);
  return {
    order_id: shippingReference(order.id), order_date: order.date,
    pickup_location: parcel.pickupLocation,
    comment: `Purnya order ${order.id}`,
    billing_customer_name: firstName, billing_last_name: rest.join(' '),
    billing_address: address.addressLine, billing_city: address.city,
    billing_pincode: address.pincode, billing_state: address.state,
    billing_country: 'India', billing_email: order.customer.email, billing_phone: phone,
    shipping_is_billing: true,
    order_items: order.items.map(item => ({ name: item.name + (item.variant ? ` (${item.variant})` : ''),
      sku: `${item.id}${item.variant ? '-' + createHash('sha256').update(item.variant).digest('hex').slice(0, 10) : ''}`,
      units: item.quantity, selling_price: item.price })),
    payment_method: 'Prepaid',
    // Legacy orders don't store shipping/discount separately: derive their net adjustment
    // so Shiprocket's payable total always equals the actual order total.
    sub_total: subtotal,
    shipping_charges: Math.max(0, Math.round((order.total - subtotal) * 100) / 100),
    total_discount: Math.max(0, Math.round((subtotal - order.total) * 100) / 100),
    weight: parcel.weight, length: parcel.length, breadth: parcel.breadth, height: parcel.height,
  };
}

async function request(path: string, body?: unknown, token?: string) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: body === undefined ? 'GET' : 'POST', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(25000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Shiprocket rejected the request (HTTP ${response.status}). Check the account, API permissions, pickup location and order details in Shiprocket.`);
  return data;
}

export async function shiprocketToken(): Promise<string> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) throw new Error('Configure SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD on the server.');
  const data = await request('/auth/login', { email, password });
  if (typeof data.token !== 'string' || !data.token) throw new Error('Shiprocket authentication failed. Use API-user credentials.');
  return data.token;
}

export function shiprocketRequest(token: string, path: string, body?: unknown) {
  return request(path, body, token);
}
