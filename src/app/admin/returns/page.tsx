'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  DollarSign,
  ArrowRight,
  Filter,
  Eye,
  X,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

interface ReturnRequest {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  category: string;
  price: number;
  reason: 'Size Mismatch' | 'Damaged in Transit' | 'Defective / Craft Issue' | 'Gift Exchange Preference' | 'Did Not Meet Expectations';
  type: 'Refund to Original Payment' | 'Exchange Replacement' | 'Store Credit Note';
  status: 'Pending Review' | 'Pickup Scheduled' | 'Received & Inspected' | 'Refunded' | 'Replacement Dispatched' | 'Rejected';
  dateRequested: string;
  pickupCourier?: string;
  refundReference?: string;
}

export default function AdminReturnsPage() {
  const { orders, showToast } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);

  // Return requests state
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);

  const filteredReturns = returnRequests.filter((r) => {
    const matchesTab =
      selectedStatusTab === 'all' ||
      (selectedStatusTab === 'pending' && r.status === 'Pending Review') ||
      (selectedStatusTab === 'pickup' && r.status === 'Pickup Scheduled') ||
      (selectedStatusTab === 'completed' && (r.status === 'Refunded' || r.status === 'Replacement Dispatched'));

    const matchesSearch =
      !searchQuery.trim() ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const pendingCount = returnRequests.filter((r) => r.status === 'Pending Review').length;
  const pickupCount = returnRequests.filter((r) => r.status === 'Pickup Scheduled').length;
  const completedCount = returnRequests.filter((r) => r.status === 'Refunded' || r.status === 'Replacement Dispatched').length;
  const totalReturnedValue = returnRequests.reduce((sum, r) => sum + r.price, 0);

  const handleUpdateStatus = (id: string, newStatus: ReturnRequest['status']) => {
    setReturnRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, status: newStatus };
          if (newStatus === 'Pickup Scheduled') {
            updated.pickupCourier = 'BlueDart Reverse Logistics';
          } else if (newStatus === 'Refunded') {
            updated.refundReference = `REF-${Date.now().toString().slice(-6)}`;
          }
          return updated;
        }
        return r;
      })
    );
    showToast('Return Updated', `Return request status updated to ${newStatus}.`);
    if (selectedReturn && selectedReturn.id === id) {
      setSelectedReturn(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Returns & Exchanges Management
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Process customer return inquiries, schedule reverse logistics pickups, and execute refunds or replacements (SOW Section 14 & 19).
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {pendingCount}
          </p>
          <p className="text-[11px] text-[#5A7469]">Requests requiring merchant action</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Pickups Scheduled</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {pickupCount}
          </p>
          <p className="text-[11px] text-[#5A7469]">Courier in transit to warehouse</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Completed / Refunded</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {completedCount}
          </p>
          <p className="text-[11px] text-[#5A7469]">Cases successfully closed</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Return Volume</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#C5A059] flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            ₹{totalReturnedValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#5A7469]">7-Day easy return policy</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E2DBD0] shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#5A7469] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by return ID, order ID, customer or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {[
            { id: 'all', label: `All Requests (${returnRequests.length})` },
            { id: 'pending', label: `Pending Review (${pendingCount})` },
            { id: 'pickup', label: `Pickup Scheduled (${pickupCount})` },
            { id: 'completed', label: `Closed (${completedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                selectedStatusTab === tab.id
                  ? 'bg-[#0B241C] text-white shadow-sm'
                  : 'bg-[#FAF8F5] text-[#5A7469] hover:bg-[#EFEBE3]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-3xl border border-[#E2DBD0] shadow-sm overflow-hidden">
        {filteredReturns.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <RotateCcw className="w-12 h-12 text-[#C5A059] mx-auto opacity-40" />
            <p className="text-sm font-bold text-[#0B241C]">No Return Requests</p>
            <p className="text-xs text-[#5A7469] max-w-sm mx-auto">
              {returnRequests.length === 0
                ? 'No returns or exchange claims have been filed. When customers initiate a 7-day return request from their account or concierge support, it will appear here for management.'
                : 'No return requests match your current search and filter settings.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#5A7469] font-bold uppercase tracking-wider text-[10px] border-b border-[#E2DBD0]">
                <tr>
                  <th className="py-3.5 px-6">Return Case</th>
                  <th className="py-3.5 px-6">Patron & Order</th>
                  <th className="py-3.5 px-6">Item & Reason</th>
                  <th className="py-3.5 px-6">Requested Action</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEBE3]">
                {filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-bold text-[#0B241C] block">{ret.id}</span>
                      <span className="text-[11px] text-[#5A7469]">{ret.dateRequested}</span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-[#0B241C]">{ret.customerName}</p>
                      <p className="text-[11px] text-[#5A7469]">Order: {ret.orderId} · {ret.customerPhone}</p>
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <p className="font-semibold text-[#0B241C] truncate">{ret.productName}</p>
                      <p className="text-[11px] text-amber-800 font-medium">{ret.reason}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-[#0B241C] block">₹{ret.price.toLocaleString('en-IN')}</span>
                      <span className="text-[11px] text-[#5A7469]">{ret.type}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          ret.status === 'Pending Review'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : ret.status === 'Pickup Scheduled'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : ret.status === 'Received & Inspected'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : ret.status === 'Refunded' || ret.status === 'Replacement Dispatched'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {ret.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedReturn(ret)}
                        className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#0B241C] hover:text-white text-[#0B241C] border border-[#E2DBD0] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Manage Case</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manage Return Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E2DBD0] shadow-2xl overflow-hidden text-xs">
            <div className="p-5 bg-[#0B241C] text-white flex items-center justify-between">
              <div>
                <h3 className="font-serif-title text-base font-bold text-white">Return Case: {selectedReturn.id}</h3>
                <p className="text-[11px] text-[#B4C9BF]">Original Order: {selectedReturn.orderId}</p>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E2DBD0]">
                <p className="text-[11px] text-[#5A7469]">Product to be Returned:</p>
                <p className="font-bold text-[#0B241C] text-sm">{selectedReturn.productName}</p>
                <p className="text-[11px] text-[#2C4A3E]">
                  Price: ₹{selectedReturn.price.toLocaleString('en-IN')} · Category: {selectedReturn.category}
                </p>
                <p className="text-[11px] text-amber-800 font-semibold pt-1">
                  Customer Reason: {selectedReturn.reason}
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-[#0B241C] block">Update Case Milestone:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedReturn.id, 'Pickup Scheduled')}
                    className="p-2.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-left"
                  >
                    1. Schedule Reverse Pickup
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReturn.id, 'Received & Inspected')}
                    className="p-2.5 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-left"
                  >
                    2. Mark Received & QC Passed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReturn.id, 'Refunded')}
                    className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-left"
                  >
                    3. Issue Payment Refund
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReturn.id, 'Replacement Dispatched')}
                    className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-left"
                  >
                    4. Dispatch Exchange Unit
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border-t border-[#E2DBD0] flex justify-between">
              <button
                onClick={() => handleUpdateStatus(selectedReturn.id, 'Rejected')}
                className="px-4 py-2 rounded-xl text-rose-700 hover:bg-rose-50 font-bold"
              >
                Reject Request
              </button>
              <button
                onClick={() => setSelectedReturn(null)}
                className="px-5 py-2 rounded-xl bg-[#0B241C] text-white font-semibold hover:bg-[#C5A059]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
