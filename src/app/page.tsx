'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  ArrowUpRight,
  Gem,
  Flame,
  Home,
  Leaf,
  Gift,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { initialHeroSlides } from '../data/mockData';
import { HomeMiddleSection, HomeBottomSection } from '../types';
import { getHomeMiddleSectionsFromSupabase, getHomeBottomSectionsFromSupabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';

const defaultMiddleFallback: HomeMiddleSection = {
  id: 'homepage-middle-standard',
  tag: 'THE PURNYA STANDARD',
  title: 'Artisanal Metallurgy & Anti-Tarnish Elegance',
  description: 'Every piece of Purnya Jewellery is cast from premium hypoallergenic alloys, finished with lustrous 18K micro-gold plating and sealed with an invisible protective nano-ceramic barrier to guard against moisture, perfume, and daily wear.',
  imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000&fit=crop&auto=format',
  features: [
    'Skin-Safe Hypoallergenic & Nickel Free',
    'Anti-Tarnish Protective Ceramic Seal',
    'Ethically Sourced Genuine Freshwater Pearls',
    'Hand-Set AAA Cubic Zirconia & Gemstones'
  ],
  primaryButtonText: 'SHOP COMPLETE CATALOG',
  primaryButtonLink: '/catalog',
  secondaryButtonText: 'EXPLORE OTHER 4 WORLDS',
  secondaryButtonLink: '/worlds',
  isActive: true,
};

const defaultBottomCardImages = [
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&fit=crop&auto=format',
];

const defaultBottomFallback: HomeBottomSection = {
  id: 'homepage-bottom-integrity',
  tag: 'THE PURNYA STANDARD',
  heading: 'Artisanal Integrity in Every Creation',
  subheading: 'From conscious sourcing to anti-tarnish protective sealing, our commitment to mindful luxury is uncompromising.',
  cards: [
    {
      iconText: '18K',
      title: 'Gold Vermeil & Anti-Tarnish Sealing',
      description: 'Handcrafted jewellery plated with genuine 18-karat gold over hypoallergenic brass and finished with proprietary nano-ceramic sealing.',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&fit=crop&auto=format',
    },
    {
      iconText: '100%',
      title: 'Clean Natural Sand Wax Formulations',
      description: 'Granulated plant-based sand and pearl wax that burns soot-free with pure cotton wicks and distilled aromatic botanicals.',
      image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&fit=crop&auto=format',
    },
    {
      iconText: 'Origin',
      title: 'Direct Single-Origin Ethical Sourcing',
      description: 'Herbal wellness infusions and handcrafted stoneware produced in ethical artisan cooperatives with traceable, conscious materials.',
      image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&fit=crop&auto=format',
    },
  ],
  isActive: true,
};

function getCategoryIcon(cat: { slug?: string; title?: string }) {
  const s = `${cat.slug || ''} ${cat.title || ''}`.toLowerCase();
  if (s.includes('jewel') || s.includes('apparel') || s.includes('accessor')) return Gem;
  if (s.includes('candle') || s.includes('fragrance')) return Flame;
  if (s.includes('decor') || s.includes('décor') || s.includes('lifestyle') || s.includes('home')) return Home;
  if (s.includes('wellness') || s.includes('organic')) return Leaf;
  if (s.includes('gift') || s.includes('stationery')) return Gift;
  return Sparkles;
}

export default function HomePage() {
  const { categories, products, banners } = useStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const [middleSection, setMiddleSection] = useState<HomeMiddleSection | null>(null);
  const [bottomSection, setBottomSection] = useState<HomeBottomSection | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSections() {
      try {
        const [mid, bot] = await Promise.all([
          getHomeMiddleSectionsFromSupabase(),
          getHomeBottomSectionsFromSupabase(),
        ]);
        if (!isMounted) return;
        const activeMid = mid.find((m) => m.isActive) || mid[0] || null;
        if (activeMid) setMiddleSection(activeMid);

        const activeBot = bot.find((b) => b.isActive) || bot[0] || null;
        if (activeBot) setBottomSection(activeBot);
      } catch (err) {
        console.warn('Error fetching dynamic sections from Supabase:', err);
      }
    }
    loadSections();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeMiddle = middleSection || defaultMiddleFallback;
  const activeBottom = bottomSection || defaultBottomFallback;

  const activeBanners = banners.filter((b) => b.active);
  const displayedBanners = activeBanners.length > 0 ? activeBanners : initialHeroSlides;

  useEffect(() => {
    if (displayedBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % displayedBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [displayedBanners.length]);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % displayedBanners.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + displayedBanners.length) % displayedBanners.length);
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-12">
      {/* 1. HERO BANNER SECTION (SOW 5.A) */}
      <section className="relative w-full h-[520px] sm:h-[620px] lg:h-[680px] overflow-hidden bg-[#08281F]">
        {displayedBanners.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-center scale-105 transition-transform duration-10000 ease-out opacity-90"
            />
            {/* Emerald Deep Atmospheric Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#08281F]/90 via-[#0C3B2E]/60 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08281F]/80 via-transparent to-transparent" />

            <div className="absolute inset-0 flex items-center">
              <div className="w-full px-3 sm:px-4">
                <div className="max-w-2xl text-[#FAF8F5] space-y-4 sm:space-y-6">
                  {slide.pretitle && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.25em] border border-[#D4AF37]/30">
                      <span>{slide.pretitle}</span>
                    </div>
                  )}
                  <h1 className="font-serif-title text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.06]">
                    {slide.title}
                  </h1>
                  <p className="text-base sm:text-lg text-[#E8F0EC] font-normal leading-relaxed max-w-lg">
                    {slide.subtitle}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-4">
                    <Link
                      href={slide.ctaLink}
                      className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs sm:text-sm uppercase tracking-widest shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                    >
                      <span>{slide.ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    {categories.length > 0 && (
                      <Link
                        href={`/category/${categories[0].slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm uppercase tracking-widest backdrop-blur-md border border-white/25 transition-all"
                      >
                        Explore {categories[0].title} ↗
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Hero Navigation Controls */}
        {displayedBanners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              aria-label="Previous Slide"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/25 hover:bg-[#0C3B2E] text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all hover:scale-110 shadow-lg"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next Slide"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/25 hover:bg-[#0C3B2E] text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all hover:scale-110 shadow-lg"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
              {displayedBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === activeSlide ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
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
          <h2 className="font-serif-title text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B241C]">
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
              .slice(0, 5);

            const validSubcats = (
              (cat.subcatImages && cat.subcatImages.length > 0)
                ? cat.subcatImages
                : (cat.subcategories || []).filter((s) => s !== 'All').map((s) => ({ name: s, image: cat.bannerImage || cat.heroImage }))
            );

            const Icon = getCategoryIcon(cat);

            return (
              <div
                key={cat.id}
                className="group/card relative bg-white rounded-[1.75rem] border border-[#E2DBD0] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Header Band: Icon + Title + Description + CTA */}
                <div className="relative bg-gradient-to-r from-[#0C3B2E] via-[#0C3B2E] to-[#08281F] px-6 sm:px-8 lg:px-10 py-6 sm:py-7 overflow-hidden">
                  {/* Decorative glow */}
                  <div className="pointer-events-none absolute -right-10 -top-16 w-56 h-56 rounded-full bg-[#D4AF37]/10 blur-3xl" />
                  <div className="pointer-events-none absolute -left-10 -bottom-16 w-48 h-48 rounded-full bg-[#D4AF37]/5 blur-3xl" />

                  <div className="relative flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-5 lg:gap-8">
                    <div className="flex items-center gap-3.5 sm:gap-4 shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-[#D4AF37] shrink-0 group-hover/card:bg-[#D4AF37] group-hover/card:text-[#08281F] transition-colors">
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">
                          World 0{idx + 1}
                        </span>
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
                        className={`grid gap-2.5 sm:gap-3 ${
                          validSubcats.length === 4 ? 'grid-cols-2 sm:grid-cols-4' :
                          validSubcats.length === 5 ? 'grid-cols-3 sm:grid-cols-5' :
                          'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6'
                        }`}
                      >
                        {validSubcats.map((sub) => (
                          <Link
                            key={sub.name}
                            href={`/category/${cat.slug}/${encodeURIComponent(sub.name)}`}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-[#E2DBD0] bg-[#EBF3EF] shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-[#C5A059] transition-all duration-300"
                            title={`Shop ${sub.name}`}
                          >
                            <img
                              src={sub.image}
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
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0C3B2E]" />
                      <p className="text-sm sm:text-base font-bold uppercase tracking-widest text-[#0B241C]">
                        Featured in {cat.title}
                      </p>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0C3B2E]" />
                    </div>
                    {catProducts.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-5 gap-2 sm:gap-3">
                        {catProducts.map((prod) => (
                          <ProductCard key={prod.id} product={prod} compact hidePrice showVariants={false} />
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

      {/* 3. TRUST REASSURANCE BAR */}
      <section className="bg-white border-y border-[#E2DBD0] py-6 shadow-xs">
        <div className="w-full px-2 sm:px-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
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

      {/* 4. EDITORIAL BRAND STORY / MIDDLE SECTION */}
      <section className="w-full px-2 sm:px-3">
        <div className="relative rounded-3xl overflow-hidden bg-[#0C3B2E] text-[#FAF8F5] p-6 sm:p-10 lg:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8 lg:gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase border border-[#D4AF37]/30">
                {activeMiddle.tag || 'The Purnya Philosophy'}
              </div>
              <h2 className="font-serif-title text-3xl sm:text-4xl font-bold leading-tight">
                {activeMiddle.title}
              </h2>
              <p className="text-sm text-[#B4C9BF] leading-relaxed">
                {activeMiddle.description}
              </p>

              {activeMiddle.features && activeMiddle.features.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {activeMiddle.features.map((feat, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span className="text-[11px] sm:text-xs text-[#FAF8F5]">{feat}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={activeMiddle.primaryButtonLink || '/catalog'}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-[#08281F] font-bold text-[11px] uppercase tracking-widest transition-all shadow-lg hover:scale-105"
                >
                  <span>{activeMiddle.primaryButtonText || 'Shop Complete Catalog'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                {activeMiddle.secondaryButtonText && (
                  <Link
                    href={activeMiddle.secondaryButtonLink || '/worlds'}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/30 text-white font-semibold text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    <span>{activeMiddle.secondaryButtonText}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                  </Link>
                )}
              </div>
            </div>

            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#071a13]">
              <img
                src={activeMiddle.imageUrl || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000&fit=crop&auto=format'}
                alt={activeMiddle.title}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000&fit=crop&auto=format';
                }}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. AUTHENTIC PURNYA CRAFTSMANSHIP STANDARDS / BOTTOM SECTION */}
      <section className="bg-[#EBF3EF]/60 border-y border-[#E2DBD0] py-10">
        <div className="w-full px-2 sm:px-3">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
              {activeBottom.tag || 'The Purnya Standard'}
            </span>
            <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C]">
              {activeBottom.heading}
            </h2>
            <p className="text-xs sm:text-sm text-[#2C4A3E]">
              {activeBottom.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeBottom.cards.map((card, idx) => {
              const cardImage = card.image || defaultBottomCardImages[idx % defaultBottomCardImages.length];
              return (
                <div key={idx} className="bg-white p-7 rounded-2xl border border-[#E2DBD0] shadow-xs space-y-4 flex flex-col justify-between group hover:border-[#C5A059] transition-all">
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] font-serif-title font-bold text-lg">
                      {card.iconText}
                    </div>
                    <h3 className="font-serif-title text-base font-bold text-[#0B241C]">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#2C4A3E] leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  {cardImage && (
                    <div className="w-full h-40 rounded-xl overflow-hidden border border-[#E2DBD0] mt-3 relative bg-[#FAF9F5]">
                      <img
                        src={cardImage}
                        alt={card.title}
                        onError={(e) => {
                          e.currentTarget.src = defaultBottomCardImages[idx % defaultBottomCardImages.length];
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}