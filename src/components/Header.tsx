'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  X,
  ShieldCheck,
  Truck,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

function HeaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSub = searchParams?.get('sub') || 'All';
  const { announcement, cartCount, wishlistCount, setIsSearchOpen, categories } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [otherBoutiquesOpen, setOtherBoutiquesOpen] = useState(false);

  const isAdminRoute = pathname?.startsWith('/admin');

  // Detect if user is on a dedicated category website
  const isCategoryRoute = pathname?.startsWith('/category/');
  const currentCategorySlug = isCategoryRoute ? pathname.split('/')[2] : null;
  const currentCategory = categories.find((c) => c.slug === currentCategorySlug);

  const mainNavLinks = [
    { name: 'Jewellery & Accessories', href: '/category/jewellery' },
    { name: 'Candle & Home Fragrance', href: '/category/candles' },
    { name: 'Home Décor & Lifestyle', href: '/category/home-decor' },
    { name: 'Organic & Wellness', href: '/category/wellness' },
    { name: 'Gift & Stationery', href: '/category/gifts' },
  ];

  if (isAdminRoute) return null;

  return (
    <>
      {/* Emerald & Gold Announcement Bar */}
      <div className="bg-[#08281F] text-[#FAF8F5] text-[11px] sm:text-xs font-medium py-2.5 px-4 text-center tracking-widest uppercase flex items-center justify-center gap-2 border-b border-[#144234]">
        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] hidden sm:inline" />
        <span className="font-semibold tracking-[0.15em]">
          {currentCategory
            ? `Purnya ${currentCategory.title} · Dedicated Official Boutique | Free Express Shipping > ₹999`
            : announcement}
        </span>
        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] hidden sm:inline" />
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2DBD0] transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-22 flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#0C3B2E] hover:text-[#C5A059] transition-colors"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo with Emblem & Brand Name */}
          <Link
            href={currentCategory ? `/category/${currentCategory.slug}` : '/'}
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
            title={currentCategory ? `${currentCategory.title} Storefront` : 'Purnya Official Store'}
          >
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full overflow-hidden flex items-center justify-center p-0.5 bg-[#FAF8F5] border border-[#C5A059]/40 shadow-xs group-hover:scale-105 transition-transform duration-300">
              <img
                src="/purnya-logo.png"
                alt="Purnya Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <span className="font-serif-title text-2xl sm:text-3xl font-bold tracking-[0.18em] text-[#0C3B2E] group-hover:text-[#164E3D] transition-colors leading-none">
                  PURNYA
                </span>
                {currentCategory && (
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#0C3B2E] text-white">
                    Flagship
                  </span>
                )}
              </div>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.24em] text-[#C5A059] font-bold mt-0.5">
                {currentCategory ? currentCategory.title : 'Life · Lifestyle · You'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs font-semibold tracking-wider uppercase text-[#2C4A3E]">
            {currentCategory ? (
              // Dedicated Category Storefront Navigation (Includes Home + Subcategories)
              <>
                <Link
                  href={`/category/${currentCategory.slug}`}
                  className={`py-2 relative transition-colors duration-200 hover:text-[#0C3B2E] ${
                    pathname === `/category/${currentCategory.slug}` && currentSub === 'All'
                      ? 'text-[#0C3B2E] font-bold'
                      : ''
                  }`}
                >
                  Home
                  {pathname === `/category/${currentCategory.slug}` && currentSub === 'All' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0C3B2E] rounded-full" />
                  )}
                </Link>

                {currentCategory.subcategories
                  .filter((s) => s !== 'All')
                  .slice(0, 5)
                  .map((sub) => {
                    const isSubActive = currentSub === sub;
                    return (
                      <Link
                        key={sub}
                        href={`/category/${currentCategory.slug}?sub=${encodeURIComponent(sub)}`}
                        className={`py-2 relative transition-colors duration-200 hover:text-[#0C3B2E] ${
                          isSubActive ? 'text-[#0C3B2E] font-bold' : ''
                        }`}
                      >
                        {sub}
                        {isSubActive && (
                          <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0C3B2E] rounded-full" />
                        )}
                      </Link>
                    );
                  })}

                {/* Dropdown to open any of the other 4 category websites in a new tab */}
                <div
                  className="relative"
                  onMouseEnter={() => setOtherBoutiquesOpen(true)}
                  onMouseLeave={() => setOtherBoutiquesOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setOtherBoutiquesOpen(!otherBoutiquesOpen)}
                    className="py-2 inline-flex items-center gap-1 transition-colors hover:text-[#0C3B2E] text-xs font-semibold uppercase tracking-wider text-[#2C4A3E] cursor-pointer"
                  >
                    <span>Other Boutiques</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#C5A059]" />
                  </button>

                  {otherBoutiquesOpen && (
                    <div className="absolute left-0 top-full pt-1 w-64 z-50">
                      <div className="bg-white rounded-2xl shadow-xl border border-[#E2DBD0] py-2 overflow-hidden">
                        <div className="px-3.5 py-1.5 border-b border-[#F0ECE4] text-[10px] uppercase tracking-wider text-[#5A7469] font-bold">
                          Open in Separate Tab ↗
                        </div>
                        {categories
                          .filter((c) => c.slug !== currentCategory.slug)
                          .map((otherCat) => (
                            <Link
                              key={otherCat.id}
                              href={`/category/${otherCat.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOtherBoutiquesOpen(false)}
                              className="flex items-center justify-between px-3.5 py-2.5 text-xs text-[#0B241C] hover:bg-[#EBF3EF] hover:text-[#0C3B2E] transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[#C5A059]/40 bg-[#EBF3EF]">
                                  <img
                                    src={otherCat.bannerImage || otherCat.heroImage}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="font-semibold text-[#0B241C]">{otherCat.title}</span>
                              </div>
                              <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A059]" />
                            </Link>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Switcher back to Main Purnya Portal */}
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FAF8F5] hover:bg-[#EBF3EF] border border-[#C5A059]/40 text-[#0C3B2E] text-[11px] font-bold normal-case tracking-normal transition-all shadow-xs"
                  title="Open Main Purnya Worlds Portal in new tab"
                >
                  <span>Main Portal</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </Link>
              </>
            ) : (
              // Main Multi-Category Portal Navigation (Each opens in a new tab like an independent website!)
              mainNavLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`py-2 relative transition-colors duration-200 hover:text-[#0C3B2E] inline-flex items-center gap-1 ${
                      isActive ? 'text-[#0C3B2E] font-bold' : ''
                    }`}
                    title={`Open ${link.name} in a new website tab`}
                  >
                    <span>{link.name}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0C3B2E] rounded-full" />
                    )}
                  </Link>
                );
              })
            )}
          </nav>

          {/* Right Action Icons (Completely shared across all tabs and categories) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 text-[#2C4A3E] hover:text-[#0C3B2E] hover:bg-[#EBF3EF] rounded-full transition-all"
              aria-label="Search"
              title="Search catalog"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Account */}
            <Link
              href="/account"
              className="p-2.5 text-[#2C4A3E] hover:text-[#0C3B2E] hover:bg-[#EBF3EF] rounded-full transition-all"
              aria-label="Customer Account"
              title="My Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Wishlist with Badge */}
            <Link
              href="/wishlist"
              className="p-2.5 text-[#2C4A3E] hover:text-[#0C3B2E] hover:bg-[#EBF3EF] rounded-full transition-all relative"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#C5A059] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart with Badge */}
            <Link
              href="/cart"
              className="p-2.5 text-[#2C4A3E] hover:text-[#0C3B2E] hover:bg-[#EBF3EF] rounded-full transition-all relative"
              aria-label="Cart"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#0C3B2E] text-[#FAF8F5] text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Admin Switch Pill */}
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 ml-2 text-xs font-semibold rounded-full bg-[#EBF3EF] text-[#0C3B2E] hover:bg-[#0C3B2E] hover:text-[#FAF8F5] border border-[#0C3B2E]/20 transition-all"
              title="Centralized Admin Dashboard"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Admin</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[117px] bottom-0 bg-black/40 backdrop-blur-sm z-50">
            <div className="bg-[#FAF8F5] h-full max-w-sm w-full p-6 shadow-2xl border-r border-[#E2DBD0] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <img src="/purnya-logo.png" alt="Purnya" className="w-8 h-8 object-contain" />
                <p className="text-xs font-bold uppercase tracking-widest text-[#0C3B2E]">
                  {currentCategory ? `${currentCategory.title} Store` : 'Shop Five Worlds'}
                </p>
              </div>

              {currentCategory ? (
                <div className="space-y-1">
                  <Link
                    href={`/category/${currentCategory.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-bold text-[#0C3B2E] bg-[#EBF3EF]"
                  >
                    <span>Home ({currentCategory.title})</span>
                    <ChevronRight className="w-4 h-4 text-[#C5A059]" />
                  </Link>

                  {currentCategory.subcategories.map((sub) => (
                    <Link
                      key={sub}
                      href={`/category/${currentCategory.slug}?sub=${encodeURIComponent(sub)}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold text-[#0B241C] hover:bg-white"
                    >
                      <span>{sub}</span>
                      <ChevronRight className="w-4 h-4 text-[#C5A059]" />
                    </Link>
                  ))}

                  <div className="pt-4 border-t border-[#E2DBD0]/70 mt-2 space-y-2">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#5A7469]">
                      Switch Category (Opens New Tab)
                    </p>
                    {categories
                      .filter((c) => c.slug !== currentCategory.slug)
                      .map((otherCat) => (
                        <Link
                          key={otherCat.id}
                          href={`/category/${otherCat.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold text-[#0B241C] hover:bg-white transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-[#C5A059]/40 bg-[#EBF3EF]">
                              <img
                                src={otherCat.bannerImage || otherCat.heroImage}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span>{otherCat.title}</span>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A059]" />
                        </Link>
                      ))}
                  </div>

                  <div className="pt-3">
                    <Link
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-bold text-[#08281F] bg-[#FAF5EA] border border-[#C5A059]/40"
                    >
                      <span>Explore Main Portal ↗</span>
                      <ArrowUpRight className="w-4 h-4 text-[#C5A059]" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {mainNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-3 px-3 rounded-xl text-sm font-semibold text-[#0B241C] hover:bg-white transition-colors"
                    >
                      <span>{link.name}</span>
                      <ArrowUpRight className="w-4 h-4 text-[#C5A059]" />
                    </Link>
                  ))}
                </div>
              )}

              <div className="border-t border-[#E2DBD0] my-6 pt-6 space-y-3">
                <Link
                  href="/order-tracking"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 text-sm text-[#2C4A3E] hover:text-[#0C3B2E]"
                >
                  <Truck className="w-4 h-4 text-[#C5A059]" />
                  <span>Track Your Order</span>
                </Link>
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 text-sm text-[#2C4A3E] hover:text-[#0C3B2E]"
                >
                  <User className="w-4 h-4 text-[#C5A059]" />
                  <span>My Account</span>
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 text-sm font-semibold text-[#0C3B2E] hover:text-[#C5A059]"
                >
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
                  <span>Merchant Admin Dashboard</span>
                </Link>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2DBD0] mt-4 text-xs text-[#5A7469] space-y-2">
                <p className="font-semibold text-[#0B241C]">Purnya Concierge Support</p>
                <p>care@purnya.in | +91 98765 43210</p>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

export default function Header() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full bg-white border-b border-[#E2DBD0] h-20" />
      }
    >
      <HeaderContent />
    </React.Suspense>
  );
}

