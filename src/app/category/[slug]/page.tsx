'use client';

import React, { useState, useEffect, useMemo, use, Suspense } from 'react';
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
  Gem,
  Flame,
  Home,
  Leaf,
  Gift,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import ProductCard from '../../../components/ProductCard';
import { supabase } from '../../../lib/supabaseClient';

function getCategoryIcon(cat: { slug?: string; title?: string }) {
  const s = `${cat.slug || ''} ${cat.title || ''}`.toLowerCase();
  if (s.includes('jewel') || s.includes('apparel') || s.includes('accessor')) return Gem;
  if (s.includes('candle') || s.includes('fragrance')) return Flame;
  if (s.includes('decor') || s.includes('décor') || s.includes('lifestyle') || s.includes('home')) return Home;
  if (s.includes('wellness') || s.includes('organic')) return Leaf;
  if (s.includes('gift') || s.includes('stationery')) return Gift;
  return Sparkles;
}

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
  const [selectedLifestyleTag, setSelectedLifestyleTag] = useState<string>('all');

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
        if (selectedLifestyleTag !== 'all') {
          const t = (p.lifestyleTag || (p as any).lifestyleTagName || '').trim();
          if (t !== selectedLifestyleTag) return false;
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
  }, [products, slug, currentCategory, selectedSubcategory, selectedLifestyleTag, selectedPriceRange, selectedBadge, sortBy]);

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

  // Group category products by their lifestyle_sale_tags entry.
  // Tags with zero matching products are dropped entirely.
  const lifestyleGroups = useMemo(() => {
    const map = new Map<string, { tag: string; items: any[] }>();
    categoryProducts.forEach((p: any) => {
      const tag = (p.lifestyleTag || p.lifestyleTagName || '').trim();
      if (!tag) return;
      if (!map.has(tag)) map.set(tag, { tag, items: [] });
      map.get(tag)!.items.push(p);
    });
    const groups = Array.from(map.values()).filter((g) => g.items.length > 0);
    // Sort so "New Arrivals" is always first
    return groups.sort((a, b) => {
      const isANew = a.tag.toLowerCase().includes('new arrival');
      const isBNew = b.tag.toLowerCase().includes('new arrival');
      if (isANew && !isBNew) return -1;
      if (!isANew && isBNew) return 1;
      return 0;
    });
  }, [categoryProducts]);

  const featuredProducts = useMemo(() => {
    return categoryProducts.filter((p: any) => p.featured === true);
  }, [categoryProducts]);

  const avgRating = useMemo(() => {
    const rated = categoryProducts.filter((p: any) => typeof p.rating === 'number' && p.rating > 0);
    if (rated.length === 0) return null;
    const sum = rated.reduce((acc: number, p: any) => acc + p.rating, 0);
    return (sum / rated.length).toFixed(1);
  }, [categoryProducts]);

  const [instagramVideos, setInstagramVideos] = useState<any[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from('instagram_videos')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setInstagramVideos(data);
        }
      } catch (err) {
        console.error('Error fetching Instagram videos:', err);
      }
    };
    fetchVideos();
  }, []);

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
                  Collections
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
          <div className="flex flex-col items-center justify-center gap-4 pb-5 border-b border-[#EFEBE3] text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] shrink-0 shadow-inner">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                  Explore Collections
                </p>
                <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-[#0B241C] mt-1">
                  Discover {currentCategory.title}
                </h2>
              </div>
            </div>
            {selectedSubcategory !== 'All' && (
              <button
                onClick={() => setSelectedSubcategory('All')}
                className="text-xs font-semibold text-[#0C3B2E] hover:text-[#C5A059] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FAF8F5] border border-[#E2DBD0] hover:border-[#C5A059] transition-colors"
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
              className={`group relative aspect-square rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer ${selectedSubcategory === 'All'
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
                  className={`group relative aspect-square rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${isSelected
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

      {/* 2.5 SHOP BY LIFESTYLE — ROWS GROUPED BY lifestyle_sale_tags */}
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
            {lifestyleGroups.map((group, idx) => {
              // Alternating elegant themes mixing dark and light
              const themes = [
                // 1. Deep Signature Green (Dark)
                {
                  bg: 'bg-[#08281F]', border: 'border-[#144234]', blob1: 'bg-[#C5A059]/15', blob2: 'bg-[#0C3B2E]/60',
                  textMain: 'text-white', tag: 'text-[#D4AF37]', borderSub: 'border-[#144234]',
                  btnStyle: 'text-[#FAF8F5] hover:text-[#D4AF37] bg-white/5 hover:bg-white/10 border-white/10'
                },
                // 2. Cream/Gold (Light)
                {
                  bg: 'bg-[#FAF8F5]', border: 'border-[#E2DBD0]', blob1: 'bg-[#C5A059]/10', blob2: 'bg-[#0C3B2E]/5',
                  textMain: 'text-[#0B241C]', tag: 'text-[#C5A059]', borderSub: 'border-[#E2DBD0]',
                  btnStyle: 'text-[#0B241C] hover:text-[#C5A059] bg-white hover:bg-white/90 border-[#E2DBD0]'
                },
                // 3. Rich Bronze/Mocha (Dark)
                {
                  bg: 'bg-[#2A231C]', border: 'border-[#3D332A]', blob1: 'bg-[#D4AF37]/15', blob2: 'bg-[#4A3B32]/40',
                  textMain: 'text-white', tag: 'text-[#E5C07B]', borderSub: 'border-[#3D332A]',
                  btnStyle: 'text-[#FAF8F5] hover:text-[#E5C07B] bg-white/5 hover:bg-white/10 border-white/10'
                },
                // 4. Pale Mint (Light)
                {
                  bg: 'bg-[#F2F6F4]', border: 'border-[#DCE5E0]', blob1: 'bg-[#0C3B2E]/5', blob2: 'bg-[#C5A059]/10',
                  textMain: 'text-[#08281F]', tag: 'text-[#5A7469]', borderSub: 'border-[#DCE5E0]',
                  btnStyle: 'text-[#08281F] hover:text-[#5A7469] bg-white hover:bg-white/90 border-[#DCE5E0]'
                },
              ];
              const theme = themes[idx % themes.length];
              
              return (
                <div
                  key={group.tag}
                  className={`${theme.bg} rounded-[1.75rem] border ${theme.border} p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden transition-shadow hover:shadow-md`}
                >
                  {/* Elegant Background Decoration */}
                  <div className={`absolute top-0 right-0 w-96 h-96 ${theme.blob1} rounded-full blur-3xl -translate-y-1/2 translate-x-1/3`} />
                  <div className={`absolute bottom-0 left-0 w-64 h-64 ${theme.blob2} rounded-full blur-3xl translate-y-1/3 -translate-x-1/4`} />
                  
                  <div className={`relative flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b ${theme.borderSub} pb-6 text-center md:text-left`}>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-[0.2em] ${theme.tag}`}>
                        Curated Edit
                      </p>
                      <h2 className={`font-serif-title text-3xl sm:text-4xl font-bold ${theme.textMain} mt-1`}>
                        {group.tag}
                      </h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs ${theme.textMain} opacity-60 font-semibold hidden md:inline-block`}>
                        {group.items.length} {group.items.length === 1 ? 'Piece' : 'Pieces'}
                      </span>
                      <Link 
                        href={`/category/${(currentCategory.slug || '').trim()}/${encodeURIComponent(group.tag)}`}
                        className={`text-xs font-semibold inline-flex items-center gap-1.5 transition-colors px-4 py-2 rounded-full border shadow-sm cursor-pointer ${theme.btnStyle}`}
                      >
                        Shop Collection <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  <div className="relative flex gap-4 sm:gap-5 overflow-x-auto pb-4 scrollbar-none snap-x justify-start sm:justify-center md:justify-start">
                    {group.items.map((prod) => (
                      <div key={prod.id} className="w-48 sm:w-56 lg:w-64 shrink-0 snap-start">
                        <ProductCard product={prod} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2.6 FEATURED COLLECTIONS */}
      {featuredProducts.length > 0 && (
        <section className="w-full px-2 sm:px-3">
          <div className="bg-[#F5F6F8] rounded-[1.75rem] border border-[#E2E5EA] p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
            {/* Soft Gray Background Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#E2E5EA]/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 mb-8 border-b border-[#E2E5EA] pb-6 text-center md:text-left">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5A7469]">
                  Handpicked
                </p>
                <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C] mt-1">
                  Featured Collections
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[#5A7469] font-semibold hidden md:inline-block">
                  {featuredProducts.length} {featuredProducts.length === 1 ? 'Piece' : 'Pieces'}
                </span>
                <button 
                  onClick={() => {
                    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-xs font-semibold text-[#0B241C] hover:text-[#0C3B2E] inline-flex items-center gap-1.5 transition-colors bg-white hover:bg-white/90 px-4 py-2 rounded-full border border-[#E2E5EA] shadow-sm cursor-pointer"
                >
                  Shop All <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="relative flex gap-4 sm:gap-5 overflow-x-auto pb-4 scrollbar-none snap-x justify-start sm:justify-center md:justify-start">
              {featuredProducts.map((prod) => (
                <div key={prod.id} className="w-48 sm:w-56 lg:w-64 shrink-0 snap-start">
                  <ProductCard product={prod} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2.5.5 FIVE WORLDS, ONE PURNYA */}
      <section className="w-full px-2 sm:px-3">
        <div className="relative rounded-3xl overflow-hidden bg-[#FAF8F5] border border-[#E2DBD0] px-5 py-10 sm:px-10 sm:py-14">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
              One Unified Lifestyle Brand
            </p>
            <h2 className="font-serif-title text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B241C]">
              Five Worlds. One Purnya.
            </h2>
            <p className="text-sm text-[#2C4A3E]">
              From artisanal jewellery to organic wellness, every Purnya world is crafted with the
              same premium, mindful standard — so however you shop, it always feels like Purnya.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat);
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group relative flex flex-col items-center text-center gap-3 p-5 rounded-2xl bg-white border border-[#E2DBD0] hover:border-[#C5A059] hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] group-hover:bg-[#0C3B2E] group-hover:text-[#D4AF37] transition-colors shadow-inner">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif-title text-sm sm:text-base font-bold text-[#0B241C] leading-snug">
                      {cat.title}
                    </h3>
                    {cat.subtitle && (
                      <p className="text-[11px] text-[#5A7469] mt-1 line-clamp-2">{cat.subtitle}</p>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-[#0C3B2E] group-hover:text-[#C5A059] inline-flex items-center gap-1 mt-1">
                    <span>Shop Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. MAIN PRODUCT CATALOG WITH FILTERS & SORT */}
      <section id="catalog-section" className="w-full px-2 sm:px-3 space-y-8 pt-8">
        {/* Catalog Header Toolbar */}
        <div className="flex flex-col items-center justify-center gap-5 pb-5 border-b border-[#E2DBD0] text-center relative">
          {selectedLifestyleTag !== 'all' && (
            <button 
              onClick={() => setSelectedLifestyleTag('all')}
              className="absolute top-0 right-0 sm:right-4 text-xs font-bold text-[#C5A059] hover:text-[#0C3B2E] transition-colors bg-[#FAF8F5] px-3 py-1.5 rounded-full border border-[#E2DBD0]"
            >
              ✕ Clear Lifestyle Filter
            </button>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
              {selectedLifestyleTag !== 'all' ? 'Lifestyle Collection' : (selectedSubcategory === 'All' ? 'Curated Collection' : 'Selected Collection')}
            </p>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C] mt-1">
              {selectedLifestyleTag !== 'all'
                ? `${selectedLifestyleTag} Edit`
                : (selectedSubcategory === 'All'
                  ? `Complete ${currentCategory.title} Collection`
                  : `${selectedSubcategory} Collection`)}
            </h2>
            <p className="text-xs text-[#5A7469] mt-1.5">
              Showing <strong className="text-[#0B241C]">{filteredProducts.length}</strong> handcrafted pieces
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
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
                  setSelectedLifestyleTag('all');
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
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${selectedPriceRange === pr.val
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
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${selectedBadge === badge
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
              Try adjusting your collection or price filters to explore more of our {currentCategory.title} catalog.
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

      {/* INSTAGRAM VIDEOS FEED (MOVED TO BOTTOM) */}
      {instagramVideos.length > 0 && (
        <section className="w-full px-2 sm:px-3 mb-10">
          <div className="bg-[#08281F] rounded-[1.75rem] border border-[#144234] p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
            {/* Elegant dark background blobs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
            
            <div className="relative flex flex-col items-center justify-center gap-4 mb-8 border-b border-[#144234] pb-6 text-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Style Inspiration
                </p>
                <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-white mt-1">
                  Purnya on Instagram
                </h2>
              </div>
            </div>

            <div className="relative flex flex-wrap justify-center gap-5 sm:gap-8 max-w-7xl mx-auto">
              {instagramVideos.map((video) => {
                // Force standard post embed (NO hidecaption) to enable inline playback!
                let cleanUrl = video.url.replace('/reel/', '/p/').split('?')[0].replace(/\/$/, '');
                if (cleanUrl.endsWith('/embed')) {
                  cleanUrl = cleanUrl.replace(/\/embed$/, '');
                }
                // Do not use hidecaption=true, otherwise Instagram blocks inline playback
                const embedUrl = `${cleanUrl}/embed`;

                return (
                  <div key={video.id} className="w-[280px] h-[480px] shrink-0 bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#144234] relative group">
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300 pointer-events-none z-10" />
                    <iframe
                      src={embedUrl}
                      className="absolute w-[320px] h-[800px] top-[-80px] left-[-20px] border-none max-w-none"
                      scrolling="no"
                      allow="encrypted-media"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
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