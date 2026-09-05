'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  Truck,
  Plus,
  Database,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function AdminOverviewPage() {
  const { products, orders, categories, coupons, supabaseStatus, syncCatalogToSupabase } = useStore();
  const [syncing, setSyncing] = useState(false);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = orders.length;
  const totalProductsCount = products.length;

  const handleSyncSupabase = async () => {
    setSyncing(true);
    await syncCatalogToSupabase();
    setSyncing(false);
  };

  const statusColors: Record<string, string> = {
    New: 'bg-amber-100 text-amber-800',
    Processing: 'bg-blue-100 text-blue-800',
    Shipped: 'bg-purple-100 text-purple-800',
    'Out for Delivery': 'bg-indigo-100 text-indigo-800',
    Delivered: 'bg-emerald-100 text-emerald-800',
    Cancelled: 'bg-rose-100 text-rose-800',
  };

  // Category product distribution
  const categoryCounts = categories.map((cat) => ({
    name: cat.title,
    count: products.filter((p) => p.categorySlug === cat.slug).length,
    slug: cat.slug,
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Executive Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Real-time analytics across all five Purnya categories and customer orders.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products"
            className="px-4 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Product</span>
          </Link>
          <Link
            href="/admin/coupons"
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Create Promo Coupon</span>
          </Link>
        </div>
      </div>

      {/* Supabase Cloud Live Integration Status Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0C3B2E] to-[#164E3D] text-white p-6 shadow-md border border-[#C5A059]/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Database className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif-title text-lg font-bold text-white">
                  Supabase Cloud Database
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  supabaseStatus.connected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${supabaseStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {supabaseStatus.connected ? 'Connected' : 'Connecting'}
                </span>
              </div>
              <p className="text-xs text-[#B4C9BF] mt-0.5">
                Project Ref: <code className="bg-black/20 px-1.5 py-0.5 rounded text-[#D4AF37] font-mono text-[11px]">{supabaseStatus.projectRef}</code>
                {' · '}{supabaseStatus.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={handleSyncSupabase}
              disabled={syncing}
              className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-[#08281F] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-105 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync Catalog to Supabase'}</span>
            </button>
            <a
              href={`https://supabase.com/dashboard/project/${supabaseStatus.projectRef}/sql`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/20"
              title="Open Supabase SQL Editor"
            >
              <span>SQL Editor</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
            </a>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#C5A059] flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% this month
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {totalOrdersCount}
          </p>
          <p className="text-[11px] text-[#5A7469]">
            {orders.filter((o) => o.status === 'New' || o.status === 'Processing').length} awaiting fulfillment
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Catalog Products</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {totalProductsCount}
          </p>
          <p className="text-[11px] text-[#5A7469]">Across 5 lifestyle categories</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Active Coupons</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {coupons.filter((c) => c.isActive).length}
          </p>
          <p className="text-[11px] text-[#5A7469]">Discount promotions running</p>
        </div>
      </div>

      {/* Category Performance & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Category Share */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#EFEBE3] pb-4">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
              Category Breakdown
            </h2>
            <Link href="/admin/categories" className="text-xs font-semibold text-[#C5A059] hover:underline">
              Manage Categories →
            </Link>
          </div>

          <div className="space-y-4">
            {categoryCounts.map((cat) => {
              const pct = Math.round((cat.count / (totalProductsCount || 1)) * 100);
              return (
                <div key={cat.slug} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-[#0B241C]">
                    <span>{cat.name}</span>
                    <span className="text-[#5A7469]">{cat.count} items ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#FAF8F5] overflow-hidden border border-[#E2DBD0]">
                    <div
                      className="h-full bg-[#C5A059] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Orders Overview */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#EFEBE3] pb-4">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
              Recent Customer Orders
            </h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-[#C5A059] hover:underline">
              View All Orders ({orders.length}) →
            </Link>
          </div>

          <div className="divide-y divide-[#EFEBE3] text-xs">
            {orders.slice(0, 4).map((ord) => (
              <div key={ord.id} className="py-3.5 first:pt-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0B241C]">{ord.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[ord.status] || 'bg-gray-100 text-gray-800'}`}>
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5A7469] truncate">
                    {ord.customer.name} · {ord.items.length} items · {ord.date}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-[#0B241C]">₹{ord.total.toLocaleString('en-IN')}</span>
                  <Link
                    href="/admin/orders"
                    className="block text-[11px] text-[#C5A059] hover:underline"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
