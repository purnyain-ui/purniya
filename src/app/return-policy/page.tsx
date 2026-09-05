import React from 'react';
import Link from 'next/link';

export default function ReturnPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">Policy</span>
        <h1 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C]">
          Return & Exchange Policy
        </h1>
        <p className="text-xs sm:text-sm text-[#5A7469] mt-1">7-Day Effortless Satisfaction Guarantee</p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6 text-xs sm:text-sm text-[#2C4A3E] leading-relaxed">
        <div className="space-y-2">
          <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">1. 7-Day Window</h2>
          <p>
            We take pride in our artisanal craftsmanship. If you are not completely enchanted by your purchase, you may initiate 
            a return or exchange request within <strong>7 calendar days</strong> from the delivery timestamp.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">2. Conditions for Return</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Candles must be unburned and wax refills unopened.</li>
            <li>Jewellery must be in unworn, scratch-free condition with original security tag attached.</li>
            <li>Wellness items and teas must be sealed in their original air-tight packaging for hygiene compliance.</li>
            <li>All original gift boxes, cloth pouches, and certificates must be returned intact.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">3. Reverse Pickup & Refunds</h2>
          <p>
            Our logistics team will coordinate a complimentary reverse pickup from your doorstep. 
            Upon successful inspection at our Bengaluru facility, refunds are processed within 48 hours directly to your original payment method.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/account"
            className="inline-block px-6 py-2.5 rounded-full bg-[#C5A059] text-white text-xs font-semibold uppercase tracking-wider"
          >
            Initiate Return in My Account →
          </Link>
        </div>
      </div>
    </div>
  );
}
