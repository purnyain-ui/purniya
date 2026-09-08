'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
  Home,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { getCustomersAndPatronsFromSupabase, CustomerRecord } from '../../../lib/supabase';

export default function AdminCustomersPage() {
  const { orders, showToast } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [cloudCustomers, setCloudCustomers] = useState<CustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCustomers = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await getCustomersAndPatronsFromSupabase();
      setCloudCustomers(data);
      if (isManual) {
        showToast('Patrons Refreshed', `Synchronized ${data.length} registered patron profiles from database.`);
      }
    } catch (err) {
      console.warn('Failed to fetch customers:', err);
      if (isManual) {
        showToast('Fetch Warning', 'Could not refresh patrons from database.', 'error');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Merge Supabase customers with any local store orders if not already captured
  const customersList = useMemo<CustomerRecord[]>(() => {
    const map = new Map<string, CustomerRecord>();

    // 1. Seed from Supabase profiles, addresses & orders
    cloudCustomers.forEach((cust) => {
      map.set(cust.email.trim().toLowerCase(), { ...cust });
    });

    // 2. Merge in any local orders that might be in StoreContext
    orders.forEach((ord) => {
      const emailKey = ord.customer.email.trim().toLowerCase();
      if (!emailKey) return;

      if (!map.has(emailKey)) {
        const spent = Number(ord.total) || 0;
        map.set(emailKey, {
          id: `cust-${emailKey.replace(/[^a-z0-9]/gi, '')}`,
          name: ord.customer.name || 'Patron',
          email: ord.customer.email || 'N/A',
          phone: ord.customer.phone || 'N/A',
          city: ord.shippingAddress?.city || 'India',
          state: ord.shippingAddress?.state || '',
          registeredDate: ord.date || 'Recent',
          lastOrderDate: ord.date || 'Recent',
          totalOrders: 1,
          totalSpent: spent,
          orders: [ord],
          addresses: ord.shippingAddress ? [ord.shippingAddress] : [],
          status: spent >= 5000 ? 'VIP Patron' : 'New Patron',
        });
      } else {
        const existing = map.get(emailKey)!;
        const existsInCustOrders = existing.orders.some((o) => o.id === ord.id);
        if (!existsInCustOrders) {
          existing.totalOrders += 1;
          existing.totalSpent += Number(ord.total) || 0;
          existing.orders.push(ord);
          existing.lastOrderDate = ord.date || existing.lastOrderDate;
          if (existing.totalSpent >= 5000 || existing.totalOrders >= 3) {
            existing.status = 'VIP Patron';
          } else if (existing.totalOrders >= 2) {
            existing.status = 'Active Patron';
          }
        }
      }
    });

    return Array.from(map.values());
  }, [cloudCustomers, orders]);

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
    const headers = 'ID,Name,Email,Phone,City,Registered Date,Total Orders,Total Spent (INR),Tier\n';
    const rows = customersList
      .map(
        (c) =>
          `"${c.id}","${c.name}","${c.email}","${c.phone}","${c.city}","${c.registeredDate}",${c.totalOrders},${c.totalSpent},"${c.status}"`
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
          <div className="flex items-center gap-2">
            <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
              Customer & Patron Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#144234]/10 text-[#0B241C] text-[10px] font-bold tracking-wider uppercase border border-[#0B241C]/20">
              Supabase Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#2C4A3E] mt-1">
            Real-time directory of registered circle members, authenticated accounts, saved delivery books, and lifetime relationship metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => fetchCustomers(true)}
            disabled={isRefreshing}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0] text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
            title="Fetch latest registered patrons and orders directly from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C5A059] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Patrons'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#0C3B2E] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Export Directory</span>
          </button>
        </div>
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
            {isLoading ? '...' : customersList.length}
          </p>
          <p className="text-[11px] text-[#5A7469]">Registered patrons & buyers on database</p>
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
            { id: 'all', label: `All Patrons (${customersList.length})` },
            { id: 'vip', label: 'VIP Tier' },
            { id: 'active', label: 'Active Repeat' },
            { id: 'new', label: 'New / Circle Members' },
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
        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#C5A059] mx-auto animate-spin" />
            <p className="text-sm font-bold text-[#0B241C]">Loading Patrons from Supabase...</p>
            <p className="text-xs text-[#5A7469]">Fetching registered profiles, saved address books, and order histories.</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-12 h-12 text-[#C5A059] mx-auto opacity-40" />
            <p className="text-sm font-bold text-[#0B241C]">No Customer Profiles Found</p>
            <p className="text-xs text-[#5A7469] max-w-sm mx-auto">
              {customersList.length === 0
                ? 'No patron registrations or orders found in the database. When users sign up or place orders, their profiles will appear here.'
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
                  <th className="py-3.5 px-6">Saved Addresses</th>
                  <th className="py-3.5 px-6">Orders & Spend</th>
                  <th className="py-3.5 px-6">Tier Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEBE3]">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0B241C] to-[#144234] text-[#D4AF37] font-bold flex items-center justify-center text-xs shrink-0 border border-[#C5A059]/30 shadow-inner">
                          {cust.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#0B241C] flex items-center gap-1.5">
                            <span>{cust.name}</span>
                            {cust.addresses.length > 0 && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Verified Address on File" />
                            )}
                          </p>
                          <p className="text-[11px] text-[#5A7469]">
                            {cust.totalOrders > 0
                              ? `Latest Order: ${cust.lastOrderDate}`
                              : `Circle Member: ${cust.registeredDate}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[#0B241C]">
                        <Mail className="w-3 h-3 text-[#C5A059] shrink-0" />
                        <span className="truncate max-w-[180px]">{cust.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#5A7469]">
                        <Phone className="w-3 h-3 text-[#C5A059] shrink-0" />
                        <span>{cust.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#5A7469]">
                        <MapPin className="w-3 h-3 text-[#C5A059] shrink-0" />
                        <span>{cust.city}{cust.state ? `, ${cust.state}` : ''}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {cust.addresses && cust.addresses.length > 0 ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Home className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{cust.addresses.length} {cust.addresses.length === 1 ? 'address' : 'addresses'}</span>
                          </span>
                          <p className="text-[11px] text-[#5A7469] line-clamp-1 max-w-[180px]">
                            {cust.addresses[0].addressLine}, {cust.addresses[0].city}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#8BAAA0] italic">No address on file</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <p className="font-bold text-sm text-[#0B241C]">
                          ₹{cust.totalSpent.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[11px] text-[#5A7469]">
                          {cust.totalOrders} {cust.totalOrders === 1 ? 'order' : 'orders'}
                        </p>
                      </div>
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
                        <span>View Details</span>
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
            {/* Header */}
            <div className="p-6 bg-[#0B241C] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#FAF8F5] text-[#0B241C] font-bold flex items-center justify-center text-base border-2 border-[#D4AF37] shadow-md">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif-title text-lg font-bold text-white flex items-center gap-2">
                    <span>{selectedCustomer.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-sans font-bold uppercase tracking-wider border border-[#D4AF37]/30">
                      {selectedCustomer.status}
                    </span>
                  </h3>
                  <p className="text-xs text-[#B4C9BF] mt-0.5">
                    {selectedCustomer.email} · {selectedCustomer.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
                  <span className="text-[10px] text-[#5A7469] font-bold uppercase block">Member Since</span>
                  <span className="font-bold text-[#0B241C] block mt-0.5">{selectedCustomer.registeredDate}</span>
                </div>
              </div>

              {/* Saved Delivery Addresses from Cloud */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#0B241C] text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#C5A059]" />
                    <span>Saved Delivery Addresses ({selectedCustomer.addresses.length})</span>
                  </span>
                  <span className="text-[10px] text-[#5A7469] uppercase font-semibold">Supabase Cloud Record</span>
                </h4>

                {selectedCustomer.addresses.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] text-center text-[#5A7469]">
                    No delivery addresses saved on this patron's cloud account yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedCustomer.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white border border-[#E2DBD0] text-[#0B241C]">
                            {addr.label || 'Home'}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Default Address
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-[#0B241C] text-xs">{addr.fullName || selectedCustomer.name}</p>
                        <p className="text-[11px] text-[#5A7469] leading-relaxed">
                          {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-[10px] text-[#5A7469] flex items-center gap-1 pt-0.5">
                          <Phone className="w-2.5 h-2.5 text-[#C5A059]" />
                          <span>{addr.phone || selectedCustomer.phone}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order History */}
              <div className="space-y-3">
                <h4 className="font-bold text-[#0B241C] text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                    <span>Purchased Orders ({selectedCustomer.orders.length})</span>
                  </span>
                  <span className="text-[10px] text-[#5A7469] uppercase font-semibold">Store Orders</span>
                </h4>

                {selectedCustomer.orders.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] text-center text-[#5A7469]">
                    This circle member has registered their account but hasn't placed any purchases yet.
                  </div>
                ) : (
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
                          {ord.trackingNumber && (
                            <p className="text-[10px] text-[#0B241C] mt-0.5 font-medium">
                              Tracking: {ord.trackingNumber} ({ord.courierPartner || 'Courier'})
                            </p>
                          )}
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
                )}
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border-t border-[#E2DBD0] text-right">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-xl bg-[#0B241C] text-white text-xs font-semibold hover:bg-[#C5A059] transition-colors cursor-pointer"
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
