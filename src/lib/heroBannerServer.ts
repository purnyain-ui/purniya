import sharp from 'sharp';
import { getBannersFromSupabase } from './supabase';
import type { HeroSlide } from '../types';

const INLINE_IMAGE = /^data:image\/(png|jpe?g|webp);base64,(.+)$/s;
type BannerImage = { bytes: Buffer; contentType: string };
type BannerCache = { slides: HeroSlide[]; expires: number; images: Map<string, Promise<BannerImage>> };
let cached: BannerCache | undefined;
let pending: Promise<BannerCache> | undefined;

async function source(): Promise<BannerCache> {
  if (cached && cached.expires > Date.now()) return cached;
  pending ??= (async () => {
    const originals = await getBannersFromSupabase();
    if (originals === null) throw new Error('Banner source unavailable');
    cached = { slides: originals.filter(slide => slide.active), expires: Date.now() + 60000, images: new Map() };
    return cached;
  })().finally(() => { pending = undefined; });
  return pending;
}

// The manifest contains URLs rather than every full image in a JSON download.
// The browser chooses a responsive size and only downloads slides it displays.
export async function getHeroDisplayBanners(): Promise<HeroSlide[]> {
  const { slides } = await source();
  return slides.map(slide => INLINE_IMAGE.test(slide.image)
    ? { ...slide, image: `/api/hero-banners/image?id=${encodeURIComponent(slide.id)}` }
    : slide);
}

export async function getHeroBannerImage(id: string, width: number): Promise<BannerImage | null> {
  if (![640, 960, 1680].includes(width)) return null;
  const cache = await source();
  const slide = cache.slides.find(item => item.id === id);
  const match = slide && INLINE_IMAGE.exec(slide.image);
  if (!match) return null;
  const key = `${id}:${width}`;
  let image = cache.images.get(key);
  if (!image) {
    image = (async () => {
      const original = Buffer.from(match[2], 'base64');
      try {
        const bytes = await sharp(original, { limitInputPixels: 40000000 }).rotate()
          .resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
        return { bytes, contentType: 'image/webp' };
      } catch {
        // Keep individual older uploads usable if conversion fails.
        return { bytes: original, contentType: `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` };
      }
    })();
    cache.images.set(key, image);
  }
  return image;
}
