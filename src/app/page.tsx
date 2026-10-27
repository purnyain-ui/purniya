'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import StorefrontMotion from '../components/StorefrontMotion';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Gem,
  Flame,
  Home,
  Leaf,
  Gift,
  Sparkles,
  Pause,
  Play,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { getSubcategoryImage } from '../data/mockData';
import ProductCard from '../components/ProductCard';

function getCategoryIcon(cat: { slug?: string; title?: string }) {
  const s = `${cat.slug || ''} ${cat.title || ''}`.toLowerCase();
  if (s.includes('jewel') || s.includes('apparel') || s.includes('accessor')) return Gem;
  if (s.includes('candle') || s.includes('fragrance')) return Flame;
  if (s.includes('decor') || s.includes('décor') || s.includes('lifestyle') || s.includes('home')) return Home;
  if (s.includes('wellness') || s.includes('organic')) return Leaf;
  if (s.includes('gift') || s.includes('stationery')) return Gift;
  return Sparkles;
}

function getCategoryCuratedTitle(cat: { slug?: string; title?: string }) {
  const s = `${cat.slug || ''} ${cat.title || ''}`.toLowerCase();
  if (s.includes('jewel') || s.includes('apparel') || s.includes('accessor')) return 'Jewellery & Accessories';
  if (s.includes('candle') || s.includes('fragrance')) return 'Candle & Home Fragrance';
  if (s.includes('decor') || s.includes('décor') || s.includes('lifestyle')) return 'Home Décor & Lifestyle';
  if (s.includes('wellness') || s.includes('organic')) return 'Organic & Wellness';
  if (s.includes('gift') || s.includes('stationery')) return 'Gift & Stationery';
  return cat.title || '';
}

function getCategoryCuratedDescription(cat: { slug?: string; title?: string; subtitle?: string }) {
  const s = `${cat.slug || ''} ${cat.title || ''}`.toLowerCase();
  if (s.includes('jewel') || s.includes('apparel') || s.includes('accessor')) {
    return 'Discover jewellery and accessories that bring elegance and charm to everyday moments.';
  }
  if (s.includes('candle') || s.includes('fragrance')) {
    return 'Explore pearl wax and home fragrance essentials to create a warm, inviting atmosphere.';
  }
  if (s.includes('decor') || s.includes('décor') || s.includes('lifestyle') || s.includes('home')) {
    return 'Discover thoughtfully selected décor and lifestyle essentials to make your space feel special.';
  }
  if (s.includes('wellness') || s.includes('organic')) {
    return 'Explore organic products and wellness essentials for a more mindful everyday lifestyle.';
  }
  if (s.includes('gift') || s.includes('stationery')) {
    return 'Find thoughtful gifts and stationery to celebrate special moments and make every occasion memorable.';
  }
  return cat.subtitle || 'Discover thoughtfully curated essentials for a mindful, elegant lifestyle.';
}

export default function HomePage() {
  const { categories, products, heroBanners: banners, markHeroReady, bannersLoaded, bannersError, retryBanners } = useStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const [motionReduced, setMotionReduced] = useState(true);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [heroHovered, setHeroHovered] = useState(false);
  const [heroFocused, setHeroFocused] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotionReduced(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  const catRowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const activeBanners = [...banners]
    .filter((b) => b.active)
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  const displayedBanners = activeBanners;

  useEffect(() => {
    if (displayedBanners.length <= 1 || motionReduced || rotationPaused || heroHovered || heroFocused) return;
    const timer = setInterval(() => {
      if (!document.hidden) setActiveSlide((prev) => (prev + 1) % displayedBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [displayedBanners.length, motionReduced, rotationPaused, heroHovered, heroFocused]);

  useEffect(() => {
    setActiveSlide((previous) => previous % Math.max(displayedBanners.length, 1));
  }, [displayedBanners.length]);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % displayedBanners.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + displayedBanners.length) % displayedBanners.length);
  };

  return (
    <StorefrontMotion className="space-y-6 sm:space-y-10 pb-12">
{/* 1. HERO BANNER SECTION (SOW 5.A) */}
<section
  hidden={bannersLoaded && !bannersError && displayedBanners.length === 0}
  aria-label="Featured collections"
  aria-roledescription="carousel"
  onMouseEnter={() => setHeroHovered(true)}
  onMouseLeave={() => setHeroHovered(false)}
  onFocusCapture={() => setHeroFocused(true)}
  onBlurCapture={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeroFocused(false);
  }}
  className="relative w-full h-[520px] sm:h-[620px] lg:h-[680px] overflow-hidden bg-[#08281F]">
  {displayedBanners.length === 0 && (
    <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center bg-gradient-to-br from-[#08281F] to-[#164E3D]">
      <p role="status" className="text-sm tracking-widest uppercase text-[#E9D28B]">
        {bannersError ? 'Unable to load featured collections' : 'Loading featured collections…'}
      </p>
      {bannersError && (
        <button type="button" onClick={retryBanners} className="rounded-full border border-[#E9D28B]/60 px-5 py-2 text-sm text-[#E9D28B] hover:bg-white/10">
          Retry loading banners
        </button>
      )}
    </div>
  )}
  {displayedBanners.map((slide, idx) => {
    const heroImage = slide.image;
    return (
      <div
        key={slide.id}
        data-active={idx === activeSlide}
        aria-hidden={idx !== activeSlide}
        inert={idx !== activeSlide}
        className={`hero-slide absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
        }`}
      >
        {heroImage && <img
          src={heroImage}
          fetchPriority={idx === activeSlide ? 'high' : 'low'}
          loading={idx === activeSlide ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => { if (idx === activeSlide) markHeroReady(); }}
          onError={() => { if (idx === activeSlide) markHeroReady(); }}
          alt={slide.title}
          className="w-full h-full object-cover object-center hero-image opacity-90"
        />}
      {/* Emerald Deep Atmospheric Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#08281F]/90 via-[#0C3B2E]/60 to-black/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#08281F]/80 via-transparent to-transparent" />

      {/* pb-24 / sm:pb-28 keeps text clear of bottom controls */}
      <div className="absolute inset-0 flex items-center pb-24 sm:pb-28">
        <div className="w-full px-3 sm:px-6">
          <div className="hero-copy max-w-2xl text-[#FAF8F5] space-y-3.5 sm:space-y-6">
            {slide.pretitle && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.25em] border border-[#D4AF37]/30">
                <span>{slide.pretitle}</span>
              </div>
            )}
            <h1 className="font-serif-title text-3xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.06]">
              {slide.title}
            </h1>
            <ClampedText
              text={slide.subtitle}
              className="text-xs sm:text-lg text-[#E8F0EC] font-normal leading-relaxed max-w-lg"
            />
            <div className="pt-2 flex flex-wrap gap-2.5 sm:gap-4">
              <Link
                href={slide.ctaLink}
                className="px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs sm:text-sm uppercase tracking-widest shadow-xl transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>{slide.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {categories.length > 0 && (
                <Link
                  href={`/category/${categories[0].slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm uppercase tracking-widest backdrop-blur-md border border-white/25 transition-all"
                >
                  Explore {categories[0].title} ↗
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
})}

  {/* Hero Navigation Controls — bottom row: dots (left) + arrows (bottom-right corner) */}
  {displayedBanners.length > 1 && (
    <>
      {/* Slide Indicator Dots (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 z-30 flex items-center gap-2 sm:gap-2.5">
        {displayedBanners.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveSlide(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeSlide ? 'w-7 sm:w-8 bg-[#D4AF37]' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Slide ${i + 1}`}
            aria-current={i === activeSlide ? true : undefined}
          />
        ))}
      </div>

      {/* Navigation Arrows (Bottom-Right Corner) */}
      <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-30 flex items-center gap-2 sm:gap-3">
        {!motionReduced && (
          <button
            type="button"
            onClick={() => setRotationPaused((paused) => !paused)}
            aria-label={rotationPaused ? 'Resume banner rotation' : 'Pause banner rotation'}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-[#0C3B2E] text-white flex items-center justify-center border border-white/30 transition-colors"
          >
            {rotationPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        )}
        <button
          onClick={prevSlide}
          aria-label="Previous Slide"
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-[#0C3B2E] text-white flex items-center justify-center backdrop-blur-md border border-white/30 transition-all hover:scale-110 active:scale-95 shadow-xl"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button
          onClick={nextSlide}
          aria-label="Next Slide"
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-[#0C3B2E] text-white flex items-center justify-center backdrop-blur-md border border-white/30 transition-all hover:scale-110 active:scale-95 shadow-xl"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </>
  )}
</section>

      {/* 2. FIVE CATEGORY DISCOVERY ROWS (SOW SECTION 5.1 & 5.B, 5.C, 5.D, 5.E, 5.F, 5.G) */}
      <section className="w-full px-2 sm:px-3 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059] flex items-center justify-center gap-1.5">

            <span>Curated Lifestyle Worlds</span>
          </p>
          <h2 data-motion className="font-serif-title text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B241C]">
            Explore Our Boutiques
          </h2>
          <p className="text-sm text-[#2C4A3E]">
            Each category opens into its own dedicated landing page with focused subcategories, collections, and artisanal products.
          </p>
        </div>

        {/* Dynamic Category Blocks */}
        <div className="space-y-8">
          {categories.map((cat, idx) => {
            const catProducts = products
              .filter((p) => {
                const isActive = (p.is_active !== undefined ? p.is_active : p.status === 'Active') && p.status !== 'Inactive';
                if (!isActive) return false;
                const pSlug = (p.categorySlug || '').trim().toLowerCase();
                const cSlug = (cat.slug || '').trim().toLowerCase();
                const pCat = (p.category || '').trim().toLowerCase();
                const cTitle = (cat.title || '').trim().toLowerCase();
                return (
                  pSlug === cSlug ||
                  pCat === cTitle ||
                  (cSlug === 'apparel' && (pSlug === 'jewellery' || pCat.includes('jewel') || pCat.includes('apparel'))) ||
                  (cSlug === 'lifestyle' && (pSlug === 'home-decor' || pCat.includes('décor') || pCat.includes('decor') || pCat.includes('lifestyle'))) ||
                  (cSlug === 'gift' && (pSlug === 'gifts' || pCat.includes('gift') || pCat.includes('stationery'))) ||
                  (cSlug === 'fragrance' && (pSlug === 'candles' || pSlug === 'fragrance' || pCat.includes('candle') || pCat.includes('fragrance'))) ||
                  (cSlug === 'wellness' && (pSlug === 'wellness' || pCat.includes('wellness') || pCat.includes('organic')))
                );
              })
              .slice(0, 10);

            const catHero = cat.heroImage || cat.bannerImage || '';
            const rawSubcats = (
              (cat.subcatImages && cat.subcatImages.length > 0)
                ? cat.subcatImages
                : (cat.subcategories || []).filter((s) => s !== 'All').map((s) => ({ name: s, image: catHero }))
            );
            const validSubcats = rawSubcats.map((s) => ({
              name: s.name,
              image: getSubcategoryImage(s.name, catHero, s.image),
            }));

            const Icon = getCategoryIcon(cat);

            return (
              <div
                key={cat.id}
                className="group/card relative bg-white rounded-[1.75rem] border border-[#E2DBD0] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Header Band: Icon + Title + Description + CTA */}
                <div data-motion={idx % 2 ? "right" : "left"} className="relative bg-gradient-to-r from-[#0C3B2E] via-[#0C3B2E] to-[#08281F] px-6 sm:px-8 lg:px-10 py-6 sm:py-7 overflow-hidden">
                  {/* Decorative glow */}
                  <div className="pointer-events-none absolute -right-10 -top-16 w-56 h-56 rounded-full bg-[#D4AF37]/10 blur-3xl" />
                  <div className="pointer-events-none absolute -left-10 -bottom-16 w-48 h-48 rounded-full bg-[#D4AF37]/5 blur-3xl" />

                  <div className="relative flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-5 lg:gap-8">
                    <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-[#D4AF37] shrink-0 group-hover/card:bg-[#D4AF37] group-hover/card:text-[#08281F] transition-colors">
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <div>
                        <h3 className="font-serif-title text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight whitespace-nowrap">
                          {cat.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#B4C9BF] leading-relaxed flex-1 line-clamp-2">
                      {cat.subtitle}
                    </p>

                    <Link
                      href={`/category/${cat.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-105 shrink-0 self-start lg:self-auto"
                    >
                      <span>Explore {cat.title.split('&')[0].trim()}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Body: Subcategories + Products */}
                <div className="p-6 sm:p-8 lg:p-10 space-y-8">
                  {/* All Subcategories */}
                  {validSubcats.length > 0 && (
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                        <p className="text-sm sm:text-base font-bold uppercase tracking-widest text-[#0B241C]">
                          Explore Collections
                        </p>
                        <span className="text-xs sm:text-sm font-semibold text-[#5A7469]">({validSubcats.length})</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
                      </div>

                      <div
                        className={`grid gap-2.5 sm:gap-3 ${validSubcats.length === 4 ? 'grid-cols-2 sm:grid-cols-4' :
                          validSubcats.length === 5 ? 'grid-cols-3 sm:grid-cols-5' :
                            'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'
                          }`}
                      >
                        {validSubcats.map((sub) => (
                          <Link
                            key={sub.name}
                            data-motion="pop"
                            href={`/category/${cat.slug}/${encodeURIComponent(sub.name)}`}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-[#E2DBD0] bg-[#EBF3EF] shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-[#C5A059] transition-all duration-300"
                            title={`Shop ${sub.name}`}
                          >
                            <img
                              src={sub.image}
                              loading="lazy"
                              decoding="async"
                              alt={sub.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#08281F]/90 via-[#08281F]/15 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 flex items-end justify-between gap-2">
                              <span className="text-white text-xs sm:text-sm font-bold leading-snug line-clamp-2">
                                {sub.name}
                              </span>
                              <span className="shrink-0 w-6 h-6 rounded-full bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37] transition-colors">
                                <ArrowRight className="w-3.5 h-3.5 text-white group-hover:text-[#08281F]" />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Featured Mini Product Grid */}
                  <div className="rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0]/70 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0C3B2E]" />
                        <p className="text-sm sm:text-base font-bold uppercase tracking-widest text-[#0B241C]">
                          Featured in {cat.title}
                        </p>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0C3B2E]" />
                      </div>
                      {/* Desktop Scroll Controls < > */}
                      {catProducts.length > 2 && (
                        <div className="hidden sm:flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const el = catRowRefs.current[cat.id];
                              if (el) el.scrollBy({ left: -320, behavior: motionReduced ? 'instant' : 'smooth' });
                            }}
                            aria-label="Scroll left"
                            className="w-7 h-7 rounded-full border border-[#E2DBD0] bg-white text-[#0B241C] hover:bg-[#0C3B2E] hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const el = catRowRefs.current[cat.id];
                              if (el) el.scrollBy({ left: 320, behavior: motionReduced ? 'instant' : 'smooth' });
                            }}
                            aria-label="Scroll right"
                            className="w-7 h-7 rounded-full border border-[#E2DBD0] bg-white text-[#0B241C] hover:bg-[#0C3B2E] hover:text-white flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {catProducts.length > 0 ? (
                      <div
                        ref={(el) => { catRowRefs.current[cat.id] = el; }}
                        className="grid grid-cols-2 sm:flex sm:gap-3 sm:overflow-x-auto pb-2 scrollbar-none sm:snap-x sm:justify-start gap-2"
                      >
                        {catProducts.map((prod) => (
                          <div key={prod.id} data-motion="pop" className="w-full sm:w-[210px] sm:shrink-0 sm:snap-start">
                            <ProductCard product={prod} compact hidePrice showVariants={false} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 px-4 rounded-xl bg-white border border-dashed border-[#E2DBD0] text-center text-xs text-[#5A7469]">
                        <p className="font-semibold text-[#0B241C]">Artisanal pieces arriving soon</p>
                        <p className="text-[11px] mt-0.5 text-[#5A7469]">Explore all subcategories above.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 1.5 FIVE WORLDS, ONE PURNYA — BRAND OBJECTIVE / QUICK CATEGORY ACCESS */}
      <section className="w-full px-2 sm:px-3">
        <div className="relative rounded-3xl overflow-hidden bg-[#FAF8F5] border border-[#E2DBD0] px-5 py-10 sm:px-10 sm:py-14">
          <div className="text-center max-w-2xl mx-auto space-y-2.5 mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
              EXPLORE THE WORLD OF PURNYA
            </p>
            <h2 data-motion className="font-serif-title text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B241C]">
              Five Worlds. One Purnya.
            </h2>
            <p className="text-sm sm:text-base text-[#2C4A3E] leading-relaxed">
              From everyday elegance to thoughtful gifts and lifestyle essentials, discover a curated collection for every part of your life.
            </p>
          </div>

          <div data-motion-stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 items-stretch">
            {[...categories]
              .sort((a: any, b: any) => (a.priority ?? 1) - (b.priority ?? 1))
              .map((cat, idx) => {
                const Icon = getCategoryIcon(cat);
                const isLastOdd = idx === categories.length - 1 && categories.length % 2 !== 0;
                const displayTitle = getCategoryCuratedTitle(cat);
                const displayDesc = getCategoryCuratedDescription(cat);
                return (
                  <Link
                    key={cat.id}
                    data-motion
                    href={`/category/${cat.slug}`}
                    className={`group relative flex flex-col items-center text-center justify-between px-4 pt-5 pb-4 sm:px-5 sm:pt-5 sm:pb-4 rounded-2xl bg-white border border-[#E2DBD0] hover:border-[#C5A059] hover:shadow-lg transition-all duration-300 h-full ${
                      isLastOdd
                        ? 'sm:col-span-2 lg:col-span-1 sm:w-1/2 lg:w-full mx-auto'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col items-center text-center flex-1 w-full">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] group-hover:bg-[#0C3B2E] group-hover:text-[#D4AF37] transition-all duration-300 shadow-inner mb-3">
                        <Icon className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h3 className="font-serif-title text-sm sm:text-base font-bold text-[#0B241C] leading-snug mb-2">
                        {displayTitle}
                      </h3>
                      <p className="text-xs text-[#5A7469] leading-relaxed mb-2.5">
                        {displayDesc}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#0C3B2E] group-hover:text-[#C5A059] inline-flex items-center gap-1.5 transition-colors mt-auto">
                      <span>Shop Now</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-[#C5A059]" />
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>
      </section>

      {/* 3. TRUST REASSURANCE BAR */}
      <section className="bg-white border-y border-[#E2DBD0] py-6 shadow-xs">
        <div className="w-full px-2 sm:px-3">
          <div data-motion-stagger className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] shrink-0 shadow-inner">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif-title text-sm sm:text-base font-bold text-[#0B241C]">
                  Free Express Shipping
                </h4>
                <p className="text-xs text-[#2C4A3E]">On all domestic orders above ₹999</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] shrink-0 shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif-title text-sm sm:text-base font-bold text-[#0B241C]">
                  100% Secure Checkout
                </h4>
                <p className="text-xs text-[#2C4A3E]">UPI, Cards & Cash on Delivery</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] shrink-0 shadow-inner">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif-title text-sm sm:text-base font-bold text-[#0B241C]">
                  Hassle-Free 7-Day Returns
                </h4>
                <p className="text-xs text-[#2C4A3E]">Effortless replacements & refunds</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] shrink-0 shadow-inner">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif-title text-sm sm:text-base font-bold text-[#0B241C]">
                  Dedicated Support
                </h4>
                <p className="text-xs text-[#2C4A3E]">Direct customer care +91 7892297609</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </StorefrontMotion>
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