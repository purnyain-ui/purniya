import { NextRequest } from 'next/server';
import { getHeroBannerImage } from '../../../../lib/heroBannerServer';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  const width = Number(request.nextUrl.searchParams.get('width') || 1680);
  if (!id || id.length > 200 || ![640, 960, 1680].includes(width)) {
    return new Response('Invalid image request', { status: 400 });
  }
  try {
    const image = await getHeroBannerImage(id, width);
    if (!image) return new Response('Image not found', { status: 404 });
    return new Response(new Uint8Array(image.bytes), { headers: {
      'Content-Type': image.contentType,
      'Cache-Control': 'public, max-age=30, s-maxage=60',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch {
    return new Response('Image temporarily unavailable', { status: 503 });
  }
}
