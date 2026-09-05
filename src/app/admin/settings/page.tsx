'use client';

import React, { useState } from 'react';
import {
  Settings,
  Globe,
  CreditCard,
  ShieldCheck,
  Building,
  Save,
  CheckCircle2,
  Lock,
  Search,
  FileCode,
  Share2,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';

export default function AdminSettingsPage() {
  const { showToast } = useStore();
  const [activeTab, setActiveTab] = useState<'general' | 'seo' | 'payments' | 'security'>('general');

  // General Settings State
  const [storeName, setStoreName] = useState('Purnya');
  const [legalName, setLegalName] = useState('Purnya Lifestyle Private Limited');
  const [supportEmail, setSupportEmail] = useState('concierge@purnya.in');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('Heritage Pavilion, 12 Kalaghoda Arts Precinct, Fort, Mumbai, MH 400001');
  const [currency, setCurrency] = useState('INR (₹)');
  const [gstJewellery, setGstJewellery] = useState('3%');
  const [gstLifestyle, setGstLifestyle] = useState('18%');

  // SEO Settings State (SOW Section 23)
  const [metaTitle, setMetaTitle] = useState('Purnya | Official Multi-Category Luxury Lifestyle Destination');
  const [metaDescription, setMetaDescription] = useState(
    "Discover Purnya's five worlds of refined craftsmanship: Luxury Jewellery & Accessories, Artisanal Sand Wax Candles, Home Décor, Organic Wellness, and Bespoke Gifts."
  );
  const [keywords, setKeywords] = useState('purnya, jewellery, sand wax candle, home decor, organic wellness, gifts, purnya.in');
  const [canonicalDomain, setCanonicalDomain] = useState('https://www.purnya.in');
  const [ogImage, setOgImage] = useState('https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&fit=crop&auto=format');
  const [gscTag, setGscTag] = useState('google-site-verification=purnya-brand-official-2026');

  // Payment Gateway Settings (SOW Section 13)
  const [razorpayKeyId, setRazorpayKeyId] = useState('rzp_live_purnya_official_prod');
  const [razorpayEnabled, setRazorpayEnabled] = useState(true);
  const [upiEnabled, setUpiEnabled] = useState(true);
  const [cardsEnabled, setCardsEnabled] = useState(true);
  const [codEnabled, setCodEnabled] = useState(true);
  const [codMaxLimit, setCodMaxLimit] = useState(15000);

  // Security Settings (SOW Section 25)
  const [enforceHttps, setEnforceHttps] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('60');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Configuration Saved', 'Store settings and SEO configuration successfully updated.');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
            Website Settings & SEO Configuration
          </h1>
          <p className="text-xs sm:text-sm text-[#2C4A3E]">
            Manage brand profile, SEO meta tags, payment gateway integrations, and store security (SOW Section 19, 23 & 25).
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-5 py-2.5 rounded-xl bg-[#0B241C] hover:bg-[#C5A059] text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2DBD0] gap-2 sm:gap-4 overflow-x-auto text-xs font-bold">
        {[
          { id: 'general', label: 'Store Identity & GST', icon: <Building className="w-4 h-4" /> },
          { id: 'seo', label: 'SEO & Meta Readiness', icon: <Globe className="w-4 h-4" /> },
          { id: 'payments', label: 'Payment Gateways', icon: <CreditCard className="w-4 h-4" /> },
          { id: 'security', label: 'Security & Access Control', icon: <ShieldCheck className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? 'border-[#C5A059] text-[#0B241C]'
                : 'border-transparent text-[#5A7469] hover:text-[#0B241C]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSaveSettings}>
        {/* Tab 1: General Store Identity */}
        {activeTab === 'general' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
            <div className="border-b border-[#EFEBE3] pb-4">
              <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
                Store Identity & Concierge Details
              </h2>
              <p className="text-xs text-[#5A7469]">
                Public brand identifiers displayed across invoices, packaging, and patron communications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-[#0B241C] mb-1.5">Official Brand Name</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1.5">Legal Entity Name</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1.5">Patron Concierge Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1.5">Concierge WhatsApp / Phone</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-[#0B241C] mb-1.5">Registered Registered Studio Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1.5">GST Rate on Jewellery</label>
                <input
                  type="text"
                  value={gstJewellery}
                  onChange={(e) => setGstJewellery(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1.5">GST Rate on Home Fragrance & Decor</label>
                <input
                  type="text"
                  value={gstLifestyle}
                  onChange={(e) => setGstLifestyle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: SEO & Digital Readiness (SOW Section 23) */}
        {activeTab === 'seo' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
            <div className="border-b border-[#EFEBE3] pb-4">
              <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
                Search Engine Optimisation & Meta Tags
              </h2>
              <p className="text-xs text-[#5A7469]">
                Structured metadata, canonical domain, OpenGraph cards, and search indexing compliance (SOW Section 23).
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#0B241C] mb-1.5">Global Meta Title (Homepage)</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1.5">Global Meta Description</label>
                <textarea
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0B241C] mb-1.5">Canonical Domain URL</label>
                  <input
                    type="text"
                    value={canonicalDomain}
                    onChange={(e) => setCanonicalDomain(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0B241C] mb-1.5">Google Search Console Verification Tag</label>
                  <input
                    type="text"
                    value={gscTag}
                    onChange={(e) => setGscTag(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1.5">Primary Targeted Keywords</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {/* Live Google Search Preview */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A7469] block">
                  Search Result Snippet Preview
                </span>
                <p className="text-xs text-blue-700 font-medium truncate">https://www.purnya.in</p>
                <p className="font-serif-title font-bold text-sm text-[#1a0dab] hover:underline cursor-pointer">
                  {metaTitle}
                </p>
                <p className="text-[11px] text-[#4d5156] line-clamp-2">{metaDescription}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Payment Gateways (SOW Section 13) */}
        {activeTab === 'payments' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
            <div className="border-b border-[#EFEBE3] pb-4">
              <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
                Payment Gateways & Methods
              </h2>
              <p className="text-xs text-[#5A7469]">
                Configure digital checkout providers including UPI, Razorpay, Cards, and Cash on Delivery (SOW Section 13).
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0B241C]">Razorpay Online Payment Gateway</p>
                  <p className="text-[11px] text-[#5A7469]">Processes Cards, Net Banking, and Wallet transactions.</p>
                </div>
                <input
                  type="checkbox"
                  checked={razorpayEnabled}
                  onChange={(e) => setRazorpayEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#C5A059] rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#0B241C] mb-1.5">Razorpay Key ID</label>
                  <input
                    type="text"
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-mono text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0B241C] mb-1.5">Razorpay Key Secret</label>
                  <input
                    type="password"
                    value="••••••••••••••••••••••••"
                    disabled
                    className="w-full px-3.5 py-2.5 bg-gray-100 border border-[#E2DBD0] rounded-xl font-mono text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#0B241C]">UPI (GPay / PhonePe)</p>
                    <p className="text-[10px] text-[#5A7469]">Instant zero-fee QR & VPA</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={upiEnabled}
                    onChange={(e) => setUpiEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#C5A059] rounded cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#0B241C]">Credit / Debit Cards</p>
                    <p className="text-[10px] text-[#5A7469]">Visa, RuPay, Mastercard</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cardsEnabled}
                    onChange={(e) => setCardsEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#C5A059] rounded cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#0B241C]">Cash on Delivery (COD)</p>
                    <p className="text-[10px] text-[#5A7469]">Cap: ₹{codMaxLimit}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={codEnabled}
                    onChange={(e) => setCodEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#C5A059] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security & Access Control (SOW Section 25) */}
        {activeTab === 'security' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
            <div className="border-b border-[#EFEBE3] pb-4">
              <h2 className="font-serif-title text-lg font-bold text-[#0B241C]">
                Security & Access Control
              </h2>
              <p className="text-xs text-[#5A7469]">
                SSL configuration, merchant studio authentication, and role-based permissions (SOW Section 25).
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-950">SSL Certificate & Strict HTTPS</p>
                    <p className="text-[11px] text-emerald-800">256-bit TLS encryption active on all patron checkout routes.</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                  Enforced
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2DBD0] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0B241C]">Admin Two-Factor Authentication (2FA)</p>
                  <p className="text-[11px] text-[#5A7469]">Requires OTP confirmation when accessing the Merchant Studio.</p>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorAuth}
                  onChange={(e) => setTwoFactorAuth(e.target.checked)}
                  className="w-4 h-4 text-[#C5A059] rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0B241C] mb-1.5">Admin Session Idle Timeout (Minutes)</label>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E2DBD0] rounded-xl font-semibold text-[#0B241C] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="120">2 Hours</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
