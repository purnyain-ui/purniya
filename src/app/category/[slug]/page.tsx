'use client';

import React, { useState, useEffect, useMemo, useRef, use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Gem,
  Flame,
  Home,
  Leaf,
  Gift,
  Sparkles,
  X,
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

// Catalog shows at most 6 rows. Grid is 2 cols (mobile) / 3 cols (sm) / 4 cols (lg),
// so 6 rows = 12 / 18 / 24 products. Extra items are hidden per breakpoint with CSS.
const MAX_CATALOG_PRODUCTS = 24;

// Mobile: horizontal rows become a vertical 2-column grid, max 15 rows (= 30 products) per section.
// Change MOBILE_MAX_ROWS to show more / fewer rows. Desktop keeps the horizontal scroll rows.
const MOBILE_MAX_ROWS = 15;
const MOBILE_MAX_ITEMS = MOBILE_MAX_ROWS * 2;

// Auto-scroll interval for the horizontal product rows (ms)
const AUTO_SCROLL_MS = 4000;

// Horizontal product row that moves one card to the left every 4 seconds,
// loops back to the start at the end, and pauses on hover / touch.
// On mobile the row is a vertical grid (nothing overflows), so it simply does nothing there.
function AutoScrollRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      // Nothing to scroll (e.g. mobile grid or few products)
      if (el.scrollWidth <= el.clientWidth + 4) return;

      const first = el.firstElementChild as HTMLElement | null;
      if (!first) return;
      const gap = parseFloat(getComputedStyle(el).columnGap || '0') || 0;
      const step = first.offsetWidth + gap;

      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, AUTO_SCROLL_MS);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      ref={rowRef}
      className={className}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onTouchStart={() => (pausedRef.current = true)}
      onTouchEnd={() => {
        window.setTimeout(() => (pausedRef.current = false), AUTO_SCROLL_MS);
      }}
    >
      {children}
    </div>
  );
}
function ClampedText({ text, className = '' }: { text?: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      if (!expanded) setIsClamped(el.scrollHeight > el.clientHeight + 1);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [text, expanded]);

  if (!text) return null;

  return (
    <div>
      <p ref={ref} className={`${className} ${expanded ? '' : 'line-clamp-2'} sm:line-clamp-none`}>
        {text}
      </p>
      {(isClamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="sm:hidden mt-1.5 text-xs font-bold uppercase tracking-wider text-[#D4AF37] underline underline-offset-4"
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

function CategoryContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const subQuery = searchParams?.get('sub');

  const { categories, products } = useStore();

  const currentCategory = useMemo(() => {
    const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
    return (
      categories.find((c) => (c.slug || '').trim().toLowerCase() === decodedSlug) ||
      categories.find((c) => {
        const s = (c.slug || '').trim().toLowerCase();
        const t = (c.title || '').trim().toLowerCase();
        return (
          s.includes(decodedSlug) ||
          decodedSlug.includes(s) ||
          t.includes(decodedSlug) ||
          decodedSlug.includes(t)
        );
      }) ||
      null
    );
  }, [categories, slug]);

  // Check if current category is Jewellery & Accessories (slug: 'apparel', or title containing 'jewel')
  const isJewelryCategory = useMemo(() => {
    if (!currentCategory) return false;
    const targetSlug = decodeURIComponent(slug).trim().toLowerCase();
    const s = (currentCategory.slug || '').trim().toLowerCase();
    const t = (currentCategory.title || '').trim().toLowerCase();
    return (
      targetSlug === 'apparel' ||
      targetSlug === 'jewellery' ||
      targetSlug === 'jewelry' ||
      s === 'apparel' ||
      s === 'jewellery' ||
      s === 'jewelry' ||
      t.includes('jewel') ||
      t.includes('jewelry')
    );
  }, [currentCategory, slug]);

  const [userSubcategory, setUserSubcategory] = useState<string | null>(null);
  const selectedSubcategory = userSubcategory ?? (subQuery || 'All');
  const setSelectedSubcategory = (val: string) => setUserSubcategory(val);

  // All products in this category (used for lifestyle rows, featured, festival, catalog)
  const categoryProducts = useMemo(() => {
    const targetSlug = decodeURIComponent(slug).trim().toLowerCase();
    return products.filter((p: any) => {
      const isActive = (p.is_active !== undefined ? p.is_active : p.status === 'Active') && p.status !== 'Inactive';
      if (!isActive) return false;
      const pSlug = (p.categorySlug || '').trim().toLowerCase();
      const matchesSlug = pSlug === targetSlug;
      const matchesTitle =
        currentCategory &&
        p.category?.trim().toLowerCase() === currentCategory.title?.trim().toLowerCase();
      return matchesSlug || matchesTitle;
    });
  }, [products, slug, currentCategory]);

  // Catalog products (subcategory only; price/sort/collection filters live on the all-products page)
  const filteredProducts = useMemo(() => {
    return categoryProducts.filter((p: any) => {
      if (selectedSubcategory !== 'All' && p.subcategory !== selectedSubcategory) {
        return false;
      }
      return true;
    });
  }, [categoryProducts, selectedSubcategory]);

  // Group category products by their lifestyle_sale_tags entry.
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

  const [instagramVideos, setInstagramVideos] = useState<any[]>([]);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  const [festivalBanner, setFestivalBanner] = useState<any | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      if (!currentCategory) return;
      try {
        const { getFestivalBannersFromSupabase } = await import('../../../lib/supabase');
        const banners = await getFestivalBannersFromSupabase();
        const activeBanner = banners.find((b: any) =>
          b.isActive && (b.categoryId === currentCategory.id || b.categorySlug === currentCategory.slug)
        );
        if (activeBanner) {
          setFestivalBanner(activeBanner);
        }
      } catch (e) {
        console.warn('Could not load festival banner', e);
      }
    };
    fetchBanners();
  }, [currentCategory]);

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
    const fallbackImg = currentCategory?.bannerImage || currentCategory?.heroImage || 'https://images.unsplash.com/photo-1515562141589-67f0d0953a8e?w=600&fit=crop&auto=format';
    return (
      (currentCategory?.subcatImages && currentCategory.subcatImages.length > 0)
        ? currentCategory.subcatImages
        : (currentCategory?.subcategories || []).filter((s) => s !== 'All').map((s) => ({
          name: s,
          image: fallbackImg,
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

  const categorySlug = (currentCategory.slug || '').trim();

  // "Show All Products" link — carries over the active subcategory
  const allProductsParams = new URLSearchParams();
  if (selectedSubcategory !== 'All') allProductsParams.set('sub', selectedSubcategory);
  const allProductsQuery = allProductsParams.toString();
  const allProductsHref = `/all-products/${categorySlug}${allProductsQuery ? `?${allProductsQuery}` : ''}`;

  const catalogProducts = filteredProducts.slice(0, MAX_CATALOG_PRODUCTS);

  const tagHref = (tag: string) =>
    `/all-products/${categorySlug}?tag=${encodeURIComponent(tag)}`;

  const festivalProducts = festivalBanner
    ? categoryProducts
      .filter((p: any) => {
        const tag = (p.lifestyleTag || p.lifestyleTagName || '').trim();
        return tag === festivalBanner.lifestyleTag.trim();
      })
      .slice(0, MOBILE_MAX_ITEMS)
    : [];

  return (
    <div className="space-y-12 sm:space-y-16 pb-24">
      {/* 1. DEDICATED CATEGORY HERO BANNER */}
      <section className="relative w-full min-h-[460px] sm:min-h-[540px] lg:min-h-[620px] bg-[#08281F] overflow-hidden flex items-center">
        <img
          src={currentCategory.heroImage || currentCategory.bannerImage}
          alt={currentCategory.title}
          className="w-full h-full object-cover object-center absolute inset-0 opacity-45 scale-105 transition-transform duration-7000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08281F]/95 via-[#0C3B2E]/70 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08281F] via-transparent to-transparent" />

        <div className="relative w-full px-4 sm:px-6 py-14 sm:py-16 pb-16 sm:pb-20">
          {/* Top Breadcrumb & Badge */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-4">
            <Link
              href="/"
              className="text-xs text-[#FAF8F5]/80 hover:text-[#D4AF37] uppercase tracking-widest flex items-center gap-1 font-semibold shrink-0"
            >
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
            <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold">
              {currentCategory.title} Flagship
            </span>
          </div>

          <div className="max-w-3xl space-y-4 sm:space-y-5">
            <h1 className="font-serif-title text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.08]">
              {currentCategory.title}
            </h1>
            <ClampedText
              text={currentCategory.subtitle}
              className="text-sm sm:text-lg text-[#E8F0EC]/90 leading-relaxed font-normal max-w-2xl"
            />
          </div>
        </div>
      </section>

      {/* 2. SUB-CATEGORY QUICK-SHOP — BIG SQUARE CARDS */}
      <section className="w-full px-2 sm:px-3">
        <div className="relative bg-white rounded-[1.75rem] border border-[#E2DBD0] p-6 sm:p-8 lg:p-10 shadow-sm space-y-6">
          <div className="flex flex-col items-center justify-center gap-4 pb-5 border-b border-[#EFEBE3] text-center">
            <div className="flex flex-col items-center gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                  Explore Collections
                </p>
                <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-[#0B241C] mt-1">
                  {currentCategory.title}
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
                  href={`/category/${categorySlug}/${encodeURIComponent(sub.name.trim())}`}
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

      {/* 2.2 FESTIVAL BANNER & SALE PRODUCTS */}
      {festivalBanner && (
        <section className="w-full px-2 sm:px-3 mt-6 sm:mt-10">
          <div className="relative bg-[#FFEFE8] rounded-[1.75rem] overflow-hidden border border-[#F5DFD6] shadow-sm flex flex-col">
            {/* The Banner → all-products filtered by this sale tag */}
            <Link
              href={tagHref(festivalBanner.lifestyleTag)}
              className="w-full block relative aspect-[3000/563] group cursor-pointer shrink-0"
            >
              <img
                src={festivalBanner.imageUrl}
                alt={festivalBanner.lifestyleTag}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
            </Link>

            {/* The Sale Products — mobile: 2-col vertical grid, desktop: horizontal row */}
            <div className="p-4 sm:p-8 lg:p-10 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif-title text-xl sm:text-2xl font-bold text-[#0B241C]">
                  {festivalBanner.lifestyleTag}
                </h3>
                <Link
                  href={tagHref(festivalBanner.lifestyleTag)}
                  className="text-xs font-bold text-[#C5A059] hover:text-[#0C3B2E] transition-colors flex items-center gap-1 uppercase tracking-wider"
                >
                  View All Sale <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <AutoScrollRow className="grid grid-cols-2 gap-3 sm:flex sm:gap-4 sm:overflow-x-auto sm:snap-x sm:snap-mandatory pb-2 sm:pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {festivalProducts.map((product: any, i: number) => (
                  <div
                    key={product.id}
                    className={`w-full sm:w-[260px] sm:shrink-0 sm:snap-start ${i >= 6 ? 'sm:hidden' : ''}`}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </AutoScrollRow>

              {/* Mobile View All */}
              <div className="sm:hidden flex justify-center">
                <Link
                  href={tagHref(festivalBanner.lifestyleTag)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0C3B2E] text-white text-xs font-semibold uppercase tracking-wider shadow-sm"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

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
                        href={tagHref(group.tag)}
                        className={`hidden sm:inline-flex text-xs font-semibold items-center gap-1.5 transition-colors px-4 py-2 rounded-full border shadow-sm cursor-pointer ${theme.btnStyle}`}
                      >
                        View All <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Mobile: 2-col vertical grid (max 15 rows). Desktop: horizontal scroll row */}
                  <AutoScrollRow className="relative grid grid-cols-2 gap-3 sm:flex sm:gap-5 sm:overflow-x-auto pb-2 sm:pb-4 scrollbar-none sm:snap-x sm:justify-start">
                    {group.items.map((prod, i) => (
                      <div
                        key={prod.id}
                        className={`w-full sm:w-56 lg:w-64 sm:shrink-0 sm:snap-start ${i >= MOBILE_MAX_ITEMS ? 'hidden sm:block' : ''}`}
                      >
                        <ProductCard product={prod} />
                      </div>
                    ))}
                  </AutoScrollRow>

                  {/* Mobile View All */}
                  <div className="relative sm:hidden flex justify-center mt-4">
                    <Link
                      href={tagHref(group.tag)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-6 py-2.5 rounded-full border shadow-sm ${theme.btnStyle}`}
                    >
                      View All <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2.5.5 PRICE BUCKETS — navigate to /all-products/[slug] with the price filter applied */}
      <section className="w-full px-2 sm:px-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {[99, 499, 999].map((price, idx) => {
            const isLast = idx === 2;
            return (
              <Link
                key={price}
                href={`/all-products/${categorySlug}?price=under${price}`}
                className={`relative block rounded-[1.5rem] sm:rounded-3xl overflow-hidden aspect-[2/1] sm:aspect-[2.5/1] shadow-md hover:shadow-xl transition-all hover:-translate-y-1 group border border-[#591420]/20 ${isLast
                  ? 'col-span-2 sm:col-span-1 w-[calc(50%-6px)] sm:w-full mx-auto justify-self-center sm:justify-self-auto'
                  : 'w-full'
                  }`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: "url('/greencover.jpg')" }}
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />

                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <span className="text-white/90 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-0.5">
                    Under
                  </span>
                  <span className="text-white font-bold text-2xl sm:text-4xl tracking-tight">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

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
                <Link
                  href={`/all-products/${categorySlug}?featured=1`}
                  className="hidden sm:inline-flex text-xs font-semibold text-[#0B241C] hover:text-[#0C3B2E] items-center gap-1.5 transition-colors bg-white hover:bg-white/90 px-4 py-2 rounded-full border border-[#E2E5EA] shadow-sm cursor-pointer"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Mobile: 2-col vertical grid (max 15 rows). Desktop: horizontal scroll row */}
            <AutoScrollRow className="relative grid grid-cols-2 gap-3 sm:flex sm:gap-5 sm:overflow-x-auto pb-2 sm:pb-4 scrollbar-none sm:snap-x sm:justify-start">
              {featuredProducts.map((prod: any, i: number) => (
                <div
                  key={prod.id}
                  className={`w-full sm:w-56 lg:w-64 sm:shrink-0 sm:snap-start ${i >= MOBILE_MAX_ITEMS ? 'hidden sm:block' : ''}`}
                >
                  <ProductCard product={prod} />
                </div>
              ))}
            </AutoScrollRow>

            {/* Mobile View All */}
            <div className="relative sm:hidden flex justify-center mt-4">
              <Link
                href={`/all-products/${categorySlug}?featured=1`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B241C] bg-white px-6 py-2.5 rounded-full border border-[#E2E5EA] shadow-sm"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2.5.6 FIVE WORLDS, ONE PURNYA */}
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
            {categories.map((cat, idx) => {
              const Icon = getCategoryIcon(cat);
              const isLastOdd = idx === categories.length - 1 && categories.length % 2 !== 0;
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className={`group relative flex flex-col items-center text-center gap-3 p-5 rounded-2xl bg-white border border-[#E2DBD0] hover:border-[#C5A059] hover:shadow-lg transition-all ${isLastOdd
                    ? 'col-span-2 sm:col-span-1 w-[calc(50%-8px)] sm:w-full mx-auto sm:mx-0 justify-self-center sm:justify-self-auto'
                    : ''
                    }`}
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

      {/* 2.5.7 SHOP BY GENDER — opens all-products with the gender filter (Jewellery only) */}
      {isJewelryCategory && (
        <section className="w-full px-2 sm:px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
              Shop by Gender
            </p>
            <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C]">
              Who Are You Shopping For?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
            {[
              {
                value: 'men',
                buttonText: 'SHOP FOR HIM',
                image: '/images/gender/shop-for-him.jpg',
                imagePosition: 'object-[center_16%]',
              },
              {
                value: 'women',
                buttonText: 'SHOP FOR HER',
                image: '/images/gender/shop-for-her.png',
                imagePosition: 'object-[center_20%]',
              },
              {
                value: 'unisex',
                buttonText: 'SHOP UNISEX',
                image: '/images/gender/shop-unisex.jpg',
                imagePosition: 'object-[center_26%]',
              },
            ].map(({ value, buttonText, image, imagePosition }) => (
              <Link
                key={value}
                href={`/all-products/${categorySlug}?gender=${value}`}
                className="group relative block w-full rounded-[40px] sm:rounded-[52px] lg:rounded-full overflow-hidden bg-[#FCE5D6] aspect-[16/9] sm:aspect-[7/4] md:aspect-[16/10] lg:aspect-[16/9] shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-[#E2DBD0]/60 hover:ring-2 hover:ring-[#C5A059]/60"
              >
                <img
                  src={image}
                  alt={buttonText}
                  className={`w-full h-full object-cover ${imagePosition} group-hover:scale-105 transition-transform duration-700 ease-out`}
                />
                {/* Soft overlay */}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors duration-300" />
                {/* Centered Green Pill Button */}
                <div className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none">
                  <span className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#056828] text-white text-xs sm:text-sm font-serif font-bold uppercase tracking-wider shadow-md group-hover:bg-[#03521E] group-hover:scale-105 group-hover:shadow-xl transition-all duration-300 flex items-center gap-1.5 sm:gap-2">
                    <span>{buttonText}</span>
                    <span className="text-[9px] sm:text-[10px] leading-none">▶</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. MAIN PRODUCT CATALOG — limited to 6 rows, then "Show All Products" */}
      <section id="catalog-section" className="w-full px-2 sm:px-3 space-y-8 pt-8">
        {/* Catalog Header (Refine Filters + Sort removed) */}
        <div className="flex flex-col items-center justify-center gap-5 pb-5 border-b border-[#E2DBD0] text-center relative">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
              {selectedSubcategory === 'All' ? 'Curated Collection' : 'Selected Collection'}
            </p>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C] mt-1">
              {selectedSubcategory === 'All'
                ? `Complete ${currentCategory.title} Collection`
                : `${selectedSubcategory} Collection`}
            </h2>
            <p className="text-xs text-[#5A7469] mt-1.5">
              <strong className="text-[#0B241C]">{filteredProducts.length}</strong> handcrafted pieces
            </p>
          </div>
        </div>

        {/* Products Grid — 6 rows max (12 on mobile, 18 on tablet, 24 on desktop) */}
        {filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {catalogProducts.map((product, i) => (
                <div
                  key={product.id}
                  className={i >= 18 ? 'hidden lg:block' : i >= 12 ? 'hidden sm:block' : ''}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Show All Products → /all-products/[slug] */}
            <div className="flex justify-center pt-2">
              <Link
                href={allProductsHref}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#0C3B2E] text-white text-xs font-semibold uppercase tracking-wider shadow-md hover:bg-[#08281F] hover:shadow-lg transition-all"
              >
                Show All Products
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#E2DBD0] p-8 space-y-4">
            <h3 className="font-serif-title text-xl font-bold text-[#0B241C]">
              No products found in this selection
            </h3>
            <p className="text-xs text-[#2C4A3E] max-w-sm mx-auto">
              Try another collection to explore more of our {currentCategory.title} catalog.
            </p>
            <button
              onClick={() => setSelectedSubcategory('All')}
              className="px-6 py-2.5 rounded-full bg-[#0C3B2E] text-white text-xs font-semibold uppercase tracking-wider shadow-sm cursor-pointer"
            >
              Show All {currentCategory.title}
            </button>
          </div>
        )}
      </section>

      {/* INSTAGRAM VIDEOS FEED */}
      {instagramVideos.length > 0 && (
        <section className="w-full px-2 sm:px-3 mb-10">
          <div className="bg-[#08281F] rounded-[1.75rem] border border-[#144234] p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden">
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

            <div className="relative grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 max-w-5xl mx-auto px-2 sm:px-0">
              {instagramVideos.map((video) => {
                let cleanUrl = video.url.replace('/reel/', '/p/').split('?')[0].replace(/\/$/, '');
                if (cleanUrl.endsWith('/embed')) {
                  cleanUrl = cleanUrl.replace(/\/embed$/, '');
                }
                const embedUrl = `${cleanUrl}/embed`;

                return (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideoUrl(embedUrl)}
                    className="aspect-square w-full bg-[#EBF3EF] overflow-hidden relative group cursor-pointer rounded-lg sm:rounded-2xl"
                  >
                    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black">
                      <iframe
                        src={embedUrl}
                        className="absolute border-none max-w-none"
                        style={{
                          width: '360px',
                          height: '700px',
                          top: '-100px',
                          left: '-30px',
                          transform: 'scale(1.25)',
                          transformOrigin: 'top left'
                        }}
                        scrolling="no"
                      />
                    </div>
                    <div className="absolute inset-0 z-20 bg-transparent group-hover:bg-black/10 transition-colors duration-300" />
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* VIDEO POPUP MODAL */}
      {selectedVideoUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" onClick={() => setSelectedVideoUrl(null)} />
          <div className="relative w-full max-w-md bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => setSelectedVideoUrl(null)}
              className="absolute top-3 right-3 z-50 w-10 h-10 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors border border-white/20 shadow-md"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full h-[80vh] sm:h-[85vh] max-h-[850px] relative bg-black flex items-center justify-center">
              <iframe
                src={selectedVideoUrl}
                className="w-full h-full border-none"
                scrolling="no"
                allow="encrypted-media"
              />
            </div>
          </div>
        </div>
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