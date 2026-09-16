'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  Edit2,
  X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useStore } from '../../../context/StoreContext';
import { Order, OrderStatus } from '../../../types';

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus } = useStore();

  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Accordion — which order row is currently expanded (only one at a time)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Edit Tracking Modal
  const [editingTrackingOrder, setEditingTrackingOrder] = useState<Order | null>(null);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesTab = selectedStatusTab === 'all' || o.status.toLowerCase() === selectedStatusTab.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer.phone.includes(searchQuery);
      return matchesTab && matchesSearch;
    });
  }, [orders, selectedStatusTab, searchQuery]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  const openTrackingModal = (ord: Order) => {
    setEditingTrackingOrder(ord);
    setCourierName(ord.courierPartner || 'BlueDart Express');
    setTrackingNumber(ord.trackingNumber || '');
  };

  const handleSaveTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrackingOrder) return;
    updateOrderStatus(
      editingTrackingOrder.id,
      editingTrackingOrder.status,
      trackingNumber,
      courierName
    );
    setEditingTrackingOrder(null);
  };

  // Generates and downloads a simple tax-invoice PDF for the order
  const handleDownloadInvoice = (ord: Order, e?: React.MouseEvent) => {
    e?.stopPropagation();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('PURNYA', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Tax Invoice', 14, 27);

    doc.setDrawColor(200);
    doc.line(14, 32, pageWidth - 14, 32);

    doc.setFont('helvetica', 'bold');
    doc.text('Order ID:', 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(ord.id, 45, 42);

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 14, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(ord.date, 45, 48);

    doc.setFont('helvetica', 'bold');
    doc.text('Status:', 14, 54);
    doc.setFont('helvetica', 'normal');
    doc.text(ord.status, 45, 54);

    doc.setFont('helvetica', 'bold');
    doc.text('Bill To', 120, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(ord.customer.name, 120, 48);
    doc.text(ord.customer.phone, 120, 54);
    doc.text(ord.customer.email || '', 120, 60);

    doc.setFont('helvetica', 'bold');
    doc.text('Shipping Address', 14, 66);
    doc.setFont('helvetica', 'normal');
    const addrLines = doc.splitTextToSize(
      `${ord.shippingAddress.addressLine}, ${ord.shippingAddress.city}, ${ord.shippingAddress.state} - ${ord.shippingAddress.pincode}`,
      pageWidth - 28
    );
    doc.text(addrLines, 14, 72);

    let y = 72 + addrLines.length * 5 + 10;

    doc.setDrawColor(200);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Item', 14, y);
    doc.text('Qty', 125, y);
    doc.text('Price', 148, y);
    doc.text('Total', 175, y);
    y += 4;
    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    ord.items.forEach((item) => {
      const nameLines = doc.splitTextToSize(item.name, 105);
      doc.text(nameLines, 14, y);
      doc.text(String(item.quantity), 125, y);
      doc.text(`Rs.${item.price.toLocaleString('en-IN')}`, 148, y);
      doc.text(`Rs.${(item.price * item.quantity).toLocaleString('en-IN')}`, 175, y);
      y += nameLines.length * 5 + 3;
    });

    y += 4;
    doc.line(120, y, pageWidth - 14, y);
    y += 8;

    doc.text('Subtotal', 148, y);
    doc.text(`Rs.${ord.subtotal.toLocaleString('en-IN')}`, 175, y);
    y += 6;

    if (ord.discount > 0) {
      doc.text('Discount', 148, y);
      doc.text(`-Rs.${ord.discount.toLocaleString('en-IN')}`, 175, y);
      y += 6;
    }

    doc.text('Shipping', 148, y);
    doc.text(ord.shipping === 0 ? 'Free' : `Rs.${ord.shipping}`, 175, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total Paid', 148, y);
    doc.text(`Rs.${ord.total.toLocaleString('en-IN')}`, 175, y);

    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Thank you for shopping with Purnya.', 14, y);

    doc.save(`Invoice-${ord.id}.pdf`);
  };

  const statusColors: Record<string, string> = {
    New: 'bg-amber-100 text-amber-800 border-amber-300',
    Processing: 'bg-blue-100 text-blue-800 border-blue-300',
    Shipped: 'bg-purple-100 text-purple-800 border-purple-300',
    'Out for Delivery': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    Delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Cancelled: 'bg-rose-100 text-rose-800 border-rose-300',
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
          Order Fulfillment & Consignments
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E]">
          Manage incoming customer purchases, assign courier tracking numbers, and update dispatch milestones.
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-[#EFEBE3] pb-3 text-xs">
          {[
            { id: 'all', label: `All Orders (${orders.length})` },
            { id: 'new', label: 'New' },
            { id: 'processing', label: 'Processing' },
            { id: 'shipped', label: 'Shipped' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusTab(tab.id)}
              className={`px-4 py-1.5 rounded-full font-semibold transition-all ${
                selectedStatusTab === tab.id
                  ? 'bg-[#0B241C] text-white shadow-sm'
                  : 'text-[#2C4A3E] hover:bg-[#FAF8F5]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#5A7469] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, customer name, phone number..."
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-[#E2DBD0] rounded-xl focus:outline-none focus:border-[#C5A059]"
          />
        </div>
      </div>

      {/* Orders — expandable accordion rows */}
      <div className="bg-white rounded-3xl border border-[#E2DBD0] shadow-sm overflow-hidden divide-y divide-[#EFEBE3]">
        {/* Header row (desktop only) */}
        <div className="hidden md:grid grid-cols-[24px_1fr_1.3fr_1fr_60px_100px_140px_40px] gap-3 items-center px-5 py-3 bg-[#FAF8F5] text-[10px] font-bold uppercase tracking-wider text-[#5A7469]">
          <span />
          <span>Order ID</span>
          <span>Customer</span>
          <span>Date</span>
          <span>Items</span>
          <span>Total</span>
          <span>Status</span>
          <span className="text-right">Invoice</span>
        </div>

        {filteredOrders.map((ord) => {
          const isExpanded = expandedOrderId === ord.id;
          return (
            <div key={ord.id}>
              {/* Collapsed summary row — click anywhere to toggle */}
              <button
                type="button"
                onClick={() => toggleExpand(ord.id)}
                className={`w-full grid grid-cols-2 md:grid-cols-[24px_1fr_1.3fr_1fr_60px_100px_140px_40px] gap-3 items-center px-5 py-4 text-left text-xs transition-colors ${
                  isExpanded ? 'bg-[#FAF8F5]' : 'hover:bg-[#FAF8F5]/60'
                }`}
              >
                <span className="text-[#5A7469]">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>

                <span className="font-serif-title font-bold text-[#0B241C]">#{ord.id}</span>

                <span className="min-w-0">
                  <p className="font-semibold text-[#0B241C] truncate">{ord.customer.name}</p>
                  <p className="text-[11px] text-[#5A7469]">{ord.customer.phone}</p>
                </span>

                <span className="text-[#2C4A3E] hidden md:inline">{ord.date}</span>

                <span className="text-[#0B241C] font-semibold hidden md:inline">{ord.items.length}</span>

                <span className="font-bold text-[#0B241C]">₹{ord.total.toLocaleString('en-IN')}</span>

                <span className="hidden md:inline">
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                      statusColors[ord.status] || 'border-gray-300'
                    }`}
                  >
                    {ord.status}
                  </span>
                </span>

                <span className="hidden md:flex justify-end">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleDownloadInvoice(ord, e)}
                    className="p-1.5 rounded-lg text-[#5A7469] hover:text-[#C5A059] hover:bg-[#FAF8F5] transition-colors"
                    title="Download Invoice"
                  >
                    <Download className="w-4 h-4" />
                  </span>
                </span>
              </button>

              {/* Expanded detail panel */}
              {isExpanded && (
                <div className="px-5 pb-6 pt-1 bg-[#FAF8F5]/60 border-t border-[#EFEBE3]">
                  <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 pt-4">
                    {/* Left column */}
                    <div className="space-y-5">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A7469] mb-2">
                          Items & Variations
                        </p>
                        <div className="bg-white rounded-2xl border border-[#E2DBD0] divide-y divide-[#EFEBE3]">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="p-3 flex items-center gap-3 text-xs">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 rounded-xl object-cover bg-[#EBF3EF] border border-[#E2DBD0] shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[#0B241C] truncate">{item.name}</p>
                                <p className="text-[11px] text-[#5A7469]">
                                  {item.variant ? `${item.variant} · ` : ''}Qty: {item.quantity}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[10px] text-[#5A7469]">₹{item.price.toLocaleString('en-IN')} each</p>
                                <p className="font-bold text-[#0B241C]">
                                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A7469] mb-2">
                          Shipping Address
                        </p>
                        <div className="bg-white rounded-2xl border border-[#E2DBD0] p-3 text-xs text-[#2C4A3E] space-y-0.5">
                          <p className="font-bold text-[#0B241C]">{ord.customer.name}</p>
                          <p>
                            {ord.shippingAddress.addressLine}, {ord.shippingAddress.city},{' '}
                            {ord.shippingAddress.state} - {ord.shippingAddress.pincode}
                          </p>
                          <p className="text-[#5A7469]">{ord.customer.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-5">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A7469] mb-2">
                          Payment Summary
                        </p>
                        <div className="bg-white rounded-2xl border border-[#E2DBD0] p-4 text-xs space-y-2">
                          <div className="flex justify-between text-[#2C4A3E]">
                            <span>Subtotal</span>
                            <span>₹{ord.subtotal.toLocaleString('en-IN')}</span>
                          </div>
                          {ord.discount > 0 && (
                            <div className="flex justify-between text-emerald-700 font-semibold">
                              <span>Discount{ord.couponCode ? ` (${ord.couponCode})` : ''}</span>
                              <span>- ₹{ord.discount.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-[#2C4A3E]">
                            <span>Shipping</span>
                            <span>{ord.shipping === 0 ? 'Free' : `₹${ord.shipping}`}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-[#EFEBE3] font-bold text-sm text-[#0B241C]">
                            <span>Amount Paid</span>
                            <span>₹{ord.total.toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-[10px] text-[#5A7469] pt-1">{ord.paymentMethod}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A7469] mb-2">
                          Update Status
                        </p>
                        <select
                          value={ord.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value as OrderStatus)}
                          className="w-full p-3 rounded-xl border border-[#E2DBD0] text-xs font-semibold bg-white cursor-pointer focus:outline-none focus:border-[#C5A059]"
                        >
                          <option value="New">New</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>

                        <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-[#5A7469]">
                          <span className="truncate">AWB: {ord.trackingNumber || 'Unassigned'}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTrackingModal(ord);
                            }}
                            className="flex items-center gap-1 text-[#C5A059] hover:underline shrink-0"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit Courier
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDownloadInvoice(ord, e)}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-[#E2DBD0] bg-white hover:border-[#C5A059] hover:text-[#C5A059] text-xs font-bold text-[#2C4A3E] transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download Invoice
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="p-10 text-center text-xs text-[#5A7469]">No orders match this filter.</div>
        )}
      </div>

      {/* Edit Tracking Modal */}
      {editingTrackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveTracking}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E2DBD0] shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">
                Update Courier & Tracking for {editingTrackingOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTrackingOrder(null)}
                className="p-1 text-[#5A7469] hover:text-[#0B241C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">Logistics Partner</label>
              <input
                type="text"
                required
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                placeholder="e.g. BlueDart Express, Delhivery"
                className="w-full p-3 rounded-xl border border-[#E2DBD0]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[#2C4A3E]">AWB / Tracking Number</label>
              <input
                type="text"
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. BD-994821034IN"
                className="w-full p-3 rounded-xl border border-[#E2DBD0]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setEditingTrackingOrder(null)}
                className="px-4 py-2 rounded-xl border border-[#E2DBD0] text-[#2C4A3E]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#C5A059] text-[#0B241C] font-bold"
              >
                Save Consignment Info
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}