'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
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
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { signInWithSupabase, signUpWithSupabase, isSupabaseConfigured, sendPasswordResetEmail } from '../lib/supabase';

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
    user,
    loginUser,
    logoutUser,
    showToast,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [otherBoutiquesOpen, setOtherBoutiquesOpen] = useState(false);

  // Profile Dropdown Popover (for logged-in patrons)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Auth Pop-up Modal (for non-logged-in patrons)
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authForgotSent, setAuthForgotSent] = useState(false);

  const isAdminRoute = pathname?.startsWith('/admin');

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

  // Handle Profile click
  const handleProfileClick = () => {
    if (!user?.email) {
      setAuthError('');
      setAuthModalOpen(true);
    } else {
      setProfileDropdownOpen((prev) => !prev);
    }
  };

  // Auth Modal Login Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authEmail.trim()) {
      setAuthError('Please enter your email address.');
      return;
    }
    if (!authPassword) {
      setAuthError('Please enter your password.');
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        if (isSupabaseConfigured && authEmail.includes('@')) {
          const res = await signInWithSupabase(authEmail.trim(), authPassword);
          if (!res.success && res.error) {
            setAuthLoading(false);
            setAuthError(
              res.error.toLowerCase().includes('invalid login credentials')
                ? 'Invalid email or password. Please verify and try again.'
                : res.error
            );
            return;
          } else if (res.success && res.user) {
            const meta = res.user.user_metadata || {};
            const detectedName = meta.name || meta.full_name || authEmail.split('@')[0];
            loginUser({
              name: detectedName,
              email: authEmail.trim(),
              phone: meta.phone || '+91 98765 43210',
            });
            setAuthLoading(false);
            setAuthModalOpen(false);
            showToast('Welcome Back ✨', `Delighted to see you, ${detectedName}.`);
            return;
          }
        }

        // Direct local login fallback
        const detectedName = authEmail.split('@')[0] || 'Patron';
        const capitalized = detectedName.charAt(0).toUpperCase() + detectedName.slice(1);
        loginUser({
          name: capitalized,
          email: authEmail.trim(),
          phone: '+91 98765 43210',
        });
        setAuthLoading(false);
        setAuthModalOpen(false);
        showToast('Welcome Back ✨', `Signed in successfully as ${capitalized}.`);
      } else {
        // Sign up
        if (!authName.trim()) {
          setAuthLoading(false);
          setAuthError('Please enter your full name.');
          return;
        }

        if (isSupabaseConfigured && authEmail.includes('@')) {
          const res = await signUpWithSupabase(authEmail.trim(), authPassword, {
            name: authName.trim(),
            phone: authPhone.trim() || '',
          });
          if (!res.success && res.error) {
            setAuthLoading(false);
            setAuthError(res.error);
            return;
          }
        }

        loginUser({
          name: authName.trim(),
          email: authEmail.trim(),
          phone: authPhone.trim() || '+91 98765 43210',
        });
        setAuthLoading(false);
        setAuthModalOpen(false);
        showToast('Welcome to Purnya ✨', `Delighted to welcome you to the Circle, ${authName.trim()}.`);
      }
    } catch (err: any) {
      setAuthLoading(false);
      setAuthError(err?.message || 'Authentication error. Please try again.');
    }
  };

  const handleSignOut = () => {
    logoutUser();
    setProfileDropdownOpen(false);
    showToast('Signed Out', 'You have been safely signed out. See you soon!');
  };

  // Detect if user is on a dedicated category website
  const isCategoryRoute = pathname?.startsWith('/category/');
  const currentCategorySlug = isCategoryRoute ? pathname.split('/')[2] : null;
  const currentCategory = categories.find(
    (c) => c.slug.trim().toLowerCase() === currentCategorySlug?.trim().toLowerCase()
  );

  // Dynamic navigation links directly from Supabase categories
  const navLinks = categories.map((cat) => ({
    name: (cat.title || '').trim(),
    href: `/category/${(cat.slug || '').trim()}`,
  }));

  if (isAdminRoute) return null;

  return (
    <>
      {/* Emerald & Gold Announcement Bar */}
      <div className="bg-[#08281F] text-[#FAF8F5] text-[11px] sm:text-xs font-medium py-2.5 px-4 text-center tracking-widest uppercase flex items-center justify-center gap-2 border-b border-[#144234]">
        <span className="font-semibold tracking-[0.15em]">
          {announcement}
        </span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2DBD0] transition-all shadow-xs">
        <div className="relative w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8 h-20 sm:h-22 flex items-center justify-between">
          {/* 1. LEFT ZONE: Logo with Emblem & Brand Name (kept neatly to the left) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#0C3B2E] hover:text-[#C5A059] transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link
              href={currentCategory ? `/category/${(currentCategory.slug || '').trim()}` : '/'}
              className="flex items-center gap-2 sm:gap-2.5 group shrink-0"
              title={currentCategory ? `${(currentCategory.title || '').trim()} Storefront` : 'Purnya Official Store'}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex items-center justify-center p-0.5 bg-[#FAF8F5] border border-[#C5A059]/40 shadow-xs group-hover:scale-105 transition-transform duration-300">
                <img
                  src="/purnya-logo.png"
                  alt="Purnya Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif-title text-2xl sm:text-3xl font-bold tracking-[0.16em] text-[#0C3B2E] group-hover:text-[#164E3D] transition-colors leading-none">
                    PURNYA
                  </span>
                  {currentCategory && (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#0C3B2E] text-white">
                      Flagship
                    </span>
                  )}
                </div>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] text-[#C5A059] font-bold mt-0.5">
                  {currentCategory ? (currentCategory.title || '').trim() : 'Life · Lifestyle · You'}
                </span>
              </div>
            </Link>
          </div>

          {/* 2. CENTER ZONE: Desktop Navigation Links (Anchored in dead center - ZERO shift or gaps when logging in!) */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs font-semibold tracking-wider uppercase text-[#2C4A3E] whitespace-nowrap absolute left-1/2 -translate-x-1/2">
            {currentCategory ? (
              // Dedicated Category Storefront Navigation (Includes Home + Subcategories)
              <>
                <Link
                  href={`/category/${(currentCategory.slug || '').trim()}`}
                  className={`py-2 relative transition-colors duration-200 hover:text-[#0C3B2E] ${pathname === `/category/${(currentCategory.slug || '').trim()}` && currentSub === 'All'
                      ? 'text-[#0C3B2E] font-bold'
                      : ''
                    }`}
                >
                  Home
                  {pathname === `/category/${(currentCategory.slug || '').trim()}` && currentSub === 'All' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0C3B2E] rounded-full" />
                  )}
                </Link>

                {currentCategory.subcategories
                  .filter((s) => (s || '').trim() !== 'All')
                  .slice(0, 4)
                  .map((sub) => {
                    const cleanSub = (sub || '').trim();
                    const isSubActive = currentSub === cleanSub;
                    return (
                      <Link
                        key={cleanSub}
                        href={`/category/${(currentCategory.slug || '').trim()}?sub=${encodeURIComponent(cleanSub)}`}
                        className={`py-2 relative transition-colors duration-200 hover:text-[#0C3B2E] ${isSubActive ? 'text-[#0C3B2E] font-bold' : ''
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

                {/* Switcher back to Main Purnya Portal */}
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FAF8F5] hover:bg-[#EBF3EF] border border-[#C5A059]/40 text-[#0C3B2E] text-[11px] font-bold normal-case tracking-normal transition-all shadow-xs"
                  title="Open Main Purnya Worlds Portal in new tab"
                >
                  <span>Main Portal</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </Link>
              </>
            ) : (
              // Main Multi-Category Portal Navigation
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

          {/* 3. RIGHT ZONE: Action Icons (Wishlist & Cart ONLY show after login as requested!) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 justify-end z-10">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 text-[#2C4A3E] hover:text-[#0C3B2E] hover:bg-[#EBF3EF] rounded-full transition-all cursor-pointer"
              aria-label="Search"
              title="Search catalog"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist with Badge (APPEARS ONLY AFTER LOGIN) */}
            {user?.email && (
              <Link
                href="/wishlist"
                className="p-2.5 text-[#2C4A3E] hover:text-[#0C3B2E] hover:bg-[#EBF3EF] rounded-full transition-all relative animate-in fade-in"
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

            {/* Cart with Badge (APPEARS ONLY AFTER LOGIN) */}
            {user?.email && (
              <Link
                href="/cart"
                className="p-2.5 text-[#2C4A3E] hover:text-[#0C3B2E] hover:bg-[#EBF3EF] rounded-full transition-all relative animate-in fade-in"
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
            )}

            {/* Profile Button with Popover / Modal Trigger */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={handleProfileClick}
                className="flex flex-col items-center justify-center group py-1 px-1.5 rounded-xl hover:bg-[#EBF3EF] transition-all cursor-pointer focus:outline-hidden"
                aria-label={user?.email ? 'Customer Account Menu' : 'Sign In'}
                title={user?.email ? `Account Options (${user.name || user.email})` : 'Sign In / Register'}
              >
                {user?.email ? (
                  // CUTE LOGGED-IN AVATAR WITH NAME DIRECTLY UNDER IT
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#0C3B2E] to-[#08281F] text-[#FAF8F5] font-bold text-[11px] sm:text-xs flex items-center justify-center border border-[#C5A059] shadow-xs group-hover:scale-105 transition-transform">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-bold text-[#0C3B2E] max-w-[70px] truncate text-center leading-tight mt-0.5 tracking-tight group-hover:text-[#C5A059] transition-colors">
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
              {user?.email && profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-[#E2DBD0] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
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
                          <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-[#0B241C] group-hover:text-[#0C3B2E]">
                            Shopping Bag
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

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[117px] bottom-0 bg-black/40 backdrop-blur-sm z-50">
            <div className="bg-[#FAF8F5] h-full max-w-sm w-full p-6 shadow-2xl border-r border-[#E2DBD0] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <img src="/purnya-logo.png" alt="Purnya" className="w-8 h-8 object-contain" />
                <p className="text-xs font-bold uppercase tracking-widest text-[#0C3B2E]">
                  {currentCategory ? `${currentCategory.title.trim()} Store` : 'Shop Five Worlds'}
                </p>
              </div>

              {currentCategory ? (
                <div className="space-y-1">
                  <Link
                    href={`/category/${currentCategory.slug.trim()}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-bold text-[#0C3B2E] bg-[#EBF3EF]"
                  >
                    <span>Home ({currentCategory.title.trim()})</span>
                    <ChevronRight className="w-4 h-4 text-[#C5A059]" />
                  </Link>

                  {currentCategory.subcategories.map((sub) => (
                    <Link
                      key={sub}
                      href={`/category/${currentCategory.slug.trim()}?sub=${encodeURIComponent(sub.trim())}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-semibold text-[#0B241C] hover:bg-white"
                    >
                      <span>{sub.trim()}</span>
                      <ChevronRight className="w-4 h-4 text-[#C5A059]" />
                    </Link>
                  ))}

                  <div className="pt-4 border-t border-[#E2DBD0]/70 mt-2 space-y-2">
                    <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#5A7469]">
                      Switch Category (Opens New Tab)
                    </p>
                    {categories
                      .filter((c) => c.slug.trim() !== currentCategory.slug.trim())
                      .map((otherCat) => (
                        <Link
                          key={otherCat.id}
                          href={`/category/${otherCat.slug.trim()}`}
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
                            <span>{otherCat.title.trim()}</span>
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
                  {navLinks.map((link) => (
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
                  <Package className="w-4 h-4 text-[#C5A059]" />
                  <span>Track Your Order</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleProfileClick();
                  }}
                  className="w-full flex items-center gap-3 py-2 px-3 text-sm text-[#2C4A3E] hover:text-[#0C3B2E] text-left cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#C5A059]" />
                  <span>{user?.email ? `My Account (${user.name || 'Member'})` : 'Sign In / Register'}</span>
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#E2DBD0] mt-4 text-xs text-[#5A7469] space-y-2">
                <p className="font-semibold text-[#0B241C]">Purnya Concierge Support</p>
                <p>care@purnya.in | +91 98765 43210</p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 4. AUTHENTICATION POP-UP MODAL (Appears on clicking profile instead of redirecting to page!) */}
      {authModalOpen && !user?.email && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-[#C5A059]/40 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-[#5A7469] hover:text-[#0B241C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header Brand Logo & Titles */}
            <div className="flex flex-col items-center justify-center text-center space-y-1.5">
              <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center p-1 bg-[#FAF8F5] border-2 border-[#C5A059] mx-auto shadow-md">
                <img
                  src="/purnya-logo.png"
                  alt="Purnya Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-serif-title text-xl font-bold tracking-[0.16em] text-[#0C3B2E] block leading-tight">
                  PURNYA
                </span>
                <span className="text-[9px] uppercase tracking-[0.22em] text-[#C5A059] font-bold block mt-0.5">
                  Maison of Mindful Luxury
                </span>
              </div>
              <h3 className="font-serif-title text-2xl font-bold text-[#0B241C] pt-1">
                {authMode === 'login'
                  ? 'Welcome to Purnya'
                  : authMode === 'signup'
                    ? 'Join Purnya Circle'
                    : 'Reset Password'}
              </h3>
              <p className="text-xs text-[#2C4A3E]">
                {authMode === 'login'
                  ? 'Sign in to access your bespoke orders, wishlist & exclusive benefits.'
                  : authMode === 'signup'
                    ? 'Experience elevated luxury living with personalized curated perks.'
                    : 'Enter your registered email to receive a password reset link.'}
              </p>
            </div>

            {/* Tab Switcher (Only visible for Sign In / Sign Up) */}
            {authMode !== 'forgot' && (
              <div className="flex rounded-2xl bg-[#FAF8F5] p-1 border border-[#E2DBD0]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${authMode === 'login'
                      ? 'bg-[#08281F] text-white shadow-sm'
                      : 'text-[#5A7469] hover:text-[#0B241C]'
                    }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${authMode === 'signup'
                      ? 'bg-[#08281F] text-white shadow-sm'
                      : 'text-[#5A7469] hover:text-[#0B241C]'
                    }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Error Message Display */}
            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Form */}
            {authMode === 'forgot' ? (
              authForgotSent ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <p className="text-xs font-bold text-emerald-900">Recovery Instructions Dispatched</p>
                  <p className="text-[11px] text-emerald-700">
                    We have forwarded a password recovery link to <strong>{authEmail}</strong>. Please check your inbox and spam folder.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setAuthForgotSent(false);
                      setAuthError('');
                    }}
                    className="px-4 py-2 bg-[#08281F] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#0C3B2E]"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!authEmail.trim() || !authEmail.includes('@')) {
                      setAuthError('Please enter a valid email address.');
                      return;
                    }
                    setAuthLoading(true);
                    setAuthError('');
                    const res = await sendPasswordResetEmail(authEmail.trim());
                    setAuthLoading(false);
                    if (res.success) {
                      setAuthForgotSent(true);
                    } else {
                      setAuthError(res.error || 'Failed to dispatch reset link. Please try again.');
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A3E]">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A7469]" />
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2DBD0] bg-[#FAF8F5] focus:bg-white text-xs font-medium focus:border-[#C5A059] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 px-6 rounded-xl bg-[#08281F] hover:bg-[#0C3B2E] text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <span>Send Recovery Link</span>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setAuthError('');
                      }}
                      className="text-xs font-semibold text-[#5A7469] hover:text-[#0B241C] cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A3E]">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A7469]" />
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="e.g. Devendra Sharma"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2DBD0] bg-[#FAF8F5] focus:bg-white text-xs font-medium focus:border-[#C5A059] focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A3E]">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A7469]" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2DBD0] bg-[#FAF8F5] focus:bg-white text-xs font-medium focus:border-[#C5A059] focus:outline-hidden"
                    />
                  </div>
                </div>

                {authMode === 'signup' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A3E]">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A7469]" />
                      <input
                        type="tel"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2DBD0] bg-[#FAF8F5] focus:bg-white text-xs font-medium focus:border-[#C5A059] focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A3E]">
                      Password
                    </label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setAuthError('');
                          setAuthForgotSent(false);
                        }}
                        className="text-[10px] text-[#C5A059] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A7469]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#E2DBD0] bg-[#FAF8F5] focus:bg-white text-xs font-medium focus:border-[#C5A059] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A7469] hover:text-[#0B241C]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50 mt-4"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>{authMode === 'login' ? 'Sign In to Purnya' : 'Create Account'}</span>
                  )}
                </button>
              </form>
            )}

            {/* Quick Demo Login Shortcut */}
            <div className="pt-2 text-center border-t border-[#F0ECE4]">
              <button
                type="button"
                onClick={() => {
                  loginUser({
                    name: 'Devendra Sharma',
                    email: 'devendra@purnya.in',
                    phone: '+91 98765 43210',
                  });
                  setAuthModalOpen(false);
                  showToast('Welcome, Devendra ✨', 'Signed in seamlessly to Purnya Circle.');
                }}
                className="text-[11px] font-semibold text-[#0C3B2E] hover:text-[#C5A059] transition-colors cursor-pointer"
              >
                Instant 1-Click Demo Sign In ⚡
              </button>
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
