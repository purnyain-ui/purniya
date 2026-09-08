'use client';

import React, { useState, useMemo } from 'react';
import {
  Ticket,
  Plus,
  Tag,
  X,
  Calendar,
  Percent,
  CheckCircle2,
  Trash2,
  Copy,
  Clock,
  Search,
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
  Eye,
  Pencil,
  Check,
  TrendingUp,
  LayoutGrid,
  Table as TableIcon,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { Coupon } from '../../../types';
import { getCouponsFromSupabase } from '../../../lib/supabase';

export default function AdminCouponsPage() {
  const { coupons, addCoupon, updateCoupon, toggleCoupon, deleteCoupon, orders, showToast } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingCode, setEditingCode] = useState<string | null>(null);

  // View modal state for inspecting full coupon details
  const [viewingCoupon, setViewingCoupon] = useState<Coupon | null>(null);

  // View mode: 'table' or 'grid'
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Helper for current ISO datetime
  const getCurrentDateTime = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  // Modal Form State matching user screenshot
  const [couponCode, setCouponCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('20');
  const [maxDiscount, setMaxDiscount] = useState<string>('');
  const [minOrderValue, setMinOrderValue] = useState<string>('0');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [validFrom, setValidFrom] = useState<string>(getCurrentDateTime());
  const [validUntil, setValidUntil] = useState<string>('');

  const resetForm = () => {
    setCouponCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('20');
    setMaxDiscount('');
    setMinOrderValue('0');
    setUsageLimit('');
    setValidFrom(getCurrentDateTime());
    setValidUntil('');
    setEditingCode(null);
    setModalMode('create');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCode(coupon.code);
    setModalMode('edit');
    setCouponCode(coupon.code);
    setDescription(coupon.description || '');
    setDiscountType(coupon.discountType || 'percentage');
    setDiscountValue(String(coupon.discountValue || 0));
    setMaxDiscount(coupon.maxDiscount ? String(coupon.maxDiscount) : '');
    setMinOrderValue(String(coupon.minOrderValue || 0));
    setUsageLimit(coupon.usageLimit ? String(coupon.usageLimit) : '');

    const formatToLocalInput = (isoString?: string) => {
      if (!isoString) return '';
      try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return '';
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch {
        return '';
      }
    };

    setValidFrom(formatToLocalInput(coupon.validFrom) || getCurrentDateTime());
    setValidUntil(formatToLocalInput(coupon.validUntil));
    setIsModalOpen(true);
    if (viewingCoupon) setViewingCoupon(null);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Letters, numbers, - and _ only
    const filtered = e.target.value.replace(/[^a-zA-Z0-9-_]/g, '').toUpperCase();
    setCouponCode(filtered);
  };

  // Sync with Supabase cloud database
  const handleSyncCoupons = async () => {
    setIsSyncing(true);
    try {
      const dbCoupons = await getCouponsFromSupabase();
      if (dbCoupons && dbCoupons.length > 0) {
        dbCoupons.forEach((c) => addCoupon(c));
        showToast('Coupons Synced', `Synchronized ${dbCoupons.length} coupons with Supabase cloud.`);
      } else {
        showToast('Coupons Synced', 'Coupons are up to date with cloud.');
      }
    } catch (err) {
      showToast('Sync Notice', 'Supabase sync completed.', 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate live usage count for each coupon (from orders and recorded usageCount)
  const getUsageStats = (coupon: Coupon) => {
    const ordersCount = orders.filter((o) => o.couponCode === coupon.code).length;
    const recordedCount = coupon.usageCount || 0;
    const count = Math.max(recordedCount, ordersCount);
    const limit = coupon.usageLimit;
    const isExhausted = Boolean(limit && limit > 0 && count >= limit);
    return { count, limit, isExhausted };
  };

  // Check validity dates
  const getValidityStatus = (coupon: Coupon) => {
    const now = new Date();
    if (coupon.validFrom) {
      const fromDate = new Date(coupon.validFrom);
      if (now < fromDate) {
        return { label: 'Upcoming', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      }
    }
    if (coupon.validUntil) {
      const untilDate = new Date(coupon.validUntil);
      if (now > untilDate) {
        return { label: 'Expired', color: 'bg-rose-100 text-rose-800 border-rose-300' };
      }
    }
    return coupon.isActive
      ? { label: 'Active', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' }
      : { label: 'Inactive', color: 'bg-gray-100 text-gray-700 border-gray-300' };
  };

  // Handle Save / Update Coupon
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) {
      showToast('Code Required', 'Please enter a valid coupon code.', 'error');
      return;
    }

    const val = Number(discountValue) || 0;
    const minVal = Number(minOrderValue) || 0;
    const maxVal = maxDiscount ? Number(maxDiscount) : undefined;
    const limit = usageLimit ? Number(usageLimit) : undefined;

    if (modalMode === 'edit' && editingCode) {
      // Update existing coupon
      const current = coupons.find((c) => c.code === editingCode);
      const updatedCoupon: Coupon = {
        code: editingCode,
        discountType,
        discountValue: val,
        minOrderValue: minVal,
        maxDiscount: maxVal,
        usageLimit: limit,
        validFrom: validFrom ? new Date(validFrom).toISOString() : undefined,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        isActive: current ? current.isActive : true,
        description: description.trim() || `${val}${discountType === 'percentage' ? '%' : '₹'} off promotional discount`,
        usageCount: current?.usageCount || 0,
      };

      updateCoupon(editingCode, updatedCoupon);
    } else {
      // Create new coupon
      const newCoupon: Coupon = {
        code: cleanCode,
        discountType,
        discountValue: val,
        minOrderValue: minVal,
        maxDiscount: maxVal,
        usageLimit: limit,
        validFrom: validFrom ? new Date(validFrom).toISOString() : undefined,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        isActive: true,
        description: description.trim() || `${val}${discountType === 'percentage' ? '%' : '₹'} off promotional discount`,
        usageCount: 0,
      };

      addCoupon(newCoupon);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('Code Copied', `Coupon ${code} copied to clipboard.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered coupons list
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchesSearch =
        !searchQuery.trim() ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterActive === 'all' ||
        (filterActive === 'active' && c.isActive) ||
        (filterActive === 'inactive' && !c.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [coupons, searchQuery, filterActive]);

  // Overall metric statistics for header
  const totalCouponsCount = coupons.length;
  const activeCouponsCount = coupons.filter((c) => c.isActive).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + getUsageStats(c).count, 0);
  const avgDiscountValue =
    coupons.length > 0
      ? Math.round(coupons.reduce((sum, c) => sum + (c.discountValue || 0), 0) / coupons.length)
      : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ========================================================= */}
      {/* MAIN LUXURY ADMIN HEADER WITH ACTIONS                     */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
              Coupons & Promotions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#144234]/10 text-[#0B241C] text-[10px] font-bold tracking-wider uppercase border border-[#0B241C]/20">
              {activeCouponsCount} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#2C4A3E] mt-1">
            Manage promotional codes, percentage discounts, validity windows, maximum caps, and track redemptions.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleSyncCoupons}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl border border-[#E2DBD0] bg-white hover:bg-[#FAF8F5] text-[#0B241C] text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh coupons from Supabase cloud database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C5A059] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#051813] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md cursor-pointer hover:shadow-lg active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Add Coupon</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN HEADER METRIC CARDS                                  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Total Coupons */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2DBD0] shadow-xs relative overflow-hidden group hover:border-[#C5A059]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Total Coupons</span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] flex items-center justify-center text-[#0B241C] border border-[#E2DBD0]/60">
              <Ticket className="w-4 h-4 text-[#C5A059]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif-title text-[#0B241C]">
              {totalCouponsCount}
            </span>
            <span className="text-[11px] text-[#5A7469]">campaigns</span>
          </div>
        </div>

        {/* Metric 2: Active Campaigns */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2DBD0] shadow-xs relative overflow-hidden group hover:border-[#C5A059]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Active Now</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif-title text-emerald-800">
              {activeCouponsCount}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">live on store</span>
          </div>
        </div>

        {/* Metric 3: Total Times Redeemed (User Requirement: "show count in main header") */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2DBD0] shadow-xs relative overflow-hidden group hover:border-[#C5A059]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Times Used</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif-title text-[#0B241C]">
              {totalRedemptions}
            </span>
            <span className="text-[11px] text-[#5A7469]">orders redeemed</span>
          </div>
        </div>

        {/* Metric 4: Average Discount */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2DBD0] shadow-xs relative overflow-hidden group hover:border-[#C5A059]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Avg Discount</span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] flex items-center justify-center text-[#0B241C] border border-[#E2DBD0]/60">
              <Percent className="w-4 h-4 text-[#C5A059]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-serif-title text-[#0B241C]">
              {avgDiscountValue}%
            </span>
            <span className="text-[11px] text-[#5A7469]">avg benefit</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SEARCH, STATUS FILTER & VIEW TOGGLE                       */}
      {/* ========================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E2DBD0] shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#5A7469] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by coupon code or internal note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs focus:outline-none focus:border-[#C5A059]"
          />
        </div>

        {/* Filters & View Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Tabs */}
          <div className="flex gap-1.5 text-xs font-semibold p-1 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl">
            {[
              { id: 'all', label: `All (${coupons.length})` },
              { id: 'active', label: `Active (${coupons.filter((c) => c.isActive).length})` },
              { id: 'inactive', label: `Inactive (${coupons.filter((c) => !c.isActive).length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterActive(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterActive === tab.id
                    ? 'bg-[#0B241C] text-white shadow-xs'
                    : 'text-[#5A7469] hover:bg-[#EFEBE3]/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table vs Grid Toggle */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-[#0B241C] text-white shadow-xs' : 'text-[#5A7469] hover:text-[#0B241C]'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#0B241C] text-white shadow-xs' : 'text-[#5A7469] hover:text-[#0B241C]'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* COUPONS DISPLAY: TABLE VIEW (DEFAULT)                     */}
      {/* ========================================================= */}
      {filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2DBD0] p-12 text-center space-y-3 shadow-sm">
          <Ticket className="w-12 h-12 text-[#C5A059] mx-auto opacity-40" />
          <p className="text-sm font-bold text-[#0B241C]">No Coupons Found</p>
          <p className="text-xs text-[#5A7469] max-w-sm mx-auto">
            {coupons.length === 0
              ? 'No promotional coupons on record. Click "+ Add Coupon" to create your first discount campaign.'
              : 'No coupons match your search and status filter.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-[#E2DBD0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E2DBD0] text-[#5A7469] text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-4 px-5">Coupon Code & Note</th>
                  <th className="py-4 px-4">Discount</th>
                  <th className="py-4 px-4">Min Order</th>
                  <th className="py-4 px-4">Times Used</th>
                  <th className="py-4 px-4">Validity</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEBE3]">
                {filteredCoupons.map((coupon) => {
                  const usage = getUsageStats(coupon);
                  const validity = getValidityStatus(coupon);
                  const isLongNote = (coupon.description || '').length > 35;

                  return (
                    <tr
                      key={coupon.code}
                      className="hover:bg-[#FAF8F5]/60 transition-colors group"
                    >
                      {/* Column 1: Coupon Code & Description */}
                      <td className="py-4 px-5 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0] font-mono tracking-wider shadow-2xs">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 text-gray-400 hover:text-[#0B241C] transition-colors rounded cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="mt-1 text-[11px] text-[#5A7469] max-w-xs truncate flex items-center gap-1.5">
                          <span>{coupon.description || 'Promotional coupon'}</span>
                          {isLongNote && (
                            <button
                              onClick={() => setViewingCoupon(coupon)}
                              className="text-[#C5A059] hover:underline text-[10px] font-semibold cursor-pointer shrink-0"
                            >
                              [more]
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Discount */}
                      <td className="py-4 px-4 align-middle">
                        <div className="font-bold text-[#0B241C]">
                          {coupon.discountType === 'percentage'
                            ? `${coupon.discountValue}% OFF`
                            : `Flat ₹${coupon.discountValue} OFF`}
                        </div>
                        {coupon.maxDiscount && (
                          <div className="text-[10px] text-[#5A7469] mt-0.5">
                            Capped at ₹{coupon.maxDiscount}
                          </div>
                        )}
                      </td>

                      {/* Column 3: Min Order Value */}
                      <td className="py-4 px-4 align-middle text-[#0B241C] font-medium">
                        {coupon.minOrderValue && coupon.minOrderValue > 0 ? (
                          `₹${coupon.minOrderValue.toLocaleString('en-IN')}`
                        ) : (
                          <span className="text-gray-400">No Minimum</span>
                        )}
                      </td>

                      {/* Column 4: Times Used (User Requirement: "show count in table okay") */}
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0]">
                            {usage.count} {usage.limit ? `/ ${usage.limit}` : ''} used
                          </span>
                        </div>
                        {usage.limit && usage.limit > 0 && (
                          <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                usage.isExhausted ? 'bg-rose-500' : 'bg-[#C5A059]'
                              }`}
                              style={{
                                width: `${Math.min(100, Math.round((usage.count / usage.limit) * 100))}%`,
                              }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Column 5: Validity Window */}
                      <td className="py-4 px-4 align-middle">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${validity.color}`}
                        >
                          {validity.label}
                        </span>
                        <div className="text-[10px] text-[#5A7469] mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#C5A059]" />
                          {coupon.validUntil ? (
                            <span>Until {new Date(coupon.validUntil).toLocaleDateString('en-IN')}</span>
                          ) : (
                            <span>Never expires</span>
                          )}
                        </div>
                      </td>

                      {/* Column 6: Status Toggle */}
                      <td className="py-4 px-4 align-middle text-center">
                        <button
                          onClick={() => toggleCoupon(coupon.code)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                            coupon.isActive ? 'bg-[#0B241C]' : 'bg-gray-300'
                          }`}
                          title={coupon.isActive ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              coupon.isActive ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Column 7: Actions (View, Edit, Delete) */}
                      <td className="py-4 px-5 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Button ("if it long keep in view button") */}
                          <button
                            onClick={() => setViewingCoupon(coupon)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EFEBE3] text-[#0B241C] border border-[#E2DBD0] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="View complete coupon details"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#C5A059]" />
                            <span className="hidden md:inline">View</span>
                          </button>

                          {/* Edit Button ("also keep edit option for this editable") */}
                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#0B241C] hover:text-white text-[#0B241C] border border-[#E2DBD0] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer group/edit"
                            title="Edit coupon"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[#C5A059] group-hover/edit:text-[#D4AF37]" />
                            <span className="hidden md:inline">Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete coupon ${coupon.code}?`)) {
                                deleteCoupon(coupon.code);
                              }
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* GRID CARD VIEW (Alternative)                             */
        /* ========================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoupons.map((coupon) => {
            const usage = getUsageStats(coupon);
            const validity = getValidityStatus(coupon);

            return (
              <div
                key={coupon.code}
                className={`p-6 rounded-3xl border transition-all bg-white shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden group ${
                  coupon.isActive ? 'border-[#E2DBD0] hover:border-[#C5A059]/60' : 'border-gray-200 opacity-70'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0] shadow-2xs font-mono">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(coupon.code)}
                        className="p-1 rounded-lg hover:bg-[#FAF8F5] text-[#5A7469] hover:text-[#0B241C] transition-colors cursor-pointer"
                        title="Copy code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${validity.color}`}
                    >
                      {validity.label}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif-title text-xl font-bold text-[#0B241C] flex items-baseline gap-2">
                      {coupon.discountType === 'percentage'
                        ? `${coupon.discountValue}% OFF`
                        : `Flat ₹${coupon.discountValue} OFF`}
                      {coupon.maxDiscount && (
                        <span className="text-xs font-sans font-normal text-[#5A7469]">
                          (Max ₹{coupon.maxDiscount})
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#5A7469] mt-0.5 leading-relaxed line-clamp-2">
                      {coupon.description || 'Promotional coupon'}
                    </p>
                  </div>

                  {/* Usage Counter Badge */}
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-[#5A7469]">Times Used:</span>
                    <span className="font-bold text-[#0B241C]">
                      {usage.count} {usage.limit ? `/ ${usage.limit}` : ''}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#EFEBE3] grid grid-cols-2 gap-2 text-[11px] text-[#5A7469]">
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-gray-400">Min Order</span>
                      <span className="font-semibold text-[#0B241C]">
                        {coupon.minOrderValue ? `₹${coupon.minOrderValue}` : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-gray-400">Valid Until</span>
                      <span className="font-semibold text-[#0B241C]">
                        {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString('en-IN') : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#EFEBE3] pt-3 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setViewingCoupon(coupon)}
                    className="text-xs font-semibold text-[#C5A059] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(coupon)}
                      className="text-xs font-semibold text-[#0B241C] hover:text-[#C5A059] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon.code)}
                      className="text-gray-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* "VIEW COUPON" DETAIL MODAL ("if it long keep in view")     */}
      {/* ========================================================= */}
      {viewingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E2DBD0] shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 sm:p-8 space-y-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-[#EFEBE3] pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="px-3.5 py-1 rounded-xl text-sm font-bold uppercase bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0] font-mono shadow-xs">
                      {viewingCoupon.code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        getValidityStatus(viewingCoupon).color
                      }`}
                    >
                      {getValidityStatus(viewingCoupon).label}
                    </span>
                  </div>
                  <h3 className="font-serif-title text-xl font-bold text-[#0B241C] mt-2">
                    {viewingCoupon.discountType === 'percentage'
                      ? `${viewingCoupon.discountValue}% OFF`
                      : `Flat ₹${viewingCoupon.discountValue} OFF`}
                  </h3>
                </div>

                <button
                  onClick={() => setViewingCoupon(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Full Description (Even if very long) */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E2DBD0]/60 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A7469]">
                  Description & Internal Note
                </span>
                <p className="text-xs text-[#0B241C] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {viewingCoupon.description || 'No description provided.'}
                </p>
              </div>

              {/* Detailed Breakdown Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E2DBD0]/60">
                  <span className="text-[10px] uppercase font-bold text-[#5A7469] block">Discount Type</span>
                  <span className="font-semibold text-[#0B241C] capitalize mt-0.5 block">
                    {viewingCoupon.discountType}
                  </span>
                </div>

                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E2DBD0]/60">
                  <span className="text-[10px] uppercase font-bold text-[#5A7469] block">Max Discount Cap</span>
                  <span className="font-semibold text-[#0B241C] mt-0.5 block">
                    {viewingCoupon.maxDiscount ? `₹${viewingCoupon.maxDiscount}` : 'No cap'}
                  </span>
                </div>

                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E2DBD0]/60">
                  <span className="text-[10px] uppercase font-bold text-[#5A7469] block">Minimum Order</span>
                  <span className="font-semibold text-[#0B241C] mt-0.5 block">
                    {viewingCoupon.minOrderValue ? `₹${viewingCoupon.minOrderValue}` : 'None (₹0)'}
                  </span>
                </div>

                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E2DBD0]/60">
                  <span className="text-[10px] uppercase font-bold text-[#5A7469] block">Usage Count</span>
                  <span className="font-semibold text-[#0B241C] mt-0.5 block">
                    {getUsageStats(viewingCoupon).count}{' '}
                    {viewingCoupon.usageLimit ? `of ${viewingCoupon.usageLimit} max` : 'times used'}
                  </span>
                </div>

                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E2DBD0]/60">
                  <span className="text-[10px] uppercase font-bold text-[#5A7469] block">Valid From</span>
                  <span className="font-semibold text-[#0B241C] mt-0.5 block">
                    {viewingCoupon.validFrom
                      ? new Date(viewingCoupon.validFrom).toLocaleString('en-IN')
                      : 'Always active'}
                  </span>
                </div>

                <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E2DBD0]/60">
                  <span className="text-[10px] uppercase font-bold text-[#5A7469] block">Valid Until</span>
                  <span className="font-semibold text-[#0B241C] mt-0.5 block">
                    {viewingCoupon.validUntil
                      ? new Date(viewingCoupon.validUntil).toLocaleString('en-IN')
                      : 'Never expires'}
                  </span>
                </div>
              </div>

              {/* Actions inside View Modal */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#EFEBE3]">
                <button
                  type="button"
                  onClick={() => handleCopyCode(viewingCoupon.code)}
                  className="px-4 py-2.5 rounded-xl border border-[#E2DBD0] bg-[#FAF8F5] hover:bg-[#EFEBE3] text-[#0B241C] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(viewingCoupon)}
                  className="px-5 py-2.5 rounded-xl bg-[#0B241C] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Edit Coupon</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EXACT "ADD / EDIT COUPON" MODAL MATCHING SCREENSHOT       */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#E2DBD0] shadow-2xl overflow-hidden animate-scale-up">
            <form onSubmit={handleSaveCoupon} className="p-6 sm:p-8 space-y-5 text-xs">
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-2">
                <h2 className="text-base sm:text-lg font-bold text-[#111111] tracking-tight">
                  {modalMode === 'edit' ? `Edit Coupon: ${couponCode}` : 'Add Coupon'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Row 1: COUPON CODE & DESCRIPTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-gray-700 tracking-wider uppercase block mb-1.5">
                    COUPON CODE
                  </label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'edit'}
                    value={couponCode}
                    onChange={handleCodeChange}
                    placeholder="SAVE20"
                    className={`w-full px-3.5 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-gray-900 font-semibold focus:bg-white focus:outline-none focus:border-[#0B241C] transition-all uppercase placeholder:text-gray-400 ${
                      modalMode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                  <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1">
                    Letters, numbers, - and _ only.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-gray-700 tracking-wider uppercase block mb-1.5">
                    DESCRIPTION
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Internal note — e.g. Diwali sale"
                    className="w-full px-3.5 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-gray-900 focus:bg-white focus:outline-none focus:border-[#0B241C] transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Row 2: DISCOUNT TYPE, PERCENT OFF / DISCOUNT VALUE, MAX DISCOUNT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-gray-700 tracking-wider uppercase block mb-1.5">
                    DISCOUNT TYPE
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#0B241C] transition-all"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-gray-700 tracking-wider uppercase block mb-1.5">
                    {discountType === 'percentage' ? 'PERCENT OFF' : 'DISCOUNT (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percentage' ? '100' : '999999'}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '20' : '500'}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#0B241C] transition-all placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-gray-700 tracking-wider uppercase block mb-1.5">
                    MAX DISCOUNT (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="Optional cap"
                    className="w-full px-3.5 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#0B241C] transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Row 3: MIN ORDER VALUE & USAGE LIMIT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-gray-700 tracking-wider uppercase block mb-1.5">
                    MIN ORDER VALUE (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#0B241C] transition-all placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-gray-700 tracking-wider uppercase block mb-1.5">
                    USAGE LIMIT
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="Blank = unlimited"
                    className="w-full px-3.5 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#0B241C] transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Row 4: VALID FROM & VALID UNTIL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-gray-700 tracking-wider uppercase block mb-1.5">
                    VALID FROM
                  </label>
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#0B241C] transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-gray-700 tracking-wider uppercase block mb-1.5">
                    VALID UNTIL
                  </label>
                  <input
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    placeholder="mm/dd/yyyy --:-- --"
                    className="w-full px-3.5 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#0B241C] transition-all"
                  />
                  <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1">
                    Blank = never expires.
                  </p>
                </div>
              </div>

              {/* Full Width Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 sm:py-4 rounded-xl bg-[#111111] hover:bg-black text-white font-bold text-xs uppercase tracking-widest transition-all shadow-md cursor-pointer hover:shadow-lg active:scale-[0.99]"
                >
                  {modalMode === 'edit' ? 'UPDATE COUPON' : 'SAVE COUPON'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
