import sharp from 'sharp';
import { getBannersFromSupabase } from '../../../lib/supabase';
import type { HeroSlide } from '../../../types';

export const runtime = 'nodejs';

// Cache only public display copies. Admin editing continues to use the originals.
let cached: { slides: HeroSlide[]; expires: number } | undefined;
let pending: Promise<HeroSlide[]> | undefined;

async function loadDisplayBanners() {
  const originals = await getBannersFromSupabase();
  if (originals === null) throw new Error('Banner source unavailable');
  const slides = await Promise.all(originals.filter((slide) => slide.active).map(async (slide) => {
    const match = /^data:image\/(?:png|jpe?g|webp);base64,(.+)$/s.exec(slide.image);
    if (!match) return slide;
    try {
      const image = await sharp(Buffer.from(match[1], 'base64'), { limitInputPixels: 40000000 })
        .rotate()
        .resize({ width: 1680, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      return { ...slide, image: `data:image/webp;base64,${image.toString('base64')}` };
    } catch {
      // An unsupported upload must not make the other banners disappear.
      return slide;
    }
  }));
  cached = { slides, expires: Date.now() + 60000 };
  return slides;
}

export async function GET() {
  try {
    if (!cached || cached.expires < Date.now()) {
      pending ??= loadDisplayBanners().finally(() => { pending = undefined; });
      await pending;
    }
    return Response.json(cached!.slides, {
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' },
    });
  } catch {
    return Response.json({ error: 'Unable to load banners' }, { status: 503 });
  }
}
