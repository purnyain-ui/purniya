'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Download,
  Eye,
  ShieldCheck,
  UserCheck,
  Award,
  Calendar,
  X,
  Plus,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { Order } from '../../../types';

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  orders: Order[];
  status: 'VIP Patron' | 'Active Patron' | 'New Patron';
}

export default function AdminCustomersPage() {
  const { orders, showToast } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Derive unique customers from store orders
  const customersList = useMemo<CustomerRecord[]>(() => {
    const map = new Map<string, CustomerRecord>();

    orders.forEach((ord) => {
      const emailKey = ord.customer.email.trim().toLowerCase() || ord.customer.phone;
      if (!emailKey) return;

      if (!map.has(emailKey)) {
        const spent = ord.total;
        map.set(emailKey, {
          id: `cust-${emailKey.replace(/[^a-z0-9]/gi, '')}`,
          name: ord.customer.name || 'Patron',
          email: ord.customer.email || 'N/A',
          phone: ord.customer.phone || 'N/A',
          city: ord.shippingAddress?.city || 'India',
          state: ord.shippingAddress?.state || '',
          totalOrders: 1,
          totalSpent: spent,
          lastOrderDate: ord.date,
          orders: [ord],
          status: spent >= 5000 ? 'VIP Patron' : 'New Patron',
        });
      } else {
        const existing = map.get(emailKey)!;
        existing.totalOrders += 1;
        existing.totalSpent += ord.total;
        existing.orders.push(ord);
        if (existing.totalSpent >= 5000 || existing.totalOrders >= 3) {
          existing.status = 'VIP Patron';
        } else if (existing.totalOrders >= 2) {
          existing.status = 'Active Patron';
        }
      }
    });

    return Array.from(map.values());
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    return customersList.filter((c) => {
      const matchesSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier =
        filterTier === 'all' ||
        (filterTier === 'vip' && c.status === 'VIP Patron') ||
        (filterTier === 'active' && c.status === 'Active Patron') ||
        (filterTier === 'new' && c.status === 'New Patron');

      return matchesSearch && matchesTier;
    });
  }, [customersList, searchQuery, filterTier]);

  const totalSpentAcrossAll = customersList.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgLTV = customersList.length > 0 ? Math.round(totalSpentAcrossAll / customersList.length) : 0;
  const repeatCount = customersList.filter((c) => c.totalOrders > 1).length;
  const repeatRate = customersList.length > 0 ? Math.round((repeatCount / customersList.length) * 100) : 0;

  const handleExportCSV = () => {
    if (customersList.length === 0) {
      showToast('Export Notice', 'No customer accounts on file yet.');
      return;
    }
    const headers = 'ID,Name,Email,Phone,City,Total Orders,Total Spent (INR),Tier\n';
    const rows = customersList
      .map(
        (c) =>
          `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.city}",${c.totalOrders},${c.totalSpent},"${c.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purnya-patron-directory-${Date.now()}.csv`;
    a.click();
    showToast('Export Complete', 'Customer directory downloaded as CSV.');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Customer & Patron Management
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Directory of registered patrons, guest checkouts, order volumes, and lifetime relationship metrics (SOW Section 12 & 19).
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0] text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Export Directory (CSV)</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Total Patrons</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {customersList.length}
          </p>
          <p className="text-[11px] text-[#5A7469]">Unique buyers across all 5 boutiques</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Avg. Lifetime Value</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#C5A059] flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            ₹{avgLTV.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#5A7469]">Per purchasing patron</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Repeat Purchase Rate</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {repeatRate}%
          </p>
          <p className="text-[11px] text-[#5A7469]">{repeatCount} repeat patrons</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">VIP Tier Patrons</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {customersList.filter((c) => c.status === 'VIP Patron').length}
          </p>
          <p className="text-[11px] text-[#5A7469]">High-value brand advocates</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E2DBD0] shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#5A7469] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by patron name, email, phone, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {[
            { id: 'all', label: `All (${customersList.length})` },
            { id: 'vip', label: 'VIP Tier' },
            { id: 'active', label: 'Active Repeat' },
            { id: 'new', label: 'First Time' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTier(tab.id)}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                filterTier === tab.id
                  ? 'bg-[#0B241C] text-white shadow-sm'
                  : 'bg-[#FAF8F5] text-[#5A7469] hover:bg-[#EFEBE3]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-[#E2DBD0] shadow-sm overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-[#C5A059] mx-auto opacity-40" />
            <p className="text-sm font-bold text-[#0B241C]">No Customer Profiles Found</p>
            <p className="text-xs text-[#5A7469] max-w-sm mx-auto">
              {customersList.length === 0
                ? 'When patrons place orders on any of the five boutique storefronts, their verified customer profile and lifetime metrics will be populated here.'
                : 'No customer profiles match your current search and filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-[#5A7469] font-bold uppercase tracking-wider text-[10px] border-b border-[#E2DBD0]">
                <tr>
                  <th className="py-3.5 px-6">Patron Details</th>
                  <th className="py-3.5 px-6">Contact & Location</th>
                  <th className="py-3.5 px-6">Total Orders</th>
                  <th className="py-3.5 px-6">Lifetime Spend</th>
                  <th className="py-3.5 px-6">Tier Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEBE3]">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0B241C] to-[#144234] text-[#D4AF37] font-bold flex items-center justify-center text-xs shrink-0">
                          {cust.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#0B241C]">{cust.name}</p>
                          <p className="text-[11px] text-[#5A7469]">Latest: {cust.lastOrderDate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[#0B241C]">
                        <Mail className="w-3 h-3 text-[#C5A059]" />
                        <span>{cust.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#5A7469]">
                        <MapPin className="w-3 h-3 text-[#C5A059]" />
                        <span>{cust.city}{cust.state ? `, ${cust.state}` : ''}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-[#0B241C]">{cust.totalOrders}</span>
                      <span className="text-[#5A7469] text-[11px]"> {cust.totalOrders === 1 ? 'order' : 'orders'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-[#0B241C]">
                        ₹{cust.totalSpent.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          cust.status === 'VIP Patron'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : cust.status === 'Active Patron'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {cust.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#0B241C] hover:text-white text-[#0B241C] border border-[#E2DBD0] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Orders</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#E2DBD0] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-[#0B241C] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#FAF8F5] text-[#0B241C] font-bold flex items-center justify-center text-sm border-2 border-[#D4AF37]">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif-title text-lg font-bold text-white">{selectedCustomer.name}</h3>
                  <p className="text-xs text-[#B4C9BF]">{selectedCustomer.email} · {selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] text-center">
                  <span className="text-[10px] text-[#5A7469] font-bold uppercase block">Total Orders</span>
                  <span className="font-serif-title text-lg font-bold text-[#0B241C]">
                    {selectedCustomer.totalOrders}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] text-center">
                  <span className="text-[10px] text-[#5A7469] font-bold uppercase block">Lifetime Spend</span>
                  <span className="font-serif-title text-lg font-bold text-[#0B241C]">
                    ₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] text-center">
                  <span className="text-[10px] text-[#5A7469] font-bold uppercase block">Patron Tier</span>
                  <span className="font-bold text-[#C5A059] block mt-0.5">{selectedCustomer.status}</span>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#0B241C] text-sm flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                  <span>Purchased Orders ({selectedCustomer.orders.length})</span>
                </h4>
                <div className="space-y-2.5">
                  {selectedCustomer.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0B241C]">{ord.id}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-white border border-[#E2DBD0]">
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5A7469] mt-1">
                          {ord.date} · {ord.items.length} items ({ord.items.map((i) => i.name).join(', ')})
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-[#0B241C]">
                          ₹{ord.total.toLocaleString('en-IN')}
                        </span>
                        <span className="block text-[10px] text-[#5A7469]">{ord.paymentMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border-t border-[#E2DBD0] text-right">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-xl bg-[#0B241C] text-white text-xs font-semibold hover:bg-[#C5A059] transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
