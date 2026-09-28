'use client';

import React, { useState, useMemo, use, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
  Package,
  X,
  Sparkles,
  IndianRupee,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import ProductCard from '../../../components/ProductCard';

const PRICE_RANGES = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under ₹99', value: 'under99' },
  { label: 'Under ₹499', value: 'under499' },
  { label: 'Under ₹999', value: 'under999' },
  { label: 'Above ₹1,000', value: 'above1000' },
];

type SectionKey = 'type' | 'price' | 'collections' | 'gender';

// Reads ?price=under99 / ?sub=Necklaces / ?tag=New%20Arrivals / ?featured=1 / ?gender=men from the URL
function readPrice(sp: URLSearchParams | null) {
  const p = sp?.get('price');
  return p && PRICE_RANGES.some((r) => r.value === p) ? p : 'all';
}

function readFeatured(sp: URLSearchParams | null) {
  const f = sp?.get('featured');
  return f === '1' || f === 'true';
}

function readGender(sp: URLSearchParams | null) {
  const g = sp?.get('gender');
  return g && ['men', 'women', 'unisex'].includes(g.toLowerCase()) ? g.toLowerCase() : 'all';
}

function AllProductsContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const { categories, products } = useStore();

  const [sortBy, setSortBy] = useState<string>('featured');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    () => searchParams?.get('sub') || 'All'
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>(() =>
    readPrice(searchParams)
  );
  const [selectedLifestyleTag, setSelectedLifestyleTag] = useState<string>(
    () => searchParams?.get('tag') || 'all'
  );
  const [selectedFeatured, setSelectedFeatured] = useState<boolean>(() =>
    readFeatured(searchParams)
  );
  const [selectedGender, setSelectedGender] = useState<string>(() =>
    readGender(searchParams)
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Re-apply filters whenever the URL query changes (e.g. clicking "Under ₹499" again)
  useEffect(() => {
    setSelectedPriceRange(readPrice(searchParams));
    setSelectedSubcategory(searchParams?.get('sub') || 'All');
    setSelectedLifestyleTag(searchParams?.get('tag') || 'all');
    setSelectedFeatured(readFeatured(searchParams));
    setSelectedGender(readGender(searchParams));
  }, [searchParams]);

  // Collapsible filter sections (true = expanded)
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    type: true,
    price: true,
    collections: true,
    gender: true,
  });
  const toggleSection = (key: SectionKey) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Lock page scroll while the mobile bottom sheet is open
  useEffect(() => {
    if (showMobileFilters) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [showMobileFilters]);

  // Find the current category
  const currentCategory = useMemo(() => {
    const decodedSlug = decodeURIComponent(slug).trim().toLowerCase();
    return (
      categories.find((c) => (c.slug || '').trim().toLowerCase() === decodedSlug) ||
      null
    );
  }, [categories, slug]);

  const isGenderApplicable = useMemo(() => {
    const targetSlug = decodeURIComponent(slug).trim().toLowerCase();
    if (targetSlug === 'apparel') return true;
    if (currentCategory) {
      const catSlug = (currentCategory.slug || '').trim().toLowerCase();
      const catTitle = (currentCategory.title || '').trim().toLowerCase();
      if (catSlug === 'apparel' || catTitle.includes('jewel') || catTitle.includes('accessories')) {
        return true;
      }
    }
    return false;
  }, [slug, currentCategory]);

  // Get all active products for this category
  const categoryProducts = useMemo(() => {
    const targetSlug = decodeURIComponent(slug).trim().toLowerCase();
    return products.filter((p) => {
      const isActive = (p.is_active !== undefined ? p.is_active : p.status === 'Active') && p.status !== 'Inactive';
      if (!isActive) return false;
      const pSlug = (p.categorySlug || '').trim().toLowerCase();
      const matchesSlug = pSlug === targetSlug;
      const matchesTitle =
        Boolean(currentCategory &&
        p.category?.trim().toLowerCase() === currentCategory.title?.trim().toLowerCase());
      return matchesSlug || matchesTitle;
    });
  }, [products, slug, currentCategory]);

  // Get unique subcategories
  const subcategories = useMemo(() => {
    const subs = new Set<string>();
    categoryProducts.forEach((p) => {
      if (p.subcategory) subs.add(p.subcategory);
    });
    return ['All', ...Array.from(subs).sort()];
  }, [categoryProducts]);

  // Get unique lifestyle tags (Collections & Highlights)
  const lifestyleTags = useMemo(() => {
    const tags = new Set<string>();
    categoryProducts.forEach((p: any) => {
      const tag = (p.lifestyleTag || p.lifestyleTagName || '').trim();
      if (tag) tags.add(tag);
    });
    return Array.from(tags).sort();
  }, [categoryProducts]);

  const hasFeatured = useMemo(
    () => categoryProducts.some((p: any) => p.featured === true),
    [categoryProducts]
  );

  // Apply all filters and sorting
  const displayProducts = useMemo(() => {
    let filtered = categoryProducts;

    if (selectedSubcategory !== 'All') {
      filtered = filtered.filter((p) => p.subcategory === selectedSubcategory);
    }

    if (selectedPriceRange !== 'all') {
      filtered = filtered.filter((p) => {
        switch (selectedPriceRange) {
          case 'under99': return p.price < 99;
          case 'under499': return p.price < 499;
          case 'under999': return p.price < 999;
          case 'above1000': return p.price > 1000;
          default: return true;
        }
      });
    }

    if (selectedLifestyleTag !== 'all') {
      filtered = filtered.filter((p: any) => {
        const tag = (p.lifestyleTag || p.lifestyleTagName || '').trim();
        return tag === selectedLifestyleTag;
      });
    }

    if (selectedFeatured) {
      filtered = filtered.filter((p: any) => p.featured === true);
    }

    if (isGenderApplicable && selectedGender !== 'all') {
      filtered = filtered.filter((p: any) => {
        const rawG = p.targetGender ?? p.target_gender ?? p.gender;
        if (!rawG || rawG === 'none') return false;
        const g = String(rawG).toLowerCase();
        if (selectedGender === 'men') return g === 'men' || g === 'unisex';
        if (selectedGender === 'women') return g === 'women' || g === 'unisex';
        if (selectedGender === 'unisex') return g === 'unisex';
        return true;
      });
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'priceLow') return a.price - b.price;
      if (sortBy === 'priceHigh') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'newest') {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      }
      return 0;
    });
  }, [categoryProducts, selectedSubcategory, selectedPriceRange, selectedLifestyleTag, selectedFeatured, isGenderApplicable, selectedGender, sortBy]);

  const activeFilterCount = [
    selectedSubcategory !== 'All',
    selectedPriceRange !== 'all',
    selectedLifestyleTag !== 'all',
    selectedFeatured,
    isGenderApplicable && selectedGender !== 'all',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedSubcategory('All');
    setSelectedPriceRange('all');
    setSelectedLifestyleTag('all');
    setSelectedFeatured(false);
    setSelectedGender('all');
  };

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 text-[#B4C9BF] mx-auto" />
          <h1 className="font-serif-title text-2xl text-[#0B241C]">Category Not Found</h1>
          <p className="text-sm text-[#6B7F78]">The category you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-2.5 bg-[#0B241C] text-[#FAF8F5] rounded-lg text-sm font-medium hover:bg-[#144234] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const optionClass = (active: boolean) =>
    `text-left text-xs px-3 py-1.5 rounded-lg transition-all ${active
      ? 'bg-[#0B241C] text-[#FAF8F5] font-semibold shadow-sm'
      : 'text-[#6B7F78] hover:bg-[#E8E2D9]/60 hover:text-[#0B241C]'
    }`;

  // Collapsible section: heading with ">" that rotates downward when open
  const renderSection = (
    key: SectionKey,
    title: string,
    icon: React.ReactNode,
    content: React.ReactNode,
    isMobile: boolean
  ) => {
    const open = openSections[key];
    return (
      <div className="border-b border-[#E8E2D9] last:border-b-0 py-3">
        <button
          type="button"
          onClick={() => toggleSection(key)}
          aria-expanded={open}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#0B241C]"
        >
          <span className="flex items-center gap-1.5">
            {icon}
            {title}
          </span>
          <ChevronRight
            className={`w-4 h-4 text-[#6B7F78] transition-transform duration-200 ${open ? 'rotate-90' : ''
              }`}
          />
        </button>
        {open && (
          <div className={`flex ${isMobile ? 'flex-wrap' : 'flex-col'} gap-1.5 mt-3`}>
            {content}
          </div>
        )}
      </div>
    );
  };

  // Called as a function (not <Component/>) so it doesn't remount on every render
  const renderFilters = (isMobile = false) => (
    <div>
      {/* Product Type */}
      {subcategories.length > 1 &&
        renderSection(
          'type',
          'Product Type',
          <LayoutGrid className="w-3.5 h-3.5 text-[#D4AF37]" />,
          subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubcategory(sub)}
              className={optionClass(selectedSubcategory === sub)}
            >
              {sub}
            </button>
          )),
          isMobile
        )}

      {/* Price Range */}
      {renderSection(
        'price',
        'Price Range',
        <IndianRupee className="w-3.5 h-3.5 text-[#D4AF37]" />,
        PRICE_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => setSelectedPriceRange(range.value)}
            className={optionClass(selectedPriceRange === range.value)}
          >
            {range.label}
          </button>
        )),
        isMobile
      )}

      {/* Collections & Highlights */}
      {(lifestyleTags.length > 0 || hasFeatured) &&
        renderSection(
          'collections',
          'Collections & Highlights',
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />,
          <>
            <button
              onClick={() => setSelectedLifestyleTag('all')}
              className={optionClass(selectedLifestyleTag === 'all')}
            >
              All Collections
            </button>
            {lifestyleTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedLifestyleTag(tag)}
                className={optionClass(selectedLifestyleTag === tag)}
              >
                {tag}
              </button>
            ))}
            {hasFeatured && (
              <button
                onClick={() => setSelectedFeatured((v) => !v)}
                className={optionClass(selectedFeatured)}
              >
                Featured Collections
              </button>
            )}
          </>,
          isMobile
        )}

      {/* Target Gender - Only shown for Jewellery & Accessories */}
      {isGenderApplicable &&
        renderSection(
          'gender',
          'Target Gender',
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />,
          [
            { label: 'All Gender', value: 'all' },
            { label: 'Men', value: 'men' },
            { label: 'Women', value: 'women' },
            { label: 'Unisex', value: 'unisex' },
          ].map((g) => (
            <button
              key={g.value}
              onClick={() => setSelectedGender(g.value)}
              className={optionClass(selectedGender === g.value)}
            >
              {g.label}
            </button>
          )),
          isMobile
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Bottom-sheet animation */}
      <style>{`
        @keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-[#08281F]">
        {currentCategory.bannerImage && (
          <div className="absolute inset-0">
            <img
              src={currentCategory.bannerImage}
              alt={currentCategory.title}
              className="w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08281F] via-[#08281F]/90 to-[#08281F]/70" />
          </div>
        )}

        <div className="relative max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <nav className="flex items-center gap-1.5 text-xs text-[#B4C9BF] mb-5">
            <Link href="/" className="hover:text-[#D4AF37] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/category/${currentCategory.slug}`}
              className="hover:text-[#D4AF37] transition-colors"
            >
              {currentCategory.title}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#D4AF37]">All Products</span>
          </nav>

          <h1 className="font-serif-title text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-wide">
            All {currentCategory.title}
          </h1>
          <p className="text-sm sm:text-base text-[#B4C9BF] mt-3 max-w-2xl">
            {currentCategory.subtitle || `Explore our complete collection of ${currentCategory.title.toLowerCase()}.`}
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#D4AF37] text-xs font-semibold border border-[#D4AF37]/30">
              <Package className="w-3.5 h-3.5" />
              {categoryProducts.length} {categoryProducts.length === 1 ? 'Product' : 'Products'}
            </span>
          </div>

        </div>
      </div>

      {/* Sort Bar */}
      <div className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E2D9]">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Active filter tags (desktop) */}
            <div className="hidden lg:flex items-center gap-2 overflow-x-auto flex-1">
              {activeFilterCount > 0 && (
                <>
                  {selectedSubcategory !== 'All' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0B241C]/10 text-[#0B241C] text-xs">
                      {selectedSubcategory}
                      <button onClick={() => setSelectedSubcategory('All')} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedPriceRange !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0B241C]/10 text-[#0B241C] text-xs">
                      {PRICE_RANGES.find((r) => r.value === selectedPriceRange)?.label}
                      <button onClick={() => setSelectedPriceRange('all')} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedLifestyleTag !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0B241C]/10 text-[#0B241C] text-xs">
                      {selectedLifestyleTag}
                      <button onClick={() => setSelectedLifestyleTag('all')} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {selectedFeatured && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0B241C]/10 text-[#0B241C] text-xs">
                      Featured Collections
                      <button onClick={() => setSelectedFeatured(false)} className="hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-[#D4AF37] hover:text-[#0B241C] font-medium transition-colors"
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-transparent border border-[#E8E2D9] rounded-lg px-3 py-1.5 text-[#0B241C] focus:outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: floating Filters button fixed at the bottom */}
      {!showMobileFilters && (
        <button
          onClick={() => setShowMobileFilters(true)}
          className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-6 py-3 rounded-full bg-[#0B241C] text-[#FAF8F5] text-sm font-semibold shadow-xl border border-[#D4AF37]/40 active:scale-95 transition-transform"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#D4AF37] text-[#0B241C] text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      )}

      {/* Mobile: bottom sheet (opens from the bottom) */}
      {showMobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            style={{ animation: 'fadeIn 0.2s ease-out' }}
            onClick={() => setShowMobileFilters(false)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[85vh] flex flex-col bg-[#FAF8F5] rounded-t-2xl shadow-2xl"
            style={{ animation: 'sheetUp 0.3s ease-out' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5">
              <span className="w-10 h-1 rounded-full bg-[#E8E2D9]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8E2D9]">
              <h3 className="font-serif-title text-lg font-semibold text-[#0B241C]">Filters</h3>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="text-xs text-[#D4AF37] font-medium">
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E8E2D9]/60 hover:bg-[#E8E2D9] transition-colors"
                >
                  <X className="w-4 h-4 text-[#0B241C]" />
                </button>
              </div>
            </div>

            {/* Scrollable filters */}
            <div className="flex-1 overflow-y-auto px-5 py-2">{renderFilters(true)}</div>

            {/* Footer */}
            <div className="border-t border-[#E8E2D9] p-4">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-2.5 bg-[#0B241C] text-[#FAF8F5] rounded-lg text-sm font-semibold hover:bg-[#144234] transition-colors"
              >
                Show {displayProducts.length} Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Sidebar + Grid */}
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 pb-24 lg:pb-12">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-16">{renderFilters(false)}</div>
          </aside>

          {/* Products Area */}
          <div className="flex-1 min-w-0">
            {displayProducts.length > 0 ? (
              <>
                <p className="text-xs text-[#6B7F78] mb-6">
                  Showing {displayProducts.length} of {categoryProducts.length} products
                  {selectedSubcategory !== 'All' && (
                    <span className="text-[#D4AF37]"> in {selectedSubcategory}</span>
                  )}
                  {selectedLifestyleTag !== 'all' && (
                    <span className="text-[#D4AF37]"> · {selectedLifestyleTag}</span>
                  )}
                  {selectedPriceRange !== 'all' && (
                    <span className="text-[#D4AF37]"> · {PRICE_RANGES.find((r) => r.value === selectedPriceRange)?.label}</span>
                  )}
                  {selectedFeatured && (
                    <span className="text-[#D4AF37]"> · Featured</span>
                  )}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                  {displayProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20 space-y-4">
                <Package className="w-14 h-14 text-[#B4C9BF] mx-auto" />
                <h2 className="font-serif-title text-xl text-[#0B241C]">No Products Found</h2>
                <p className="text-sm text-[#6B7F78] max-w-md mx-auto">
                  No products match your current filters. Try adjusting your selection.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="inline-block mt-2 px-5 py-2 bg-[#0B241C] text-[#FAF8F5] rounded-lg text-sm font-medium hover:bg-[#144234] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary in the Next.js App Router
export default function AllProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return (
    <Suspense
      fallback={<div className="text-center py-20 text-xs text-[#6B7F78]">Loading products...</div>}
    >
      <AllProductsContent slug={slug} />
    </Suspense>
  );
}