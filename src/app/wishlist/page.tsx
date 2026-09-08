'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import ProductCard from '../../components/ProductCard';

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div>
        <h1 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C]">
          My Wishlist
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E] mt-1">
          {wishlist.length} cherished pieces saved in your personal wishlist
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E2DBD0] p-12 sm:p-20 text-center max-w-xl mx-auto space-y-5 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#FAF8F5] text-[#C5A059] flex items-center justify-center mx-auto border border-[#E2DBD0]">
            <Heart className="w-10 h-10" />
          </div>
          <h2 className="font-serif-title text-2xl font-bold text-[#0B241C]">Your Wishlist is Empty</h2>
          <p className="text-xs sm:text-sm text-[#2C4A3E] leading-relaxed">
            Click the heart icon on any piece you love while browsing to save it here for later.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
          >
            <span>Explore Five Worlds</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlist.map((prod) => (
            <div key={prod.id} className="relative flex flex-col justify-between">
              <ProductCard product={prod} />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => {
                    addToCart(prod, 1);
                    toggleWishlist(prod);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#0C3B2E] text-[#0B241C] hover:text-white border border-[#E2DBD0] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Move to Bag</span>
                </button>
                <button
                  onClick={() => toggleWishlist(prod)}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
