import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
  }

  try {
    // We fetch the embed URL because it reliably returns the OG image tag even without JS
    const embedUrl = url.endsWith('/embed') ? url : url.replace(/\/$/, '') + '/embed';
    
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Instagram: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract thumbnail from og:image or the EmbeddedMediaImage class
    let thumbnailUrl = '';
    const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    const imgMatch = html.match(/<img\s+class="EmbeddedMediaImage"[^>]+src="([^"]+)"/i);

    if (imgMatch && imgMatch[1]) {
      thumbnailUrl = imgMatch[1].replace(/&amp;/g, '&');
    } else if (ogMatch && ogMatch[1]) {
      thumbnailUrl = ogMatch[1].replace(/&amp;/g, '&');
    }

    if (thumbnailUrl) {
      return NextResponse.json({ thumbnailUrl });
    } else {
      return NextResponse.json({ error: 'Thumbnail not found in HTML' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Error fetching Instagram thumbnail:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
