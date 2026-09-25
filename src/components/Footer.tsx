'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function Footer() {
  const pathname = usePathname();
  const { categories } = useStore();

  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="bg-[#08281F] text-[#FAF8F5] pt-16 pb-8 border-t border-[#144234]">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-6 xl:gap-10 mb-14">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center p-0.5 bg-[#FAF8F5] border border-[#C5A059] shrink-0">
                <img
                  src="/logoicon.png"
                  alt="Purnya"
                  className="w-full h-full object-contain"
                />
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
              Purnya is a unified lifestyle sanctuary offering curated
              collections across handcrafted jewellery, clean sand wax home
              fragrances, timeless decor, pure organic wellness, and personalized
              gifts.
            </p>

            <div className="pt-2 text-xs text-[#B4C9BF] space-y-2">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>
                  No.138, Canara Bank Main Road, Neraluru, Virupakshipura Hobli,
                  Channapattana Taluk, Bengaluru South District, Karnataka 562138
                </span>
              </p>

              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a
                  href="tel:+917892297609"
                  className="hover:text-[#FAF8F5] transition-colors"
                >
                  +91 7892297609 (Mon–Sat, 10 AM–6 PM IST)
                </a>
              </p>

              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a
                  href="mailto:care@purnya.in"
                  className="hover:text-[#FAF8F5] transition-colors"
                >
                  care@purnya.in
                </a>
              </p>
            </div>
          </div>

          {/* Menu */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-base font-semibold text-[#D4AF37] tracking-wider uppercase">
              Menu
            </h4>

            <ul className="space-y-2 text-xs sm:text-sm text-[#B4C9BF]">
              <li>
                <Link
                  href="/"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  About Purnya
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Shop */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-base font-semibold text-[#D4AF37] tracking-wider uppercase">
              Shop Boutiques
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
              <li>
                <Link
                  href="/order-tracking"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link
                  href="/account"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  My Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-base font-semibold text-[#D4AF37] tracking-wider uppercase">
              Policies
            </h4>

            <ul className="space-y-2 text-xs sm:text-sm text-[#B4C9BF]">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/return-policy#shipping"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Shipping & Delivery Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/return-policy#returns"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Returns and Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar — all three items on one line */}
        <div className="border-t border-[#144234] pt-6 overflow-x-auto">
          <div className="flex items-center justify-between gap-6 whitespace-nowrap text-xs text-[#849C92]">
            <p className="shrink-0">
              © {new Date().getFullYear()} Purnya.in · All rights reserved.
            </p>

            <p className="shrink-0 text-[#D4AF37]">
              Harmonious Lifestyle Across Five Worlds
            </p>

            <p className="shrink-0">
              Designed and Developed by{' '}
              <a
                href="https://rakvih.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#D4AF37] hover:text-white transition-colors"
              >
                Rakvih
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}