'use client';

import React from 'react';
import { Tag, Sparkles, Copy, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import ProductCard from '../../components/ProductCard';

export default function OffersPage() {
  const { products, coupons, showToast } = useStore();
  const discountedItems = products.filter((p) => p.originalPrice && p.originalPrice > p.price);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('Code Copied!', `${code} copied to your clipboard.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
          Festive Privileges
        </span>
        <h1 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C]">
          Offers & Deals
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E]">
          Exclusive promotional campaigns, discount coupon codes, and bundle specials.
        </p>
      </div>

      {/* Active Coupon Codes Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {coupons.filter(c => c.isActive).map((c) => (
          <div
            key={c.code}
            className="p-5 rounded-2xl bg-white border border-[#E2DBD0] shadow-sm relative space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#C5A059] text-white text-xs font-bold tracking-widest uppercase">
                {c.code}
              </span>
              <button
                onClick={() => copyCode(c.code)}
                className="text-xs font-semibold text-[#5A7469] hover:text-[#C5A059] flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
            <p className="text-xs font-bold text-[#0B241C]">{c.description}</p>
            <p className="text-[11px] text-[#5A7469]">Min Order: ₹{c.minOrderValue.toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      {/* Discounted Products Grid */}
      <div className="space-y-6">
        <h2 className="font-serif-title text-2xl font-bold text-[#0B241C]">
          Special Offer Products
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {discountedItems.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </div>
    </div>
  );
}
