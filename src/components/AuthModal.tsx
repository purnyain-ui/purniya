'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  signInWithSupabase,
  signUpWithSupabase,
  sendPasswordResetEmail,
} from '../lib/supabase';

export default function AuthModal() {
  const router = useRouter();
  const { authModal, closeAuthModal, openAuthModal, loginUser, showToast } = useStore();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const authQuery = params.get('auth');
      // 'forgot' is switched off for now.
      if (authQuery === 'login' || authQuery === 'signup') {
        openAuthModal({ mode: authQuery });
        // Clean URL query without page reload
        const url = new URL(window.location.href);
        url.searchParams.delete('auth');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }, [openAuthModal]);

  useEffect(() => {
    if (authModal?.isOpen) {
      setMode(authModal.mode || 'login');
      setErrorMsg('');
      setForgotSuccess(false);
    }
  }, [authModal?.isOpen, authModal?.mode]);

  if (!authModal || !authModal.isOpen) return null;

  const { actionType, title, message, redirectUrl } = authModal;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'forgot') {
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      setLoading(true);
      const res = await sendPasswordResetEmail(email.trim());
      setLoading(false);
      if (res.success) {
        setForgotSuccess(true);
      } else {
        setErrorMsg(res.error || 'Failed to send reset link. Please check your email.');
      }
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }

      setLoading(true);
      const res = await signUpWithSupabase(email.trim(), password, {
        name: name.trim(),
        phone: phone.trim(),
      });
      setLoading(false);

      if (res.success) {
        loginUser({
          id: res.user?.id,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        });
        showToast('Welcome to Purnya ✨', 'Your account has been created successfully!');
        closeAuthModal();
        if (redirectUrl && redirectUrl !== window.location.pathname) {
          router.push(redirectUrl);
        }
      } else {
        setErrorMsg(res.error || 'Failed to create account.');
      }
      return;
    }

    // Default 'login'
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    const res = await signInWithSupabase(email.trim(), password);
    setLoading(false);

    if (res.success) {
      loginUser({
        id: res.user?.id,
        name: res.user?.user_metadata?.name || email.split('@')[0],
        email: email.trim(),
        phone: res.user?.user_metadata?.phone || '',
      });
      showToast('Welcome Back ✨', 'Signed in successfully.');
      closeAuthModal();
      if (redirectUrl && redirectUrl !== window.location.pathname) {
        router.push(redirectUrl);
      }
    } else {
      setErrorMsg(res.error || 'Invalid email or password.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-[#C5A059]/40 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-left max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full text-[#5A7469] hover:text-[#0B241C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="flex flex-col items-center text-center space-y-1.5 pt-1">
          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center p-1 bg-[#FAF8F5] border-2 border-[#C5A059] mx-auto shadow-md">
            <img
              src="/logoicon.png"
              alt="Purnya Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-serif-title text-xl font-bold tracking-[0.16em] text-[#0C3B2E] block leading-tight">
              PURNYA
            </span>
            <span className="text-[8.5px] uppercase tracking-[0.14em] text-[#C5A059] font-bold block mt-0.5">
              Thoughtfully · Curated · Beautifully Yours
            </span>
          </div>
          <h3 className="font-serif-title text-2xl font-bold text-[#0B241C] pt-1">
            {title ||
              (mode === 'login'
                ? 'Welcome to Purnya'
                : mode === 'signup'
                ? 'Join Purnya Circle'
                : 'Reset Password')}
          </h3>
          <p className="text-xs text-[#2C4A3E]">
            {message ||
              (mode === 'login'
                ? 'Sign in to access your bespoke orders, wishlist & exclusive benefits.'
                : mode === 'signup'
                ? 'Experience elevated luxury living with personalized curated perks.'
                : 'Enter your registered email to receive a password reset link.')}
          </p>
        </div>

        {/* Action Type Context Banner (Order / Wishlist) */}
        {actionType && (
          <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#FAF8F5] border border-[#E2DBD0] text-[11px] text-[#5A7469]">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
            <span>
              {actionType === 'order'
                ? 'Sign in required to finalize delivery and place order'
                : actionType === 'wishlist'
                ? 'Sign in to save pieces to your personal collection'
                : 'Sign in to continue uninterrupted'}
            </span>
          </div>
        )}

        {/* Tab Switcher */}
        {mode !== 'forgot' && (
          <div className="flex rounded-2xl bg-[#FAF8F5] p-1 border border-[#E2DBD0]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#08281F] text-white shadow-sm'
                  : 'text-[#5A7469] hover:text-[#0B241C]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#08281F] text-white shadow-sm'
                  : 'text-[#5A7469] hover:text-[#0B241C]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        {mode === 'forgot' ? (
          forgotSuccess ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-emerald-900">Recovery Link Sent</p>
              <p className="text-[11px] text-emerald-700">
                We sent password recovery instructions to <strong>{email}</strong>. Please check your inbox.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setForgotSuccess(false);
                  setErrorMsg('');
                }}
                className="px-4 py-2 bg-[#08281F] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#0C3B2E]"
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-4">
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
                className="w-full py-3.5 px-6 rounded-xl bg-[#08281F] hover:bg-[#0C3B2E] text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="text-xs font-semibold text-[#5A7469] hover:text-[#0B241C] cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A3E]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A7469]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Devendra Sharma"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2DBD0] bg-[#FAF8F5] focus:bg-white text-xs font-medium focus:border-[#C5A059] focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A3E]">
                Email Address
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

            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A3E]">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A7469]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2DBD0] bg-[#FAF8F5] focus:bg-white text-xs font-medium focus:border-[#C5A059] focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A3E]">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A7469]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#E2DBD0] bg-[#FAF8F5] focus:bg-white text-xs font-medium focus:border-[#C5A059] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A7469] hover:text-[#0B241C]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In to Purnya' : 'Create Account'}</span>
              )}
            </button>
          </form>
        )}

        {/* Member perks mini-badge */}
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#FAF8F5] text-[10px] text-[#5A7469]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0C3B2E] shrink-0" />
          <span>Instant checkout · Saved addresses · Privileged offers</span>
        </div>
      </div>
    </div>
  );
}
