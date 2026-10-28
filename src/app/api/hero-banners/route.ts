import { getHeroDisplayBanners } from '../../../lib/heroBannerServer';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return Response.json(await getHeroDisplayBanners(), {
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' },
    });
  } catch {
    return Response.json({ error: 'Unable to load banners' }, { status: 503 });
  }
}
