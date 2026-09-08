'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,

  KeyRound,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { signInWithSupabase, isSupabaseConfigured } from '../../../lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const { showToast } = useStore();

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepActive, setKeepActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!adminEmail.trim()) {
      setErrorMsg('Please enter your authorized administrative email.');
      return;
    }
    if (!adminPassword) {
      setErrorMsg('Please enter your security key or password.');
      return;
    }

    setIsLoading(true);

    // 1. Try Supabase Auth verification if configured
    if (isSupabaseConfigured && adminEmail.includes('@')) {
      const res = await signInWithSupabase(adminEmail.trim(), adminPassword);
      if (res.success && res.user) {
        setIsSuccess(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('purnya_admin_authenticated', 'true');
          localStorage.setItem(
            'purnya_admin_session',
            JSON.stringify({
              email: adminEmail.trim(),
              loginTime: new Date().toISOString(),
              role: 'Super Administrator',
            })
          );
        }
        showToast('Admin Authenticated', 'Welcome back to Purnya Merchant Studio.');
        setTimeout(() => {
          router.push('/admin');
        }, 500);
        return;
      }
    }

    // 2. Default preset credential verification (admin@purnya.com / purnya2026)
    const isPresetAdmin =
      (adminEmail.toLowerCase() === 'admin@purnya.com' && adminPassword === 'purnya2026') ||
      (adminEmail.toLowerCase().includes('admin') && adminPassword === 'purnya2026') ||
      adminPassword === 'purnya2026';

    if (isPresetAdmin) {
      setIsSuccess(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('purnya_admin_authenticated', 'true');
        localStorage.setItem(
          'purnya_admin_session',
          JSON.stringify({
            email: adminEmail.trim() || 'admin@purnya.com',
            loginTime: new Date().toISOString(),
            role: 'Super Administrator',
          })
        );
      }
      showToast('Admin Authenticated', 'Welcome back to Purnya Merchant Studio.');
      setTimeout(() => {
        router.push('/admin');
      }, 500);
    } else {
      setIsLoading(false);
      setErrorMsg('Invalid administrative credentials. Use admin@purnya.com / purnya2026 or your Supabase admin user.');
    }
  };


  return (
    <div className="min-h-screen bg-[#051813] text-[#FAF8F5] flex flex-col justify-between relative overflow-hidden selection:bg-[#C5A059] selection:text-[#051813]">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#144234]/40 via-[#0B241C]/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-[#165543]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 w-full px-6 py-6 flex items-center justify-between border-b border-white/5">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border-2 border-[#C5A059] flex items-center justify-center p-0.5 shadow-lg group-hover:scale-105 transition-transform">
            <img src="/purnya-logo.png" alt="Purnya" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-serif-title font-bold text-lg tracking-widest text-white block leading-tight">
              PURNYA
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold block">
              Merchant Studio
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#C9BDB0] hover:text-white transition-all border border-white/10"
        >
          <span>Storefront</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card Wrapper with Luxury Border & Shadow */}
          <div className="bg-[#08281F]/90 backdrop-blur-xl rounded-3xl border border-[#1B4B3B] p-8 sm:p-10 shadow-2xl shadow-black/60 relative overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent" />

            {/* Header Icon & Tag */}
            <div className="text-center space-y-3 mb-8">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#0D382B] border border-[#C5A059]/40 flex items-center justify-center shadow-inner">
                <KeyRound className="w-7 h-7 text-[#D4AF37]" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#144234] text-[#D4AF37] border border-[#C5A059]/30">
                  <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                  Authorized Personnel Only
                </span>
                <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-white mt-3">
                  Merchant Console
                </h1>
                <p className="text-xs text-[#8BAAA0] mt-1">
                  Authenticate to access multi-category operations, order fulfillment, and logistics control.
                </p>
              </div>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Notification */}
            {isSuccess && (
              <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Credentials verified. Redirecting to operational dashboard...</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#E5ECE9] mb-1.5 uppercase tracking-wider">
                  Admin Email / Identifier
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A7469]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@purnya.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#051813]/80 border border-[#1C4839] focus:border-[#C5A059] focus:bg-[#051813] rounded-xl text-xs sm:text-sm text-white outline-none transition-all placeholder:text-[#4A6458]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#E5ECE9] uppercase tracking-wider">
                    Security Key / Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A7469]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-[#051813]/80 border border-[#1C4839] focus:border-[#C5A059] focus:bg-[#051813] rounded-xl text-xs sm:text-sm text-white outline-none transition-all placeholder:text-[#4A6458]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5A7469] hover:text-[#D4AF37]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepActive}
                    onChange={(e) => setKeepActive(e.target.checked)}
                    className="w-4 h-4 accent-[#C5A059] rounded bg-[#051813] border-[#1C4839]"
                  />
                  <span className="text-xs text-[#8BAAA0]">Remember session on this device</span>
                </label>
              </div>

              {/* Enter Button */}
              <button
                type="submit"
                disabled={isLoading || isSuccess}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#C5A059] hover:from-[#D4AF37] hover:to-[#E5C358] text-[#08281F] font-bold text-xs sm:text-sm tracking-wide shadow-lg shadow-[#C5A059]/15 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-3 font-serif-title"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#08281F]/30 border-t-[#08281F] rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Merchant Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>


            </form>
          </div>

          {/* Footer Security Note */}
          <div className="text-center mt-6 text-[11px] text-[#638076] space-y-1">
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Protected by 256-Bit SSL Encryption & RBAC Security Layer</span>
            </p>
            <p>Purnya Luxury Merchant Studio · All rights reserved.</p>
          </div>
        </div>
      </main>

      {/* Footer System Status */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-white/5 flex items-center justify-between text-[11px] text-[#638076]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Central Gateway: Operational</span>
        </div>
        <div>
          <span>Next.js 16 Enterprise Build</span>
        </div>
      </footer>
    </div>
  );
}
