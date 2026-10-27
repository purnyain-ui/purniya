'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminBottomSectionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/home/festival-banner');
  }, [router]);

  return (
    <div className="p-8 text-center text-sm text-[#5A7469]">
      Redirecting to Home Sections...
    </div>
  );
}