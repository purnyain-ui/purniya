'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { sendPasswordResetEmail } from '../../lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await sendPasswordResetEmail(email.trim());
      setLoading(false);
      if (res.success) {
        setSent(true);
      } else {
        setError(res.error || 'Failed to dispatch reset link. Please try again.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DBD0] shadow-xl space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-1.5">
          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center p-1 bg-[#FAF8F5] border-2 border-[#C5A059] shadow-md">
            <img src="/purnya-logo.png" alt="Purnya Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-serif-title text-xl font-bold tracking-[0.16em] text-[#0C3B2E] block leading-tight">
              PURNYA
            </span>
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#C5A059] font-bold block mt-0.5">
              Maison of Mindful Luxury
            </span>
          </div>
          <h1 className="font-serif-title text-2xl font-bold text-[#0B241C] pt-1">
            Reset Your Password
          </h1>
          <p className="text-xs text-[#2C4A3E]">
            Enter your registered email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success / Form */}
        {sent ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <p className="text-xs font-bold text-emerald-900">Recovery Instructions Dispatched</p>
            <p className="text-[11px] text-emerald-700">
              We have forwarded a password recovery link to <strong>{email}</strong>. Please check your inbox
              and spam folder.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
              className="text-[11px] font-semibold text-[#0C3B2E] hover:text-[#C5A059] underline cursor-pointer"
            >
              Send to a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A3E]">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A7469]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2DBD0] bg-[#FAF8F5] focus:bg-white text-xs font-medium focus:border-[#C5A059] focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <span>Send Recovery Link</span>
              )}
            </button>
          </form>
        )}

        {/* Back to Sign In */}
        <div className="pt-2 text-center border-t border-[#F0ECE4]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A7469] hover:text-[#0B241C] transition-colors mt-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>

        <p className="text-center text-[10px] text-[#5A7469] flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-[#C5A059]" />
          <span>Purnya Circle Member Support: care@purnya.in</span>
        </p>
      </div>
    </div>
  );
}