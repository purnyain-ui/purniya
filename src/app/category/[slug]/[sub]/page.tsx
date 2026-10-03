'use client';

import React, { useState, useEffect, useMemo, use, Suspense } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  ChevronRight,
  Filter,
  CheckCircle2,
  Home,
} from 'lucide-react';
import { useStore } from '../../../../context/StoreContext';
import ProductCard from '../../../../components/ProductCard';
import { initialCategories, getSubcategoryImage } from '../../../../data/mockData';

function SubcategoryContent({ slug, sub }: { slug: string; sub: string }) {
  const { categories, products } = useStore();
  const subcategoryName = decodeURIComponent(sub).trim().replace(/é/g, 'e').replace(/É/g, 'E');

  const currentCategory = useMemo(() => {
    const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
    const list = (categories && categories.length > 0) ? categories : initialCategories;
    return (
      list.find((c) => (c.slug || '').trim().toLowerCase() === decodedSlug) ||
      list.find((c) => {
        const s = (c.slug || '').trim().toLowerCase();
        const t = (c.title || '').trim().toLowerCase();
        return (
          s.includes(decodedSlug) ||
          decodedSlug.includes(s) ||
          t.includes(decodedSlug) ||
          decodedSlug.includes(t)
        );
      }) ||
      initialCategories.find((c) => (c.slug || '').trim().toLowerCase() === decodedSlug) ||
      initialCategories[0]
    );
  }, [categories, slug]);

  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Get subcategory image from subcatImages
  const subcatImageData = useMemo(() => {
    if (!currentCategory?.subcatImages) return null;
    return currentCategory.subcatImages.find(
      (si) => si.name.trim().toLowerCase().replace(/é/g, 'e') === subcategoryName.toLowerCase()
    );
  }, [currentCategory, subcategoryName]);

  const catHero = currentCategory?.heroImage || currentCategory?.bannerImage || '';
  const bannerImage = getSubcategoryImage(subcategoryName, catHero, subcatImageData?.image);

  // Filter products for this subcategory
  const filteredProducts = useMemo(() => {
    const targetSlug = decodeURIComponent(slug).trim().toLowerCase();
    return products
      .filter((p) => {
        const pSlug = (p.categorySlug || '').trim().toLowerCase();
        const matchesSlug = pSlug === targetSlug;
        const matchesTitle =
          currentCategory &&
          p.category?.trim().toLowerCase().replace(/é/g, 'e') === currentCategory.title?.trim().toLowerCase().replace(/é/g, 'e');
        return matchesSlug || matchesTitle;
      })
      .filter((p) => {
        const pSub = (p.subcategory || '').trim().toLowerCase().replace(/é/g, 'e');
        const pTag = (p.lifestyleTag || (p as any).lifestyleTagName || '').trim().toLowerCase().replace(/é/g, 'e');
        const searchVal = subcategoryName.toLowerCase();
        
        if (pSub !== searchVal && pTag !== searchVal) {
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
        return 0;
      });
  }, [products, slug, currentCategory, subcategoryName, selectedPriceRange, selectedBadge, sortBy]);

  // Other subcategories for quick navigation
  const otherSubcategories = useMemo(() => {
    if (!currentCategory) return [];
    return (currentCategory.subcategories || []).filter(
      (s) => s.trim() !== 'All' && s.trim().toLowerCase().replace(/é/g, 'e') !== subcategoryName.toLowerCase()
    );
  }, [currentCategory, subcategoryName]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [slug, sub]);

  if (loading || !currentCategory) {
    return (
      <div className="min-h-[70vh] w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#08281F] text-[#FAF8F5] rounded-[2rem] my-6 shadow-xl border border-[#144234] px-4">
        {/* Background radial glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-md">
          {/* Glowing Logo Emblem */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#FAF8F5] p-1 border-2 border-[#D4AF37] shadow-2xl flex items-center justify-center animate-pulse">
              <img
                src="/logoicon.png"
                alt="Purnya Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            {/* Animated Gold Ring Spinner */}
            <div className="absolute inset-0 -m-2.5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>

          {/* Brand Text */}
          <div className="space-y-1.5">
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold tracking-[0.2em] text-white">
              PURNYA
            </h2>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
              Life · Lifestyle · You
            </p>
          </div>

          {/* Loading Message & Progress Bar */}
          <div className="space-y-3 pt-2">
            <p className="text-xs sm:text-sm text-[#E8F0EC] font-medium tracking-wide">
              Unveiling {subcategoryName} Collection...
            </p>
            <div className="w-48 sm:w-64 h-1.5 bg-[#144234] rounded-full overflow-hidden mx-auto p-0.5">
              <div className="h-full bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#E6C25B] rounded-full animate-pulse w-full transition-all duration-1000" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-16 pb-24">
      {/* 1. SUBCATEGORY HERO BANNER */}
      <section className="relative w-full min-h-[340px] sm:min-h-[400px] lg:min-h-[440px] bg-[#08281F] overflow-hidden flex items-center">
        <img
          src={bannerImage || 'https://images.unsplash.com/photo-1515562141589-67f0d0953a8e?w=1920&fit=crop&auto=format'}
          alt={subcategoryName}
          className="w-full h-full object-cover object-center absolute inset-0 opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08281F]/95 via-[#0C3B2E]/70 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08281F] via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Link
              href="/"
              className="text-xs text-[#FAF8F5]/80 hover:text-[#D4AF37] uppercase tracking-widest flex items-center gap-1 font-semibold"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#C5A059]" />
            <Link
              href={`/category/${(currentCategory.slug || '').trim()}`}
              className="text-xs text-[#FAF8F5]/80 hover:text-[#D4AF37] uppercase tracking-widest font-semibold"
            >
              {currentCategory.title}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold">
              {subcategoryName}
            </span>
          </div>

          <div className="max-w-2xl space-y-4 sm:space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] border border-[#D4AF37]/30 shadow-sm">
              <span>{currentCategory.title} Collection</span>
            </div>

            <h1 className="font-serif-title text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.08]">
              {subcategoryName}
            </h1>

            <p className="text-sm sm:text-base text-[#E8F0EC]/90 leading-relaxed font-normal max-w-xl">
              Explore our curated {subcategoryName} collection from the {currentCategory.title} boutique. 
              Each piece is handpicked for quality and artisanal craftsmanship.
            </p>

          </div>
        </div>
      </section>

      {/* 2. QUICK NAVIGATE OTHER SUBCATEGORIES */}
      {otherSubcategories.length > 0 && (
        <section className="w-full px-2 sm:px-3">
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                Also in {currentCategory.title}
              </p>
              <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-[#0B241C]">
                Explore Other Collections
              </h2>
              <Link
                href={`/category/${(currentCategory.slug || '').trim()}`}
                className="text-xs font-semibold text-[#0C3B2E] hover:text-[#C5A059] transition-colors mt-2"
              >
                ← View All {currentCategory.title}
              </Link>
            </div>

            <div 
              className={`grid gap-3 sm:gap-4 max-w-7xl mx-auto ${
                (otherSubcategories.length + 1) === 4 ? 'grid-cols-2 sm:grid-cols-4' :
                (otherSubcategories.length + 1) === 5 ? 'grid-cols-3 sm:grid-cols-5' :
                'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'
              }`}
            >
              {/* "All" goes back to category page */}
              <Link
                href={`/category/${(currentCategory.slug || '').trim()}`}
                className="group relative aspect-square rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 border-[#E2DBD0] hover:border-[#C5A059]"
              >
                <img
                  src={currentCategory.bannerImage || currentCategory.heroImage || 'https://images.unsplash.com/photo-1515562141589-67f0d0953a8e?w=600&fit=crop&auto=format'}
                  alt="All Pieces"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#08281F]/90 via-[#08281F]/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex items-end justify-between gap-2">
                  <span className="text-white text-xs sm:text-sm font-bold leading-snug line-clamp-2">
                    All Pieces
                  </span>
                </div>
              </Link>

              {otherSubcategories.map((otherSub) => {
                const found = currentCategory.subcatImages?.find(
                  (si) => si.name.trim().toLowerCase() === otherSub.trim().toLowerCase()
                );
                const otherImg = getSubcategoryImage(otherSub.trim(), currentCategory.heroImage || currentCategory.bannerImage, found?.image);
                return (
                  <Link
                    key={otherSub}
                    href={`/category/${(currentCategory.slug || '').trim()}/${encodeURIComponent(otherSub.trim())}`}
                    className="group relative aspect-square rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 border-[#E2DBD0] hover:border-[#C5A059]"
                  >
                    <img
                      src={otherImg}
                      alt={otherSub.trim()}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#08281F]/90 via-[#08281F]/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex items-end justify-between gap-2">
                      <span className="text-white text-xs sm:text-sm font-bold leading-snug line-clamp-2">
                        {otherSub.trim()}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 3. PRODUCT CATALOG WITH FILTERS */}
      <section className="w-full px-2 sm:px-3 space-y-8">
        <div className="flex flex-col items-center justify-center gap-5 pb-5 border-b border-[#E2DBD0] text-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
              {subcategoryName} Collection
            </p>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C] mt-1">
              {subcategoryName}
            </h2>
            <p className="text-xs text-[#5A7469] mt-1.5">
              Showing <strong className="text-[#0B241C]">{filteredProducts.length}</strong> handcrafted pieces
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
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
                }}
                className="text-xs text-[#0C3B2E] font-bold hover:underline"
              >
                Reset Filters
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
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
              No products found in this selection
            </h3>
            <p className="text-xs text-[#2C4A3E] max-w-sm mx-auto">
              Try adjusting your price or collection filters to explore more of our {subcategoryName} catalog.
            </p>
            <button
              onClick={() => {
                setSelectedPriceRange('all');
                setSelectedBadge('all');
              }}
              className="px-6 py-2.5 rounded-full bg-[#0C3B2E] text-white text-xs font-semibold uppercase tracking-wider shadow-sm cursor-pointer"
            >
              Show All {subcategoryName}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function SubcategoryPage({ params }: { params: Promise<{ slug: string; sub: string }> }) {
  const resolvedParams = use(params);
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-[#5A7469]">Loading Collection...</div>}>
      <SubcategoryContent slug={resolvedParams.slug} sub={resolvedParams.sub} />
    </Suspense>
  );
}
