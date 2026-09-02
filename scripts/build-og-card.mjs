#!/usr/bin/env node
/**
 * build-og-card.mjs — renders a typographic Open Graph card for a page we have no
 * photograph for.
 *
 *   node scripts/build-og-card.mjs \
 *     --out public/images/og/<slug>.png \
 *     --title "Matt Dee" \
 *     --subtitle "Bondi Rescue lifeguard, 2008-2017"
 *
 * WHY THIS EXISTS. A page with no ogImage shares as a bare link with no card, which on a
 * story people actually pass around costs reach. The obvious fix - reach for a stock beach
 * photo - is the wrong one for an obituary: a picture of other lifeguards under a headline
 * about a man who has died reads as a picture OF him. A card that is purely type asserts
 * nothing it should not.
 *
 * It renders in Chromium rather than through an SVG rasteriser so it can use the site's
 * real display face (Fraunces, app/fonts/fraunces-latin-var.woff2, embedded below as a
 * data URI). librsvg ignores @font-face, so an SVG route would silently fall back to
 * DejaVu and the card would not look like the site.
 *
 * REQUIREMENTS: Playwright + Chromium, which are NOT project dependencies - adding them
 * would desynchronise package-lock.json. This is a by-hand generator whose PNG output is
 * committed; it is not part of `npm run build`. On a machine without them, the committed
 * card is still served correctly.
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);
for (const k of ['out', 'title']) {
  if (!args[k]) {
    console.error(`missing --${k}`);
    process.exit(1);
  }
}

// Brand tokens, mirrored from tailwind.config.ts. Kept literal here because this script
// runs outside the Tailwind pipeline.
const SAND_50 = '#faf7f2';
const SAND_200 = '#e6d9c4';
const OCEAN_600 = '#186576';
const INK_900 = '#14181b';
const INK_600 = '#3c444a';

const font = readFileSync('app/fonts/fraunces-latin-var.woff2').toString('base64');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const html = `<!doctype html><meta charset="utf-8"><style>
  @font-face {
    font-family: 'Fraunces';
    src: url(data:font/woff2;base64,${font}) format('woff2');
    font-weight: 400 600;
  }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; background: ${SAND_50}; color: ${INK_900};
    padding: 72px 80px; display: flex; flex-direction: column; justify-content: space-between;
    font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }
  .brand { font-family: 'Fraunces', Georgia, serif; font-size: 30px; letter-spacing: -0.01em; }
  .brand em { font-style: normal; color: ${OCEAN_600}; }
  .rule { height: 3px; width: 84px; background: ${OCEAN_600}; margin: 0 0 30px; }
  h1 {
    font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 92px;
    line-height: 1.04; letter-spacing: -0.02em; max-width: 15ch;
  }
  p.sub { margin-top: 22px; font-size: 33px; line-height: 1.35; color: ${INK_600}; max-width: 26ch; }
  .foot {
    display: flex; justify-content: space-between; align-items: baseline;
    border-top: 1px solid ${SAND_200}; padding-top: 22px; font-size: 22px; color: ${INK_600};
  }
</style>
<body>
  <div class="brand">Visit <em>Bondi Beach</em></div>
  <div>
    <div class="rule"></div>
    <h1>${esc(args.title)}</h1>
    ${args.subtitle ? `<p class="sub">${esc(args.subtitle)}</p>` : ''}
  </div>
  <div class="foot"><span>visitbondibeach.com</span><span>${esc(args.kicker ?? '')}</span></div>
</body>`;

const require_ = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require_('/opt/node22/lib/node_modules/playwright'));
} catch {
  console.error('Playwright not available - the committed card is still valid; skipping.');
  process.exit(0);
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
mkdirSync(dirname(args.out), { recursive: true });
await page.screenshot({ path: args.out });
await browser.close();
console.log(`wrote ${args.out} (1200x630)`);
