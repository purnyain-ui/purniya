'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What makes Purnya Sand Wax candles unique?',
      a: 'Purnya Sand Wax candles are composed of natural micro-granules derived from clean plant waxes. Unlike conventional paraffin, sand wax requires zero container cleanup; you can refill any heat-resistant vessel indefinitely by simply inserting a new wick. They emit clean aromatic vapor with zero toxic black soot.',
    },
    {
      q: 'How long does shipping take across India?',
      a: 'All orders are dispatched within 24 to 48 hours from our central warehouse in Bengaluru. Metro city deliveries arrive in 2 to 3 business days; all other regions across India arrive in 4 to 6 business days. Express courier tracking with BlueDart or Delhivery is provided via SMS and email.',
    },
    {
      q: 'Is shipping free on Purnya.in?',
      a: 'Yes! We provide complimentary domestic express shipping on all orders totaling ₹999 or above. For orders under ₹999, a flat nominal shipping fee of ₹99 is applied at checkout.',
    },
    {
      q: 'Are the jewellery pieces waterproof and anti-tarnish?',
      a: 'Our gold-plated collections feature high-micron 18K gold electroplating over hypoallergenic premium brass or 925 sterling silver posts, sealed with an invisible protective anti-tarnish lacquer. While resilient to casual splashes, we advise removing pieces before hot showers or pool swimming to maintain their mirror luster.',
    },
    {
      q: 'What is your return and exchange policy?',
      a: 'We proudly offer a 7-day hassle-free return and exchange policy from the date of package delivery. Items must be unused, unburned, and in their original Purnya presentation box with tags. You can initiate a return directly from your Account portal or by writing to care@purnya.in.',
    },
    {
      q: 'Can I customize corporate gifts or wedding hampers?',
      a: 'Absolutely. Purnya specializes in bespoke corporate hampers, festive Diwali sets, and personalized monogrammed jewellery. Please reach out through our Contact page or email corporate@purnya.in for personalized curation catalogues.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
          Help Center
        </span>
        <h1 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C]">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E]">
          Everything you need to know about our products, delivery timelines, and care guidelines.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-[#E2DBD0] overflow-hidden shadow-sm transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-serif-title text-base sm:text-lg font-bold text-[#0B241C]"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#C5A059] transition-transform duration-300 shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-[#2C4A3E] leading-relaxed border-t border-[#EFEBE3] pt-3 animate-in fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
