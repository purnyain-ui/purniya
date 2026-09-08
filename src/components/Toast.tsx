'use client';

import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, Info, AlertCircle, Heart, ShoppingBag, Sparkles, X } from 'lucide-react';

export default function Toast() {
  const { toast } = useStore();

  if (!toast) return null;

  const getCuteIcon = () => {
    const title = toast.title || '';
    if (title.includes('Wishlist') || title.includes('💔')) {
      return (
        <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 shrink-0 shadow-xs">
          <Heart className="w-4 h-4 fill-rose-500/20" />
        </div>
      );
    }
    if (title.includes('Bag') || title.includes('🛍️') || title.includes('Cart')) {
      return (
        <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shrink-0 shadow-xs">
          <ShoppingBag className="w-4 h-4" />
        </div>
      );
    }
    if (title.includes('Order') || title.includes('💎') || title.includes('✨') || title.includes('Sign In')) {
      return (
        <div className="w-8 h-8 rounded-full bg-[#08281F] border border-[#C5A059]/50 flex items-center justify-center text-[#D4AF37] shrink-0 shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
      );
    }

    if (toast.type === 'error') {
      return (
        <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
      );
    }

    if (toast.type === 'info') {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#C5A059] shrink-0">
          <Info className="w-4 h-4" />
        </div>
      );
    }

    return (
      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0C3B2E] shrink-0">
        <CheckCircle2 className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-[110] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-start gap-3.5 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#C5A059]/30 max-w-sm">
        {getCuteIcon()}
        <div className="flex-1 pr-1">
          <p className="text-xs sm:text-sm font-bold text-[#0B241C] leading-snug">{toast.title}</p>
          {toast.desc && (
            <p className="text-[11px] sm:text-xs text-[#5A7469] mt-0.5 leading-relaxed">{toast.desc}</p>
          )}
        </div>
      </div>
    </div>
  );
}
