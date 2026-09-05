import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">Legal</span>
        <h1 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C]">
          Terms & Conditions
        </h1>
        <p className="text-xs sm:text-sm text-[#5A7469] mt-1">Official E-Commerce Terms of Service</p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6 text-xs sm:text-sm text-[#2C4A3E] leading-relaxed">
        <div className="space-y-2">
          <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">1. Introduction</h2>
          <p>
            These terms and conditions govern your use of the website located at www.purnya.in ("Purnya.in") 
            and the purchase of products offered across our five product categories.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">2. Intellectual Property</h2>
          <p>
            All content on Purnya.in, including but not limited to brand identity, trademarks, imagery, text descriptions, 
            and catalog layouts, is the exclusive proprietary property of Purnya and protected under relevant copyright laws.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">3. Pricing & Availability</h2>
          <p>
            All prices are quoted in Indian Rupees (INR) and are inclusive of Goods and Services Tax (GST). 
            Purnya reserves the right to modify prices and correct typographical errors without prior notice.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">4. Governing Law</h2>
          <p>
            Any disputes arising in connection with orders placed on Purnya.in shall be governed by the laws of India 
            under the exclusive jurisdiction of the courts of Bengaluru, Karnataka.
          </p>
        </div>
      </div>
    </div>
  );
}
