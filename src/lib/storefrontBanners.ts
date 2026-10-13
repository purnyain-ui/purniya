import type { HeroSlide } from '../types';

export async function getStorefrontBanners(): Promise<HeroSlide[] | null> {
  try {
    const response = await fetch('/api/hero-banners', { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return null;
    const slides = await response.json();
    return Array.isArray(slides) ? slides : null;
  } catch {
    return null;
  }
}
