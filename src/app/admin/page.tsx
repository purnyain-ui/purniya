'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Sparkles,
  Truck,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function AdminOverviewPage() {
  const { products, orders, categories, coupons } = useStore();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = orders.length;
  const totalProductsCount = products.length;
  const pendingOrders = orders.filter((o) => o.status === 'New' || o.status === 'Processing');
  const lowStockCount = products.filter((p) => p.stock <= 15).length;

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
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Executive Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Real-time management dashboard across all five Purnya lifestyle categories and store operations.
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
          <Link
            href="/admin/orders"
            className="px-4 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EFEBE3] text-[#0B241C] border border-[#E2DBD0] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Fulfillment Hub</span>
          </Link>
        </div>
      </div>

      {/* Operational Highlights Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Store Status</p>
            <p className="text-sm font-semibold text-emerald-900">Online · 5 Category Boutiques Active</p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
          pendingOrders.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-[#FAF8F5] border-[#E2DBD0]'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#0B241C] uppercase tracking-wider">Fulfillment Queue</p>
            <p className="text-sm font-semibold text-[#0B241C]">
              {pendingOrders.length} {pendingOrders.length === 1 ? 'Order' : 'Orders'} Awaiting Dispatch
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
          lowStockCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-[#FAF8F5] border-[#E2DBD0]'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#0B241C] uppercase tracking-wider">Inventory Health</p>
            <p className="text-sm font-semibold text-[#0B241C]">
              {lowStockCount > 0 ? `${lowStockCount} SKUs Low on Stock` : 'Healthy Across All Lines'}
            </p>
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
          )}
        </div>
      </div>
    </div>
  );
}
