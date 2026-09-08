'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Lock, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function AuthModal() {
  const router = useRouter();
  const { authModal, closeAuthModal } = useStore();

  if (!authModal || !authModal.isOpen) return null;

  const { actionType, title, message, redirectUrl } = authModal;

  const handleSignIn = () => {
    closeAuthModal();
    const dest = redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login';
    router.push(dest);
  };

  const handleSignUp = () => {
    closeAuthModal();
    const dest = redirectUrl ? `/signup?redirect=${encodeURIComponent(redirectUrl)}` : '/signup';
    router.push(dest);
  };

  // Cute icons and badges per action
  const actionConfig = {
    order: {
      icon: <Lock className="w-7 h-7 text-[#D4AF37]" />,
      badge: 'Bespoke Checkout',
      defaultTitle: 'Sign In to Place Order 💎',
      defaultDesc: 'Please sign in to your Purnya Circle account to finalize your bespoke delivery details and place your order.',
      primaryBtn: 'Sign In to Place Order',
    },
    wishlist: {
      icon: <Heart className="w-7 h-7 text-rose-500 fill-rose-500/20" />,
      badge: 'Personal Collection',
      defaultTitle: 'Save to Your Wishlist ✨',
      defaultDesc: 'Please sign in to keep your favorite pieces saved in your personal wishlist collection across all your devices.',
      primaryBtn: 'Sign In to Save Pieces',
    },
    bag: {
      icon: <ShoppingBag className="w-7 h-7 text-[#D4AF37]" />,
      badge: 'Shopping Bag',
      defaultTitle: 'Add to Your Bag 🛍️',
      defaultDesc: 'Please sign in to your account to add artisanal pieces to your bag and enjoy uninterrupted shopping.',
      primaryBtn: 'Sign In to Add to Bag',
    },
  };

  const config = actionConfig[actionType || 'order'] || actionConfig.order;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-[#C5A059]/40 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full text-[#5A7469] hover:text-[#0B241C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cute Icon Header */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-[#08281F] flex items-center justify-center shadow-lg border border-[#C5A059]/50">
              {config.icon}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37] text-[#08281F]">
              <Sparkles className="w-3 h-3 fill-current" />
            </span>
          </div>

          <span className="px-3 py-1 rounded-full bg-[#FAF8F5] text-[#C5A059] text-[10px] font-bold uppercase tracking-wider border border-[#E2DBD0] mt-1">
            {config.badge}
          </span>
        </div>

        {/* Title and Message */}
        <div className="space-y-2">
          <h3 className="font-serif-title text-2xl font-bold text-[#0B241C] tracking-tight">
            {title || config.defaultTitle}
          </h3>
          <p className="text-xs sm:text-sm text-[#2C4A3E] leading-relaxed">
            {message || config.defaultDesc}
          </p>
        </div>

        {/* Member perks mini-badge */}
        <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FAF8F5] border border-[#EFEBE3] text-[11px] text-[#5A7469]">
          <ShieldCheck className="w-4 h-4 text-[#0C3B2E] shrink-0" />
          <span>Instant checkout · Saved addresses · Privileged offers</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          <button
            onClick={handleSignIn}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
          >
            <span>{config.primaryBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleSignUp}
            className="w-full py-3 px-6 rounded-2xl bg-white hover:bg-[#FAF8F5] text-[#0B241C] border border-[#E2DBD0] hover:border-[#0C3B2E] font-semibold text-xs tracking-wider transition-all cursor-pointer"
          >
            New to Purnya? Join the Circle
          </button>

          <button
            onClick={closeAuthModal}
            className="text-[11px] font-medium text-[#5A7469] hover:text-[#0B241C] underline transition-colors cursor-pointer pt-1"
          >
            Maybe later, keep browsing
          </button>
        </div>
      </div>
    </div>
  );
}
