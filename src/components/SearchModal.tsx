'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Search, X, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function SearchModal() {
  const { isSearchOpen, setIsSearchOpen, products, categories } = useStore();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchOpen]);

  const popularTags = [
    'Pearl Necklace',
    'Sand Wax',
    'Ceramic Vase',
    'Sidr Honey',
    'Gift Hamper',
    'Gold Ring',
  ];

  const filteredResults = useMemo(() => {
    if (!query.trim() && selectedCategory === 'All') return [];
    return products.filter(p => {
      const matchesQuery =
        !query.trim() ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase());

      const pSlug = (p.categorySlug || '').trim().toLowerCase();
      const pCat = (p.category || '').trim().toLowerCase();
      const selSlug = selectedCategory.trim().toLowerCase();

      const matchesCat =
        selectedCategory === 'All' ||
        pSlug === selSlug ||
        pCat === selSlug ||
        (selSlug === 'apparel' && (pSlug === 'jewellery' || pCat.includes('jewel'))) ||
        (selSlug === 'fragrance' && (pSlug === 'candles' || pCat.includes('candle') || pCat.includes('fragrance'))) ||
        (selSlug === 'lifestyle' && (pSlug === 'home-decor' || pCat.includes('decor') || pCat.includes('lifestyle'))) ||
        (selSlug === 'gift' && (pSlug === 'gifts' || pCat.includes('gift') || pCat.includes('stationery'))) ||
        (selSlug === 'wellness' && (pSlug === 'wellness' || pCat.includes('wellness') || pCat.includes('organic')));

      return matchesQuery && matchesCat;
    }).slice(0, 8);
  }, [products, query, selectedCategory]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-[#E2DBD0] overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Bar Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2DBD0] flex items-center gap-3 bg-[#FAF8F5]">
          <Search className="w-6 h-6 text-[#C5A059] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={
              categories.length > 0
                ? `Search across ${categories.map((c) => c.title).slice(0, 3).join(', ')}...`
                : 'Search products, collections...'
            }
            className="w-full bg-transparent text-base sm:text-lg text-[#0B241C] placeholder:text-[#5A7469] outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 hover:bg-[#EBF3EF] rounded-full text-[#5A7469]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="px-3 py-1.5 text-xs font-semibold text-[#2C4A3E] hover:bg-[#EBF3EF] rounded-lg transition-colors border border-[#E2DBD0]"
          >
            ESC
          </button>
        </div>

        {/* Dynamic Category Filters directly from Supabase */}
        <div className="px-4 py-3 bg-[#FAF8F5]/80 border-b border-[#E2DBD0] flex gap-2 overflow-x-auto text-xs scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all font-semibold uppercase tracking-wider text-[11px] ${
              selectedCategory === 'All'
                ? 'bg-[#0C3B2E] text-white shadow-sm ring-1 ring-[#C5A059]'
                : 'bg-white text-[#2C4A3E] border border-[#E2DBD0] hover:border-[#0C3B2E]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id || cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all font-semibold uppercase tracking-wider text-[11px] ${
                selectedCategory.trim().toLowerCase() === cat.slug.trim().toLowerCase()
                  ? 'bg-[#0C3B2E] text-white shadow-sm ring-1 ring-[#C5A059]'
                  : 'bg-white text-[#2C4A3E] border border-[#E2DBD0] hover:border-[#0C3B2E]'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Results / Suggestions */}
        <div className="p-5 overflow-y-auto flex-1">
          {query.trim() === '' && selectedCategory === 'All' ? (
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#5A7469] mb-3">
                Trending Searches
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3.5 py-1.5 text-xs rounded-full bg-[#EBF3EF] text-[#0C3B2E] hover:bg-[#0C3B2E] hover:text-white transition-all font-medium"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="border-t border-[#E2DBD0] pt-4">
                <p className="text-xs font-semibold tracking-wider uppercase text-[#5A7469] mb-3">
                  Featured Recommendations
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.slice(0, 4).map(p => (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FAF8F5] border border-transparent hover:border-[#E2DBD0] transition-all group"
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded-lg bg-[#EBF3EF] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#0B241C] truncate group-hover:text-[#0C3B2E]">
                          {p.name}
                        </p>
                        <p className="text-xs text-[#5A7469]">{p.subcategory} · ₹{p.price.toLocaleString('en-IN')}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#5A7469] group-hover:text-[#0C3B2E] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-[#5A7469] mb-3">
                Found {filteredResults.length} matching products:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredResults.map(p => (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF8F5]/70 hover:bg-[#FAF8F5] border border-[#E2DBD0] hover:border-[#0C3B2E] transition-all group"
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-14 h-14 object-cover rounded-lg bg-[#EBF3EF] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#C5A059]">
                        {p.subcategory}
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-[#0B241C] truncate group-hover:text-[#0C3B2E]">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-[#0B241C]">
                          ₹{p.price.toLocaleString('en-IN')}
                        </span>
                        {p.originalPrice && (
                          <span className="text-[11px] text-[#5A7469] line-through">
                            ₹{p.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm font-semibold text-[#0B241C]">No products found</p>
              <p className="text-xs text-[#5A7469] mt-1">
                Try searching for something else like "pearl", "candle", "vase", or "tea".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
