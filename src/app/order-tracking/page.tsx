'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order } from '../../types';

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams?.get('id') || '';

  const { orders } = useStore();
  const [searchQuery, setSearchQuery] = useState(initialId);
  const [contact, setContact] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // A signed-in customer's own orders are already loaded, so they can track by ID alone.
  const findOwnOrder = (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return orders.find((o) => o.id.toLowerCase() === q || o.trackingNumber?.toLowerCase() === q) || null;
  };

  useEffect(() => {
    if (!initialId) return;
    const found = findOwnOrder(initialId);
    if (found) {
      setSelectedOrder(found);
      setErrorMsg('');
    }
  }, [initialId, orders]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const own = findOwnOrder(searchQuery);
    if (own) {
      setSelectedOrder(own);
      setErrorMsg('');
      return;
    }

    // Anyone else must also give the email or phone the order was placed with.
    if (!searchQuery.trim() || !contact.trim()) {
      setSelectedOrder(null);
      setErrorMsg('Enter your order ID and the email or phone number used for the order.');
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: searchQuery, contact }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedOrder(data.order);
        setErrorMsg('');
      } else {
        setSelectedOrder(null);
        setErrorMsg(data.error || 'No order found with those details.');
      }
    } catch {
      setErrorMsg('Could not look up the order right now. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
          Logistics Tracking Portal
        </span>
        <h1 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C]">
          Track Your Consignment
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E]">
          Enter your Purnya Order ID or tracking number, and the email or phone number used for the order.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="max-w-md mx-auto space-y-2">
        <div className="flex items-center rounded-2xl bg-white border border-[#E2DBD0] p-1.5 shadow-sm focus-within:border-[#0C3B2E] transition-colors">
          <Search className="w-5 h-5 text-[#5A7469] ml-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Order ID or tracking number"
            aria-label="Order ID or tracking number"
            className="w-full px-3 py-2 text-xs sm:text-sm text-[#0B241C] focus:outline-none uppercase font-semibold"
          />
        </div>
        <div className="flex items-center rounded-2xl bg-white border border-[#E2DBD0] p-1.5 shadow-sm focus-within:border-[#0C3B2E] transition-colors">
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Email or phone used for the order"
            aria-label="Email or phone used for the order"
            className="w-full px-3 py-2 text-xs sm:text-sm text-[#0B241C] focus:outline-none font-semibold"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2.5 rounded-xl bg-[#0C3B2E] hover:bg-[#164E3D] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs disabled:opacity-60"
          >
            {isSearching ? 'Searching…' : 'Track'}
          </button>
        </div>
        {errorMsg && <p className="text-xs text-rose-600 mt-2 text-center">{errorMsg}</p>}
      </form>

      {/* Order Status Display */}
      {selectedOrder && (
        <div className="bg-white rounded-3xl border border-[#E2DBD0] p-6 sm:p-10 shadow-sm space-y-8 animate-in fade-in">
          {/* Header info */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-[#EFEBE3] gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">
                Consignment Details
              </span>
              <p className="font-serif-title text-2xl font-bold text-[#0B241C]">
                {selectedOrder.id}
              </p>
              <p className="text-xs text-[#5A7469]">
                Courier: <strong className="text-[#0B241C]">{selectedOrder.courierPartner || 'BlueDart Express'}</strong> · AWB: {selectedOrder.trackingNumber}
              </p>
            </div>

            <div className="sm:text-right bg-[#FAF8F5] p-3 rounded-xl border border-[#E2DBD0]">
              <p className="text-[11px] text-[#5A7469]">Estimated Delivery</p>
              <p className="text-sm font-bold text-[#0B241C]">{selectedOrder.estimatedDelivery}</p>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">
              Shipment Journey
            </h3>

            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2DBD0]">
              {(selectedOrder.trackingHistory || [
                { status: 'Order Placed', time: selectedOrder.date, location: 'Purnya Store', completed: true },
                { status: 'Packed & Dispatched', time: 'Pending', location: 'Bengaluru Hub', completed: selectedOrder.status !== 'New' },
                { status: 'Delivered', time: 'Pending', location: 'Customer Doorstep', completed: selectedOrder.status === 'Delivered' },
              ]).map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div
                    className={`absolute -left-6 sm:-left-8 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                      step.completed
                        ? 'bg-[#0C3B2E] border-white text-white shadow-md'
                        : 'bg-[#FAF8F5] border-[#E2DBD0] text-[#5A7469]'
                    }`}
                  >
                    {step.completed ? '✓' : idx + 1}
                  </div>
                  <div>
                    <p
                      className={`text-xs sm:text-sm font-bold ${
                        step.completed ? 'text-[#0B241C]' : 'text-[#5A7469]'
                      }`}
                    >
                      {step.status}
                    </p>
                    <p className="text-[11px] text-[#5A7469]">
                      {step.time} {step.location ? `· ${step.location}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Address & Ordered Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[#EFEBE3] text-xs">
            <div className="space-y-1.5">
              <span className="font-bold text-[#5A7469] uppercase tracking-wider">Destination Address</span>
              <p className="font-semibold text-[#0B241C]">{selectedOrder.shippingAddress.fullName}</p>
              <p className="text-[#2C4A3E]">
                {selectedOrder.shippingAddress.addressLine}, {selectedOrder.shippingAddress.city},{' '}
                {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
              </p>
              <p className="text-[#5A7469]">Phone: {selectedOrder.shippingAddress.phone}</p>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#5A7469] uppercase tracking-wider">Package Contents</span>
              <div className="space-y-1.5">
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-[#0B241C]">
                    <span className="truncate pr-2">{item.quantity}x {item.name}</span>
                    <span className="font-bold shrink-0">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-sm">Loading Order Tracking...</div>}>
      <OrderTrackingContent />
    </Suspense>
  );
}
