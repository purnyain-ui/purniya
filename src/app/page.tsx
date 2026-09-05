'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Sparkles,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';

export default function HomePage() {
  const { categories, products, banners } = useStore();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeBanners = banners.filter((b) => b.active);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % activeBanners.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  };

  const newArrivals = products
    .filter((p) => p.badge === 'New' || p.badge === 'Trending')
    .slice(0, 8);

  const bestSellers = products
    .filter((p) => p.badge === 'Best Seller' || (p.rating && p.rating >= 4.9))
    .slice(0, 4);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO BANNER SECTION (SOW 5.A) */}
      <section className="relative w-full h-[520px] sm:h-[620px] lg:h-[680px] overflow-hidden bg-[#08281F]">
        {activeBanners.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
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
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl text-[#FAF8F5] space-y-4 sm:space-y-6">
                  {slide.pretitle && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.25em] border border-[#D4AF37]/30">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
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
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs sm:text-sm uppercase tracking-widest shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                    >
                      <span>{slide.ctaText} ↗</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/category/candles"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm uppercase tracking-widest backdrop-blur-md border border-white/25 transition-all"
                    >
                      Explore Candles &amp; Fragrance ↗
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Hero Navigation Controls */}
        {activeBanners.length > 1 && (
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
              {activeBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === activeSlide ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* 2. FIVE CATEGORY DISCOVERY ROWS (SOW SECTION 5.1 & 5.B, 5.C, 5.D, 5.E, 5.F, 5.G) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059] flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Curated Lifestyle Worlds</span>
          </p>
          <h2 className="font-serif-title text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B241C]">
            Explore Our Five Categories
          </h2>
          <p className="text-sm text-[#2C4A3E]">
            Each category opens into its own dedicated landing page with focused subcategories, collections, and artisanal products.
          </p>
        </div>

        {/* Dynamic Category Blocks */}
        <div className="space-y-16">
          {categories.map((cat, idx) => {
            const catProducts = products
              .filter((p) => p.categorySlug === cat.slug)
              .slice(0, 4);

            return (
              <div
                key={cat.id}
                className="bg-white rounded-3xl border border-[#E2DBD0] p-6 sm:p-8 lg:p-10 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left: Category Visual & Intro */}
                  <div className="lg:col-span-4 space-y-5">
                    <div className="flex items-center gap-3">
                      <span className="font-serif-title text-2xl font-bold text-[#C5A059]">
                        0{idx + 1}.
                      </span>
                      <h3 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
                        {cat.title}
                      </h3>
                    </div>

                    <Link 
                      href={`/category/${cat.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[4/3] rounded-2xl overflow-hidden bg-[#EBF3EF] group"
                    >
                      <img
                        src={cat.bannerImage || cat.heroImage}
                        alt={cat.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#08281F]/80 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <p className="text-xs text-[#FAF8F5]/90 line-clamp-2">{cat.subtitle}</p>
                        <span className="text-[11px] text-[#D4AF37] font-bold uppercase tracking-wider mt-1 inline-flex items-center gap-1 group-hover:underline">
                          <span>Open {cat.title.split('&')[0].trim()} Flagship Site ↗</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>

                    <Link
                      href={`/category/${cat.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0C3B2E] hover:bg-[#164E3D] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md hover:scale-105"
                    >
                      <span>Explore Complete {cat.title.split('&')[0].trim()} ↗</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                    </Link>
                  </div>

                  {/* Right: Quick-Shop Subcategories + Featured Products */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Quick-Shop Subcategories (SOW 5.C-5.G) */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#5A7469]">
                          Quick Shop Subcategories (Click to Open in New Tab)
                        </p>
                        <Link
                          href={`/category/${cat.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#0C3B2E] hover:text-[#C5A059] flex items-center gap-1"
                        >
                          <span>Explore All ({cat.subcategories.length - 1}) ↗</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      {/* Circular Subcategory Cards with Direct Subcategory Links */}
                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                        {((cat.subcatImages && cat.subcatImages.length > 0)
                          ? cat.subcatImages
                          : (cat.subcategories || []).filter((s) => s !== 'All').map((s) => ({ name: s, image: cat.bannerImage || cat.heroImage }))
                        ).slice(0, 6).map((sub) => (
                          <Link
                            key={sub.name}
                            href={`/category/${cat.slug}?sub=${encodeURIComponent(sub.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 shrink-0 group"
                            title={`Shop ${sub.name} in new tab`}
                          >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#E2DBD0] p-0.5 group-hover:border-[#0C3B2E] group-hover:shadow-md transition-all bg-[#EBF3EF] shadow-xs">
                              <img
                                src={sub.image}
                                alt={sub.name}
                                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-[#2C4A3E] group-hover:text-[#0C3B2E] text-center max-w-[84px] truncate">
                              {sub.name}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Featured Mini Product Grid */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#5A7469] mb-3">
                        Featured in {cat.title}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                        {catProducts.map((prod) => (
                          <ProductCard key={prod.id} product={prod} compact />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. TRUST REASSURANCE BAR */}
      <section className="bg-white border-y border-[#E2DBD0] py-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  Personal Concierge
                </h4>
                <p className="text-xs text-[#2C4A3E]">Daily customer support care@purnya.in</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NEW ARRIVALS HORIZONTAL CAROUSEL (SOW 5.H) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
              Fresh Releases
            </span>
            <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C] mt-1">
              New Arrivals
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={scrollLeft}
              className="w-10 h-10 rounded-full border border-[#E2DBD0] hover:border-[#0C3B2E] hover:bg-white flex items-center justify-center text-[#0B241C] transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRight}
              className="w-10 h-10 rounded-full border border-[#E2DBD0] hover:border-[#0C3B2E] hover:bg-white flex items-center justify-center text-[#0B241C] transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory"
        >
          {newArrivals.map((prod) => (
            <div key={prod.id} className="w-[240px] sm:w-[280px] shrink-0 snap-start">
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </section>

      {/* 5. EDITORIAL BRAND STORY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-[#0C3B2E] text-[#FAF8F5] p-8 sm:p-14 lg:p-20 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-[#D4AF37] text-xs font-semibold tracking-widest uppercase border border-[#D4AF37]/30">
                <Sparkles className="w-3.5 h-3.5" />
                The Purnya Philosophy
              </div>
              <h2 className="font-serif-title text-3xl sm:text-5xl font-bold leading-tight">
                Crafted for Mindful Living.
              </h2>
              <p className="text-sm sm:text-base text-[#B4C9BF] leading-relaxed">
                At Purnya, we unite conscious nature with elevated luxury. From clean sand wax candles
                to fine 18K gold-plated jewellery, each creation in our five worlds is created to bring
                tranquility, beauty, and heartfelt joy to your daily rituals.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="font-serif-title text-2xl font-bold text-[#D4AF37]">100%</p>
                  <p className="text-xs text-[#B4C9BF] mt-1">Conscious Artisanal Materials</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="font-serif-title text-2xl font-bold text-[#D4AF37]">5 Worlds</p>
                  <p className="text-xs text-[#B4C9BF] mt-1">One Unified Lifestyle</p>
                </div>
              </div>
              <div>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-[#08281F] font-bold text-xs uppercase tracking-widest transition-all shadow-lg hover:scale-105"
                >
                  <span>Read Our Full Story</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/15">
              <img
                src="https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=1000&fit=crop&auto=format"
                alt="Purnya Lifestyle"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. BEST SELLERS CURATED SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
            Customer Favorites
          </span>
          <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C]">
            Best Selling Icons
          </h2>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            The most cherished creations loved by over 10,000+ patrons across India.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {bestSellers.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* 7. AUTHENTIC PURNYA CRAFTSMANSHIP STANDARDS */}
      <section className="bg-[#EBF3EF]/60 border-y border-[#E2DBD0] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
              The Purnya Standard
            </span>
            <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0B241C]">
              Artisanal Integrity in Every Creation
            </h2>
            <p className="text-xs sm:text-sm text-[#2C4A3E]">
              From conscious sourcing to anti-tarnish protective sealing, our commitment to mindful luxury is uncompromising.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-2xl border border-[#E2DBD0] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] font-serif-title font-bold text-lg">
                18K
              </div>
              <h3 className="font-serif-title text-base font-bold text-[#0B241C]">
                Gold Vermeil &amp; Anti-Tarnish Sealing
              </h3>
              <p className="text-xs text-[#2C4A3E] leading-relaxed">
                Handcrafted jewellery plated with genuine 18-karat gold over hypoallergenic brass and finished with proprietary nano-ceramic sealing.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-[#E2DBD0] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] font-serif-title font-bold text-lg">
                100%
              </div>
              <h3 className="font-serif-title text-base font-bold text-[#0B241C]">
                Clean Natural Sand Wax Formulations
              </h3>
              <p className="text-xs text-[#2C4A3E] leading-relaxed">
                Granulated plant-based sand and pearl wax that burns soot-free with pure cotton wicks and distilled aromatic botanicals.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-[#E2DBD0] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] font-serif-title font-bold text-lg">
                Origin
              </div>
              <h3 className="font-serif-title text-base font-bold text-[#0B241C]">
                Direct Single-Origin Ethical Sourcing
              </h3>
              <p className="text-xs text-[#2C4A3E] leading-relaxed">
                Herbal wellness infusions and handcrafted stoneware produced in ethical artisan cooperatives with traceable, conscious materials.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
