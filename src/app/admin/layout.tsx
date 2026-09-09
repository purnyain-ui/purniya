'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Boxes,
  Ticket,
  Image as ImageIcon,
  ExternalLink,
  Menu,
  X,
  Users,
  Truck,
  RotateCcw,
  BarChart3,
  LogOut,
  Palette,
  Home,
  CreditCard,
  ChevronDown,
  ChevronRight,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { verifyAdminSession, signOutFromSupabase } from '../../lib/supabase';
import {
  AdminSession,
  AdminPermissionKey,
  hasPermission,
  isSuperAdmin,
  permissionKeyForPath,
  readAdminSession,
  clearAdminSession,
} from '../../lib/adminPermissions';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  key: AdminPermissionKey;
  badge?: number;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { orders } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);

  const [homeManagementOpen, setHomeManagementOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/admin/home')) {
      setHomeManagementOpen(true);
    }
  }, [pathname]);

  // Authenticate, then load the session's role/permissions for RBAC.
  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsAuthenticated(true);
      return;
    }

    const localSession = readAdminSession();
    const localFlag =
      typeof window !== 'undefined' &&
      localStorage.getItem('purnya_admin_authenticated') === 'true';

    // Sessions created via the plaintext admin_users fallback or the dev
    // "Quick Access" button never created a real Supabase Auth session, so
    // verifyAdminSession() (which checks Supabase) will always report
    // "not authenticated" for them a moment after login. Trust the locally
    // stored session directly for those auth methods instead of calling it.
    if (localFlag && localSession && localSession.authMethod !== 'supabase') {
      setIsAuthenticated(true);
      setAdminSession(localSession);
      return;
    }

    let isCancelled = false;
    verifyAdminSession().then((res) => {
      if (isCancelled) return;
      if (res.authenticated) {
        setIsAuthenticated(true);
        setAdminSession(readAdminSession());
        if (typeof window !== 'undefined') {
          localStorage.setItem('purnya_admin_authenticated', 'true');
        }
      } else {
        setIsAuthenticated(false);
        clearAdminSession();
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [pathname]);

  // Route guard: redirect away from sections the sub-admin isn't permitted to see.
  useEffect(() => {
    if (pathname === '/admin/login' || isAuthenticated !== true || !adminSession) return;

    const requiredKey = permissionKeyForPath(pathname);
    if (requiredKey && !hasPermission(adminSession, requiredKey)) {
      router.replace('/admin');
    }
  }, [pathname, isAuthenticated, adminSession, router]);

  const handleAdminLogout = async () => {
    clearAdminSession();
    await signOutFromSupabase();
    window.location.href = '/admin/login';
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#08281F] flex flex-col items-center justify-center text-[#FAF8F5]">
        <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="font-serif-title text-base font-bold tracking-widest text-[#FAF8F5] block">
          PURNYA
        </span>
        <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold mt-1">
          Verifying Merchant Studio Access...
        </p>
      </div>
    );
  }

  const pendingOrdersCount = orders.filter((o) => o.status === 'New' || o.status === 'Processing').length;

  const allNavItems: NavItem[] = [
    { name: 'Dashboard Overview', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" />, key: 'dashboard' },
    { name: 'Products Catalog', href: '/admin/products', icon: <Package className="w-4 h-4" />, key: 'products' },
    { name: 'Categories & Subcats', href: '/admin/categories', icon: <Layers className="w-4 h-4" />, key: 'categories' },
    { name: 'Attributes & Badges', href: '/admin/attributes', icon: <Palette className="w-4 h-4" />, key: 'attributes' },
    {
      name: 'Orders Management',
      href: '/admin/orders',
      icon: <ShoppingBag className="w-4 h-4" />,
      key: 'orders',
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    { name: 'Inventory & Stock', href: '/admin/inventory', icon: <Boxes className="w-4 h-4" />, key: 'inventory' },
    { name: 'Payments Update', href: '/admin/payments', icon: <CreditCard className="w-4 h-4" />, key: 'payments' },
    { name: 'Customers & Patrons', href: '/admin/customers', icon: <Users className="w-4 h-4" />, key: 'customers' },
    { name: 'Shipping & Logistics', href: '/admin/shipping', icon: <Truck className="w-4 h-4" />, key: 'shipping' },
    { name: 'Returns & Exchanges', href: '/admin/returns', icon: <RotateCcw className="w-4 h-4" />, key: 'returns' },
    { name: 'Offers & Coupons', href: '/admin/coupons', icon: <Ticket className="w-4 h-4" />, key: 'coupons' },
    { name: 'Banners & Content', href: '/admin/banners', icon: <ImageIcon className="w-4 h-4" />, key: 'banners' },
    { name: 'Reports & Analytics', href: '/admin/reports', icon: <BarChart3 className="w-4 h-4" />, key: 'reports' },
    { name: 'Admin Management', href: '/admin/management', icon: <UserCheck className="w-4 h-4" />, key: 'management' },
  ];

  const homeSubItems = [
    { name: 'Middle Section', href: '/admin/home/middle-section' },
    { name: 'Bottom Section', href: '/admin/home/bottom-section' },
  ];

  // Filter nav by permission. Dashboard stays pinned separately below.
  const visibleNavItems = allNavItems
    .slice(1)
    .filter((item) => hasPermission(adminSession, item.key));
  const canSeeHome = hasPermission(adminSession, 'home');
  const canSeeDashboard = hasPermission(adminSession, 'dashboard');

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#0B241C]">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-[#08281F] text-[#FAF8F5] border-r border-[#144234] z-50 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between pb-5 border-b border-[#144234] shrink-0">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-[#FAF8F5] border border-[#C5A059] flex items-center justify-center p-0.5 shrink-0">
                <img src="/purnya-logo.png" alt="Purnya" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-serif-title font-bold text-base tracking-wider text-white block leading-tight">
                  PURNYA
                </span>
                <span className="block text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold">
                  Merchant Studio
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-[#5A7469] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Signed-in admin identity + role badge */}
          {adminSession && (
            <div className="pt-3 pb-1 shrink-0">
              <p className="text-[11px] font-semibold text-white truncate">
                {adminSession.fullName || adminSession.email}
              </p>
              <span
                className={`inline-block mt-1 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${
                  isSuperAdmin(adminSession.role)
                    ? 'bg-[#144234] text-[#D4AF37] border-[#C5A059]/30'
                    : 'bg-white/5 text-[#8BAAA0] border-white/10'
                }`}
              >
                {adminSession.role}
              </span>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto py-4 space-y-1 text-xs font-semibold pr-1 custom-scrollbar">
            {canSeeDashboard && (
              <Link
                href="/admin"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                  pathname === '/admin'
                    ? 'bg-[#C5A059] text-[#1E130D] font-bold shadow-md'
                    : 'text-[#C9BDB0] hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="truncate">Dashboard Overview</span>
                </div>
              </Link>
            )}

            {canSeeHome && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setHomeManagementOpen((prev) => !prev)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                    pathname.startsWith('/admin/home')
                      ? 'bg-white/10 text-white font-bold'
                      : 'text-[#C9BDB0] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Home className="w-4 h-4" />
                    <span className="truncate">Home Management</span>
                  </div>
                  {homeManagementOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#D4AF37]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#5A7469]" />
                  )}
                </button>

                {homeManagementOpen && (
                  <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-[#144234] ml-4">
                    {homeSubItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center px-3 py-2 rounded-lg text-[11px] transition-all ${
                            isSubActive
                              ? 'bg-[#C5A059] text-[#1E130D] font-bold shadow-sm'
                              : 'text-[#A3B8B0] hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="truncate">{sub.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#C5A059] text-[#1E130D] font-bold shadow-md'
                      : 'text-[#C9BDB0] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {!canSeeDashboard && visibleNavItems.length === 0 && !canSeeHome && (
              <div className="flex items-start gap-2 px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-[#8BAAA0] text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#D4AF37]" />
                <span>No sections have been assigned to this account yet. Contact a Super Administrator.</span>
              </div>
            )}
          </nav>

          <div className="pt-3 border-t border-[#144234] shrink-0 space-y-1.5">
            <Link
              href="/"
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all border border-white/10"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Storefront</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">Live</span>
            </Link>

            <button
              type="button"
              onClick={handleAdminLogout}
              className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 text-xs font-semibold transition-all border border-rose-900/30 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out Admin</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E2DBD0] px-4 sm:px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#0B241C] hover:text-[#C5A059]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A7469] hidden sm:inline">
              Centralized Control Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-[#C5A059] hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Customer View</span>
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-[#E2DBD0]">
              <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-center font-bold text-xs text-[#C5A059]">
                {(adminSession?.fullName || adminSession?.email || 'P').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#0B241C] leading-tight">
                  {adminSession?.role || 'Admin Console'}
                </p>
                <p className="text-[10px] text-emerald-700 font-semibold">● Operational</p>
              </div>
              <button
                type="button"
                onClick={handleAdminLogout}
                title="Sign out of Admin Console"
                className="ml-2 p-1.5 text-[#5A7469] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}