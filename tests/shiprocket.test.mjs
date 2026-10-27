import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

const source = stripTypeScriptTypes(readFileSync(new URL('../src/lib/shiprocketServer.ts', import.meta.url), 'utf8'));
const { readParcel, buildShiprocketOrder, shippingReference, shiprocketToken, shiprocketRequest, ShippingInputError } =
  await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const parcel = { weight: 0.4, length: 15, breadth: 12, height: 6, pickupLocation: 'Primary' };
const order = {
  id: 'PUR-2026-ABC123', date: '2026-10-27', total: 900, paymentMethod: 'UPI',
  items: [{ id: 'product-1', name: 'Gift', price: 500, quantity: 2, variant: 'Gold' }],
  customer: { name: 'Sample Buyer', phone: '9876543210', email: 'buyer@example.com' },
  shippingAddress: { fullName: 'Sample Buyer', phone: '+91 9876543210', addressLine: '123 Sample Road',
    city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
};

test('parcel validation rejects missing, non-numeric, zero, negative and infinite measurements', () => {
  assert.deepEqual(readParcel(parcel), parcel);
  for (const key of ['weight', 'length', 'breadth', 'height']) {
    for (const value of [undefined, '', '1', 0, -1, Infinity, NaN, 10001]) {
      assert.throws(() => readParcel({ ...parcel, [key]: value }));
    }
  }
  assert.throws(() => readParcel({ ...parcel, pickupLocation: ' ' }));
});

test('reference is stable, numeric, separate from storefront ID and varies per order', () => {
  assert.match(shippingReference(order.id), /^\d{1,50}$/);
  assert.equal(shippingReference(order.id), shippingReference(order.id));
  assert.notEqual(shippingReference(order.id), shippingReference('PUR-2026-OTHER'));
});

test('payload preserves packed measurements, names, quantities and actual discounted payable total', () => {
  const payload = buildShiprocketOrder(order, parcel);
  assert.equal(payload.billing_phone, '9876543210');
  assert.equal(payload.billing_customer_name, 'Sample');
  assert.equal(payload.billing_last_name, 'Buyer');
  assert.equal(payload.payment_method, 'Prepaid');
  assert.equal(payload.order_items[0].units, 2);
  assert.equal(payload.sub_total + payload.shipping_charges - payload.total_discount, order.total);
  assert.equal(payload.weight, parcel.weight);
  assert.equal(payload.breadth, parcel.breadth);
  assert.equal(payload.pickup_location, parcel.pickupLocation);
  assert.notEqual(payload.order_id, order.id);
  const withShipping = buildShiprocketOrder({ ...order, total: 1099 }, parcel);
  assert.equal(withShipping.payment_method, 'Prepaid');
  assert.equal(withShipping.sub_total + withShipping.shipping_charges - withShipping.total_discount, 1099);
  assert.throws(() => buildShiprocketOrder({ ...order, paymentMethod: 'Cash on Delivery' }, parcel));
  assert.notEqual(payload.order_items[0].sku, buildShiprocketOrder({ ...order, items: [{ ...order.items[0], variant: 'Silver' }] }, parcel).order_items[0].sku);
});

test('invalid address, item quantity and total cannot be sent for booking', () => {
  assert.throws(() => buildShiprocketOrder({ ...order, shippingAddress: { ...order.shippingAddress, pincode: '000000' } }, parcel));
  assert.throws(() => buildShiprocketOrder({ ...order, items: [{ ...order.items[0], quantity: 1.5 }] }, parcel));
  assert.throws(() => buildShiprocketOrder({ ...order, total: 0 }, parcel));
});

test('server authentication and shipment requests use bearer tokens without exposing credentials in errors', async () => {
  const originalFetch = globalThis.fetch;
  const originalEmail = process.env.SHIPROCKET_EMAIL;
  const originalPassword = process.env.SHIPROCKET_PASSWORD;
  process.env.SHIPROCKET_EMAIL = 'api@example.com'; process.env.SHIPROCKET_PASSWORD = 'test-password';
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => url.endsWith('/auth/login') ? { token: 'test-token' } : { order_id: 123, shipment_id: 456 } };
  };
  try {
    const token = await shiprocketToken();
    const response = await shiprocketRequest(token, '/orders/create/adhoc', buildShiprocketOrder(order, parcel));
    assert.equal(response.shipment_id, 456);
    assert.equal(calls[1].options.headers.Authorization, 'Bearer test-token');
    assert.equal(JSON.parse(calls[0].options.body).email, 'api@example.com');
    assert.equal(calls[0].options.cache, 'no-store');
    globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({ password: 'test-password' }) });
    await assert.rejects(shiprocketToken(), error => !error.message.includes('test-password') && error.message.includes('401'));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalEmail === undefined) delete process.env.SHIPROCKET_EMAIL; else process.env.SHIPROCKET_EMAIL = originalEmail;
    if (originalPassword === undefined) delete process.env.SHIPROCKET_PASSWORD; else process.env.SHIPROCKET_PASSWORD = originalPassword;
  }
});

const vm = await import('node:vm');
const routeSource = stripTypeScriptTypes(readFileSync(new URL('../src/app/api/admin/shipping/route.ts', import.meta.url), 'utf8'))
  .replace(/^import .*;$/gm, '').replace(/export /g, '');
function routeHarness({ denied = false, paid = true, failCreate = false } = {}) {
  const records = new Map(); const calls = []; const updates = [];
  const savedOrder = { ...order, status: 'New', paymentStatus: paid ? 'paid' : 'pending' };
  const db = { from(table) {
    let operation = 'select', patch, filters = [], value;
    const run = () => {
      if (table === 'orders') {
        if (operation === 'update') updates.push(patch);
        return { data: operation === 'select' ? savedOrder : [savedOrder], error: null };
      }
      if (operation === 'insert') {
        if (records.has(value.order_id)) return { error: { code: '23505' } };
        records.set(value.order_id, { ...value }); return { data: [value], error: null };
      }
      const rows = [...records.values()].filter(row => filters.every(([key, expected]) => row[key] === expected));
      if (operation === 'update') rows.forEach(row => Object.assign(row, patch));
      return { data: rows, error: null };
    };
    const builder = {
      select() { return this; }, order() { return this; },
      eq(key, expected) { filters.push([key, expected]); return this; }, in() { return this; },
      insert(row) { operation = 'insert'; value = row; return this; },
      update(values) { operation = 'update'; patch = values; return this; },
      async maybeSingle() { const result = run(); return { ...result, data: Array.isArray(result.data) ? result.data[0] || null : result.data }; },
      async single() { return this.maybeSingle(); },
      then(resolve, reject) { return Promise.resolve(run()).then(resolve, reject); },
    };
    return builder;
  } };
  const context = vm.createContext({
    NextResponse: { json: (body, options) => ({ status: options?.status || 200, body }) },
    getServiceSupabase: () => db,
    requireAdmin: async () => denied ? { error: 'Forbidden', status: 403 } : { session: {} },
    mapOrderRow: row => row, readParcel, buildShiprocketOrder, shippingReference,
    ShippingInputError,
    shiprocketToken: async () => 'mock-token',
    shiprocketRequest: async (_token, path) => {
      calls.push(path);
      if (path.endsWith('/adhoc')) {
        if (failCreate) throw new Error('Connection lost after request.');
        return { order_id: 111, shipment_id: 222 };
      }
      if (path.endsWith('/awb')) return { awb_assign_status: 1, response: { data: { awb_code: 'REAL-AWB', courier_name: 'Courier' } } };
      return { pickup_status: 1 };
    },
  });
  vm.runInContext(routeSource, context);
  return { post: action => context.POST({ json: async () => ({ ...parcel, orderId: order.id, action }) }), records, calls, updates };
}

test('shipping permission and captured payment are required before calling Shiprocket', async () => {
  const denied = routeHarness({ denied: true });
  assert.equal((await denied.post('create')).status, 403); assert.equal(denied.calls.length, 0);
  const unpaid = routeHarness({ paid: false });
  assert.equal((await unpaid.post('create')).status, 409); assert.equal(unpaid.calls.length, 0);
});

test('concurrent creates book once and AWB/pickup use separate stored IDs without marking shipped', async () => {
  const h = routeHarness();
  const results = await Promise.all([h.post('create'), h.post('create')]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  assert.equal(h.calls.filter(path => path.endsWith('/adhoc')).length, 1);
  assert.equal(h.records.get(order.id).shiprocket_order_id, 111);
  assert.equal(h.records.get(order.id).shipment_id, 222);
  assert.equal((await h.post('awb')).status, 200);
  assert.equal(h.records.get(order.id).awb_code, 'REAL-AWB');
  assert.equal((await h.post('awb')).status, 409);
  assert.equal((await h.post('pickup')).status, 200);
  assert.equal((await h.post('pickup')).status, 409);
  assert.equal(h.records.get(order.id).state, 'pickup_requested');
  assert.ok(h.updates.every(patch => patch.status === 'Processing'));
});

test('ambiguous provider errors block a second external booking', async () => {
  const h = routeHarness({ failCreate: true });
  assert.equal((await h.post('create')).status, 502);
  assert.equal(h.records.get(order.id).state, 'needs_review');
  assert.equal((await h.post('create')).status, 409);
  assert.equal(h.calls.length, 1);
});
