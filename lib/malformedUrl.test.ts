/**
 * Vercel's anomaly detector flagged a 5xx spike correlated with recurring "failed to decode
 * param" errors on /[...slug]. Reproduced against the production build: /%, /%zz, /bondi%2,
 * /caf%E9 and /%E0%A4%A all returned 500, while a genuinely missing page returned 404.
 *
 * Next decodes route params upstream of our route handler, so the throw cannot be caught
 * inside the page - the middleware has to reject the path before routing. These tests cover
 * the predicate that decision rests on, and the two ways it can go wrong: letting a
 * malformed path through (back to 500s), or rejecting a legitimately encoded one (which
 * would 404 real pages - the site has 110 paths containing % or +).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/** Mirrors the predicate in middleware.ts. */
function isDecodable(pathname: string): boolean {
  try {
    decodeURIComponent(pathname);
    return true;
  } catch {
    return false;
  }
}

const MALFORMED = [
  '/%', // bare percent
  '/%zz', // non-hex digits
  '/bondi%2', // truncated escape
  '/caf%E9', // latin-1 byte, not valid UTF-8 on its own
  '/%E0%A4%A', // truncated multi-byte sequence
  '/a/b/%ff',
  '/ja/%zz', // under a locale prefix
];

const WELL_FORMED = [
  '/',
  '/bondi-beach',
  '/bondi-blog/category/Out+%26+About', // real path in pages.json
  '/bondi-blog/tag/bondi+recovery',
  '/caf%C3%A9', // properly encoded é
  '/bondi%20beach',
  '/whats-on/city2surf',
];

describe('malformed-URL predicate', () => {
  it('rejects every path that would throw in param decoding', () => {
    for (const p of MALFORMED) {
      expect(isDecodable(p), `${p} should be rejected before routing`).toBe(false);
    }
  });

  it('accepts well-formed paths, including legitimately percent-encoded ones', () => {
    for (const p of WELL_FORMED) {
      expect(isDecodable(p), `${p} is valid and must not be rejected`).toBe(true);
    }
  });

  it('accepts every encoded path the content index actually serves', () => {
    // The real regression risk: over-eager rejection would 404 live pages.
    const raw = JSON.parse(readFileSync('content/pages.json', 'utf8'));
    const pages: { path: string }[] = Array.isArray(raw) ? raw : raw.pages;
    const encoded = pages.filter((p) => /[%+]/.test(p.path));
    expect(encoded.length, 'expected encoded paths in the index').toBeGreaterThan(0);
    for (const p of encoded) {
      expect(isDecodable(p.path), `${p.path} is a real page and must stay reachable`).toBe(true);
    }
  });
});

describe('middleware wiring', () => {
  const source = readFileSync('middleware.ts', 'utf8');

  it('runs the guard before the admin gate', () => {
    // If the admin check came first, a malformed path outside /admin would fall through to
    // the route and 500 again.
    const guard = source.indexOf('isDecodable(pathname)');
    const adminGate = source.indexOf("pathname.startsWith('/admin')");
    expect(guard).toBeGreaterThan(-1);
    expect(adminGate).toBeGreaterThan(-1);
    expect(guard, 'the decode guard must run before the admin gate').toBeLessThan(adminGate);
  });

  it('matches site-wide, not just /admin', () => {
    // The guard is useless if middleware only runs on /admin - which is what the matcher
    // said before this fix.
    expect(source).toMatch(/matcher:\s*\[\s*'\/\(\(\?!/);
    expect(source, 'static assets should stay excluded from middleware').toContain('_next/static');
  });

  it('answers the malformed path directly instead of rewriting', () => {
    // A rewrite re-enters routing still carrying the original malformed URL and throws
    // again - that version was tried and still returned 500.
    expect(source).toMatch(/new NextResponse\(MALFORMED_URL_BODY/);
    expect(source).toContain('status: 404');
    expect(source, 'the edge 404 must not be indexable').toMatch(/x-robots-tag/i);
  });
});
