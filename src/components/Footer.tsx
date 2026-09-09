'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Footer() {
  const pathname = usePathname();
  const { showToast, categories } = useStore();
  const [email, setEmail] = useState('');

  const isAdminRoute = pathname?.startsWith('/admin');
  if (isAdminRoute) return null;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', undefined, 'error');
      return;
    }
    showToast('Subscribed to Purnya Circle!', 'Check your inbox for your 10% welcome coupon.', 'success');
    setEmail('');
  };

  return (
    <footer className="bg-[#08281F] text-[#FAF8F5] pt-16 pb-12 border-t border-[#144234]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center p-0.5 bg-[#FAF8F5] border border-[#C5A059] shrink-0">
                <img src="/purnya-logo.png" alt="Purnya" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif-title text-3xl font-bold tracking-[0.2em] text-white group-hover:text-[#D4AF37] transition-colors leading-none">
                  PURNYA
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mt-1">
                  Life · Lifestyle · You
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-[#B4C9BF] leading-relaxed max-w-sm pt-2">
              Purnya is a unified lifestyle sanctuary offering curated collections across handcrafted jewellery, 
              clean sand wax home fragrances, timeless decor, pure organic wellness, and personalized gifts.
            </p>

            <div className="pt-2 text-xs text-[#B4C9BF] space-y-2">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>No.138, Canara Bank Main Road, Neraluru, Virupakshipura Hobli, Channapattana Taluk, Bengaluru South District, Karnataka 562138</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a href="tel:+917892297609" className="hover:text-[#FAF8F5] transition-colors">
                  +91 7892297609 (Mon–Sat, 10 AM–6 PM IST)
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a href="mailto:care@purnya.in" className="hover:text-[#FAF8F5] transition-colors">
                  care@purnya.in
                </a>
              </p>
            </div>
          </div>

          {/* Shop Col */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-base font-semibold text-[#D4AF37] tracking-wider uppercase flex items-center gap-1.5">
              <span>Shop Boutiques</span>
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#B4C9BF]">
              {categories.map((cat) => (
                <li key={cat.id || cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#D4AF37] transition-colors flex items-center justify-between group"
                    title={`Open ${cat.title} Boutique in new tab`}
                  >
                    <span>{cat.title}</span>
                    <ArrowUpRight className="w-3 h-3 text-[#D4AF37]/60 group-hover:text-[#D4AF37] transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-base font-semibold text-[#D4AF37] tracking-wider uppercase">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#B4C9BF]">
              <li><Link href="/order-tracking" className="hover:text-[#D4AF37] transition-colors">Track Your Order</Link></li>
              <li><Link href="/account" className="hover:text-[#D4AF37] transition-colors">My Account</Link></li>
              <li><Link href="/wishlist" className="hover:text-[#D4AF37] transition-colors">My Wishlist</Link></li>
              <li><Link href="/about" className="hover:text-[#D4AF37] transition-colors">About Purnya</Link></li>
              <li><Link href="/contact" className="hover:text-[#D4AF37] transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-[#D4AF37] transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Newsletter & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-base font-semibold text-[#D4AF37] tracking-wider uppercase">
              Stay Connected
            </h4>
            <p className="text-xs text-[#B4C9BF] leading-relaxed">
              Subscribe for exclusive previews, festive hampers, and private lifestyle releases.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full py-2.5 px-3.5 pr-10 rounded-xl bg-white/10 border border-white/20 text-xs text-[#FAF8F5] placeholder:text-[#849C92] focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 p-1.5 bg-[#C5A059] hover:bg-[#D4AF37] text-[#08281F] rounded-lg transition-colors font-bold"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            <div className="pt-3">
              <p className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider mb-2">Policies</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#849C92]">
                <Link href="/shipping-policy" className="hover:text-[#FAF8F5]">Shipping</Link>
                <span>·</span>
                <Link href="/return-policy" className="hover:text-[#FAF8F5]">Returns</Link>
                <span>·</span>
                <Link href="/privacy-policy" className="hover:text-[#FAF8F5]">Privacy</Link>
                <span>·</span>
                <Link href="/terms" className="hover:text-[#FAF8F5]">Terms</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#144234] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#849C92]">
          <p>© {new Date().getFullYear()} Purnya.in · All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-[#D4AF37]">
            <span>Harmonious Lifestyle Across Five Worlds</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
