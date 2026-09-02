/**
 * The icon set is six files that all have to be the same picture at different sizes, and
 * the classic failure is one of them going stale — a favicon.ico nobody re-exported after
 * a brand change, an apple-touch icon left at the old logo. scripts/build-icons.mjs
 * generates all of them from one artwork definition; these tests assert the COMMITTED
 * outputs still have the shape that script produces.
 *
 * The headers are parsed by hand rather than with an image library on purpose: this asserts
 * the bytes a browser will actually read, and it keeps the test free of a dependency that
 * is only present transitively via Next.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/** Width and height from a PNG's IHDR, which is always the first chunk. */
function pngSize(path: string): { width: number; height: number } {
  const b = readFileSync(path);
  expect([...b.subarray(0, 8)], `${path} is not a PNG`).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

/** PNG colour type from the IHDR: 2 = RGB, 6 = RGBA. */
function pngColourType(path: string): number {
  return readFileSync(path).readUInt8(25);
}

/** The sizes declared in an .ico directory. 0 encodes 256 in this format. */
function icoSizes(path: string): number[] {
  const b = readFileSync(path);
  expect(b.readUInt16LE(0), 'ICO reserved field').toBe(0);
  expect(b.readUInt16LE(2), 'ICO type should be 1 (icon)').toBe(1);
  const count = b.readUInt16LE(4);
  return Array.from({ length: count }, (_, i) => b.readUInt8(6 + i * 16) || 256);
}

const TEAL = '#186576';

describe('favicon and icon set', () => {
  it('ships an ICO carrying both legacy sizes', () => {
    // 16 is the tab, 32 is the bookmark bar and the Windows taskbar. Google's SERP favicon
    // crawler also still asks for /favicon.ico before anything else.
    expect(icoSizes('app/favicon.ico')).toEqual([16, 32]);
  });

  it('ships an SVG icon in the brand teal', () => {
    const svg = readFileSync('app/icon.svg', 'utf8');
    expect(svg).toContain('viewBox="0 0 64 64"');
    expect(svg).toContain(TEAL);
    // Rounded: the browser tile draws its own corners, unlike the iOS one below.
    expect(svg).toMatch(/rx="\d+"/);
  });

  it('ships an opaque apple-touch icon at 180px', () => {
    expect(pngSize('app/apple-icon.png')).toEqual({ width: 180, height: 180 });
    // Apple's guidance is that a touch icon must be opaque; a transparent one renders
    // against black on some iOS surfaces. Colour type 2 is RGB with no alpha channel
    // (6 would be RGBA). This is also what makes the icon full-bleed rather than
    // pre-rounded — iOS applies its own mask, and rounding it twice leaves a pale halo.
    expect(pngColourType('app/apple-icon.png'), 'apple-icon must have no alpha channel').toBe(2);
  });

  it('ships the manifest icon sizes the manifest declares', () => {
    expect(pngSize('public/icon-192.png')).toEqual({ width: 192, height: 192 });
    expect(pngSize('public/icon-512.png')).toEqual({ width: 512, height: 512 });
  });

  it('keeps every icon small enough to be free', () => {
    // An icon is requested on essentially every cold page load; none of these should ever
    // grow into a real payload. The largest today is the 512 at ~14 KB.
    for (const f of ['app/favicon.ico', 'app/apple-icon.png', 'public/icon-192.png', 'public/icon-512.png']) {
      expect(readFileSync(f).length, `${f} is unexpectedly large`).toBeLessThan(40 * 1024);
    }
    expect(readFileSync('app/icon.svg').length).toBeLessThan(2048);
  });
});
