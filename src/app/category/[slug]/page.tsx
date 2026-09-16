'use client';

import React, { useState, useMemo, use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  ChevronRight,
  Filter,
  CheckCircle2,
  ArrowRight,
  LayoutGrid,
  Package,
  Star,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import ProductCard from '../../../components/ProductCard';

function CategoryContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const subQuery = searchParams?.get('sub');

  const { categories, products } = useStore();

  const currentCategory = useMemo(() => {
    const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
    return (
      categories.find((c) => (c.slug || '').trim().toLowerCase() === decodedSlug) ||
      categories[0] ||
      null
    );
  }, [categories, slug]);

  const [userSubcategory, setUserSubcategory] = useState<string | null>(null);
  const selectedSubcategory = userSubcategory ?? (subQuery || 'All');
  const setSelectedSubcategory = (val: string) => setUserSubcategory(val);

  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Filter products
  const filteredProducts = useMemo(() => {
    const targetSlug = decodeURIComponent(slug).trim().toLowerCase();
    return products
      .filter((p) => {
        const pSlug = (p.categorySlug || '').trim().toLowerCase();
        const matchesSlug = pSlug === targetSlug;
        const matchesTitle =
          currentCategory &&
          p.category?.trim().toLowerCase() === currentCategory.title?.trim().toLowerCase();
        return matchesSlug || matchesTitle;
      })
      .filter((p) => {
        if (selectedSubcategory !== 'All' && p.subcategory !== selectedSubcategory) {
          return false;
        }
        if (selectedPriceRange === 'under1000' && p.price >= 1000) return false;
        if (selectedPriceRange === '1000to2500' && (p.price < 1000 || p.price > 2500)) return false;
        if (selectedPriceRange === 'above2500' && p.price <= 2500) return false;
        if (selectedBadge !== 'all' && p.badge !== selectedBadge) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priceLow') return a.price - b.price;
        if (sortBy === 'priceHigh') return b.price - a.price;
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        return 0; // featured default
      });
  }, [products, slug, currentCategory, selectedSubcategory, selectedPriceRange, selectedBadge, sortBy]);

  // All products in this category (not narrowed by subcategory/price/badge filters)
  // used to build the "Shop by Lifestyle" rows below the subcategory carousel.
  const categoryProducts = useMemo(() => {
    const targetSlug = decodeURIComponent(slug).trim().toLowerCase();
    return products.filter((p: any) => {
      const pSlug = (p.categorySlug || '').trim().toLowerCase();
      const matchesSlug = pSlug === targetSlug;
      const matchesTitle =
        currentCategory &&
        p.category?.trim().toLowerCase() === currentCategory.title?.trim().toLowerCase();
      return matchesSlug || matchesTitle;
    });
  }, [products, slug, currentCategory]);

  // Group category products by their lifestyle_sale_tags entry (product.lifestyleTag / lifestyleTagName).
  // Tags with zero matching products are dropped entirely — no heading, no row, no empty space.
  const lifestyleGroups = useMemo(() => {
    const map = new Map<string, { tag: string; items: any[] }>();
    categoryProducts.forEach((p: any) => {
      const tag = (p.lifestyleTag || p.lifestyleTagName || '').trim();
      if (!tag) return;
      if (!map.has(tag)) map.set(tag, { tag, items: [] });
      map.get(tag)!.items.push(p);
    });
    return Array.from(map.values()).filter((g) => g.items.length > 0);
  }, [categoryProducts]);

  const avgRating = useMemo(() => {
    const rated = categoryProducts.filter((p: any) => typeof p.rating === 'number' && p.rating > 0);
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc: number, p: any) => acc + p.rating, 0);
    return (sum / rated.length).toFixed(1);
  }, [categoryProducts]);

  const subcatList = useMemo(() => {
    return (
      (currentCategory?.subcatImages && currentCategory.subcatImages.length > 0)
        ? currentCategory.subcatImages
        : (currentCategory?.subcategories || []).filter((s) => s !== 'All').map((s) => ({
            name: s,
            image: currentCategory?.bannerImage || currentCategory?.heroImage || '',
          }))
    );
  }, [currentCategory]);

  if (!currentCategory) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-[#5A7469] font-semibold">
          Loading Boutique Collection...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-16 pb-24">
      {/* 1. DEDICATED CATEGORY HERO BANNER (Full Standalone Website Feel) */}
      <section className="relative w-full min-h-[460px] sm:min-h-[540px] lg:min-h-[620px] bg-[#08281F] overflow-hidden flex items-center">
        <img
          src={currentCategory.heroImage || currentCategory.bannerImage}
          alt={currentCategory.title}
          className="w-full h-full object-cover object-center absolute inset-0 opacity-45 scale-105 transition-transform duration-7000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08281F]/95 via-[#0C3B2E]/70 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08281F] via-transparent to-transparent" />

        <div className="relative w-full px-4 sm:px-6 py-14 sm:py-16">
          {/* Top Breadcrumb & Badge */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <Link
              href="/"
              className="text-xs text-[#FAF8F5]/80 hover:text-[#D4AF37] uppercase tracking-widest flex items-center gap-1 font-semibold"
            >
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold">
              {currentCategory.title} Flagship
            </span>
          </div>

          <div className="max-w-3xl space-y-4 sm:space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] border border-[#D4AF37]/30 shadow-sm">
              <span>Official Flagship Storefront</span>
            </div>

            <h1 className="font-serif-title text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.08]">
              {currentCategory.title}
            </h1>

            <p className="text-sm sm:text-lg text-[#E8F0EC]/90 leading-relaxed font-normal max-w-2xl">
              {currentCategory.subtitle}
            </p>

            {/* Feature Pills */}
            <div className="pt-2 flex flex-wrap gap-2.5 text-xs text-[#FAF8F5]">
              <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>100% Artisanal Quality</span>
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Free Express Shipping &gt; ₹999</span>
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>7-Day Return Policy</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 1.5 LIVE CATEGORY STATS — moved out of the hero, sits on the page background */}
      <section className="w-full px-2 sm:px-3 -mt-6 sm:-mt-10">
        <div className="bg-white rounded-[1.75rem] border border-[#E2DBD0] shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-[#EFEBE3]">
            <div className="flex flex-col items-center sm:items-start gap-2 px-3 sm:px-8 py-5 sm:py-7">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E]">
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <div className="text-center sm:text-left">
                <p className="font-serif-title text-xl sm:text-3xl font-bold text-[#0B241C] leading-none">
                  {subcatList.length}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#5A7469] uppercase tracking-wider mt-1.5">
                  Subcategories
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-start gap-2 px-3 sm:px-8 py-5 sm:py-7">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E]">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <div className="text-center sm:text-left">
                <p className="font-serif-title text-xl sm:text-3xl font-bold text-[#0B241C] leading-none">
                  {categoryProducts.length}+
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#5A7469] uppercase tracking-wider mt-1.5">
                  Handcrafted Pieces
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center sm:items-start gap-2 px-3 sm:px-8 py-5 sm:py-7">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#EBF3EF] flex items-center justify-center text-[#C5A059]">
                <Star className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <div className="text-center sm:text-left">
                <p className="font-serif-title text-xl sm:text-3xl font-bold text-[#0B241C] leading-none">
                  {avgRating ?? '4.8'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-[#5A7469] uppercase tracking-wider mt-1.5">
                  Customer Rating
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SUB-CATEGORY QUICK-SHOP — BIG SQUARE CARDS */}
      <section className="w-full px-2 sm:px-3">
        <div className="relative bg-white rounded-[1.75rem] border border-[#E2DBD0] p-6 sm:p-8 lg:p-10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EFEBE3]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] shrink-0 shadow-inner">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                  Browse by Subcategory
                </p>
                <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-[#0B241C]">
                  Explore {currentCategory.title}
                </h2>
              </div>
            </div>
            {selectedSubcategory !== 'All' && (
              <button
                onClick={() => setSelectedSubcategory('All')}
                className="text-xs font-semibold text-[#0C3B2E] hover:text-[#C5A059] self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-[#E2DBD0] hover:border-[#C5A059] transition-colors"
              >
                <span>Clear: {selectedSubcategory}</span>
                <span aria-hidden>✕</span>
              </button>
            )}
          </div>

          {/* Big Square Subcategory Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5">
            {/* "All" Square Card */}
            <button
              onClick={() => setSelectedSubcategory('All')}
              className={`group relative aspect-square rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${
                selectedSubcategory === 'All'
                  ? 'border-[#D4AF37] ring-2 ring-[#D4AF37] shadow-lg'
                  : 'border-[#E2DBD0] hover:border-[#C5A059]'
              }`}
            >
              <img
                src={currentCategory.bannerImage || currentCategory.heroImage}
                alt="All Pieces"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08281F]/90 via-[#08281F]/20 to-transparent" />
              {selectedSubcategory === 'All' && (
                <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-4 h-4 text-[#08281F]" />
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex items-end justify-between gap-2">
                <span className="text-white text-xs sm:text-sm font-bold leading-snug">
                  All Pieces
                </span>
                <span className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37] transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-white group-hover:text-[#08281F]" />
                </span>
              </div>
            </button>

            {/* Individual Subcategories with Photos — link to dedicated pages */}
            {subcatList.map((sub) => {
              const isSelected = selectedSubcategory === sub.name;
              return (
                <Link
                  key={sub.name}
                  href={`/category/${(currentCategory?.slug || '').trim()}/${encodeURIComponent(sub.name.trim())}`}
                  className={`group relative aspect-square rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${
                    isSelected
                      ? 'border-[#D4AF37] ring-2 ring-[#D4AF37] shadow-lg'
                      : 'border-[#E2DBD0] hover:border-[#C5A059]'
                  }`}
                >
                  <img
                    src={sub.image}
                    alt={sub.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08281F]/90 via-[#08281F]/20 to-transparent" />
                  {isSelected && (
                    <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-md">
                      <CheckCircle2 className="w-4 h-4 text-[#08281F]" />
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex items-end justify-between gap-2">
                    <span className="text-white text-xs sm:text-sm font-bold leading-snug line-clamp-2">
                      {sub.name}
                    </span>
                    <span className="shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37] transition-colors">
                      <ArrowRight className="w-3.5 h-3.5 text-white group-hover:text-[#08281F]" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2.5 SHOP BY LIFESTYLE — ROWS GROUPED BY lifestyle_sale_tags, SKIPPED ENTIRELY WHEN EMPTY */}
      {lifestyleGroups.length > 0 && (
        <section className="w-full px-2 sm:px-3 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
              Shop by Lifestyle
            </p>
            <h2 className="font-serif-title text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0B241C]">
              Curated for the Way You Live
            </h2>
            <p className="text-sm text-[#2C4A3E]">
              Hand-picked edits from {currentCategory.title}, grouped by mood and moment.
            </p>
          </div>

          <div className="space-y-6">
            {lifestyleGroups.map((group) => (
              <div
                key={group.tag}
                className="bg-white rounded-[1.75rem] border border-[#E2DBD0] shadow-sm hover:shadow-md transition-shadow p-5 sm:p-7 lg:p-8"
              >
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EBF3EF] text-[#0C3B2E] text-[11px] font-bold uppercase tracking-wider border border-[#0C3B2E]/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                      <span>{group.tag}</span>
                    </span>
                    <span className="text-[11px] text-[#5A7469]">
                      {group.items.length} {group.items.length === 1 ? 'piece' : 'pieces'}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-[11px] text-[#5A7469] uppercase tracking-wider">
                    Scroll for more →
                  </span>
                </div>

                <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-1 scrollbar-none">
                  {group.items.map((prod) => (
                    <div key={prod.id} className="w-40 sm:w-48 lg:w-52 shrink-0">
                      <ProductCard product={prod} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. MAIN PRODUCT CATALOG WITH FILTERS & SORT */}
      <section className="w-full px-2 sm:px-3 space-y-8">
        {/* Catalog Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2DBD0]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
              {selectedSubcategory === 'All' ? 'Curated Collection' : 'Subcategory Selection'}
            </p>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C] mt-0.5">
              {selectedSubcategory === 'All'
                ? `Complete ${currentCategory.title} Collection`
                : `${selectedSubcategory} Collection`}
            </h2>
            <p className="text-xs text-[#5A7469] mt-1">
              Showing <strong className="text-[#0B241C]">{filteredProducts.length}</strong> handcrafted pieces
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E2DBD0] text-xs font-semibold text-[#2C4A3E] hover:border-[#0C3B2E] shadow-xs transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Refine Filters</span>
              {(selectedPriceRange !== 'all' || selectedBadge !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-[#0C3B2E]" />
              )}
            </button>

            {/* Sorting Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-[#E2DBD0] rounded-xl px-4 py-2.5 pr-8 text-xs font-semibold text-[#2C4A3E] focus:outline-none focus:border-[#0C3B2E] shadow-xs cursor-pointer"
              >
                <option value="featured">Sort: Featured</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="rating">Highest Customer Rated</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5A7469]">
                ▾
              </div>
            </div>
          </div>
        </div>

        {/* Filter Drawer */}
        {showFilterDrawer && (
          <div className="bg-white p-6 rounded-2xl border border-[#E2DBD0] shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFEBE3]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B241C] flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#C5A059]" /> Refine By Price &amp; Collections
              </span>
              <button
                onClick={() => {
                  setSelectedPriceRange('all');
                  setSelectedBadge('all');
                  setSelectedSubcategory('All');
                }}
                className="text-xs text-[#0C3B2E] font-bold hover:underline"
              >
                Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Price filter */}
              <div>
                <p className="text-xs font-bold text-[#2C4A3E] mb-2 uppercase tracking-wider">Price Range</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'All Prices', val: 'all' },
                    { label: 'Under ₹1,000', val: 'under1000' },
                    { label: '₹1,000 - ₹2,500', val: '1000to2500' },
                    { label: 'Above ₹2,500', val: 'above2500' },
                  ].map((pr) => (
                    <button
                      key={pr.val}
                      onClick={() => setSelectedPriceRange(pr.val)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        selectedPriceRange === pr.val
                          ? 'bg-[#0C3B2E] text-white font-semibold shadow-xs'
                          : 'bg-[#FAF8F5] text-[#2C4A3E] hover:bg-[#EBF3EF]'
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badges filter */}
              <div>
                <p className="text-xs font-bold text-[#2C4A3E] mb-2 uppercase tracking-wider">Collections &amp; Highlights</p>
                <div className="flex flex-wrap gap-2">
                  {['all', 'Best Seller', 'New', 'Trending', 'Premium', 'Organic'].map((badge) => (
                    <button
                      key={badge}
                      onClick={() => setSelectedBadge(badge)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        selectedBadge === badge
                          ? 'bg-[#0C3B2E] text-white font-semibold shadow-xs'
                          : 'bg-[#FAF8F5] text-[#2C4A3E] hover:bg-[#EBF3EF]'
                      }`}
                    >
                      {badge === 'all' ? 'All Pieces' : badge}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#E2DBD0] p-8 space-y-4">
            <h3 className="font-serif-title text-xl font-bold text-[#0B241C]">
              No products found in this filter selection
            </h3>
            <p className="text-xs text-[#2C4A3E] max-w-sm mx-auto">
              Try adjusting your subcategory or price filters to explore more of our {currentCategory.title} catalog.
            </p>
            <button
              onClick={() => {
                setSelectedSubcategory('All');
                setSelectedPriceRange('all');
                setSelectedBadge('all');
              }}
              className="px-6 py-2.5 rounded-full bg-[#0C3B2E] text-white text-xs font-semibold uppercase tracking-wider shadow-sm cursor-pointer"
            >
              Show All {currentCategory.title}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-[#5A7469]">Loading Flagship Store...</div>}>
      <CategoryContent slug={resolvedParams.slug} />
    </Suspense>
  );
}