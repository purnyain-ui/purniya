'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Heart,
  Leaf,
  Gem,
  Flame,
  Home,
  Gift,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function AboutPage() {
  const { categories } = useStore();
  const fiveWorlds = [
    {
      id: 'jewellery',
      title: 'Jewellery & Accessories',
      tagline: 'Heirlooms in Motion',
      desc: 'Artisanal 18K gold vermeil, cultured pearls, and hand-cut stones crafted by master silversmiths to celebrate your personal milestone moments.',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&fit=crop&auto=format',
      link: '/category/jewellery-accessories',
      icon: Gem,
    },
    {
      id: 'candle',
      title: 'Candle & Home Fragrance',
      tagline: 'Atmospheres of Serenity',
      desc: 'Hand-poured coconut-soy candles with lead-free cotton wicks and clean botanical fragrances formulated to transform your room into a tranquil sanctuary.',
      image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&fit=crop&auto=format',
      link: '/category/candle-home-fragrance',
      icon: Flame,
    },
    {
      id: 'decor',
      title: 'Home Decor & Lifestyle',
      tagline: 'Sanctuaries of Grace',
      desc: 'Hand-cast brass, glazed stoneware, and sculptural vessels that elevate everyday living into an artful and serene ritual.',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=800&fit=crop&auto=format',
      link: '/category/home-decor-lifestyle',
      icon: Home,
    },
    {
      id: 'wellness',
      title: 'Organic & Wellness',
      tagline: 'Earth-Derived Vitality',
      desc: 'Himalayan raw honeys, whole-leaf floral tisanes, and cold-pressed botanical elixirs harvested consciously with regenerative farming communities.',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&fit=crop&auto=format',
      link: '/category/organic-wellness',
      icon: Leaf,
    },
    {
      id: 'gift',
      title: 'Gift & Stationery',
      tagline: 'The Art of Thoughtful Giving',
      desc: 'Deckle-edge paper, wax-sealed stationery, and bespoke curated gift hampers created to leave an indelible impression of heartfelt elegance.',
      image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&fit=crop&auto=format',
      link: '/category/gift-stationery',
      icon: Gift,
    },
  ];

  // Dynamically resolve category cards from Supabase database categories
  const worlds = useMemo(() => {
    if (!categories || categories.length === 0) {
      return fiveWorlds;
    }

    return categories.map((cat, index) => {
      const slug = (cat.slug || '').trim().toLowerCase();
      const title = (cat.title || '').trim().toLowerCase();

      let icon = Gem;
      let tagline = 'Heirlooms in Motion';
      let fallbackDesc =
        'Artisanal creations crafted by master silversmiths to celebrate your personal milestone moments.';

      if (slug.includes('fragrance') || title.includes('candle')) {
        icon = Flame;
        tagline = 'Atmospheres of Serenity';
        fallbackDesc =
          'Hand-poured coconut-soy candles with clean botanical fragrances formulated to transform your room into a tranquil sanctuary.';
      } else if (slug.includes('lifestyle') || title.includes('decor')) {
        icon = Home;
        tagline = 'Sanctuaries of Grace';
        fallbackDesc =
          'Hand-cast brass, glazed stoneware, and sculptural vessels that elevate everyday living into an artful ritual.';
      } else if (slug.includes('wellness') || title.includes('organic')) {
        icon = Leaf;
        tagline = 'Earth-Derived Vitality';
        fallbackDesc =
          'Himalayan raw honeys, whole-leaf floral tisanes, and cold-pressed botanical elixirs harvested consciously.';
      } else if (slug.includes('gift') || title.includes('station')) {
        icon = Gift;
        tagline = 'The Art of Thoughtful Giving';
        fallbackDesc =
          'Deckle-edge paper, wax-sealed stationery, and bespoke curated gift hampers created for lasting impressions.';
      }

      // Real images pulled directly from the Supabase database
      const dbImage =
        cat.bannerImage?.trim() ||
        cat.heroImage?.trim() ||
        (cat.subcatImages && cat.subcatImages[0]?.image?.trim()) ||
        '';

      // Clean subtitle (stripping any generic filler prompts from database)
      const cleanDesc = cat.subtitle
        ? cat.subtitle
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s.length > 20 && !s.toLowerCase().startsWith('here is a'))[0] ||
          cat.subtitle.split('\n')[0]
        : fallbackDesc;

      return {
        id: cat.id || `world-${index}`,
        title: (cat.title || 'Curated Category').trim().replace(/é/g, 'e').replace(/É/g, 'E'),
        tagline,
        desc: cleanDesc.replace(/é/g, 'e').replace(/É/g, 'E'),
        image: dbImage || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&fit=crop&auto=format',
        link: `/category/${cat.slug || cat.id}`,
        icon,
      };
    });
  }, [categories]);

  const pillars = [
    {
      icon: Award,
      title: 'Generational Craft',
      desc: 'Direct partnerships with master artisan clusters across India, keeping ancestral metalcraft, ceramic artistry, and stone setting alive.',
    },
    {
      icon: Leaf,
      title: 'Conscious Purity',
      desc: 'Strictly zero toxic paraffin, zero phthalates, and 100% cruelty-free materials housed in reusable, recyclable, and biodegradable packaging.',
    },
    {
      icon: ShieldCheck,
      title: 'Enduring Longevity',
      desc: 'We reject disposable trends. Every creation is conceived as a durable heirloom intended to be cherished across generations.',
    },
    {
      icon: Heart,
      title: 'Bespoke Care & Gifting',
      desc: 'Personalized monogramming, handwritten wax-sealed notes, and bespoke packaging crafted with thoughtful care for your celebrations.',
    },
  ];

  const stats = [
    { value: '5', label: 'Curated Lifestyle Worlds' },
    { value: '100%', label: 'Clean & Ethical Materials' },
    { value: '40+', label: 'Artisan Families Supported' },
    { value: '10,000+', label: 'Moments of Harmony Delivered' },
  ];

  return (
    <div className="space-y-20 sm:space-y-28 pb-24 bg-[#FAF8F5]">
      {/* 1. Grand Hero Section */}
      <section className="relative w-full min-h-[520px] sm:min-h-[600px] bg-[#08281F] flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=1920&fit=crop&auto=format"
          alt="Purnya Lifestyle Heritage"
          className="w-full h-full object-cover absolute inset-0 opacity-25 scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08281F] via-[#08281F]/60 to-black/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#C5A059]/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center text-white space-y-6 pt-12 pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-[#C5A059]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] shadow-lg animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Maison of Mindful Luxury · Est. 2024</span>
          </div>

          <h1 className="font-serif-title text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#FAF8F5] leading-[1.15]">
            Artisan Craft, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FAF8F5] via-[#D4AF37] to-[#C5A059]">
              Conscious Living.
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-[#E0E8E4] max-w-2xl mx-auto leading-relaxed font-light">
            One unified sanctuary for elevated everyday living. Born from a vision of wholeness, 
            ancestral craftsmanship, and timeless elegance for modern homes.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#C5A059] hover:bg-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-wider shadow-xl hover:scale-105 transition-all"
            >
              <span>Explore The Five Worlds</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF8F5] border border-white/20 font-bold text-xs uppercase tracking-wider backdrop-blur-xs transition-all"
            >
              <span>Speak to Customer Care</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Stats Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DBD0] shadow-xl">
          {stats.map((item, idx) => (
            <div key={idx} className="text-center space-y-1">
              <p className="font-serif-title text-2xl sm:text-4xl font-bold text-[#0C3B2E]">
                {item.value}
              </p>
              <p className="text-xs sm:text-sm text-[#5A7469] font-medium tracking-wide">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. The Meaning of Purnya — Brand Origin Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
              <span className="w-8 h-px bg-[#C5A059]" />
              <span>Our Sacred Philosophy</span>
            </div>

            <h2 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C] leading-tight">
              The Meaning of <br />
              <span className="italic font-normal">Purnya.</span>
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-[#2C4A3E] leading-relaxed">
              <p>
                The word <strong className="text-[#0B241C]">Purnya</strong> originates from the Sanskrit 
                <em> Pūrṇa</em>, signifying complete wholeness, pristine purity, and sacred abundance. 
                It embodies the belief that a well-lived life is not assembled from hurried conveniences, 
                but curated through mindful rituals and objects crafted with soul.
              </p>
              <p>
                In an era dominated by fleeting trends and synthetic mass production, Purnya was conceived 
                as an intentional pause. We set out to challenge the fragmentation of modern lifestyle shopping 
                by bringing five essential dimensions of living under one singular aesthetic and moral compass.
              </p>
              <p>
                From the fragrance that welcomes you home at dusk, to the talisman worn close to your heart, 
                each piece is a conduit of quiet luxury and peaceful energy.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF5EA] border-l-4 border-[#C5A059] text-xs sm:text-sm text-[#0B241C] italic font-serif-title space-y-1">
              <p>&ldquo;True luxury is not excess. It is pure intention, honest provenance, and the enduring grace of human hands.&rdquo;</p>
              <span className="not-italic text-[11px] font-sans font-bold uppercase tracking-wider text-[#C5A059] block mt-1">
                — Purnya Manifesto
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#E2DBD0] aspect-4/5 sm:aspect-square lg:aspect-4/5">
              <img
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1000&fit=crop&auto=format"
                alt="Artisanal Handcraft"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-1.5 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                  Master Craftsmanship
                </span>
                <p className="text-xs sm:text-sm font-light text-[#FAF8F5]">
                  Every texture, contour, and aroma is refined by master artisans dedicated to preserving generational wisdom.
                </p>
              </div>
            </div>
            {/* Decorative Gold Accent Badge */}
            <div className="hidden sm:flex absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#08281F] text-[#D4AF37] border-2 border-[#C5A059] items-center justify-center p-2 text-center text-[10px] font-bold uppercase tracking-widest shadow-xl">
              100% Pure Origin
            </div>
          </div>
        </div>
      </section>

      {/* 4. The Five Sacred Worlds Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
            The Architecture of Living
          </span>
          <h2 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C]">
            Five Worlds. One Soul.
          </h2>
          <p className="text-xs sm:text-sm text-[#5A7469]">
            Explore our curated realms, each dedicated to bringing beauty, ritual, and tranquility to your everyday spaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {worlds.map((world, index) => {
            const IconComponent = world.icon;
            return (
              <Link
                key={world.id}
                href={world.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-[#E2DBD0] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5"
              >
                <div className="relative h-56 sm:h-64 overflow-hidden bg-[#0C3B2E]/10">
                  <img
                    src={world.image}
                    alt={world.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                    loading="lazy"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const target = e.currentTarget;
                      target.src = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&fit=crop&auto=format';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#08281F] text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      <IconComponent className="w-3 h-3 text-[#C5A059]" />
                      <span>World 0{index + 1}</span>
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[11px] text-[#D4AF37] font-semibold uppercase tracking-wider">
                      {world.tagline}
                    </p>
                    <h3 className="font-serif-title text-xl font-bold text-white group-hover:text-[#FAF8F5] transition-colors">
                      {world.title}
                    </h3>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <p className="text-xs text-[#2C4A3E] leading-relaxed line-clamp-3">
                    {world.desc}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0C3B2E] group-hover:text-[#C5A059] transition-colors pt-2 border-t border-[#F0ECE4]">
                    <span>Enter Boutique</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}

          {/* 6th Card: Bespoke Experience Card */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-[#08281F] to-[#0C3B2E] text-[#FAF8F5] rounded-3xl p-8 border border-[#144234] shadow-md space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-[#C5A059]/40 flex items-center justify-center text-[#D4AF37]">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                Personalized Gifting
              </span>
              <h3 className="font-serif-title text-2xl font-bold text-white">
                Bespoke Orders &amp; Festive Hampers
              </h3>
              <p className="text-xs text-[#E0E8E4] leading-relaxed">
                Whether curating personalized wedding favours, corporate festive gifts, or custom jewellery sets, our dedicated team attends to every bespoke detail.
              </p>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-5 rounded-full bg-[#C5A059] hover:bg-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              <span>Connect With Our Team</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Our Core Pillars of Craft */}
      <section className="bg-white py-16 sm:py-24 border-y border-[#E2DBD0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
              Ethos &amp; Conviction
            </span>
            <h2 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C]">
              The Four Pillars of Purnya
            </h2>
            <p className="text-xs sm:text-sm text-[#5A7469]">
              Every formulation, metal setting, and packaging box reflects our unyielding commitment to excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, idx) => {
              const PillarIcon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-[#FAF8F5] border border-[#E2DBD0] hover:border-[#C5A059] hover:shadow-md transition-all space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#EBF3EF] text-[#0C3B2E] flex items-center justify-center border border-[#C5A059]/30">
                    <PillarIcon className="w-6 h-6 text-[#C5A059]" />
                  </div>
                  <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-[#2C4A3E] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Clean Standards & Material Manifesto */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF5EA] rounded-3xl p-8 sm:p-12 border border-[#C5A059]/40 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2DBD0] pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
                Clean Formulations
              </span>
              <h3 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C] mt-1">
                The Purnya Purity Standard
              </h3>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-[#0C3B2E] text-[#FAF8F5] text-xs font-bold uppercase tracking-wider">
              Guaranteed Integrity
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs sm:text-sm text-[#2C4A3E]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0B241C] block">100% Lead-Free &amp; Pure Wax</strong>
                <span>Never any toxic paraffin or petrochemical byproducts in our home fragrances.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0B241C] block">Hypoallergenic 18K Gold Vermeil</strong>
                <span>Nickel-free, cadmium-free jewellery safe for delicate, sensitive skin.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0B241C] block">Wild-Harvested Botanicals</strong>
                <span>Sustainably hand-gathered Himalayan flora and organic cold-pressed distillations.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0B241C] block">Plastic-Conscious Packaging</strong>
                <span>Recycled cotton papers, glass jars, and plant-based protective cushioning.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0B241C] block">Fair Artisan Compensation</strong>
                <span>Honest livable compensation directly supporting master craft families across India.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0B241C] block">Cruelty-Free &amp; Ethical</strong>
                <span>Never tested on animals, and formulated in harmony with nature&apos;s seasonal rhythms.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Grand Closing CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-[#08281F] text-center text-white py-16 sm:py-20 px-6 sm:px-12 border border-[#144234] shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-[#C5A059]/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative max-w-2xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.25em]">
              Welcome to the Sanctuary
            </span>

            <h2 className="font-serif-title text-3xl sm:text-5xl font-bold tracking-tight">
              Begin Your Journey of <br />
              <span className="text-[#D4AF37]">Mindful Elegance.</span>
            </h2>

            <p className="text-xs sm:text-sm text-[#E0E8E4] leading-relaxed">
              Step into the world of Purnya today and discover objects designed to bring quiet beauty, 
              fragrance, and harmony to your personal sanctuary.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#C5A059] hover:bg-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-wider shadow-lg hover:scale-105 transition-all"
              >
                <span>Shop The Storefront</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs uppercase tracking-wider transition-all"
              >
                <span>Read FAQs</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
