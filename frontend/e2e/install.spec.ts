// Acceptance Test
// Traces to: L2-098
// Description: Wattzup can be installed as an app: its page links a web app manifest
// with the name, a standalone display and 192 px and 512 px icons, one of them maskable.
import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';

test('links a manifest with the name, standalone display and icons (L2-098 AC2)', async ({
  page,
}) => {
  const ride = new RidePage(page);
  await ride.open();
  const manifest = await ride.manifest();
  expect(manifest).toMatchObject({
    name: 'Wattzup',
    short_name: 'Wattzup',
    start_url: '/',
    display: 'standalone',
    theme_color: '#0b0c0e',
    background_color: '#0b0c0e',
  });
  const icons = manifest.icons as { src: string; sizes: string; type: string; purpose?: string }[];
  expect(icons.map((i) => i.sizes).sort()).toEqual(['192x192', '512x512', '512x512']);
  expect(icons.some((i) => i.purpose === 'maskable')).toBe(true);
  for (const icon of icons) {
    expect(await ride.imageSize(icon.src), icon.src).toBe(icon.sizes);
  }
});
