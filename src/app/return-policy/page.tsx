import React from 'react';
import Link from 'next/link';

export default function ShippingAndReturnPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Shipping & Delivery Policy */}
      <section id="shipping" className="space-y-8 scroll-mt-24">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
            Policy
          </span>
          <h1 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C]">
            Shipping &amp; Delivery Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#5A7469] mt-1">
            Effective Date: January 2026
          </p>
        </div>

        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6 text-xs sm:text-sm text-[#2C4A3E] leading-relaxed">
          <div className="space-y-2">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
              1. Domestic Shipping Timelines
            </h2>
            <p>
              At Purnya.in, every order is processed with utmost precision from
              our climate-controlled fulfillment hub in Bengaluru. Orders
              received before 2:00 PM IST are dispatched on the same business day.
            </p>
            <ul className="list-disc list-inside space-y-1 pt-1">
              <li>
                <strong>
                  Metro Cities (Bengaluru, Mumbai, Delhi NCR, Hyderabad, Chennai,
                  Kolkata):
                </strong>{' '}
                2 to 3 Business Days.
              </li>
              <li>
                <strong>Tier 2 &amp; Tier 3 Cities:</strong> 3 to 5 Business Days.
              </li>
              <li>
                <strong>Remote Locations &amp; Northeast:</strong> 5 to 7
                Business Days.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
              2. Shipping Charges
            </h2>
            <p>
              We offer <strong>Free Standard Shipping</strong> on all domestic
              orders of value <strong>₹999 or above</strong>. Orders below ₹999
              will incur a nominal flat shipping fee of ₹99.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
              3. Packaging Standards
            </h2>
            <p>
              Every Purnya piece is securely cushioned in biodegradable honeycomb
              paper and housed in rigid presentation packaging, guaranteeing
              pristine arrival of delicate ceramics, glassware, and jewellery.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
              4. Real-Time Tracking
            </h2>
            <p>
              Once dispatched, you will receive an automated notification
              containing your tracking AWB number with our logistics partner
              (BlueDart, Delhivery, or Xpressbees). You can track live movement at
              any moment via our{' '}
              <Link
                href="/order-tracking"
                className="text-[#C5A059] font-semibold underline"
              >
                Order Tracking Portal
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Return & Exchange Policy */}
      <section id="returns" className="space-y-8 scroll-mt-24">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
            Policy
          </span>
          <h2 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C]">
            Return &amp; Exchange Policy
          </h2>
          <p className="text-xs sm:text-sm text-[#5A7469] mt-1">
            7-Day Effortless Satisfaction Guarantee
          </p>
        </div>

        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6 text-xs sm:text-sm text-[#2C4A3E] leading-relaxed">
          <div className="space-y-2">
            <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">
              1. 7-Day Window
            </h3>
            <p>
              We take pride in our artisanal craftsmanship. If you are not
              completely enchanted by your purchase, you may initiate a return
              or exchange request within <strong>7 calendar days</strong> from
              the delivery timestamp.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">
              2. Conditions for Return
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Candles must be unburned and wax refills unopened.</li>
              <li>
                Jewellery must be in unworn, scratch-free condition with
                original security tag attached.
              </li>
              <li>
                Wellness items and teas must be sealed in their original
                air-tight packaging for hygiene compliance.
              </li>
              <li>
                All original gift boxes, cloth pouches, and certificates must
                be returned intact.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">
              3. Reverse Pickup &amp; Refunds
            </h3>
            <p>
              Our logistics team will coordinate a complimentary reverse pickup
              from your doorstep. Upon successful inspection at our Bengaluru
              facility, refunds are processed within 48 hours directly to your
              original payment method.
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
      </section>
    </div>
  );
}