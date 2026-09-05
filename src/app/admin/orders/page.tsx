'use client';

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Truck,
  Eye,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Edit2,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { Order, OrderStatus } from '../../../types';

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus } = useStore();

  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-[#E2DBD0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E2DBD0] text-[#5A7469] uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4 pl-6">Order ID & Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status & Dispatch</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEBE3]">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#FAF8F5]/40 transition-colors">
                  <td className="p-4 pl-6">
                    <p className="font-serif-title font-bold text-sm text-[#0B241C]">{ord.id}</p>
                    <p className="text-[11px] text-[#5A7469]">{ord.date}</p>
                  </td>

                  <td className="p-4">
                    <p className="font-semibold text-[#0B241C]">{ord.customer.name}</p>
                    <p className="text-[11px] text-[#5A7469]">{ord.customer.phone}</p>
                  </td>

                  <td className="p-4 text-[#2C4A3E]">
                    <span className="font-bold text-[#0B241C]">{ord.items.length} items</span>
                    <p className="text-[11px] text-[#5A7469] truncate max-w-xs">
                      {ord.items.map((i) => i.name).join(', ')}
                    </p>
                  </td>

                  <td className="p-4">
                    <p className="font-bold text-[#0B241C]">₹{ord.total.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-[#5A7469]">{ord.paymentMethod}</p>
                  </td>

                  <td className="p-4 space-y-1">
                    <select
                      value={ord.status}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value as any)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-white cursor-pointer ${
                        statusColors[ord.status] || 'border-gray-300'
                      }`}
                    >
                      <option value="New">New</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#5A7469]">
                      <span>AWB: {ord.trackingNumber || 'Unassigned'}</span>
                      <button
                        onClick={() => openTrackingModal(ord)}
                        className="text-[#C5A059] hover:underline"
                        title="Update courier code"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => setSelectedOrder(ord)}
                      className="px-3 py-1.5 rounded-lg border border-[#E2DBD0] hover:border-[#C5A059] text-xs font-semibold text-[#2C4A3E] hover:text-[#C5A059]"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 border border-[#E2DBD0] shadow-2xl text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[#EFEBE3]">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#5A7469]">Order Details</p>
                <h3 className="font-serif-title text-xl font-bold text-[#0B241C]">
                  {selectedOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-[#5A7469] hover:text-[#0B241C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E2DBD0]">
              <div>
                <span className="font-bold text-[#5A7469] uppercase tracking-wider text-[10px]">Customer</span>
                <p className="font-bold text-[#0B241C] text-sm">{selectedOrder.customer.name}</p>
                <p>{selectedOrder.customer.email}</p>
                <p>{selectedOrder.customer.phone}</p>
              </div>
              <div>
                <span className="font-bold text-[#5A7469] uppercase tracking-wider text-[10px]">Shipping Destination</span>
                <p className="text-[#0B241C]">
                  {selectedOrder.shippingAddress.addressLine}, {selectedOrder.shippingAddress.city},{' '}
                  {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#5A7469] uppercase tracking-wider text-[10px]">Line Items</span>
              <div className="divide-y divide-[#EFEBE3]">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover bg-[#EBF3EF] border border-[#E2DBD0]"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#0B241C] truncate">{item.name}</p>
                      <p className="text-[#5A7469]">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-[#0B241C]">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#EFEBE3] pt-3 space-y-1 text-right">
              <p>Subtotal: ₹{selectedOrder.subtotal.toLocaleString('en-IN')}</p>
              {selectedOrder.discount > 0 && <p className="text-emerald-700 font-semibold">Discount: - ₹{selectedOrder.discount.toLocaleString('en-IN')}</p>}
              <p>Shipping: ₹{selectedOrder.shipping}</p>
              <p className="font-bold text-sm text-[#0B241C] pt-1">Total: ₹{selectedOrder.total.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tracking Modal */}
      {editingTrackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveTracking}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E2DBD0] shadow-2xl text-xs"
          >
            <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">
              Update Courier & Tracking for {editingTrackingOrder.id}
            </h3>

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
