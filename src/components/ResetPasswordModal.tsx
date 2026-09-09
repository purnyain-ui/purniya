'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ResetPasswordModal() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    // Fired automatically by Supabase once it reads the recovery token
    // out of the URL hash, on whatever page the email link lands on.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setOpen(true);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (updateError) {
        setError(updateError.message || 'Failed to update password. Please try again.');
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        // Clean the recovery token out of the URL
        window.history.replaceState(null, '', window.location.pathname);
      }, 2200);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-[#C5A059]/40 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        {/* Close (only once resolved, to avoid dead-ending users mid recovery) */}
        {(success || error) && (
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full text-[#5A7469] hover:text-[#0B241C] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

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
          <h3 className="font-serif-title text-2xl font-bold text-[#0B241C] pt-1">Set a New Password</h3>
          <p className="text-xs text-[#2C4A3E]">Choose a strong new password for your Purnya Circle account.</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-emerald-900">Password Updated</p>
            <p className="text-[11px] text-emerald-700">You can now sign in with your new password.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A3E]">
                New Password
              </label>
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

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#2C4A3E]">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A7469]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E2DBD0] bg-[#FAF8F5] focus:bg-white text-xs font-medium focus:border-[#C5A059] focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#C5A059] hover:from-[#E6C25B] hover:to-[#D4AF37] text-[#08281F] font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-[10px] text-[#5A7469] flex items-center justify-center gap-1 pt-1">
          <Sparkles className="w-3 h-3 text-[#C5A059]" />
          <span>Purnya Circle Member Support: care@purnya.in</span>
        </p>
      </div>
    </div>
  );
}