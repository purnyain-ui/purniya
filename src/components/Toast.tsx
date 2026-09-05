'use client';

import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export default function Toast() {
  const { toast } = useStore();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#0C3B2E] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#C5A059] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div className="flex items-start gap-3 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-[#E2DBD0] max-w-sm">
        {icons[toast.type || 'success']}
        <div className="flex-1 pr-2">
          <p className="text-sm font-semibold text-[#0B241C] leading-tight">{toast.title}</p>
          {toast.desc && <p className="text-xs text-[#5A7469] mt-1 leading-snug">{toast.desc}</p>}
        </div>
      </div>
    </div>
  );
}
