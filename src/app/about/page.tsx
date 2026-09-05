'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Heart, Leaf } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero */}
      <section className="relative w-full h-[360px] sm:h-[440px] bg-[#0B241C] flex items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=1600&fit=crop&auto=format"
          alt="About Purnya"
          className="w-full h-full object-cover absolute inset-0 opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center text-white space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.25em]">
            <Sparkles className="w-3.5 h-3.5" />
            Our Heritage & Vision
          </span>
          <h1 className="font-serif-title text-4xl sm:text-6xl font-bold tracking-tight">
            The Story of Purnya
          </h1>
          <p className="text-sm sm:text-base text-[#FAF8F5]/90 max-w-xl mx-auto leading-relaxed">
            One unified destination for elevated everyday living. Born from a vision of pure harmony, 
            intentional craftsmanship, and timeless elegance.
          </p>
        </div>
      </section>

      {/* Main Philosophy */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10 text-xs sm:text-sm text-[#2C4A3E] leading-relaxed">
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <h2 className="font-serif-title text-2xl sm:text-4xl font-bold text-[#0B241C]">
            Five Worlds. One Soul.
          </h2>
          <p>
            The word <em>Purnya</em> represents complete purity, wholeness, and mindful abundance. 
            We set out to challenge the fragmentation of modern lifestyle shopping by bringing five 
            essential domains together under one singular aesthetic and moral compass.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E2DBD0] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3EF] text-[#C5A059] flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="font-serif-title text-base font-bold text-[#0B241C]">Artisanal Integrity</h3>
            <p className="text-xs">
              Every candle, tea blend, and piece of jewellery is formulated using ethical, sustainable, and non-toxic materials.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E2DBD0] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3EF] text-[#C5A059] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-serif-title text-base font-bold text-[#0B241C]">Uncompromising Quality</h3>
            <p className="text-xs">
              From 18K gold plating to Himalayan wild-harvested honey, our standards are designed to outlast passing trends.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E2DBD0] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3EF] text-[#C5A059] flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-serif-title text-base font-bold text-[#0B241C]">Gifting With Heart</h3>
            <p className="text-xs">
              We create heirlooms and hampers intended to spark lasting memories and heartfelt bonds.
            </p>
          </div>
        </div>

        <div className="pt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#C5A059] hover:bg-[#D4AF37] text-[#0B241C] font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
          >
            <span>Explore The Storefront</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
