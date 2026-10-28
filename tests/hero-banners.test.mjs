import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes, createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const implementation = stripTypeScriptTypes(readFileSync(new URL('../src/lib/heroBannerServer.ts', import.meta.url), 'utf8'))
  .replace("from 'sharp'", `from '${pathToFileURL(require.resolve('sharp')).href}'`)
  .replace("import { getBannersFromSupabase } from './supabase';", 'const getBannersFromSupabase = globalThis.__bannerTestSource;');
let moduleId = 0;
async function load(source) {
  globalThis.__bannerTestSource = source;
  try {
    return await import(`data:text/javascript;base64,${Buffer.from(implementation + `\n// test module ${moduleId++}`).toString('base64')}`);
  } finally { delete globalThis.__bannerTestSource; }
}
const fixture = await sharp(randomBytes(1800 * 900 * 3), { raw: { width: 1800, height: 900, channels: 3 } }).png().toBuffer();
const slide = { id: 'banner-one', active: true, title: 'Collection', image: `data:image/png;base64,${fixture.toString('base64')}` };

test('public banner manifest excludes image bytes and inactive slides while keeping external URLs', async () => {
  const slides = [slide, { ...slide, id: 'inactive', active: false }, { ...slide, id: 'external', image: 'https://example.com/banner.jpg' }];
  let reads = 0;
  const api = await load(async () => { reads++; return slides; });
  const [first, second] = await Promise.all([api.getHeroDisplayBanners(), api.getHeroDisplayBanners()]);
  assert.equal(reads, 1);
  assert.deepEqual(first, second);
  assert.equal(first.length, 2);
  assert.match(first[0].image, /^\/api\/hero-banners\/image\?id=/);
  assert.equal(first[1].image, slides[2].image);
  assert.ok(JSON.stringify(first).length < JSON.stringify(slides).length / 100);
  assert.equal(slide.image.startsWith('data:'), true, 'admin originals must remain unchanged');
});

test('responsive endpoint resizes mobile images and reuses concurrent conversions', async () => {
  const api = await load(async () => [slide]);
  const [mobile, repeated] = await Promise.all([api.getHeroBannerImage(slide.id, 640), api.getHeroBannerImage(slide.id, 640)]);
  const desktop = await api.getHeroBannerImage(slide.id, 1680);
  assert.equal(mobile, repeated);
  assert.equal(mobile.contentType, 'image/webp');
  assert.equal((await sharp(mobile.bytes).metadata()).width, 640);
  assert.equal((await sharp(desktop.bytes).metadata()).width, 1680);
  assert.ok(mobile.bytes.length < desktop.bytes.length);
  console.log(`Synthetic banner: original ${fixture.length} bytes; mobile ${mobile.bytes.length}; desktop ${desktop.bytes.length}.`);
  assert.equal(await api.getHeroBannerImage(slide.id, 999999), null);
  assert.equal(await api.getHeroBannerImage('unknown-banner', 640), null);
});

test('failed sources can retry and unsupported uploads retain a usable original', async () => {
  let tries = 0;
  const api = await load(async () => ++tries === 1 ? null : [{ ...slide, image: 'data:image/png;base64,YmFk' }]);
  await assert.rejects(api.getHeroDisplayBanners());
  assert.equal((await api.getHeroDisplayBanners()).length, 1);
  const fallback = await api.getHeroBannerImage(slide.id, 640);
  assert.equal(fallback.contentType, 'image/png');
  assert.equal(fallback.bytes.toString(), 'bad');
});
