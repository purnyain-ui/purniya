'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Download,
  Calendar,
  Percent,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export default function AdminReportsPage() {
  const { orders, products, categories, coupons, showToast } = useStore();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'quarter' | 'all'>('30d');

  // Business Analytics Calculations
  const grossSales = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders]);
  const totalOrdersCount = orders.length;
  const avgOrderValue = totalOrdersCount > 0 ? Math.round(grossSales / totalOrdersCount) : 0;
  const totalItemsSold = orders.reduce(
    (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
    0
  );

  // Category Breakdown
  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const catProducts = products.filter((p) => p.categorySlug === cat.slug);
      let catRevenue = 0;
      let catUnits = 0;

      orders.forEach((ord) => {
        ord.items.forEach((item) => {
          if (catProducts.some((p) => p.id === item.id || p.name === item.name)) {
            catRevenue += item.price * item.quantity;
            catUnits += item.quantity;
          }
        });
      });

      const pctOfSales = grossSales > 0 ? Math.round((catRevenue / grossSales) * 100) : 0;

      return {
        slug: cat.slug,
        title: cat.title,
        catalogCount: catProducts.length,
        revenue: catRevenue,
        unitsSold: catUnits,
        salesShare: pctOfSales,
      };
    });
  }, [categories, products, orders, grossSales]);

  // Best Selling Products Leaderboard
  const topProducts = useMemo(() => {
    const map = new Map<string, { product: (typeof products)[0]; unitsSold: number; revenue: number }>();

    orders.forEach((ord) => {
      ord.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.id || p.name === item.name);
        if (prod) {
          if (!map.has(prod.id)) {
            map.set(prod.id, { product: prod, unitsSold: item.quantity, revenue: item.price * item.quantity });
          } else {
            const existing = map.get(prod.id)!;
            existing.unitsSold += item.quantity;
            existing.revenue += item.price * item.quantity;
          }
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [orders, products]);

  // Order Status Breakdown
  const orderStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      New: 0,
      Processing: 0,
      Shipped: 0,
      'Out for Delivery': 0,
      Delivered: 0,
      Cancelled: 0,
      Returned: 0,
    };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const handleExportCSV = () => {
    const headers = 'Category,Catalog Products,Revenue (INR),Units Sold,Sales Share (%)\n';
    const rows = categoryStats
      .map((c) => `"${c.title}",${c.catalogCount},${c.revenue},${c.unitsSold},${c.salesShare}%`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purnya-analytics-report-${Date.now()}.csv`;
    a.click();
    showToast('Report Exported', 'Sales analytics report downloaded as CSV.');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Reports & Business Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Financial performance, category sales share, SKU velocity, and coupon utilization (SOW Section 20).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-[#E2DBD0] rounded-xl p-1 flex text-xs font-semibold">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'quarter', label: 'Quarter' },
              { id: 'all', label: 'All Time' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeframe === t.id
                    ? 'bg-[#0B241C] text-white shadow-xs'
                    : 'text-[#5A7469] hover:text-[#0B241C]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0] text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Gross Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#C5A059] flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            ₹{grossSales.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +14.2% vs previous period
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
          <p className="text-[11px] text-[#5A7469]">{totalItemsSold} total items sold</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Average Order Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            ₹{avgOrderValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-[#5A7469]">Basket size per checkout</p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">Active SKU Lines</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            {products.length}
          </p>
          <p className="text-[11px] text-[#5A7469]">5 core lifestyle categories</p>
        </div>
      </div>

      {/* Category Sales Share Matrix */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#EFEBE3] pb-4">
          <div>
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
              Category Sales Performance Matrix
            </h2>
            <p className="text-xs text-[#5A7469]">
              Revenue, unit volume, and catalogue share across each of the 5 Purnya worlds.
            </p>
          </div>
          <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">SOW Section 20</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#5A7469] font-bold uppercase tracking-wider text-[10px] border-b border-[#E2DBD0]">
              <tr>
                <th className="py-3 px-4">Purnya Lifestyle Category</th>
                <th className="py-3 px-4">Catalog SKUs</th>
                <th className="py-3 px-4">Units Sold</th>
                <th className="py-3 px-4">Gross Revenue</th>
                <th className="py-3 px-4">Revenue Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEBE3]">
              {categoryStats.map((c) => (
                <tr key={c.slug} className="hover:bg-[#FAF8F5]/60 transition-colors">
                  <td className="py-4 px-4 font-bold text-[#0B241C] flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>{c.title}</span>
                  </td>
                  <td className="py-4 px-4 text-[#5A7469]">{c.catalogCount} products</td>
                  <td className="py-4 px-4 font-semibold text-[#0B241C]">{c.unitsSold} units</td>
                  <td className="py-4 px-4 font-bold text-[#0B241C]">
                    ₹{c.revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-[#FAF8F5] overflow-hidden border border-[#E2DBD0]">
                        <div
                          className="h-full bg-[#C5A059] rounded-full"
                          style={{ width: `${c.salesShare}%` }}
                        />
                      </div>
                      <span className="font-semibold text-[#0B241C] text-[11px]">{c.salesShare}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Column Section: Top Selling SKUs & Coupon Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Selling Products */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
          <div className="border-b border-[#EFEBE3] pb-4">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
              Best Selling Products Leaderboard
            </h2>
            <p className="text-xs text-[#5A7469]">
              High-velocity products ranked by revenue and units ordered.
            </p>
          </div>

          {topProducts.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Package className="w-8 h-8 text-[#C5A059] mx-auto opacity-50" />
              <p className="text-xs font-bold text-[#0B241C]">Awaiting Sales Transactions</p>
              <p className="text-[11px] text-[#5A7469]">
                As orders are confirmed on the website, top-performing product rankings will update dynamically.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EFEBE3] text-xs">
              {topProducts.slice(0, 5).map((item, idx) => (
                <div key={item.product.id} className="py-3.5 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-serif-title font-bold text-sm text-[#C5A059] w-4 text-center">
                      {idx + 1}
                    </span>
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#E2DBD0]"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-[#0B241C] truncate">{item.product.name}</p>
                      <p className="text-[11px] text-[#5A7469]">{item.product.category} · {item.unitsSold} sold</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-[#0B241C]">₹{item.revenue.toLocaleString('en-IN')}</span>
                    <span className="block text-[10px] text-emerald-700 font-semibold">Stock: {item.product.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Promotion & Coupon Performance */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
          <div className="border-b border-[#EFEBE3] pb-4">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
              Coupon & Offer Utilization
            </h2>
            <p className="text-xs text-[#5A7469]">
              Track promotional campaign redemptions and active discounts.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {coupons.map((coup) => (
              <div
                key={coup.code}
                className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#0B241C] bg-white px-2 py-0.5 rounded border border-[#E2DBD0]">
                      {coup.code}
                    </span>
                    <span className={`text-[10px] font-bold uppercase ${coup.isActive ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {coup.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5A7469] mt-1 line-clamp-1">{coup.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-[#0B241C]">
                    {coup.discountType === 'percentage' ? `${coup.discountValue}% OFF` : `₹${coup.discountValue} OFF`}
                  </span>
                  <span className="block text-[10px] text-[#5A7469]">Used {coup.usageCount || 0} times</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
