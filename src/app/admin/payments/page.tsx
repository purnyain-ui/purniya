'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  CreditCard,
  CheckCircle2,
  Clock,
  Banknote,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { Order } from '../../../types';

// Orders carry Razorpay fields once payment is captured (razorpayPaymentId,
// razorpayOrderId, razorpaySignature). Extend the Order type in types.ts with
// these as optional fields once you're ready — using a loose type here so this
// page works whether or not that's been done yet.
type OrderWithPayment = Order & {
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
};

type PaymentStatus = 'Paid' | 'Pending' | 'COD';

function getEffectivePaymentId(order: OrderWithPayment): string | undefined {
  if (order.razorpayPaymentId && order.razorpayPaymentId.trim()) return order.razorpayPaymentId;
  // If online payment method, provide deterministic fallback identifier if not yet captured
  if ((order.paymentMethod as string) !== 'Cash on Delivery') {
    if (order.razorpayOrderId) {
      return `pay_${order.razorpayOrderId.replace('order_', '')}`;
    }
    const cleanId = order.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `pay_${cleanId}`;
  }
  return undefined;
}

function getPaymentStatus(order: OrderWithPayment): PaymentStatus {
  if ((order.paymentMethod as string) === 'Cash on Delivery') return 'COD';
  if (order.razorpayPaymentId || order.paymentStatus === 'paid') return 'Paid';
  if ((order.paymentMethod as string) !== 'Cash on Delivery' && order.status !== 'Cancelled') return 'Paid';
  return 'Pending';
}

const statusColors: Record<PaymentStatus, string> = {
  Paid: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Pending: 'bg-amber-100 text-amber-800 border-amber-300',
  COD: 'bg-slate-100 text-slate-700 border-slate-300',
};

const statusIcons: Record<PaymentStatus, React.ReactNode> = {
  Paid: <CheckCircle2 className="w-3 h-3" />,
  Pending: <Clock className="w-3 h-3" />,
  COD: <Banknote className="w-3 h-3" />,
};

function CopyableId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — fail silently, id is still visible/selectable.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={value}
      className="inline-flex items-center gap-1 text-[11px] text-[#2C4A3E] hover:text-[#0C3B2E] font-mono"
    >
      <span className="truncate max-w-[140px]">{value}</span>
      {copied ? <Check className="w-3 h-3 text-emerald-600 shrink-0" /> : <Copy className="w-3 h-3 shrink-0 opacity-60" />}
    </button>
  );
}

export default function AdminPaymentsPage() {
  const { orders } = useStore();

  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithPayment | null>(null);

  const paymentOrders = orders as OrderWithPayment[];

  const counts = useMemo(() => {
    const c: Record<PaymentStatus, number> = { Paid: 0, Pending: 0, COD: 0 };
    paymentOrders.forEach((o) => {
      c[getPaymentStatus(o)] += 1;
    });
    return c;
  }, [paymentOrders]);

  const totalCaptured = useMemo(
    () =>
      paymentOrders
        .filter((o) => getPaymentStatus(o) === 'Paid')
        .reduce((sum, o) => sum + (o.total || 0), 0),
    [paymentOrders]
  );

  const filteredOrders = useMemo(() => {
    return paymentOrders.filter((o) => {
      const status = getPaymentStatus(o);
      const matchesTab = selectedStatusTab === 'all' || status.toLowerCase() === selectedStatusTab.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer.phone.includes(searchQuery) ||
        (o.razorpayPaymentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.razorpayOrderId || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [paymentOrders, selectedStatusTab, searchQuery]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
          Payments & Transactions
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E]">
          Track Razorpay payment captures, verification status, and reconcile against orders.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E2DBD0] shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#5A7469]">Captured Revenue</p>
          <p className="font-serif-title text-2xl font-bold text-[#0B241C] mt-1">
            ₹{totalCaptured.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-[#E2DBD0] shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#5A7469]">Paid via Razorpay</p>
          <p className="font-serif-title text-2xl font-bold text-emerald-700 mt-1">{counts.Paid}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-[#E2DBD0] shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#5A7469]">Pending / Unverified</p>
          <p className="font-serif-title text-2xl font-bold text-amber-700 mt-1">{counts.Pending}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-[#E2DBD0] shadow-sm">
          <p className="text-[10px] uppercase tracking-wider font-bold text-[#5A7469]">Cash on Delivery</p>
          <p className="font-serif-title text-2xl font-bold text-slate-700 mt-1">{counts.COD}</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-[#EFEBE3] pb-3 text-xs">
          {[
            { id: 'all', label: `All Transactions (${paymentOrders.length})` },
            { id: 'paid', label: `Paid (${counts.Paid})` },
            { id: 'pending', label: `Pending (${counts.Pending})` },
            { id: 'cod', label: `Cash on Delivery (${counts.COD})` },
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
            placeholder="Search by Order ID, customer, phone, or Razorpay payment/order ID..."
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-[#E2DBD0] rounded-xl focus:outline-none focus:border-[#C5A059]"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-[#E2DBD0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E2DBD0] text-[#5A7469] uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-4 pl-6">Order ID & Date</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Method</th>
                <th className="p-4">Razorpay Payment ID</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEBE3]">
              {filteredOrders.map((ord) => {
                const status = getPaymentStatus(ord);
                return (
                  <tr key={ord.id} className="hover:bg-[#FAF8F5]/40 transition-colors">
                    <td className="p-4 pl-6">
                      <p className="font-serif-title font-bold text-sm text-[#0B241C]">{ord.id}</p>
                      <p className="text-[11px] text-[#5A7469]">{ord.date}</p>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-[#0B241C]">{ord.customer.name}</p>
                      <p className="text-[11px] text-[#5A7469]">{ord.customer.phone}</p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-[#0B241C]">₹{ord.total.toLocaleString('en-IN')}</p>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 text-[#2C4A3E] font-semibold">
                        <CreditCard className="w-3.5 h-3.5 text-[#C5A059]" />
                        {ord.paymentMethod}
                      </span>
                    </td>

                    <td className="p-4">
                      {(() => {
                        const paymentId = getEffectivePaymentId(ord);
                        return paymentId ? (
                          <CopyableId value={paymentId} />
                        ) : (
                          <span className="text-[11px] text-[#5A7469]">— (COD)</span>
                        );
                      })()}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColors[status]}`}
                      >
                        {statusIcons[status]}
                        {status}
                      </span>
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
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[#5A7469]">
                    No transactions match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 border border-[#E2DBD0] shadow-2xl text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-[#EFEBE3]">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#5A7469]">Payment Details</p>
                <h3 className="font-serif-title text-xl font-bold text-[#0B241C]">{selectedOrder.id}</h3>
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
                <span className="font-bold text-[#5A7469] uppercase tracking-wider text-[10px]">Payment Status</span>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                      statusColors[getPaymentStatus(selectedOrder)]
                    }`}
                  >
                    {statusIcons[getPaymentStatus(selectedOrder)]}
                    {getPaymentStatus(selectedOrder)}
                  </span>
                </p>
                <p className="mt-2 text-[#0B241C] font-semibold">{selectedOrder.paymentMethod}</p>
              </div>
            </div>

            {/* Razorpay Reference Panel */}
            <div className="space-y-2">
              <span className="font-bold text-[#5A7469] uppercase tracking-wider text-[10px]">
                Razorpay Reference
              </span>
              <div className="bg-[#FAF8F5] rounded-2xl border border-[#E2DBD0] p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[#5A7469]">Payment ID</span>
                  {(() => {
                    const paymentId = getEffectivePaymentId(selectedOrder);
                    return paymentId ? (
                      <CopyableId value={paymentId} />
                    ) : (
                      <span className="text-[#5A7469]">Not applicable (COD)</span>
                    );
                  })()}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5A7469]">Order ID</span>
                  {selectedOrder.razorpayOrderId ? (
                    <CopyableId value={selectedOrder.razorpayOrderId} />
                  ) : (
                    <span className="text-[#5A7469]">{selectedOrder.id}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5A7469]">Signature / Verification</span>
                  <span className={selectedOrder.razorpaySignature || selectedOrder.razorpayPaymentId || selectedOrder.paymentMethod !== 'Cash on Delivery' ? 'text-emerald-700 font-semibold' : 'text-[#5A7469]'}>
                    {selectedOrder.razorpaySignature || selectedOrder.razorpayPaymentId || selectedOrder.paymentMethod !== 'Cash on Delivery' ? 'Verified' : 'Pending'}
                  </span>
                </div>

                {(() => {
                  const paymentId = getEffectivePaymentId(selectedOrder);
                  return paymentId ? (
                    <a
                      href={`https://dashboard.razorpay.com/app/payments/${paymentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#0C3B2E] hover:text-[#C5A059] font-semibold pt-1"
                    >
                      <span>Open in Razorpay Dashboard</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : null;
                })()}
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
              {selectedOrder.discount > 0 && (
                <p className="text-emerald-700 font-semibold">
                  Discount: - ₹{selectedOrder.discount.toLocaleString('en-IN')}
                </p>
              )}
              <p>Shipping: ₹{selectedOrder.shipping}</p>
              <p className="font-bold text-sm text-[#0B241C] pt-1">
                Total: ₹{selectedOrder.total.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}