'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Boxes,
  Ticket,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Menu,
  X,
  Bell,
  Search,
  Users,
  Truck,
  RotateCcw,
  BarChart3,
  LogOut,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { orders } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setIsAuthenticated(true);
      return;
    }
    const auth = typeof window !== 'undefined' && localStorage.getItem('purnya_admin_authenticated') === 'true';
    if (!auth) {
      window.location.href = '/admin/login';
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname]);

  const handleAdminLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('purnya_admin_authenticated');
      localStorage.removeItem('purnya_admin_session');
      window.location.href = '/admin/login';
    }
  };

  // If viewing admin login page, bypass admin navigation layout
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Authentication validation splash
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

  const navItems = [
    { name: 'Dashboard Overview', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Products Catalog', href: '/admin/products', icon: <Package className="w-4 h-4" /> },
    { name: 'Categories & Subcats', href: '/admin/categories', icon: <Layers className="w-4 h-4" /> },
    {
      name: 'Orders Management',
      href: '/admin/orders',
      icon: <ShoppingBag className="w-4 h-4" />,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    { name: 'Inventory & Stock', href: '/admin/inventory', icon: <Boxes className="w-4 h-4" /> },
    { name: 'Customers & Patrons', href: '/admin/customers', icon: <Users className="w-4 h-4" /> },
    { name: 'Shipping & Logistics', href: '/admin/shipping', icon: <Truck className="w-4 h-4" /> },
    { name: 'Returns & Exchanges', href: '/admin/returns', icon: <RotateCcw className="w-4 h-4" /> },
    { name: 'Offers & Coupons', href: '/admin/coupons', icon: <Ticket className="w-4 h-4" /> },
    { name: 'Banners & Content', href: '/admin/banners', icon: <ImageIcon className="w-4 h-4" /> },
    { name: 'Reports & Analytics', href: '/admin/reports', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex text-[#0B241C]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-64 bg-[#08281F] text-[#FAF8F5] border-r border-[#144234] z-50 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 flex flex-col h-full overflow-hidden">
          {/* Admin Header */}
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

          {/* Navigation Links - Scrollable */}
          <nav className="flex-1 overflow-y-auto py-4 space-y-1 text-xs font-semibold pr-1 custom-scrollbar">
            {navItems.map((item) => {
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
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Storefront & Sign Out */}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Top Header */}
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
                P
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#0B241C] leading-tight">Admin Console</p>
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

        {/* Content Container */}
        <main className="p-4 sm:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
