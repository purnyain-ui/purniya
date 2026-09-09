'use client';

import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Building2,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function ContactPage() {
  const { showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderId, setOrderId] = useState('');
  const [subject, setSubject] = useState('Product Consultation & Styling');
  const [message, setMessage] = useState('');
  const [submittedInquiry, setSubmittedInquiry] = useState<{
    ticketId: string;
    name: string;
    email: string;
    phone: string;
    orderId: string;
    subject: string;
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSubmitting(true);
    const newTicketId = `PUR-${Math.floor(100000 + Math.random() * 900000)}`;
    const inquiryData = {
      ticketId: newTicketId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      orderId: orderId.trim(),
      subject,
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    // 1. Persist to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('purnya_registered_inquiries') || '[]');
      existing.unshift(inquiryData);
      localStorage.setItem('purnya_registered_inquiries', JSON.stringify(existing));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    // 2. Dispatch to /api/contact
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryData),
      });
    } catch (apiErr) {
      console.warn('Contact API dispatch warning:', apiErr);
    }

    setIsSubmitting(false);
    setSubmittedInquiry(inquiryData);
    showToast(
      'Inquiry Registered ✨',
      `Your support ticket ${newTicketId} has been registered. Our team will contact you within 4 business hours.`,
      'success'
    );
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 sm:py-16 space-y-12 sm:space-y-16">
      {/* 1. Header Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-[#C5A059]/40 text-[#0C3B2E] text-xs font-bold uppercase tracking-[0.2em] shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
          <span>Customer Care &amp; Support Hub</span>
        </div>
        <h1 className="font-serif-title text-3xl sm:text-5xl lg:text-6xl font-bold text-[#0B241C] tracking-tight">
          How May We Assist You?
        </h1>
        <p className="text-xs sm:text-sm text-[#5A7469] max-w-2xl mx-auto leading-relaxed">
          Whether you require guidance on bespoke heirloom jewellery, botanical home fragrance pairings, 
          custom wedding hampers, or order status, our support team is at your service.
        </p>
      </section>

      {/* 2. Direct Channels 4-Card Luxury Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Phone & WhatsApp */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2DBD0] shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF5EA] text-[#C5A059] flex items-center justify-center border border-[#C5A059]/30">
                <Phone className="w-5 h-5 text-[#0C3B2E]" />
              </div>
              <div>
                <h3 className="font-serif-title text-base font-bold text-[#0B241C]">Telephone &amp; WhatsApp</h3>
                <p className="text-xs font-semibold text-[#0C3B2E] mt-0.5">+91 7892297609</p>
                <p className="text-[11px] text-[#5A7469] mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#C5A059]" />
                  <span>Mon–Sat, 10 AM–6 PM IST</span>
                </p>
              </div>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <a
                href="https://wa.me/917892297609?text=Hello%20Purnya%20Support,%20I%20would%20like%20assistance%20with%20an%20inquiry"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs transition-colors border border-[#25D366]/30"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
              <a
                href="tel:+917892297609"
                className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF3EF] text-[#0C3B2E] font-bold text-xs transition-colors border border-[#E2DBD0]"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Direct Call</span>
              </a>
            </div>
          </div>

          {/* Card 2: Email Inquiries */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2DBD0] shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF5EA] text-[#C5A059] flex items-center justify-center border border-[#C5A059]/30">
                <Mail className="w-5 h-5 text-[#0C3B2E]" />
              </div>
              <div>
                <h3 className="font-serif-title text-base font-bold text-[#0B241C]">Email Inquiries</h3>
                <p className="text-xs font-semibold text-[#0C3B2E] mt-0.5">care@purnya.in</p>
                <p className="text-[11px] text-[#5A7469] mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#C5A059]" />
                  <span>Response under 4 business hours</span>
                </p>
              </div>
            </div>
            <div className="pt-2">
              <a
                href="mailto:care@purnya.in"
                className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-[#08281F] hover:bg-[#0C3B2E] text-white font-bold text-xs transition-colors shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Write to Support Team</span>
              </a>
            </div>
          </div>

          {/* Card 3: Correspondence & Atelier Address */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2DBD0] shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF5EA] text-[#C5A059] flex items-center justify-center border border-[#C5A059]/30">
                <MapPin className="w-5 h-5 text-[#0C3B2E]" />
              </div>
              <div>
                <h3 className="font-serif-title text-base font-bold text-[#0B241C]">Correspondence Address</h3>
                <p className="text-xs text-[#2C4A3E] leading-relaxed mt-1">
                  #18/5, 32, A2 Nagadevanahalli, Doddagollarahatti, Near to Amit Urban Nisha Apartment.
                </p>
                <p className="text-[11px] text-[#5A7469] font-medium mt-0.5">
                  Bangalore, Karnataka 560056, India
                </p>
              </div>
            </div>
            <div className="pt-2">
              <a
                href="https://maps.google.com/?q=Nagadevanahalli+Bangalore+Karnataka+560056"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-[#EBF3EF] text-[#0C3B2E] font-bold text-xs transition-colors border border-[#E2DBD0]"
              >
                <span>View On Map</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C5A059]" />
              </a>
            </div>
          </div>

          {/* Card 4: Registered Office */}
          <div className="bg-white p-6 rounded-3xl border border-[#E2DBD0] shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF5EA] text-[#C5A059] flex items-center justify-center border border-[#C5A059]/30">
                <Building2 className="w-5 h-5 text-[#0C3B2E]" />
              </div>
              <div>
                <h3 className="font-serif-title text-base font-bold text-[#0B241C]">Registered Office</h3>
                <p className="text-xs text-[#2C4A3E] leading-relaxed mt-1">
                  No.138, Canara Bank Main Road, Neraluru, Virupakshipura Hobli, Channapattana Taluk.
                </p>
                <p className="text-[11px] text-[#5A7469] font-medium mt-0.5">
                  Bengaluru South District, Karnataka 562138, India
                </p>
              </div>
            </div>
            <div className="pt-2">
              <div className="py-2 px-3 rounded-xl bg-[#FAF5EA] text-[#08281F] text-[11px] font-bold text-center border border-[#C5A059]/30">
                Official Entity Jurisdiction
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Two-Column Section: Interactive Form + Map & Studio Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Inquiry Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
            <div className="border-b border-[#F0ECE4] pb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">
                Direct Dispatch
              </span>
              <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C] mt-1">
                Send a Bespoke Inquiry
              </h2>
              <p className="text-xs text-[#5A7469] mt-1">
                Complete this brief form and our support team will reach out via WhatsApp or email.
              </p>
            </div>

            {submittedInquiry ? (
              <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="p-6 rounded-2xl bg-[#EBF3EF] border border-[#C5A059]/40 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0C3B2E] text-[#C5A059] flex items-center justify-center shadow-md">
                        <CheckCircle2 className="w-5 h-5 text-[#C5A059]" />
                      </div>
                      <div>
                        <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">
                          Inquiry Registered Successfully
                        </h3>
                        <p className="text-xs text-[#5A7469]">
                          Ticket Reference: <strong className="text-[#0C3B2E] font-mono">{submittedInquiry.ticketId}</strong>
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white border border-[#C5A059]/40 text-[#0C3B2E] text-[10px] font-bold uppercase tracking-wider">
                      Logged
                    </span>
                  </div>

                  <p className="text-xs text-[#2C4A3E] leading-relaxed">
                    Thank you, <strong className="text-[#0B241C]">{submittedInquiry.name}</strong>. Your inquiry has been recorded and assigned to our customer support desk. Our team will review your message and connect with you within 4 business hours.
                  </p>

                  <div className="bg-white/80 p-4 rounded-xl border border-[#E2DBD0] space-y-2 text-xs">
                    <div className="flex justify-between border-b border-[#F0ECE4] pb-1.5">
                      <span className="text-[#5A7469]">Nature of Inquiry:</span>
                      <span className="font-semibold text-[#0B241C]">{submittedInquiry.subject}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#F0ECE4] pb-1.5">
                      <span className="text-[#5A7469]">Contact Email:</span>
                      <span className="font-semibold text-[#0B241C]">{submittedInquiry.email}</span>
                    </div>
                    {submittedInquiry.phone && (
                      <div className="flex justify-between border-b border-[#F0ECE4] pb-1.5">
                        <span className="text-[#5A7469]">Phone / WhatsApp:</span>
                        <span className="font-semibold text-[#0B241C]">{submittedInquiry.phone}</span>
                      </div>
                    )}
                    {submittedInquiry.orderId && (
                      <div className="flex justify-between border-b border-[#F0ECE4] pb-1.5">
                        <span className="text-[#5A7469]">Order Reference:</span>
                        <span className="font-semibold text-[#0B241C]">{submittedInquiry.orderId}</span>
                      </div>
                    )}
                    <div className="pt-1 text-[11px] text-[#5A7469]">
                      <span className="font-medium text-[#0B241C]">Note:</span> {submittedInquiry.message}
                    </div>
                  </div>
                </div>

                {/* Direct Instant Action Buttons */}
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0B241C]">
                    Need Immediate Assistance?
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={`https://wa.me/917892297609?text=${encodeURIComponent(
                        `Hello Purnya Support,\nI registered an inquiry (Ticket: ${submittedInquiry.ticketId}).\nName: ${submittedInquiry.name}\nEmail: ${submittedInquiry.email}\nPhone: ${submittedInquiry.phone || 'N/A'}\nSubject: ${submittedInquiry.subject}\nMessage: ${submittedInquiry.message}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-102"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Send via WhatsApp Now</span>
                    </a>
                    <a
                      href={`mailto:care@purnya.in?subject=${encodeURIComponent(
                        `[Ticket: ${submittedInquiry.ticketId}] ${submittedInquiry.subject}`
                      )}&body=${encodeURIComponent(
                        `Dear Purnya Customer Support,\n\nTicket: ${submittedInquiry.ticketId}\nName: ${submittedInquiry.name}\nEmail: ${submittedInquiry.email}\nPhone: ${submittedInquiry.phone || 'N/A'}\nOrder ID: ${submittedInquiry.orderId || 'N/A'}\n\nMessage:\n${submittedInquiry.message}`
                      )}`}
                      className="py-3 px-4 rounded-xl bg-[#0C3B2E] hover:bg-[#145241] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-102"
                    >
                      <Mail className="w-4 h-4 text-[#C5A059]" />
                      <span>Send Direct Email</span>
                    </a>
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedInquiry(null);
                        setName('');
                        setEmail('');
                        setPhone('');
                        setOrderId('');
                        setMessage('');
                      }}
                      className="text-xs font-semibold text-[#5A7469] hover:text-[#0C3B2E] underline cursor-pointer"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#0B241C]">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#C5A059] transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#0B241C]">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#C5A059] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#0B241C]">Phone / WhatsApp Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 7892297609"
                      className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#C5A059] transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-semibold text-[#0B241C]">Order ID (if applicable)</label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="e.g. PUR-8492"
                      className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#C5A059] transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#0B241C]">Nature of Inquiry</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#C5A059] transition-colors cursor-pointer"
                  >
                    <option>Product Consultation &amp; Sizing</option>
                    <option>Bespoke Orders &amp; Custom Pieces</option>
                    <option>Corporate &amp; Wedding Festive Hampers</option>
                    <option>Order Tracking &amp; Delivery Update</option>
                    <option>Press, Media &amp; Brand Collaboration</option>
                    <option>General Customer Support</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#0B241C]">Your Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please describe how our customer support team can assist you with your requirements..."
                    className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#C5A059] transition-colors leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#C5A059] hover:bg-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Registering Inquiry...' : 'Register Inquiry'}</span>
                  </button>
                  <span className="text-[11px] text-[#5A7469] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>Your information is held in strict privacy.</span>
                  </span>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Google Maps & Location Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-[#E2DBD0] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[#F0ECE4] flex items-center justify-between">
                <div>
                  <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">
                    Location &amp; Atelier
                  </h3>
                  <p className="text-[11px] text-[#5A7469]">
                    Bengaluru Metropolitan Region, Karnataka
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF5EA] text-[#0C3B2E] border border-[#C5A059]/40 text-[10px] font-bold uppercase tracking-wider">
                  Atelier Hub
                </span>
              </div>

              {/* Embedded Google Maps View */}
              <div className="relative w-full h-[280px] sm:h-[320px] bg-[#EBF3EF] overflow-hidden">
                <iframe
                  title="Purnya Correspondence Atelier Location"
                  src="https://maps.google.com/maps?q=Nagadevanahalli%2C%20Doddagollarahatti%2C%20Bangalore%2C%20Karnataka%20560056&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full grayscale-[25%] contrast-[105%]"
                />
              </div>

              <div className="p-6 space-y-3 bg-[#FAF8F5]">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#2C4A3E]">
                    <p className="font-bold text-[#0B241C]">Nagadevanahalli Hub</p>
                    <p>#18/5, 32, A2 Nagadevanahalli, Doddagollarahatti, Near to Amit Urban Nisha Apartment, Bangalore 560056</p>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="https://maps.google.com/?q=Nagadevanahalli+Bangalore+Karnataka+560056"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#EBF3EF] text-[#0C3B2E] font-bold text-xs uppercase tracking-wider border border-[#E2DBD0] transition-colors shadow-2xs"
                  >
                    <span>Get Directions on Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#C5A059]" />
                  </a>
                </div>
              </div>
            </div>

            {/* Customer Care Assurances Card */}
            <div className="bg-[#08281F] text-white p-6 sm:p-7 rounded-3xl border border-[#144234] shadow-md space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="font-serif-title text-base font-bold text-[#FAF8F5]">
                  The Purnya Client Promise
                </h4>
              </div>

              <ul className="space-y-2.5 text-xs text-[#E0E8E4]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>White-glove consultation for customized wedding &amp; festive curations.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>Telephone and WhatsApp support answered by knowledgeable associates.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>All packages securely wrapped with tamper-evident insured logistics.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
