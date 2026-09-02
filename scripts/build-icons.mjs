#!/usr/bin/env node
/**
 * build-icons.mjs — generates the site's whole icon set from ONE artwork definition.
 *
 *   node scripts/build-icons.mjs        (or: npm run build:icons)
 *
 * Why a generator rather than a folder of hand-made files: an icon set is six files that
 * must all be the same picture, and the usual failure is one of them drifting — a stale
 * apple-touch icon from a previous brand, a favicon.ico nobody re-exported. Deriving all
 * of them from the `artwork()` template below makes that impossible; change the artwork,
 * re-run, and every size moves together. lib/siteIcons.test.ts asserts the committed
 * outputs still have the right shape.
 *
 * THE MARK: a sun over a wave, white on the brand teal. The teal is ocean-600 (#186576),
 * the exact colour the header wordmark uses for "Bondi Beach", so the icon and the
 * logotype are the same teal rather than two teals that nearly match.
 *
 * Every design choice here is a 16px choice, because 16px is where a favicon actually
 * lives. Earlier attempts that failed at that size, and are worth not repeating:
 *   - Two stacked wave bands with no sun read as the "≈" maths symbol, not as water.
 *   - A small sun (r≈7) dissolved into an indistinct smudge at 16px.
 *   - A centred sun read as a head above the water — a swimmer, not a sunrise. Offsetting
 *     it right turns the same two shapes into sky-over-sea.
 *   - The sun on the LEFT collides with the wave's first crest.
 * The stroke and radius below are deliberately heavy for the same reason: at 16px a 9.5/64
 * stroke lands on ~2.4 device pixels, and anything thinner greys out.
 *
 * REQUIREMENTS: sharp, which ships with Next.js. It is deliberately NOT added to
 * package.json — adding it would desynchronise package-lock.json and break `npm ci`. This
 * script is not part of `npm run build`; it is run by hand when the artwork changes, and
 * its outputs are committed.
 */
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const sharp = createRequire(import.meta.url)('sharp');

/** Brand teal — tailwind.config.ts `ocean.600`, the wordmark colour. */
const TEAL = '#186576';

/**
 * The mark, at a given corner radius.
 *
 * `radius` is a parameter because the browser favicon and the iOS home-screen icon want
 * different shapes: iOS applies its OWN rounded mask, so an apple-touch icon that arrives
 * pre-rounded gets rounded twice and shows a pale halo in the corners. That one is
 * rendered full-bleed (radius 0) and everything else rounded.
 */
const artwork = (radius) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">` +
  `<rect width="64" height="64"${radius ? ` rx="${radius}"` : ''} fill="${TEAL}"/>` +
  `<circle cx="42" cy="21" r="10.5" fill="#fff"/>` +
  `<path d="M7 44 q 12.5 -12.5 25 0 t 25 0" fill="none" stroke="#fff" stroke-width="9.5" stroke-linecap="round"/>` +
  `</svg>`;

const ROUNDED = 14;

/**
 * Rasterise at a high density and downsample, rather than asking the SVG renderer for the
 * target size directly: the curves are resolved at ~1067px and then filtered down, which
 * keeps the wave's edge smooth at 16 and 32px instead of aliasing into a staircase.
 */
async function png(size, radius) {
  return sharp(Buffer.from(artwork(radius)), { density: 1200 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Pack PNGs into an .ico container.
 *
 * The format is a 6-byte header, then one 16-byte directory entry per image, then the
 * image payloads. Embedding PNG (rather than BMP) is legal in ICO and understood by every
 * browser in use; it is also how every modern build tool emits them.
 */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // 0 encodes 256
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette size — 0 for truecolour
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const wrote = [];
const emit = (path, data) => {
  writeFileSync(path, data);
  wrote.push(`${path} (${(data.length / 1024).toFixed(1)} KB)`);
};

// The SVG itself, for browsers that take one: it stays sharp at any size and at ~300 bytes
// is smaller than any raster we could ship.
emit('app/icon.svg', artwork(ROUNDED));

// favicon.ico carries 16 and 32 for older browsers, and is still what Google's SERP
// favicon crawler looks for first.
emit('app/favicon.ico', ico([
  { size: 16, data: await png(16, ROUNDED) },
  { size: 32, data: await png(32, ROUNDED) },
]));

// iOS home screen. Full-bleed (iOS rounds it itself — see `artwork`) and flattened onto
// the teal so the file carries NO alpha channel: Apple's guidance is that a touch icon
// must be opaque, and a transparent one renders against black on some iOS surfaces.
// Flattening also makes the property checkable from the PNG header, which is what
// lib/siteIcons.test.ts asserts.
emit('app/apple-icon.png', await sharp(await png(180, 0)).flatten({ background: TEAL }).png({ compressionLevel: 9 }).toBuffer());

// Android / installed-app icons, referenced by app/manifest.ts.
emit('public/icon-192.png', await png(192, ROUNDED));
emit('public/icon-512.png', await png(512, ROUNDED));

console.log('Site icons — sun over wave, white on ocean-600');
for (const w of wrote) console.log(`  wrote ${w}`);
