'use client';

import React from 'react';
import { useStore } from '../../context/StoreContext';
import ProductCard from '../../components/ProductCard';

export default function BestSellersPage() {
  const { products } = useStore();
  const items = products.filter((p) => p.badge === 'Best Seller' || (p.rating && p.rating >= 4.9));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
          Customer Favorites
        </span>
        <h1 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C]">
          Best Sellers
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E]">
          Our most beloved handcrafted icons celebrated by over 10,000+ patrons across India.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map((prod) => (
          <ProductCard key={prod.id} product={prod} />
        ))}
      </div>
    </div>
  );
}
