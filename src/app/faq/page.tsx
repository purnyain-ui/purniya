'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do I place an order?',
      a: 'Browse the Purnya collections, select your preferred product, add it to your cart and complete checkout using an available payment method.',
    },
    {
      q: 'Can I cancel my order?',
      a: 'Cancellation may be requested before dispatch. Personalised, customised or made-to-order products may not be cancellable once processing has started.',
    },
    {
      q: 'How can I track my order?',
      a: 'Where tracking is available, shipment details are shared after dispatch.',
    },
    {
      q: 'What should I do if I receive a damaged or incorrect product?',
      a: 'Contact Purnya within 48 hours of delivery with your order number and clear photographs or videos showing the issue.',
    },
    {
      q: 'Can I return a product if I change my mind?',
      a: 'Change-of-mind returns are available only where expressly offered for that product.',
    },
    {
      q: 'Why does the product colour look slightly different from the website?',
      a: 'Colour and appearance can vary slightly due to device screens, display settings, lighting and photography. Refer to the product description for full details.',
    },
    {
      q: 'Where can I find product care instructions?',
      a: 'Relevant care, usage, safety or storage information is provided on the product page and/or packaging.',
    },
    {
      q: 'What if I have a complaint that hasn\'t been resolved?',
      a: 'You may escalate to our Grievance Redressal Desk at care@purnya.in, which will acknowledge your complaint within 48 hours and aim to resolve it within one month.',
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
          Everything you need to know about our products, orders, delivery, and policies.
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

      {/* Grievance escalation info */}
      <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#EFEBE3] text-center space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[#C5A059]">Still need help?</p>
        <p className="text-xs sm:text-sm text-[#2C4A3E]">
          Contact our Grievance Redressal Desk at{' '}
          <a href="mailto:care@purnya.in" className="text-[#C5A059] font-semibold">care@purnya.in</a>{' '}
          for unresolved complaints. Acknowledgement within 48 hours.
        </p>
      </div>
    </div>
  );
}
