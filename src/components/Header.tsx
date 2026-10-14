'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  User,
  Heart,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Package,
  LogOut,
  Sparkles,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Leaf,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { initialCategories } from '../data/mockData';
import { supabase } from '../lib/supabaseClient';
import { isAdminEmail } from '../lib/adminPermissions';


function HeaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSub = searchParams?.get('sub') || 'All';
  const {
    announcement,
    cartCount,
    wishlistCount,
    setIsSearchOpen,
    categories,
    products,
    user,
    mounted,
    loginUser,
    logoutUser,
    showToast,
    openAuthModal,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [otherBoutiquesOpen, setOtherBoutiquesOpen] = useState(false);
  const [mobileOtherBoutiquesOpen, setMobileOtherBoutiquesOpen] = useState(false);

  // Profile Dropdown Popover (for logged-in patrons)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // A patron is strictly an authenticated store customer, never an administrator
  const isCustomerLoggedIn = Boolean(
    mounted &&
    user?.email &&
    !isAdminEmail(user.email)
  );

  const isAdminRoute = pathname?.startsWith('/admin');

  // Sort categories by priority so nav always follows admin-defined order
  const categoriesList = categories && categories.length > 0 ? categories : initialCategories;
  const sortedCategories = [...categoriesList].sort(
    (a: any, b: any) => (a.priority ?? 1) - (b.priority ?? 1)
  );

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Lock body scroll when mobile menu is open & listen for Escape key
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  // Close mobile menu automatically on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, searchParams]);

  // Handle Profile click
  const handleProfileClick = () => {
    if (!isCustomerLoggedIn) {
      openAuthModal({ mode: 'login' });
    } else {
      setProfileDropdownOpen((prev) => !prev);
    }
  };

  const handleSignOut = () => {
    logoutUser();
    setProfileDropdownOpen(false);
    showToast('Signed Out', 'You have been safely signed out. See you soon!');
  };

  // Track active category across pages (e.g. /category/..., /all-products/..., /product/[id], /cart, /wishlist)
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // 1. If at homepage / main page, clear category context
    if (pathname === '/') {
      try {
        sessionStorage.removeItem('purnya_active_category');
      } catch (e) { }
      setActiveCategorySlug(null);
      return;
    }

    // 2. If at /category/[slug]...
    if (pathname.startsWith('/category/')) {
      const parts = pathname.split('/');
      const slug = decodeURIComponent(parts[2] || '').trim().toLowerCase();
      if (slug) {
        try {
          sessionStorage.setItem('purnya_active_category', slug);
        } catch (e) { }
        setActiveCategorySlug(slug);
        return;
      }
    }

    // 3. If at /all-products/[slug]...
    if (pathname.startsWith('/all-products/')) {
      const parts = pathname.split('/');
      const slug = decodeURIComponent(parts[2] || '').trim().toLowerCase();
      if (slug) {
        try {
          sessionStorage.setItem('purnya_active_category', slug);
        } catch (e) { }
        setActiveCategorySlug(slug);
        return;
      }
    }

    // 4. If at /product/[id]...
    if (pathname.startsWith('/product/')) {
      const parts = pathname.split('/');
      const prodId = parts[2]?.trim();

      // Check sessionStorage first for instantaneous UI continuity
      let savedSlug: string | null = null;
      try {
        savedSlug = sessionStorage.getItem('purnya_active_category');
      } catch (e) { }

      if (savedSlug) {
        setActiveCategorySlug(savedSlug.toLowerCase());
      }

      // Also verify/fetch the exact product category to ensure 100% accuracy (even on direct visit)
      if (prodId) {
        // Check preloaded products from store context
        const matchedProduct = products?.find((p) => p.id === prodId);
        if (matchedProduct?.categorySlug) {
          const catSlug = matchedProduct.categorySlug.trim().toLowerCase();
          setActiveCategorySlug(catSlug);
          try {
            sessionStorage.setItem('purnya_active_category', catSlug);
          } catch (e) { }
          return;
        }

        // Direct fetch from Supabase if not in preloaded context
        (async () => {
          try {
            const { data: pData } = await supabase
              .from('products')
              .select('category_id')
              .eq('id', prodId)
              .maybeSingle();

            if (pData?.category_id) {
              const { data: cData } = await supabase
                .from('categories')
                .select('slug')
                .eq('id', pData.category_id)
                .maybeSingle();

              if (cData?.slug) {
                const fetchedSlug = cData.slug.trim().toLowerCase();
                setActiveCategorySlug(fetchedSlug);
                try {
                  sessionStorage.setItem('purnya_active_category', fetchedSlug);
                } catch (e) { }
              }
            }
          } catch (err) {
            console.error('Error fetching product category in Header:', err);
          }
        })();
      }
      return;
    }

    // 5. On other subpages (e.g. /cart, /wishlist), retain active category if exists
    try {
      const saved = sessionStorage.getItem('purnya_active_category');
      if (saved) {
        setActiveCategorySlug(saved.toLowerCase());
        return;
      }
    } catch (e) { }

    setActiveCategorySlug(null);
  }, [pathname, products]);

  // Listen for custom category change event (e.g. dispatched by product detail page once loaded)
  useEffect(() => {
    const handleCategoryEvent = (e: any) => {
      const slug = e?.detail;
      if (slug && typeof slug === 'string') {
        const clean = slug.trim().toLowerCase();
        setActiveCategorySlug(clean);
        try {
          sessionStorage.setItem('purnya_active_category', clean);
        } catch (err) { }
      }
    };

    window.addEventListener('purnya_category_change', handleCategoryEvent as EventListener);
    return () => {
      window.removeEventListener('purnya_category_change', handleCategoryEvent as EventListener);
    };
  }, []);

  const currentCategory = useMemo(() => {
    if (!activeCategorySlug) return null;
    const target = activeCategorySlug.trim().toLowerCase();
    return (
      categoriesList.find(
        (c) => (c.slug || '').trim().toLowerCase() === target
      ) ||
      categoriesList.find(
        (c) => {
          const s = (c.slug || '').trim().toLowerCase();
          const t = (c.title || '').trim().toLowerCase();
          return s.includes(target) || target.includes(s) || t.includes(target) || target.includes(t);
        }
      ) ||
      null
    );
  }, [categoriesList, activeCategorySlug]);

  // Dynamic navigation links directly from Supabase categories
  const navLinks = sortedCategories.map((cat) => ({
    name: (cat.title || '').trim(),
    href: `/category/${(cat.slug || '').trim()}`,
  }));

  if (isAdminRoute) return null;

  return (
    <>
      <div className="sticky top-0 z-50 w-full flex flex-col">
        {/* Emerald & Gold Announcement Bar */}
        <div className="relative z-50 overflow-hidden border-b border-[#144234] bg-[#08281F] py-1.5 text-[10px] font-medium uppercase text-[#FAF8F5] sm:py-2.5 sm:text-xs">
          <span className="sr-only">{announcement}</span>

          <div className="announcement-track flex w-max" aria-hidden="true">
            {[0, 1].map((group) => (
              <div key={group} className="flex shrink-0">
                {[0, 1].map((item) => (
                  <span
                    key={item}
                    className="flex shrink-0 items-center gap-12 whitespace-nowrap px-6 font-semibold tracking-[0.15em]"
                  >
                    {announcement}
                    <span className="text-[#D4AF37]">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>


        {/* Main Header */}
        <header className="relative z-40 bg-white/95 backdrop-blur-md border-b border-[#E2DBD0] transition-all shadow-xs">
          <div className="relative w-full max-w-[1480px] mx-auto px-3 sm:px-6 lg:px-6 xl:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
            {/* Mobile Menu Button & Logo */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden shrink-0 p-1.5 sm:p-2 text-[#0C3B2E] hover:text-[#C5A059] transition-colors"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link
                href={currentCategory ? `/category/${(currentCategory.slug || '').trim()}` : '/'}
                className="flex items-center gap-1.5 sm:gap-2.5 group shrink-0"
                title={currentCategory ? `${(currentCategory.title || '').trim()} Boutique` : 'Purnya Official Boutique'}
              >
                <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 rounded-full overflow-hidden flex items-center justify-center p-0.5 bg-[#FAF8F5] border border-[#C5A059]/40 shadow-xs group-hover:scale-105 transition-transform duration-300">
                  <img
                    src="/logoicon.png"
                    alt="Purnya Emblem"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif-title text-lg sm:text-2xl xl:text-3xl font-bold tracking-[0.1em] sm:tracking-[0.14em] text-[#0C3B2E] group-hover:text-[#164E3D] transition-colors leading-none">
                      PURNYA
                    </span>
                  </div>
                  <div className="flex flex-col items-start leading-[1.15] mt-0.5 sm:mt-1">
                    <span className="text-[7px] sm:text-[8px] xl:text-[8.5px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#C5A059] font-bold whitespace-nowrap">
                      Thoughtfully · Curated
                    </span>
                    <span className="text-[7px] sm:text-[8px] xl:text-[8.5px] uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#C5A059] font-bold whitespace-nowrap">
                      Beautifully Yours
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links (Centered in Header, shifted slightly left in subcategory header to utilize open left space) */}
            <nav className={`hidden lg:flex items-center justify-center gap-3 xl:gap-5 text-[11px] xl:text-xs font-semibold tracking-wider uppercase text-[#2C4A3E] whitespace-nowrap absolute ${
              currentCategory ? 'left-1/2 -translate-x-1/2 -ml-8 xl:-ml-12 2xl:-ml-6' : 'left-1/2 -translate-x-1/2'
            }`}>
              {currentCategory ? (
                // Dedicated Category Storefront Navigation (Includes Home + Subcategories)
                <>
                  <Link
                    href={`/category/${(currentCategory.slug || '').trim()}`}
                    className={`py-2 relative transition-colors duration-200 hover:text-[#0C3B2E] ${
                      pathname === `/category/${(currentCategory.slug || '').trim()}` && (currentSub === 'All' || !currentSub)
                        ? 'text-[#0C3B2E] font-bold'
                        : ''
                    }`}
                  >
                    Home
                    {pathname === `/category/${(currentCategory.slug || '').trim()}` && (currentSub === 'All' || !currentSub) && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0C3B2E] rounded-full" />
                    )}
                  </Link>

                  {currentCategory.subcategories
                    .filter((s: string) => (s || '').trim() !== 'All')
                    .slice(0, 4)
                    .map((sub: string) => {
                      const cleanSub = (sub || '').trim();
                      const isSubActive =
                        decodeURIComponent(pathname).toLowerCase() === `/category/${(currentCategory.slug || '').trim().toLowerCase()}/${cleanSub.toLowerCase()}` ||
                        decodeURIComponent(pathname).toLowerCase().endsWith(`/${cleanSub.toLowerCase()}`) ||
                        currentSub.toLowerCase() === cleanSub.toLowerCase();
                      return (
                        <Link
                          key={cleanSub}
                          href={`/category/${(currentCategory.slug || '').trim()}/${encodeURIComponent(cleanSub)}`}
                          className={`py-2 relative transition-colors duration-200 hover:text-[#0C3B2E] ${
                            isSubActive ? 'text-[#0C3B2E] font-bold' : ''
                          }`}
                        >
                          {cleanSub}
                          {isSubActive && (
                            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0C3B2E] rounded-full" />
                          )}
                        </Link>
                      );
                    })}

                  {/* Dropdown to open any of the other category websites in a new tab */}
                  <div
                    className="relative"
                    onMouseEnter={() => setOtherBoutiquesOpen(true)}
                    onMouseLeave={() => setOtherBoutiquesOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => setOtherBoutiquesOpen(!otherBoutiquesOpen)}
                      className="py-2 inline-flex items-center gap-1 transition-colors hover:text-[#0C3B2E] text-[11px] xl:text-xs font-semibold uppercase tracking-wider text-[#2C4A3E] cursor-pointer"
                    >
                      <span>Other Boutiques</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#C5A059]" />
                    </button>

                    {otherBoutiquesOpen && (
                      <div className="absolute left-0 top-full pt-1 w-64 z-50">
                        <div className="bg-white rounded-2xl shadow-xl border border-[#E2DBD0] py-2 overflow-hidden">
                          <div className="px-3.5 py-1.5 border-b border-[#F0ECE4] text-[10px] uppercase tracking-wider text-[#5A7469] font-bold">
                            Switch Boutique
                          </div>
                          {sortedCategories
                            .filter((c) => (c.slug || '').trim() !== (currentCategory.slug || '').trim())
                            .map((otherCat) => (
                              <Link
                                key={otherCat.id}
                                href={`/category/${(otherCat.slug || '').trim()}`}
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
                                  <span className="font-semibold text-[#0B241C]">{(otherCat.title || '').trim()}</span>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A059]" />
                              </Link>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Main Multi-Category Portal Navigation (Opens in new tab)
                navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`py-2 relative transition-colors duration-200 hover:text-[#0C3B2E] inline-flex items-center gap-1 ${isActive ? 'text-[#0C3B2E] font-bold' : ''
                        }`}
                      title={link.name}
                    >
                      <span>{link.name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A059]" />
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0C3B2E] rounded-full" />
                      )}
                    </Link>
                  );
                })
              )}
            </nav>

            {/* 3. RIGHT ZONE: Action Icons (Wishlist & Cart ONLY show after login as requested!) */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 justify-end z-10">
              {/* Switcher back to Main Page (Anchored reliably on the right when browsing any category/subcategory boutique) */}
              {currentCategory && (
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    try { sessionStorage.removeItem('purnya_active_category'); } catch (e) { }
                    setActiveCategorySlug(null);
                  }}
                  className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FAF8F5] hover:bg-[#EBF3EF] border border-[#C5A059]/50 text-[#0C3B2E] text-[11px] font-bold normal-case tracking-normal transition-all shadow-xs shrink-0 mr-1"
                  title="Go to Main Page in new tab"
                >
                  <span>Main Page</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </Link>
              )}

              {/* Search Trigger */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 sm:p-2.5 text-[#2C4A3E] hover:text-[#0C3B2E] hover:bg-[#EBF3EF] rounded-full transition-all cursor-pointer"
                aria-label="Search"
                title="Search catalog"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist with Badge (APPEARS ONLY AFTER PATRON CUSTOMER LOGIN) */}
              {isCustomerLoggedIn && (
                <Link
                  href="/wishlist"
                  className="p-2 sm:p-2.5 text-[#2C4A3E] hover:text-[#0C3B2E] hover:bg-[#EBF3EF] rounded-full transition-all relative animate-in fade-in"
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
              )}

              {/* Cart with Badge (APPEARS ONLY AFTER PATRON CUSTOMER LOGIN) */}
              {isCustomerLoggedIn && (
                <Link
                  href="/cart"
                  className="p-2 sm:p-2.5 text-[#2C4A3E] hover:text-[#0C3B2E] hover:bg-[#EBF3EF] rounded-full transition-all relative animate-in fade-in"
                  aria-label="Cart"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#0C3B2E] text-[#FAF8F5] text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Profile Button with Popover / Modal Trigger */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="flex flex-col items-center justify-center group py-1 px-0.5 sm:px-1.5 rounded-xl hover:bg-[#EBF3EF] transition-all cursor-pointer focus:outline-hidden"
                  aria-label={isCustomerLoggedIn ? 'Customer Account Menu' : 'Sign In'}
                  title={isCustomerLoggedIn ? `Account Options (${user.name || user.email})` : 'Sign In / Register'}
                >
                  {isCustomerLoggedIn ? (
                    // CUTE LOGGED-IN AVATAR WITH NAME DIRECTLY UNDER IT
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#0C3B2E] to-[#08281F] text-[#FAF8F5] font-bold text-[11px] sm:text-xs flex items-center justify-center border border-[#C5A059] shadow-xs group-hover:scale-105 transition-transform">
                        {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-bold text-[#0C3B2E] max-w-[52px] sm:max-w-[70px] truncate text-center leading-tight mt-0.5 tracking-tight group-hover:text-[#C5A059] transition-colors">
                        {user.name ? user.name.split(' ')[0] : 'Member'}
                      </span>
                    </div>
                  ) : (
                    // GUEST ICON
                    <div className="p-2 text-[#2C4A3E] group-hover:text-[#0C3B2E] transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </button>

                {/* LOGGED-IN PROFILE DROPDOWN MENU (Does not redirect immediately; user clicks Orders to navigate!) */}
                {isCustomerLoggedIn && profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[min(18rem,calc(100vw-1.5rem))] bg-white rounded-3xl shadow-2xl border border-[#E2DBD0] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* User Header Summary */}
                    <div className="flex items-center gap-3 pb-3.5 border-b border-[#F0ECE4]">
                      <div className="w-10 h-10 rounded-2xl bg-[#08281F] text-[#D4AF37] font-bold text-sm flex items-center justify-center border border-[#C5A059]/50 shadow-inner shrink-0">
                        {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-serif-title font-bold text-sm text-[#0B241C] truncate">
                          {user.name || 'Purnya Patron'}
                        </span>
                        <span className="text-[11px] text-[#5A7469] truncate">
                          {user.email}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#C5A059] mt-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Purnya Circle Member</span>
                        </span>
                      </div>
                    </div>

                    {/* Menu Options */}
                    <div className="py-2 space-y-1">
                      {/* Orders Option - Navigates only when clicked! */}
                      <Link
                        href="/account?tab=orders"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#EBF3EF] transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] group-hover:bg-white flex items-center justify-center text-[#0C3B2E] border border-[#E2DBD0]">
                            <Package className="w-4 h-4 text-[#C5A059]" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-[#0B241C] group-hover:text-[#0C3B2E]">
                              My Orders &amp; Tracking
                            </p>
                            <p className="text-[10px] text-[#5A7469]">View order status &amp; history</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      {/* Wishlist Option */}
                      <Link
                        href="/wishlist"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#EBF3EF] transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] group-hover:bg-white flex items-center justify-center text-[#0C3B2E] border border-[#E2DBD0]">
                            <Heart className="w-4 h-4 text-[#C5A059]" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-[#0B241C] group-hover:text-[#0C3B2E]">
                              My Wishlist
                            </p>
                            <p className="text-[10px] text-[#5A7469]">{wishlistCount} cherished pieces</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      {/* Cart Option */}
                      <Link
                        href="/cart"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#EBF3EF] transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] group-hover:bg-white flex items-center justify-center text-[#0C3B2E] border border-[#E2DBD0]">
                            <ShoppingCart className="w-4 h-4 text-[#C5A059]" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-[#0B241C] group-hover:text-[#0C3B2E]">
                              Shopping Cart
                            </p>
                            <p className="text-[10px] text-[#5A7469]">{cartCount} items selected</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      {/* Account Settings Option */}
                      <Link
                        href="/account"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#EBF3EF] transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] group-hover:bg-white flex items-center justify-center text-[#0C3B2E] border border-[#E2DBD0]">
                            <User className="w-4 h-4 text-[#C5A059]" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold text-[#0B241C] group-hover:text-[#0C3B2E]">
                              Profile &amp; Addresses
                            </p>
                            <p className="text-[10px] text-[#5A7469]">Manage personal details</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#C5A059] group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>

                    {/* Sign Out Button */}
                    <div className="pt-2 border-t border-[#F0ECE4]">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out from Circle</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </header>
      </div>

      {/* Mobile Navigation Drawer (Rendered outside header to avoid backdrop-filter containment issues) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex" role="dialog" aria-modal="true">
          {/* Backdrop with fade-in and tap-to-close */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu backdrop"
          />

          {/* Drawer Panel with smooth slide-in */}
          <div className="relative w-[86vw] max-w-sm bg-[#FAF8F5] h-full shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-left duration-300 border-r border-[#E2DBD0]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E2DBD0] bg-white shrink-0">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center p-0.5 bg-[#FAF8F5] border border-[#C5A059]/50 shadow-xs">
                  <img src="/logoicon.png" alt="Purnya" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="font-serif-title text-xl font-bold tracking-[0.14em] text-[#0C3B2E] block leading-none">
                    PURNYA
                  </span>
                  <div className="flex flex-col items-start leading-[1.15] mt-1">
                    <span className="text-[7.5px] sm:text-[8px] uppercase tracking-[0.12em] text-[#C5A059] font-bold whitespace-nowrap">
                      Thoughtfully · Curated
                    </span>
                    <span className="text-[7.5px] sm:text-[8px] uppercase tracking-[0.12em] text-[#C5A059] font-bold whitespace-nowrap">
                      Beautifully Yours
                    </span>
                  </div>
                </div>
              </Link>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 flex items-center justify-center text-[#0C3B2E] hover:text-[#C5A059] hover:bg-[#FAF8F5] rounded-full transition-colors border border-transparent hover:border-[#E2DBD0] cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patron Profile Banner */}
            <div className="p-4 bg-[#08281F] text-[#FAF8F5] shrink-0 border-b border-[#144234]">
              {isCustomerLoggedIn ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#164E3D] text-[#D4AF37] border border-[#C5A059] font-bold text-xs flex items-center justify-center">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#FAF8F5] truncate">{user.name || 'Patron'}</p>
                      <p className="text-[10px] text-[#C5A059] truncate">Purnya Circle Member</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="text-[10px] uppercase font-bold text-rose-300 hover:text-rose-100 flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#FAF8F5]">Welcome to Purnya</p>
                    <p className="text-[10px] text-[#A3B8B0]">Sign in for wishlist, orders &amp; perks</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      openAuthModal({ mode: 'login' });
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#C5A059] hover:bg-[#D4AF37] text-[#08281F] font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5">
              {/* If Patron Customer Logged In: Quick Actions */}
              {isCustomerLoggedIn && (
                <div className="grid grid-cols-3 gap-2 pb-1">
                  <Link
                    href="/account?tab=orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-[#E2DBD0] text-center hover:bg-[#EBF3EF] transition-colors"
                  >
                    <Package className="w-4 h-4 text-[#C5A059] mb-1" />
                    <span className="text-[10px] font-bold text-[#0B241C]">Orders</span>
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-[#E2DBD0] text-center hover:bg-[#EBF3EF] transition-colors relative"
                  >
                    <Heart className="w-4 h-4 text-[#C5A059] mb-1" />
                    <span className="text-[10px] font-bold text-[#0B241C]">Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="absolute top-1 right-2 text-[9px] font-bold text-white bg-[#C5A059] rounded-full w-3.5 h-3.5 flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-[#E2DBD0] text-center hover:bg-[#EBF3EF] transition-colors relative"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#C5A059] mb-1" />
                    <span className="text-[10px] font-bold text-[#0B241C]">Cart</span>
                    {cartCount > 0 && (
                      <span className="absolute top-1 right-2 text-[9px] font-bold text-white bg-[#0C3B2E] rounded-full w-3.5 h-3.5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {/* Navigation Section (Same as Desktop Header Navigation) */}
              {currentCategory ? (
                <div className="space-y-4">
                  {/* Current Active Boutique Header */}
                  <div className="bg-[#FAF8F5] border border-[#E2DBD0] rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
                    <div className="min-w-0 pr-2">
                      <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[#C5A059] block">
                        Boutique
                      </span>
                      <h4 className="font-serif-title text-sm sm:text-base font-bold text-[#0C3B2E] truncate">
                        {(currentCategory.title || '').trim()}
                      </h4>
                    </div>
                    <Link
                      href="/"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        try {
                          sessionStorage.removeItem('purnya_active_category');
                        } catch (e) { }
                        setActiveCategorySlug(null);
                      }}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-[#0C3B2E] border border-[#C5A059]/60 flex items-center gap-1 shadow-2xs hover:bg-[#EBF3EF] shrink-0"
                      title="Return to Main Page"
                    >
                      <span>Main Page</span>
                      <ArrowUpRight className="w-3 h-3 text-[#C5A059]" />
                    </Link>
                  </div>

                  {/* Navigation Links (Home, Subcategories, Other Boutiques, Main Page) */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] px-2 mb-2">
                      Navigation
                    </p>

                    {/* Home Link */}
                    <Link
                      href={`/category/${(currentCategory.slug || '').trim()}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${pathname === `/category/${(currentCategory.slug || '').trim()}` && (currentSub === 'All' || !currentSub)
                          ? 'bg-[#0C3B2E] text-[#FAF8F5] shadow-xs'
                          : 'text-[#2C4A3E] hover:text-[#0C3B2E] hover:bg-white'
                        }`}
                    >
                      <span>Home</span>
                      {pathname === `/category/${(currentCategory.slug || '').trim()}` && (currentSub === 'All' || !currentSub) ? (
                        <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#5A7469]/40" />
                      )}
                    </Link>

                    {/* Subcategories (Same as desktop nav) */}
                    {currentCategory.subcategories
                      ?.filter((s: string) => (s || '').trim() !== 'All')
                      .map((sub: string) => {
                        const cleanSub = (sub || '').trim();
                        const isSubActive =
                          pathname === `/category/${(currentCategory.slug || '').trim()}/${encodeURIComponent(cleanSub)}` ||
                          (pathname === `/category/${(currentCategory.slug || '').trim()}` && currentSub === cleanSub);
                        return (
                          <Link
                            key={cleanSub}
                            href={`/category/${(currentCategory.slug || '').trim()}/${encodeURIComponent(cleanSub)}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all ${isSubActive
                                ? 'bg-[#0C3B2E] text-[#FAF8F5] font-bold shadow-xs'
                                : 'text-[#2C4A3E] hover:text-[#0C3B2E] hover:bg-white font-semibold'
                              }`}
                          >
                            <span>{cleanSub}</span>
                            {isSubActive ? (
                              <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-[#5A7469]/40" />
                            )}
                          </Link>
                        );
                      })}

                    {/* Other Boutiques (Accordion matching desktop "Other Boutiques") */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setMobileOtherBoutiquesOpen(!mobileOtherBoutiquesOpen)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-[#2C4A3E] hover:text-[#0C3B2E] hover:bg-white transition-colors cursor-pointer"
                      >
                        <span>Other Boutiques</span>
                        <ChevronDown
                          className={`w-4 h-4 text-[#C5A059] transition-transform duration-200 ${mobileOtherBoutiquesOpen ? 'rotate-180' : ''
                            }`}
                        />
                      </button>

                      {mobileOtherBoutiquesOpen && (
                        <div className="pl-2 pt-1 space-y-1 animate-in fade-in duration-150">
                          {sortedCategories
                            .filter(
                              (c) => (c.slug || '').trim().toLowerCase() !== (currentCategory.slug || '').trim().toLowerCase()
                            )
                            .map((otherCat) => {
                              const otherSlug = (otherCat.slug || '').trim();
                              return (
                                <Link
                                  key={otherCat.id || otherSlug}
                                  href={`/category/${otherSlug}`}
                                  onClick={() => {
                                    setMobileMenuOpen(false);
                                    setMobileOtherBoutiquesOpen(false);
                                  }}
                                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#0B241C] hover:bg-white hover:text-[#0C3B2E] transition-colors"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-[#C5A059]/40 bg-[#FAF8F5]">
                                      <img
                                        src={otherCat.bannerImage || otherCat.heroImage}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <span className="font-semibold truncate">{(otherCat.title || '').trim()}</span>
                                  </div>
                                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                                </Link>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    {/* Main Page Switcher */}
                    <div className="pt-2">
                      <Link
                        href="/"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          try {
                            sessionStorage.removeItem('purnya_active_category');
                          } catch (e) { }
                          setActiveCategorySlug(null);
                        }}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-[#0C3B2E] bg-white border border-[#C5A059]/40 hover:bg-[#EBF3EF] transition-colors shadow-2xs"
                      >
                        <span>Main Page</span>
                        <ArrowUpRight className="w-4 h-4 text-[#C5A059]" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                /* Main Multi-Category Portal Navigation (Same 5 categories as desktop header) */
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] px-2 mb-2">
                    Categories
                  </p>
                  {sortedCategories.map((cat) => {
                    const catSlug = (cat.slug || '').trim();
                    const isExpanded = expandedMobileCategory === catSlug;
                    const cleanSubs = (cat.subcategories || []).filter((s) => (s || '').trim() !== 'All');

                    return (
                      <div key={cat.id || catSlug} className="rounded-xl overflow-hidden transition-all">
                        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white text-xs font-bold uppercase tracking-wider text-[#0B241C] transition-colors">
                          <Link
                            href={`/category/${catSlug}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-2.5 flex-1 min-w-0"
                          >
                            <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-[#C5A059]/40 bg-[#FAF8F5]">
                              <img
                                src={cat.bannerImage || cat.heroImage}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="truncate">{(cat.title || '').trim()}</span>
                          </Link>

                          {cleanSubs.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setExpandedMobileCategory(isExpanded ? null : catSlug)}
                              className="p-1 text-[#5A7469] hover:text-[#0C3B2E] rounded-lg transition-transform cursor-pointer ml-1"
                              aria-label={`Toggle ${(cat.title || '').trim()} subcategories`}
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 text-[#C5A059] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                                  }`}
                              />
                            </button>
                          )}
                        </div>

                        {/* Subcategories Accordion */}
                        {isExpanded && cleanSubs.length > 0 && (
                          <div className="pl-10 pr-3 py-1 space-y-1 animate-in fade-in duration-150">
                            <Link
                              href={`/category/${catSlug}`}
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center justify-between py-1 px-2 text-[11px] font-bold text-[#0C3B2E] hover:text-[#C5A059] transition-colors"
                            >
                              <span>All {(cat.title || '').trim()}</span>
                              <ArrowUpRight className="w-3 h-3 text-[#C5A059]" />
                            </Link>
                            {cleanSubs.map((sub) => {
                              const cleanSub = (sub || '').trim();
                              return (
                                <Link
                                  key={cleanSub}
                                  href={`/category/${catSlug}/${encodeURIComponent(cleanSub)}`}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="flex items-center justify-between py-1 px-2 text-[11px] font-medium text-[#2C4A3E] hover:text-[#0C3B2E] transition-colors"
                                >
                                  <span>{cleanSub}</span>
                                  <ChevronRight className="w-3 h-3 text-[#C5A059]/60" />
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Main Brand Links */}
              <div className="space-y-1 pt-2 border-t border-[#E2DBD0]">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059] mb-2 px-1">
                  Discover Purnya
                </p>
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-[#0B241C] hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <span>Main Boutique</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5A7469]" />
                </Link>

                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-[#0B241C] hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Leaf className="w-4 h-4 text-[#C5A059]" />
                    <span>Our Story &amp; Ethos</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5A7469]" />
                </Link>

                <Link
                  href="/order-tracking"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-[#0B241C] hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-[#C5A059]" />
                    <span>Track Your Order</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5A7469]" />
                </Link>

                <Link
                  href="/faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-[#0B241C] hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[#C5A059]" />
                    <span>Help &amp; FAQs</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5A7469]" />
                </Link>

                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-[#0B241C] hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#C5A059]" />
                    <span>Customer Care Support</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-[#5A7469]" />
                </Link>
              </div>

              {/* Policy Links */}
              <div className="pt-2 border-t border-[#E2DBD0]">
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-[#5A7469] px-1">
                  <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#0C3B2E]">
                    Terms &amp; Conditions
                  </Link>
                  <span>·</span>
                  <Link href="/privacy-policy" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#0C3B2E]">
                    Privacy Policy
                  </Link>
                  <span>·</span>
                  <Link href="/return-policy#shipping" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#0C3B2E]">
                    Shipping
                  </Link>
                  <span>·</span>
                  <Link href="/return-policy#returns" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#0C3B2E]">
                    Returns
                  </Link>
                </div>
              </div>

              {/* Customer Care Support Card */}
              <div className="bg-white p-3.5 rounded-2xl border border-[#E2DBD0] text-xs text-[#5A7469] space-y-1.5 shadow-xs">
                <p className="font-bold text-[#0B241C] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Purnya Customer Support</span>
                </p>
                <p className="text-[11px] text-[#2C4A3E]">care@purnya.in | +91 7892297609</p>
                <p className="text-[10px] text-[#849C92]">Mon–Sat: 10 AM–6 PM IST</p>
              </div>
            </div>
          </div>
        </div>
      )}




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
