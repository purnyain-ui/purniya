'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Truck,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Palette,
  Ticket,
  RefreshCw,
  Boxes,
  RotateCcw,
  BarChart3,
  Sparkles,
  Layers,
  ArrowUpRight,
  Database,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { getCustomersAndPatronsFromSupabase } from '../../lib/supabase';

export default function AdminOverviewPage() {
  const { products, orders, categories, coupons, refreshCatalog, showToast, supabaseStatus } = useStore();

  const [patronsCount, setPatronsCount] = useState<number>(2);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load registered patrons count from Supabase on mount
  useEffect(() => {
    getCustomersAndPatronsFromSupabase()
      .then((customers) => {
        if (customers && customers.length > 0) {
          setPatronsCount(customers.length);
        }
      })
      .catch(() => {});
  }, []);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await refreshCatalog();
      const freshCustomers = await getCustomersAndPatronsFromSupabase();
      if (freshCustomers && freshCustomers.length > 0) {
        setPatronsCount(freshCustomers.length);
      }
      showToast('Dashboard Refreshed', 'Latest catalog, orders, and patron data synchronized.');
    } catch {
      showToast('Refresh Notice', 'Dashboard updated from local and cloud cache.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrdersCount = orders.length;
  const totalProductsCount = products.length;
  const pendingOrders = orders.filter((o) => o.status === 'New' || o.status === 'Processing');
  const lowStockCount = products.filter((p) => p.stock <= 15).length;
  const activeCouponsCount = coupons.filter((c) => c.isActive).length;

  const statusColors: Record<string, string> = {
    New: 'bg-amber-100 text-amber-800',
    Processing: 'bg-blue-100 text-blue-800',
    Shipped: 'bg-purple-100 text-purple-800',
    'Out for Delivery': 'bg-indigo-100 text-indigo-800',
    Delivered: 'bg-emerald-100 text-emerald-800',
    Cancelled: 'bg-rose-100 text-rose-800',
    Returned: 'bg-orange-100 text-orange-800',
  };

  // Category product distribution
  const categoryCounts = categories.map((cat) => ({
    name: cat.title,
    count: products.filter((p) => p.categorySlug === cat.slug).length,
    slug: cat.slug,
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ========================================================= */}
      {/* 1. EXECUTIVE HEADER WITH LIVE CLOUD STATUS & ACTIONS      */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
              Executive Overview
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cloud Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#2C4A3E] mt-1">
            Real-time management dashboard across all 5 Purnya luxury boutique categories, patron orders, and cloud storage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Refresh Button */}
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl border border-[#E2DBD0] bg-white hover:bg-[#FAF8F5] text-[#0B241C] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh dashboard metrics from cloud"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C5A059] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync Studio'}</span>
          </button>

          {/* Add Product Button */}
          <Link
            href="/admin/products/add"
            className="px-4 py-2 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:shadow-md"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Add Product</span>
          </Link>

          {/* Create Coupon Button */}
          <Link
            href="/admin/coupons"
            className="px-4 py-2 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Coupons</span>
          </Link>

          {/* Orders Button */}
          <Link
            href="/admin/orders"
            className="px-4 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EFEBE3] text-[#0B241C] border border-[#E2DBD0] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Fulfillment</span>
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. OPERATIONAL HIGHLIGHTS STRIP                          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Store & Cloud Status */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Store Status</p>
            <p className="text-sm font-semibold text-emerald-900">
              Online · 5 Boutiques Live on Cloud
            </p>
          </div>
        </div>

        {/* Fulfillment Queue */}
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
            pendingOrders.length > 0
              ? 'bg-amber-50 border-amber-200'
              : 'bg-[#FAF8F5] border-[#E2DBD0]'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#0B241C] uppercase tracking-wider">Fulfillment Queue</p>
            <p className="text-sm font-semibold text-[#0B241C]">
              {pendingOrders.length} {pendingOrders.length === 1 ? 'Order' : 'Orders'} Awaiting Dispatch
            </p>
          </div>
        </div>

        {/* Inventory Health */}
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
            lowStockCount > 0
              ? 'bg-rose-50 border-rose-200'
              : 'bg-[#FAF8F5] border-[#E2DBD0]'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-700" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#0B241C] uppercase tracking-wider">Inventory Health</p>
            <p className="text-sm font-semibold text-[#0B241C]">
              {lowStockCount > 0 ? `${lowStockCount} SKUs Low on Stock` : 'Healthy Across All Lines'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. KEY METRICS KPI CARDS (5 Core Performance Pillars)    */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2DBD0] shadow-xs space-y-1.5 hover:border-[#C5A059]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A7469]">Total Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#C5A059] flex items-center justify-center font-bold text-xs">
              ₹
            </div>
          </div>
          <p className="font-serif-title text-2xl font-bold text-[#0B241C]">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Live Gross Volume
          </p>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2DBD0] shadow-xs space-y-1.5 hover:border-[#C5A059]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A7469]">Total Orders</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="font-serif-title text-2xl font-bold text-[#0B241C]">
            {totalOrdersCount}
          </p>
          <p className="text-[10px] text-[#5A7469]">
            {pendingOrders.length} pending fulfillment
          </p>
        </div>

        {/* KPI 3: Catalog Pieces */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2DBD0] shadow-xs space-y-1.5 hover:border-[#C5A059]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A7469]">Catalog SKUs</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="font-serif-title text-2xl font-bold text-[#0B241C]">
            {totalProductsCount}
          </p>
          <p className="text-[10px] text-[#5A7469]">5 Boutique Collections</p>
        </div>

        {/* KPI 4: Registered Patrons */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2DBD0] shadow-xs space-y-1.5 hover:border-[#C5A059]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A7469]">Patrons & VIPs</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="font-serif-title text-2xl font-bold text-[#0B241C]">
            {patronsCount}
          </p>
          <Link
            href="/admin/customers"
            className="text-[10px] text-[#C5A059] font-semibold hover:underline flex items-center gap-0.5"
          >
            <span>View Patrons</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* KPI 5: Active Coupons */}
        <div className="p-5 rounded-2xl bg-white border border-[#E2DBD0] shadow-xs space-y-1.5 hover:border-[#C5A059]/40 transition-all col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A7469]">Active Coupons</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Ticket className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="font-serif-title text-2xl font-bold text-[#0B241C]">
            {activeCouponsCount}
          </p>
          <Link
            href="/admin/coupons"
            className="text-[10px] text-[#C5A059] font-semibold hover:underline flex items-center gap-0.5"
          >
            <span>Manage Promos</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. QUICK ACCESS MANAGEMENT HUBS                           */}
      {/* ========================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFEBE3] pb-3">
          <h2 className="font-serif-title text-base font-bold text-[#0B241C] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#C5A059]" />
            <span>Operations Hub Direct Shortcuts</span>
          </h2>
          <span className="text-[11px] text-[#5A7469]">Quick access to Merchant Studio tools</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/admin/orders"
            className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] hover:border-[#C5A059] transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E2DBD0] flex items-center justify-center text-[#0B241C] group-hover:bg-[#0B241C] group-hover:text-[#D4AF37] transition-colors">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0B241C]">Orders</p>
              <p className="text-[10px] text-[#5A7469]">{totalOrdersCount} total</p>
            </div>
          </Link>

          <Link
            href="/admin/products"
            className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] hover:border-[#C5A059] transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E2DBD0] flex items-center justify-center text-[#0B241C] group-hover:bg-[#0B241C] group-hover:text-[#D4AF37] transition-colors">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0B241C]">Products</p>
              <p className="text-[10px] text-[#5A7469]">{totalProductsCount} SKUs</p>
            </div>
          </Link>

          <Link
            href="/admin/customers"
            className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] hover:border-[#C5A059] transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E2DBD0] flex items-center justify-center text-[#0B241C] group-hover:bg-[#0B241C] group-hover:text-[#D4AF37] transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0B241C]">Customers</p>
              <p className="text-[10px] text-[#5A7469]">{patronsCount} patrons</p>
            </div>
          </Link>

          <Link
            href="/admin/coupons"
            className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] hover:border-[#C5A059] transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E2DBD0] flex items-center justify-center text-[#0B241C] group-hover:bg-[#0B241C] group-hover:text-[#D4AF37] transition-colors">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0B241C]">Coupons</p>
              <p className="text-[10px] text-[#5A7469]">{activeCouponsCount} active</p>
            </div>
          </Link>

          <Link
            href="/admin/inventory"
            className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] hover:border-[#C5A059] transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E2DBD0] flex items-center justify-center text-[#0B241C] group-hover:bg-[#0B241C] group-hover:text-[#D4AF37] transition-colors">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0B241C]">Inventory</p>
              <p className="text-[10px] text-[#5A7469]">{lowStockCount} low stock</p>
            </div>
          </Link>

          <Link
            href="/admin/reports"
            className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] hover:border-[#C5A059] transition-all group flex flex-col justify-between space-y-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E2DBD0] flex items-center justify-center text-[#0B241C] group-hover:bg-[#0B241C] group-hover:text-[#D4AF37] transition-colors">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0B241C]">Analytics</p>
              <p className="text-[10px] text-[#5A7469]">Reports & Trends</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. CATEGORY BREAKDOWN & RECENT CUSTOMER ORDERS            */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Category Share */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#EFEBE3] pb-4">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
              Category Breakdown
            </h2>
            <Link href="/admin/categories" className="text-xs font-semibold text-[#C5A059] hover:underline flex items-center gap-1">
              <span>Categories</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {categoryCounts.map((cat) => {
              const pct = Math.round((cat.count / (totalProductsCount || 1)) * 100);
              return (
                <div key={cat.slug} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-[#0B241C]">
                    <span>{cat.name}</span>
                    <span className="text-[#5A7469]">
                      {cat.count} items ({pct}%)
                    </span>
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

        {/* Recent Customer Orders */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#EFEBE3] pb-4">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
              Recent Customer Orders
            </h2>
            <Link href="/admin/orders" className="text-xs font-semibold text-[#C5A059] hover:underline flex items-center gap-1">
              <span>All Orders ({orders.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-[#C5A059] mx-auto opacity-50" />
              <p className="text-xs font-bold text-[#0B241C]">No Customer Orders Yet</p>
              <p className="text-[11px] text-[#5A7469] max-w-xs mx-auto">
                Orders placed on any of the five boutique storefronts will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EFEBE3] text-xs">
              {orders.slice(0, 5).map((ord) => (
                <div key={ord.id} className="py-3.5 first:pt-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0B241C] font-mono">{ord.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          statusColors[ord.status] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5A7469] truncate mt-0.5">
                      {ord.customer?.name || 'Patron'} · {ord.items?.length || 0} items · {ord.date}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-[#0B241C]">
                      ₹{(ord.total || 0).toLocaleString('en-IN')}
                    </span>
                    <Link
                      href="/admin/orders"
                      className="block text-[11px] text-[#C5A059] hover:underline font-semibold"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
