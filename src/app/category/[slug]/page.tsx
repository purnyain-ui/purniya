'use client';

import React, { useState, useMemo, use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  ChevronRight,

  Filter,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  ArrowUpRight,
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

  // Category bespoke craftsmanship details
  const craftsmanshipData: Record<
    string,
    { headline: string; desc: string; highlights: string[]; image: string }
  > = {
    apparel: {
      headline: 'Artisanal Metallurgy & Anti-Tarnish Elegance',
      desc: 'Every piece of Purnya Jewellery is cast from premium hypoallergenic alloys, finished with lustrous 18K micro-gold plating and sealed with an invisible protective nano-ceramic barrier to guard against moisture, perfume, and daily wear.',
      highlights: [
        'Skin-Safe Hypoallergenic & Nickel Free',
        'Anti-Tarnish Protective Ceramic Seal',
        'Ethically Sourced Genuine Freshwater Pearls',
        'Hand-Set AAA Cubic Zirconia & Gemstones',
      ],
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&fit=crop&auto=format',
    },
    jewellery: {
      headline: 'Artisanal Metallurgy & Anti-Tarnish Elegance',
      desc: 'Every piece of Purnya Jewellery is cast from premium hypoallergenic alloys, finished with lustrous 18K micro-gold plating and sealed with an invisible protective nano-ceramic barrier to guard against moisture, perfume, and daily wear.',
      highlights: [
        'Skin-Safe Hypoallergenic & Nickel Free',
        'Anti-Tarnish Protective Ceramic Seal',
        'Ethically Sourced Genuine Freshwater Pearls',
        'Hand-Set AAA Cubic Zirconia & Gemstones',
      ],
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&fit=crop&auto=format',
    },
    fragrance: {
      headline: 'Clean Sand Wax & Botanical Aromatic Architecture',
      desc: 'Purnya Home Fragrances transform spaces into tranquil sanctuaries. Crafted using granulated sand wax and pure essential botanical extracts, our candles offer clean burns, zero paraffin soot, and refillable vessel longevity.',
      highlights: [
        '100% Natural Biodegradable Sand Wax',
        'Lead-Free Organic Braided Cotton Wicks',
        'Paraben & Phthalate-Free IFRA Essential Oils',
        'Infinite Refill Concept with Minimal Waste',
      ],
      image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&fit=crop&auto=format',
    },
    candles: {
      headline: 'Clean Sand Wax & Botanical Aromatic Architecture',
      desc: 'Purnya Home Fragrances transform spaces into tranquil sanctuaries. Crafted using granulated sand wax and pure essential botanical extracts, our candles offer clean burns, zero paraffin soot, and refillable vessel longevity.',
      highlights: [
        '100% Natural Biodegradable Sand Wax',
        'Lead-Free Organic Braided Cotton Wicks',
        'Paraben & Phthalate-Free IFRA Essential Oils',
        'Infinite Refill Concept with Minimal Waste',
      ],
      image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&fit=crop&auto=format',
    },
    lifestyle: {
      headline: 'Sculptural Stoneware & Curated Sanctuary Accents',
      desc: 'From hand-thrown ceramic vases to organic travertine pedestals, our Home Décor collection bridges timeless Mediterranean architecture with modern Indian minimalism to elevate every corner of your home.',
      highlights: [
        'Hand-Thrown High-Fire Earthenware',
        'Matte Textured Natural Glaze Finishes',
        'Versatile Form Language for Modern Spaces',
        'Durable Weight & Tactile Craftsmanship',
      ],
      image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&fit=crop&auto=format',
    },
    'home-decor': {
      headline: 'Sculptural Stoneware & Curated Sanctuary Accents',
      desc: 'From hand-thrown ceramic vases to organic travertine pedestals, our Home Décor collection bridges timeless Mediterranean architecture with modern Indian minimalism to elevate every corner of your home.',
      highlights: [
        'Hand-Thrown High-Fire Earthenware',
        'Matte Textured Natural Glaze Finishes',
        'Versatile Form Language for Modern Spaces',
        'Durable Weight & Tactile Craftsmanship',
      ],
      image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&fit=crop&auto=format',
    },
    wellness: {
      headline: 'Pure Ayurvedic Botanicals & Farm-To-Cup Vitality',
      desc: 'Purnya Organic & Wellness sources directly from indigenous family estates in the Himalayas, Western Ghats, and Kashmir. Clean, pesticide-free superfoods, single-origin raw honeys, and solar-dried herbal infusions.',
      highlights: [
        'Single-Origin Pure Grade Botanicals',
        'Zero Added Preservatives, Colors, or Sugars',
        'Slow Solar Dehydration Retaining 98% Nutrients',
        'Third-Party Lab Tested for Absolute Purity',
      ],
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&fit=crop&auto=format',
    },
    gift: {
      headline: 'Bespoke Keepsakes & Celebratory Gift Hampers',
      desc: 'Celebrate milestones, festive seasons, and corporate milestones with Purnya’s signature gift boxes. Handcrafted artisanal boxes lined in rich textures, sealed with wax crests and curated with multi-category luxury items.',
      highlights: [
        'Custom Foil Stamping & Handwritten Calligraphy',
        'Luxury Satin & Textured Hardboard Presentation',
        'Curated Across All Purnya Lifestyle Categories',
        'Dedicated Corporate & Return Gifting Concierge',
      ],
      image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&fit=crop&auto=format',
    },
    gifts: {
      headline: 'Bespoke Keepsakes & Celebratory Gift Hampers',
      desc: 'Celebrate milestones, festive seasons, and corporate milestones with Purnya’s signature gift boxes. Handcrafted artisanal boxes lined in rich textures, sealed with wax crests and curated with multi-category luxury items.',
      highlights: [
        'Custom Foil Stamping & Handwritten Calligraphy',
        'Luxury Satin & Textured Hardboard Presentation',
        'Curated Across All Purnya Lifestyle Categories',
        'Dedicated Corporate & Return Gifting Concierge',
      ],
      image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&fit=crop&auto=format',
    },
  };

  const normalizedSlug = decodeURIComponent(slug).trim().toLowerCase();
  const currentCatSlug = (currentCategory?.slug || '').trim().toLowerCase();
  const matchedStory = craftsmanshipData[normalizedSlug] || craftsmanshipData[currentCatSlug];

  const categoryFallbackImage =
    currentCategory?.bannerImage ||
    currentCategory?.heroImage ||
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&fit=crop&auto=format';

  const story = {
    headline: matchedStory?.headline || `${currentCategory?.title || 'Artisanal'} Craftsmanship & Heritage`,
    desc: matchedStory?.desc || currentCategory?.subtitle || 'Every piece is crafted with utmost care, premium materials, and meticulous attention to detail.',
    highlights: matchedStory?.highlights || [
      'Ethically Sourced & Artisanal Quality',
      '100% Quality & Authenticity Guarantee',
      'Direct Pan-India Express Delivery',
      'Dedicated Concierge Customer Support',
    ],
    image: matchedStory?.image || categoryFallbackImage,
  };

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
      <section className="relative w-full min-h-[400px] sm:min-h-[460px] lg:min-h-[500px] bg-[#08281F] overflow-hidden flex items-center">
        <img
          src={currentCategory.heroImage || currentCategory.bannerImage}
          alt={currentCategory.title}
          className="w-full h-full object-cover object-center absolute inset-0 opacity-45 scale-105 transition-transform duration-7000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08281F]/95 via-[#0C3B2E]/70 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08281F] via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
          {/* Top Breadcrumb & Badge */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#FAF8F5]/80 hover:text-[#D4AF37] uppercase tracking-widest flex items-center gap-1 font-semibold"
            >
              <span>Main Purnya Portal</span>
              <span className="text-[10px]">↗</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="text-xs text-[#D4AF37] uppercase tracking-widest font-bold">
              {currentCategory.title} Flagship
            </span>
          </div>

          <div className="max-w-2xl space-y-4 sm:space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] border border-[#D4AF37]/30 shadow-sm">

              <span>Official Flagship Storefront</span>
            </div>

            <h1 className="font-serif-title text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.08]">
              {currentCategory.title}
            </h1>

            <p className="text-sm sm:text-lg text-[#E8F0EC]/90 leading-relaxed font-normal max-w-xl">
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

      {/* 2. CIRCULAR SUB-CATEGORY QUICK-SHOP CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-[#E2DBD0] p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFEBE3] pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                Browse by Subcategory
              </p>
              <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-[#0B241C]">
                Explore {currentCategory.title}
              </h2>
            </div>
            {selectedSubcategory !== 'All' && (
              <button
                onClick={() => setSelectedSubcategory('All')}
                className="text-xs font-semibold text-[#0C3B2E] hover:underline"
              >
                Clear Subcategory Filter ({selectedSubcategory}) ✕
              </button>
            )}
          </div>

          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none">
            {/* "All" Circular Button */}
            <button
              onClick={() => setSelectedSubcategory('All')}
              className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
            >
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 p-0.5 transition-all bg-[#EBF3EF] shadow-xs ${
                  selectedSubcategory === 'All'
                    ? 'border-[#0C3B2E] shadow-md scale-105 ring-2 ring-[#C5A059]'
                    : 'border-[#E2DBD0] group-hover:border-[#0C3B2E]'
                }`}
              >
                <img
                  src={currentCategory.bannerImage || currentCategory.heroImage}
                  alt="All Pieces"
                  className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span
                className={`text-[11px] font-semibold text-center max-w-[88px] truncate transition-colors ${
                  selectedSubcategory === 'All'
                    ? 'text-[#0C3B2E] font-bold'
                    : 'text-[#2C4A3E] group-hover:text-[#0C3B2E]'
                }`}
              >
                All Pieces
              </span>
            </button>

            {/* Individual Subcategories with Photos */}
            {((currentCategory?.subcatImages && currentCategory.subcatImages.length > 0)
              ? currentCategory.subcatImages
              : (currentCategory?.subcategories || []).filter((s) => s !== 'All').map((s) => ({
                  name: s,
                  image: currentCategory?.bannerImage || currentCategory?.heroImage || '',
                }))
            ).map((sub) => {
              const isSelected = selectedSubcategory === sub.name;
              return (
                <button
                  key={sub.name}
                  onClick={() => setSelectedSubcategory(sub.name)}
                  className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
                >
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 p-0.5 transition-all bg-[#EBF3EF] shadow-xs ${
                      isSelected
                        ? 'border-[#0C3B2E] shadow-md scale-105 ring-2 ring-[#C5A059]'
                        : 'border-[#E2DBD0] group-hover:border-[#0C3B2E]'
                    }`}
                  >
                    <img
                      src={sub.image}
                      alt={sub.name}
                      className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span
                    className={`text-[11px] font-semibold text-center max-w-[88px] truncate transition-colors ${
                      isSelected ? 'text-[#0C3B2E] font-bold' : 'text-[#2C4A3E] group-hover:text-[#0C3B2E]'
                    }`}
                  >
                    {sub.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. MAIN PRODUCT CATALOG WITH FILTERS & SORT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
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

      {/* 5. CRAFTSMANSHIP & STORY SECTION (Unique to this Category Website) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#08281F] rounded-3xl overflow-hidden border border-[#144234] text-white shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#D4AF37] text-xs font-bold uppercase tracking-widest border border-[#D4AF37]/30">

                <span>The Purnya Standard</span>
              </div>

              <h3 className="font-serif-title text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                {story.headline}
              </h3>

              <p className="text-sm sm:text-base text-[#B4C9BF] leading-relaxed">
                {story.desc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {story.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-[#FAF8F5]">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <button
                  onClick={() => {
                    setSelectedSubcategory('All');
                    window.scrollTo({ top: 600, behavior: 'smooth' });
                  }}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#C5A059] text-[#08281F] font-bold text-xs uppercase tracking-wider shadow-lg transition-transform hover:scale-105 cursor-pointer"
                >
                  Shop Complete Catalog
                </button>
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider backdrop-blur-md border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <span>Explore Other 4 Worlds ↗</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 h-72 sm:h-96 lg:h-full relative overflow-hidden bg-[#0C3B2E] min-h-[320px]">
              <img
                src={story.image}
                alt={story.headline}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== categoryFallbackImage) {
                    target.src = categoryFallbackImage;
                  }
                }}
                className="w-full h-full object-cover opacity-90 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-[#08281F] via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* 6. EXPLORE OTHER PURNYA FLAGSHIP BOUTIQUES (Each opens in a new tab as an independent website) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2 border-b border-[#E2DBD0] pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
              Purnya Lifestyle Ecosystem
            </span>
            <h3 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C] mt-1">
              Explore Our Other Flagship Boutiques
            </h3>
            <p className="text-xs text-[#2C4A3E] mt-1">
              Each boutique functions as its own dedicated website with specialized collections.
            </p>
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF8F5] hover:bg-[#EBF3EF] border border-[#C5A059]/40 text-[#0C3B2E] text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
          >
            <span>Visit Main Portal ↗</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories
            .filter((c) => c.slug !== slug)
            .map((otherCat) => (
              <Link
                key={otherCat.id}
                href={`/category/${otherCat.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-2xl border border-[#E2DBD0] p-4 flex flex-col justify-between hover:shadow-lg hover:border-[#0C3B2E] transition-all"
              >
                <div className="space-y-3">
                  <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[#EBF3EF] relative">
                    <img
                      src={otherCat.bannerImage || otherCat.heroImage}
                      alt={otherCat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-[#08281F]/85 backdrop-blur-xs text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider">
                      Flagship Site ↗
                    </div>
                  </div>
                  <div>
                    <h4 className="font-serif-title text-base font-bold text-[#0B241C] group-hover:text-[#0C3B2E] transition-colors">
                      {otherCat.title}
                    </h4>
                    <p className="text-xs text-[#5A7469] line-clamp-2 mt-1">
                      {otherCat.subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-[#F0ECE4] flex items-center justify-between text-xs font-semibold text-[#0C3B2E]">
                  <span>Launch Flagship Website</span>
                  <ArrowUpRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* 7. TRUST REASSURANCE BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-[#E2DBD0] p-6 sm:p-10 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] shrink-0 shadow-inner">
                <Truck className="w-6 h-6 text-[#0C3B2E]" />
              </div>
              <div>
                <h4 className="font-serif-title text-sm sm:text-base font-bold text-[#0B241C]">
                  Free Express Shipping
                </h4>
                <p className="text-xs text-[#2C4A3E]">Pan-India orders above ₹999</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] shrink-0 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-[#0C3B2E]" />
              </div>
              <div>
                <h4 className="font-serif-title text-sm sm:text-base font-bold text-[#0B241C]">
                  Authenticity Verified
                </h4>
                <p className="text-xs text-[#2C4A3E]">Hallmarked &amp; pure quality</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] shrink-0 shadow-inner">
                <RotateCcw className="w-6 h-6 text-[#0C3B2E]" />
              </div>
              <div>
                <h4 className="font-serif-title text-sm sm:text-base font-bold text-[#0B241C]">
                  7-Day Easy Returns
                </h4>
                <p className="text-xs text-[#2C4A3E]">Hassle-free doorstep exchange</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF3EF] flex items-center justify-center text-[#0C3B2E] shrink-0 shadow-inner">
                <Headphones className="w-6 h-6 text-[#0C3B2E]" />
              </div>
              <div>
                <h4 className="font-serif-title text-sm sm:text-base font-bold text-[#0B241C]">
                  Concierge Care
                </h4>
                <p className="text-xs text-[#2C4A3E]">Direct WhatsApp &amp; Call Support</p>
              </div>
            </div>
          </div>
        </div>
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

