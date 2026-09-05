'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function ContactPage() {
  const { showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Product Inquiry');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    showToast('Inquiry Dispatched', 'A Purnya Concierge will contact you within 4 business hours.', 'success');
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C5A059]">
          Concierge Support
        </span>
        <h1 className="font-serif-title text-3xl sm:text-5xl font-bold text-[#0B241C]">
          Contact Us
        </h1>
        <p className="text-xs sm:text-sm text-[#2C4A3E]">
          We are here to assist you with order inquiries, corporate bespoke hampers, or fragrance consultations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Contact Info Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E2DBD0] shadow-sm space-y-4">
            <h3 className="font-serif-title text-lg font-bold text-[#0B241C]">Direct Channels</h3>
            
            <div className="space-y-4 text-xs text-[#2C4A3E]">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] text-[#C5A059] flex items-center justify-center shrink-0 border border-[#E2DBD0]">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#0B241C]">Telephone Concierge</p>
                  <p>+91 98765 43210</p>
                  <p className="text-[11px] text-[#5A7469]">Mon - Sat: 10:00 AM – 7:00 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] text-[#C5A059] flex items-center justify-center shrink-0 border border-[#E2DBD0]">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#0B241C]">Email Inquiries</p>
                  <p>care@purnya.in</p>
                  <p className="text-[11px] text-[#5A7469]">Response time: under 4 business hours</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] text-[#C5A059] flex items-center justify-center shrink-0 border border-[#E2DBD0]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-[#0B241C]">Flagship Lifestyle Studio</p>
                  <p>Purnya Sanctuary, 100ft Road, Indiranagar</p>
                  <p className="text-[11px] text-[#5A7469]">Bengaluru, Karnataka 560038, India</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Message Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-[#E2DBD0] shadow-sm space-y-6">
          <h3 className="font-serif-title text-xl font-bold text-[#0B241C] border-b border-[#EFEBE3] pb-4">
            Send an Inquiry
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-[#2C4A3E]">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-[#2C4A3E]">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#2C4A3E]">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E2DBD0] bg-white focus:outline-none focus:border-[#C5A059]"
              >
                <option>Product Inquiry & Customization</option>
                <option>Order Status & Tracking</option>
                <option>Corporate & Wedding Gifting Hampers</option>
                <option>Press & Collaboration</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#2C4A3E]">Your Message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can our concierge team assist you today?"
                className="w-full p-3 rounded-xl border border-[#E2DBD0] focus:outline-none focus:border-[#C5A059]"
              />
            </div>

            <button
              type="submit"
              className="px-8 py-3.5 rounded-full bg-[#C5A059] hover:bg-[#D4AF37] text-[#0B241C] font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Message</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
