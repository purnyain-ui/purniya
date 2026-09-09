'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrdersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/account?tab=orders');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
      <div className="w-10 h-10 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-[#5A7469]">Redirecting to your orders...</p>
    </div>
  );
}
