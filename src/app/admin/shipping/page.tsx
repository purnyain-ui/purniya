'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Truck, Package, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import type { Order } from '../../../types';
import { useStore } from '../../../context/StoreContext';

interface Shipment {
  order_id: string; reference_id: string; shiprocket_order_id?: number; shipment_id?: number;
  awb_code?: string; courier_name?: string; pickup_location: string;
  weight: number; length: number; breadth: number; height: number;
  state: string; last_error?: string;
}
const fields = [ ['weight', 'Packed weight (kg)'], ['length', 'Length (cm)'],
  ['breadth', 'Width / breadth (cm)'], ['height', 'Height (cm)'] ] as const;
const inputClass = 'w-full rounded-xl border border-[#DADFD9] bg-white p-3 text-sm text-[#0B241C]';
const buttonClass = 'rounded-xl bg-[#0B241C] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50';

async function adminRequest(body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Please sign in to your admin account again.');
  const response = await fetch('/api/admin/shipping', {
    method: body ? 'POST' : 'GET', cache: 'no-store',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || 'Could not complete shipping request.');
  return data;
}

export default function AdminShippingPage() {
  const { refreshOrders } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [parcel, setParcel] = useState({ weight: '', length: '', breadth: '', height: '', pickupLocation: '' });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminRequest();
      setOrders(data.orders); setShipments(data.shipments);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load shipping.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setSelectedId(new URLSearchParams(window.location.search).get('order') || '');
    void load();
  }, [load]);

  const eligible = orders.filter(order => ['New', 'Processing'].includes(order.status) &&
    order.paymentStatus === 'paid' &&
    !shipments.some(shipment => shipment.order_id === order.id));
  const selected = eligible.find(order => order.id === selectedId);

  async function act(orderId: string, action: 'create' | 'awb' | 'pickup') {
    setBusy(true); setError(''); setNotice('');
    let failure = '';
    try {
      const data = await adminRequest({ orderId, action, ...parcel,
        ...Object.fromEntries(fields.map(([key]) => [key, Number(parcel[key])])) });
      setNotice(data.warning || (action === 'create' ? 'Order created in Shiprocket. Assign an AWB below.' :
        action === 'awb' ? 'AWB assigned. You can now request pickup.' : 'Pickup requested. Hand over the parcel when the courier arrives.'));
      if (action === 'create') {
        setSelectedId('');
        setParcel(current => ({ ...current, weight: '', length: '', breadth: '', height: '' }));
      }
      await refreshOrders();
    } catch (err) {
      failure = err instanceof Error ? err.message : 'Shipping request failed. Check Shiprocket before retrying.';
    } finally {
      await load();
      if (failure) setError(failure);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 text-[#0B241C]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-3xl font-bold">Shiprocket Shipping</h1>
          <p className="mt-2 text-sm text-[#5A7469]">Pack the order, enter its measurements, then create a shipment and arrange pickup.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border p-3 text-sm" onClick={() => void load()} disabled={busy || loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">{notice}</div>}
      {loading && <p role="status" className="text-sm">Loading orders and shipments…</p>}

      <section className="space-y-5 rounded-3xl border border-[#E2DBD0] bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Package size={20} /> Create a Shiprocket order</h2>
        <p className="text-sm text-[#5A7469]">Use the total packed parcel weight in kilograms and outer box dimensions in centimetres.</p>
        <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (selected) void act(selected.id, 'create'); }}>
          <label className="block space-y-2 text-sm font-semibold">Purnya order
            <select className={inputClass} required value={selectedId} onChange={event => setSelectedId(event.target.value)} disabled={busy || loading}>
              <option value="">Select an order ({eligible.length} ready)</option>
              {eligible.map(order => <option key={order.id} value={order.id}>{order.id} · {order.customer.name} · ₹{order.total}</option>)}
            </select>
          </label>
          {selected && <p className="text-sm text-[#5A7469]">{selected.shippingAddress.fullName} · {selected.shippingAddress.city}, {selected.shippingAddress.pincode} · {selected.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)</p>}
          <label className="block space-y-2 text-sm font-semibold">Shiprocket pickup location name
            <input className={inputClass} required maxLength={100} placeholder="Exact name saved in Shiprocket" value={parcel.pickupLocation}
              onChange={event => setParcel(current => ({ ...current, pickupLocation: event.target.value }))} disabled={busy} />
          </label>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {fields.map(([key, label]) => <label key={key} className="block space-y-2 text-sm font-semibold">{label}
              <input className={inputClass} type="number" required min={key === 'weight' ? '0.001' : '0.5'} max="10000" step="any"
                value={parcel[key]} placeholder={key === 'weight' ? 'e.g. 0.5' : 'e.g. 10'}
                onChange={event => setParcel(current => ({ ...current, [key]: event.target.value }))} disabled={busy} />
            </label>)}
          </div>
          <button className={buttonClass} disabled={busy || loading || !selected}>{busy ? 'Processing…' : 'Create in Shiprocket'}</button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Truck size={21} /> Shipment bookings</h2>
          <a href="https://app.shiprocket.in/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm underline">Open Shiprocket <ExternalLink size={14} /></a>
        </div>
        <input aria-label="Search shipments" className={inputClass} placeholder="Search Purnya ID, Shiprocket ID, shipment ID or AWB" value={filter} onChange={event => setFilter(event.target.value)} />
        {!loading && !shipments.length && <p className="rounded-xl bg-white p-6 text-sm">No Shiprocket bookings yet.</p>}
        {shipments.filter(shipment => [shipment.order_id, shipment.reference_id, shipment.shiprocket_order_id, shipment.shipment_id, shipment.awb_code]
          .some(value => String(value || '').toLowerCase().includes(filter.toLowerCase()))).map(shipment => (
          <article key={shipment.order_id} className="space-y-4 rounded-2xl border border-[#E2DBD0] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href="/admin/orders" className="font-bold underline">{shipment.order_id}</Link>
              <span className="rounded-full bg-[#F3F0E8] px-3 py-1 text-xs font-semibold">{shipment.state.replaceAll('_', ' ')}</span>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {([['Shiprocket reference', shipment.reference_id], ['Shiprocket order ID', shipment.shiprocket_order_id],
                ['Shipment ID', shipment.shipment_id], ['AWB / tracking', shipment.awb_code]] as const).map(([label, value]) => (
                <div key={label}><dt className="text-xs text-[#5A7469]">{label}</dt><dd className="mt-1 break-all font-mono">{value || 'Pending'}</dd></div>
              ))}
            </dl>
            <p className="text-sm text-[#5A7469]">{shipment.weight} kg · {shipment.length} × {shipment.breadth} × {shipment.height} cm · Pickup: {shipment.pickup_location}{shipment.courier_name ? ` · ${shipment.courier_name}` : ''}</p>
            {shipment.state === 'created' && <button disabled={busy || loading} className={buttonClass} onClick={() => void act(shipment.order_id, 'awb')}>Assign courier & AWB</button>}
            {shipment.state === 'awb_assigned' && <button disabled={busy || loading} className={buttonClass} onClick={() => void act(shipment.order_id, 'pickup')}>Request courier pickup</button>}
            {shipment.state === 'pickup_requested' && <p className="text-sm text-emerald-800">Pickup requested. Mark the order Shipped in Admin Orders after the courier collects it.</p>}
            {['needs_review', 'creating', 'assigning_awb', 'requesting_pickup'].includes(shipment.state) && <p className="text-sm text-amber-900">
              {shipment.last_error || 'Booking is processing. Refresh shortly.'} If it remains here, check the reference in Shiprocket before taking further action. Avoid creating a second booking.
            </p>}
          </article>
        ))}
      </section>
    </div>
  );
}
