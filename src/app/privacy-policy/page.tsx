import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">Security & Trust</span>
        <h1 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C]">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-[#5A7469] mt-1">Last Updated: January 2026</p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6 text-xs sm:text-sm text-[#2C4A3E] leading-relaxed">
        <p>
          At Purnya.in, accessible from www.purnya.in, customer privacy is of paramount importance. 
          This Privacy Policy outlines the types of information collected and how we utilize and safeguard your personal data.
        </p>

        <div className="space-y-2">
          <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">1. Information We Collect</h2>
          <p>
            When you purchase from Purnya.in or register an account, we collect relevant contact details including your name, 
            email address, telephone number, shipping address, and order transaction records. Payment card and bank credentials 
            are encrypted and processed securely by RBI-approved payment gateways (Razorpay, UPI); Purnya never stores complete card numbers.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">2. How We Use Your Data</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>To process, pack, and fulfill your orders.</li>
            <li>To send automated SMS & email delivery tracking notifications.</li>
            <li>To communicate customer support and concierge assistance.</li>
            <li>To provide personalized recommendations and exclusive member privileges.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">3. Contacting Us Regarding Privacy</h2>
          <p>
            For any queries regarding personal data handling, please write to our Data Privacy Officer at <strong className="text-[#0B241C]">privacy@purnya.in</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
