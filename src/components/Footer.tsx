'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { initialCategories } from '../data/mockData';

function InstagramIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function WhatsAppIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Footer() {
  const pathname = usePathname();
  const { categories } = useStore();

  const categoriesList = useMemo(() => {
    return categories && categories.length > 0 ? categories : initialCategories;
  }, [categories]);

  // Shop categories mapped to dynamic/fallback slugs
  const shopCategories = useMemo(() => {
    const list = [
      { title: 'Jewellery & Accessories', defaultSlug: 'apparel' },
      { title: 'Candle & Home Fragrance', defaultSlug: 'Fragrance' },
      { title: 'Home Décor & Lifestyle', defaultSlug: 'Lifestyle' },
      { title: 'Organic & Wellness', defaultSlug: 'Wellness' },
      { title: 'Gifts & Stationery', defaultSlug: 'Gift' },
    ];

    return list.map((item) => {
      const match = categoriesList.find((c) => {
        const s = (c.slug || '').trim().toLowerCase();
        const t = (c.title || '').trim().toLowerCase();
        return (
          s === item.defaultSlug.toLowerCase() ||
          t === item.title.toLowerCase() ||
          t.includes(item.title.toLowerCase().split('&')[0].trim())
        );
      });
      return {
        title: item.title,
        slug: match ? (match.slug || item.defaultSlug) : item.defaultSlug,
      };
    });
  }, [categoriesList]);

  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="bg-[#08281F] text-[#FAF8F5] pt-16 pb-8 border-t border-[#144234]">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-6 xl:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6 xl:gap-8 mb-14">
          {/* Brand & Contact Column */}
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 space-y-4">
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
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mt-1">
                  Thoughtfully · Curated · Beautifully Yours
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-[#B4C9BF] leading-relaxed max-w-md pt-1">
              Purnya is a thoughtfully curated lifestyle destination bringing
              together jewellery, home fragrance, décor, organic wellness, and
              meaningful gifts — designed to add beauty and warmth to everyday
              living.
            </p>

            <div className="pt-2 text-xs text-[#B4C9BF] space-y-2.5">
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  No.138, Canara Bank Main Road, Neraluru, Virupakshipura Hobli,
                  Channapattana Taluk, Bengaluru South District, Karnataka 562138
                </span>
              </p>

              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a
                  href="tel:+917892297609"
                  className="hover:text-[#FAF8F5] transition-colors"
                >
                  +91 7892297609 (Mon–Sat, 10 AM–6 PM IST)
                </a>
              </p>

              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a
                  href="mailto:care@purnya.in"
                  className="hover:text-[#FAF8F5] transition-colors"
                >
                  care@purnya.in
                </a>
              </p>
            </div>

            {/* Social Follow */}
            <div className="pt-3 border-t border-[#144234]/70">
              <h5 className="font-serif-title text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37] mb-2">
                FOLLOW PURNYA
              </h5>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#B4C9BF]">
                <a
                  href="https://www.instagram.com/purnya.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1.5"
                  title="Follow Purnya on Instagram"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </a>
                <span className="text-[#5A7469]">·</span>
                <a
                  href="https://wa.me/917892297609?text=Hello%20Purnya%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1.5"
                  title="Connect on WhatsApp"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-sm sm:text-base font-semibold text-[#D4AF37] tracking-wider uppercase">
              QUICK LINKS
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
              <li>
                <Link
                  href="/order-tracking"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* SHOP BY CATEGORY */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-sm sm:text-base font-semibold text-[#D4AF37] tracking-wider uppercase">
              SHOP BY CATEGORY
            </h4>

            <ul className="space-y-2.5 text-xs sm:text-sm text-[#B4C9BF]">
              {shopCategories.map((cat) => (
                <li key={cat.title}>
                  <Link
                    href={`/category/${encodeURIComponent((cat.slug || '').trim())}`}
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

          {/* CUSTOMER CARE */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-sm sm:text-base font-semibold text-[#D4AF37] tracking-wider uppercase">
              CUSTOMER CARE
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
              <li>
                <Link
                  href="/return-policy#shipping"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Shipping &amp; Delivery
                </Link>
              </li>
              <li>
                <Link
                  href="/return-policy#returns"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Returns &amp; Refunds
                </Link>
              </li>
            </ul>
          </div>

          {/* POLICIES */}
          <div className="space-y-3">
            <h4 className="font-serif-title text-sm sm:text-base font-semibold text-[#D4AF37] tracking-wider uppercase">
              POLICIES
            </h4>

            <ul className="space-y-2 text-xs sm:text-sm text-[#B4C9BF]">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Terms &amp; Conditions
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
                  Shipping &amp; Delivery
                </Link>
              </li>
              <li>
                <Link
                  href="/return-policy#returns"
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Returns &amp; Refunds
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#144234] pt-6 overflow-x-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#849C92]">
            <p className="shrink-0">
              © {new Date().getFullYear()} Purnya.in · All rights reserved.
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