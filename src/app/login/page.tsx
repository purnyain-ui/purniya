'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,

  ShieldCheck,
  Gift,
  Truck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { signInWithSupabase, signUpWithSupabase, isSupabaseConfigured, sendPasswordResetEmail, updateUserPassword, supabase } from '../../lib/supabase';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const redirectUrl = searchParams.get('redirect') || '/account';

  const { loginUser, showToast, user } = useStore();

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>(
    searchParams.get('mode') === 'reset' ? 'reset' : initialMode
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  // Detect password recovery token from Supabase email link
  React.useEffect(() => {
    if (
      searchParams.get('mode') === 'reset' ||
      (typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))
    ) {
      setMode('reset');
    }

    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setMode('reset');
        }
      });
      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email or phone number.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);

    // 1. If Supabase is configured and input is an email, authenticate via Supabase Auth
    if (isSupabaseConfigured && loginEmail.includes('@')) {
      const res = await signInWithSupabase(loginEmail.trim(), loginPassword);
      if (!res.success && res.error) {
        setIsLoading(false);
        setErrorMsg(res.error.toLowerCase().includes('invalid login credentials') ? 'Invalid email or password. Please verify and try again.' : res.error);
        return;
      } else if (res.success && res.user) {
        const meta = res.user.user_metadata || {};
        const detectedName = meta.name || meta.full_name || loginEmail.split('@')[0];
        loginUser({
          name: detectedName,
          email: loginEmail.trim(),
          phone: meta.phone || '+91 98765 43210',
        });
        setIsLoading(false);
        showToast('Welcome Back', `Delighted to see you again, ${detectedName}.`);
        router.push(redirectUrl);
        return;
      }
    } else if (isSupabaseConfigured && !loginEmail.includes('@')) {
      setIsLoading(false);
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    // 2. Standard Patron Login fallback
    setTimeout(() => {
      const detectedName = loginEmail.includes('@')
        ? loginEmail.split('@')[0].replace(/[._-]/g, ' ')
        : 'Patron';

      const capitalized = detectedName
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      loginUser({
        name: capitalized || 'Purnya Patron',
        email: loginEmail.includes('@') ? loginEmail : `${loginEmail}@purnya.in`,
        phone: !loginEmail.includes('@') ? loginEmail : '+91 98765 43210',
      });

      setIsLoading(false);
      showToast('Welcome Back', `Delighted to see you again, ${capitalized}.`);
      router.push(redirectUrl);
    }, 400);
  };


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!signupPhone.trim()) {
      setErrorMsg('Please provide your mobile number for shipping updates.');
      return;
    }
    if (signupPassword.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Please accept the Terms of Service & Privacy Policy.');
      return;
    }

    setIsLoading(true);

    // 1. If Supabase is configured, create the user in Supabase Auth (which triggers public.profiles creation)
    if (isSupabaseConfigured) {
      const res = await signUpWithSupabase(signupEmail.trim(), signupPassword, {
        name: fullName.trim(),
        phone: signupPhone.trim(),
      });
      if (!res.success && res.error) {
        setIsLoading(false);
        setErrorMsg(res.error.toLowerCase().includes('already registered') ? 'An account with this email already exists. Please sign in instead.' : res.error);
        return;
      }
    }

    loginUser({
      name: fullName.trim(),
      email: signupEmail.trim(),
      phone: signupPhone.trim().startsWith('+') ? signupPhone.trim() : `+91 ${signupPhone.trim()}`,
    });
    setIsLoading(false);
    showToast('Circle Membership Activated', 'Welcome to Purnya! Your 15% discount code is WELCOME15.');
    router.push(redirectUrl);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }
    setIsForgotLoading(true);
    const res = await sendPasswordResetEmail(forgotEmail.trim());
    setIsForgotLoading(false);
    if (res.success) {
      setForgotSent(true);
      showToast('Recovery Link Dispatched', `Password reset instructions sent to ${forgotEmail}.`);
    } else {
      setForgotError(res.error || 'Failed to dispatch recovery link. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    const res = await updateUserPassword(newPassword);
    setIsLoading(false);

    if (res.success) {
      setResetSuccess(true);
      showToast('Password Updated ✨', 'Your password has been changed. You can now sign in.');
      setTimeout(() => {
        setMode('login');
        setResetSuccess(false);
        setNewPassword('');
        setConfirmNewPassword('');
      }, 2000);
    } else {
      setErrorMsg(res.error || 'Failed to update password. Please request a new recovery link.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      {/* Top Breadcrumb / Back Link */}
      <div className="max-w-6xl w-full mx-auto mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A7469] hover:text-[#0B241C] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Storefront</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto bg-white rounded-3xl shadow-xl shadow-black/5 border border-[#E8E1D5] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Side: Editorial Luxury Brand Experience */}
        <div className="lg:col-span-5 bg-[#08281F] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Background Glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#C5A059]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#144234]/60 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Crest */}
          <div className="relative z-10 space-y-6">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#FAF8F5] border-2 border-[#C5A059] flex items-center justify-center p-0.5 shadow-md">
                <img src="/purnya-logo.png" alt="Purnya" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-serif-title font-bold text-xl tracking-widest text-[#FAF8F5] block leading-tight">
                  PURNYA
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
                  Maison of Mindful Luxury
                </span>
              </div>
            </Link>

            <div className="pt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-[#144234] text-[#D4AF37] border border-[#C5A059]/30">

                The Purnya Circle
              </span>
              <h2 className="font-serif-title text-2xl sm:text-3xl font-bold mt-4 leading-tight text-white">
                Handcrafted adornments, curated for discerning tastes.
              </h2>
              <p className="text-xs sm:text-sm text-[#C9BDB0] mt-3 leading-relaxed">
                Step into an exclusive circle celebrating 18K anti-tarnish vermeil, clean botanicals, and artisanal home sanctuaries.
              </p>
            </div>

            {/* Member Privileges List */}
            <div className="space-y-3.5 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <Gift className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">15% Welcome Privilege</h3>
                  <p className="text-[11px] text-[#A6BFB2]">Enjoy 15% off your inaugural order with code WELCOME15.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <Truck className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Complimentary Express Transit</h3>
                  <p className="text-[11px] text-[#A6BFB2]">Insured priority shipping on all bespoke orders pan-India.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Anti-Tarnish Assurance</h3>
                  <p className="text-[11px] text-[#A6BFB2]">Certified anti-tarnish longevity backed by artisanal guarantee.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
            <p className="text-xs italic text-[#D8D1C7] leading-relaxed">
              “Purnya's craftsmanship feels like an heirloom from first touch. The packaging and finish are truly sublime.”
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-6 h-6 rounded-full bg-[#C5A059] flex items-center justify-center font-bold text-[10px] text-[#08281F]">
                A
              </div>
              <div>
                <p className="text-[11px] font-bold text-white">Ananya Mukherjee</p>
                <p className="text-[9px] text-[#D4AF37]">Verified Circle Collector</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Tabs & Forms */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          {/* Mode Switcher Tabs (Hidden in Reset Mode) */}
          {mode !== 'reset' && (
            <div className="flex items-center bg-[#FAF8F5] p-1.5 rounded-2xl border border-[#E8E1D5] max-w-md mx-auto w-full mb-8">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${mode === 'login'
                    ? 'bg-[#0B241C] text-[#FAF8F5] shadow-sm'
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
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${mode === 'signup'
                    ? 'bg-[#0B241C] text-[#FAF8F5] shadow-sm'
                    : 'text-[#5A7469] hover:text-[#0B241C]'
                  }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Brand Logo on Top of Form */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border-2 border-[#C5A059] flex items-center justify-center p-1 shadow-sm shrink-0">
              <img src="/purnya-logo.png" alt="Purnya" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-serif-title font-bold text-xl tracking-[0.16em] text-[#0C3B2E] block leading-none">
                PURNYA
              </span>
              <span className="text-[9px] uppercase tracking-[0.22em] text-[#C5A059] font-bold mt-1 block">
                Life · Lifestyle · You
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h1 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0B241C]">
              {mode === 'login' ? 'Welcome Back to Purnya' : mode === 'signup' ? 'Join the Purnya Circle' : 'Set New Password'}
            </h1>
            <p className="text-xs sm:text-sm text-[#5A7469] mt-1.5">
              {mode === 'login'
                ? 'Access your orders, bespoke saved pieces, and privileged member benefits.'
                : mode === 'signup'
                  ? 'Register today to unlock curated invitations, gift privileges, and fast checkout.'
                  : 'Enter a strong, secure new password for your Purnya account.'}
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* -------------------- SIGN IN FORM -------------------- */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B241C] mb-1.5 uppercase tracking-wider">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A9E94]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com or 9876543210"
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#DDD6CA] focus:border-[#C5A059] focus:bg-white rounded-xl text-xs sm:text-sm text-[#0B241C] outline-none transition-all placeholder:text-[#9AA5A0]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#0B241C] uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs font-semibold text-[#C5A059] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A9E94]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-[#FAF8F5] border border-[#DDD6CA] focus:border-[#C5A059] focus:bg-white rounded-xl text-xs sm:text-sm text-[#0B241C] outline-none transition-all placeholder:text-[#9AA5A0]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8A9E94] hover:text-[#0B241C]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-[#0B241C] rounded"
                  />
                  <span className="text-xs text-[#5A7469]">Keep me signed in on this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-[#08281F] hover:bg-[#0C3B2E] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  </>
                )}
              </button>


            </form>
          )}

          {/* -------------------- SIGN UP FORM -------------------- */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#0B241C] mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A9E94]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#DDD6CA] focus:border-[#C5A059] focus:bg-white rounded-xl text-xs sm:text-sm text-[#0B241C] outline-none transition-all placeholder:text-[#9AA5A0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#0B241C] mb-1 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A9E94]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="priya@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#DDD6CA] focus:border-[#C5A059] focus:bg-white rounded-xl text-xs sm:text-sm text-[#0B241C] outline-none transition-all placeholder:text-[#9AA5A0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B241C] mb-1 uppercase tracking-wider">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A9E94]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#DDD6CA] focus:border-[#C5A059] focus:bg-white rounded-xl text-xs sm:text-sm text-[#0B241C] outline-none transition-all placeholder:text-[#9AA5A0]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#0B241C] mb-1 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A9E94]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-[#DDD6CA] focus:border-[#C5A059] focus:bg-white rounded-xl text-xs sm:text-sm text-[#0B241C] outline-none transition-all placeholder:text-[#9AA5A0]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8A9E94] hover:text-[#0B241C]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0B241C] mb-1 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A9E94]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-[#DDD6CA] focus:border-[#C5A059] focus:bg-white rounded-xl text-xs sm:text-sm text-[#0B241C] outline-none transition-all placeholder:text-[#9AA5A0]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8A9E94] hover:text-[#0B241C]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Welcome Bonus Callout */}
              <div className="p-3 bg-[#FAF3E0] rounded-xl border border-[#C5A059]/40 flex items-center gap-2.5 text-xs text-[#0B241C]">
                <Gift className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>
                  <strong className="font-bold text-[#96742E]">Circle Privilege:</strong> Automatic 15% discount coupon code <strong>WELCOME15</strong> will be issued to your account.
                </span>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 accent-[#0B241C] rounded"
                />
                <span className="text-[11px] text-[#5A7469] leading-tight">
                  I agree to Purnya's{' '}
                  <Link href="/terms" className="text-[#0B241C] font-semibold underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy-policy" className="text-[#0B241C] font-semibold underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-[#08281F] hover:bg-[#0C3B2E] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Membership...</span>
                  </>
                ) : (
                  <>
                    <span>Join Purnya Circle</span>
                    <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* -------------------- RESET PASSWORD FORM -------------------- */}
          {mode === 'reset' && (
            <div className="space-y-4">
              {resetSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-bold text-emerald-900">Password Updated Successfully!</h3>
                  <p className="text-xs text-emerald-700">
                    Your password has been changed. Switching back to sign in...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B241C] mb-1.5 uppercase tracking-wider">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A9E94]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-10 pr-10 py-3 bg-[#FAF8F5] border border-[#DDD6CA] focus:border-[#C5A059] focus:bg-white rounded-xl text-xs sm:text-sm text-[#0B241C] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8A9E94] hover:text-[#0B241C]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B241C] mb-1.5 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A9E94]">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        className="w-full pl-10 pr-10 py-3 bg-[#FAF8F5] border border-[#DDD6CA] focus:border-[#C5A059] focus:bg-white rounded-xl text-xs sm:text-sm text-[#0B241C] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8A9E94] hover:text-[#0B241C]"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#08281F] hover:bg-[#0C3B2E] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Update Password & Continue</span>
                        <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMsg('');
                      }}
                      className="text-xs font-semibold text-[#5A7469] hover:text-[#0B241C]"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Bottom Prompt to Toggle */}
          <div className="mt-6 text-center text-xs text-[#5A7469]">
            {mode === 'login' ? (
              <p>
                Not a member yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                  }}
                  className="font-bold text-[#0B241C] underline hover:text-[#C5A059]"
                >
                  Create an account in 30 seconds
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="font-bold text-[#0B241C] underline hover:text-[#C5A059]"
                >
                  Sign in directly
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#E8E1D5] relative animate-scaleUp">
            {/* Modal Brand Logo */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border-2 border-[#C5A059] flex items-center justify-center p-0.5 shadow-xs shrink-0">
                <img src="/purnya-logo.png" alt="Purnya" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-serif-title font-bold text-base tracking-[0.14em] text-[#0C3B2E] block leading-none">
                  PURNYA
                </span>
                <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A059] font-bold mt-0.5 block">
                  Password Recovery
                </span>
              </div>
            </div>

            <h2 className="font-serif-title text-xl font-bold text-[#0B241C]">
              Reset Your Password
            </h2>
            <p className="text-xs text-[#5A7469] mt-1.5">
              Enter the email address registered with your Purnya Circle account. We will dispatch a secure password reset link directly to your inbox.
            </p>

            {forgotError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSent ? (
              <div className="my-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-emerald-900">Recovery Instructions Dispatched</p>
                <p className="text-[11px] text-emerald-700 mt-1">
                  We have forwarded a password recovery link to <strong>{forgotEmail}</strong>. Please check your inbox and spam folder.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordOpen(false);
                    setForgotSent(false);
                    setForgotEmail('');
                    setForgotError('');
                  }}
                  className="mt-4 px-4 py-2 bg-[#08281F] text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-[#0C3B2E]"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#0B241C] mb-1 uppercase tracking-wider">
                    Registered Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD6CA] focus:border-[#C5A059] focus:bg-white rounded-xl text-xs text-[#0B241C] outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordOpen(false);
                      setForgotError('');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-[#5A7469] hover:text-[#0B241C] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="px-5 py-2.5 bg-[#08281F] hover:bg-[#0C3B2E] text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isForgotLoading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <span>Send Recovery Link</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
