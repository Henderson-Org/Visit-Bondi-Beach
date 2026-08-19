/**
 * Admin authentication.
 *
 * There was no auth system in this project, so this is the smallest secure design that
 * fits a Next.js + Vercel deployment:
 *
 *   1. The owner posts a password to /api/admin/login.
 *   2. It is compared to ADMIN_PASSWORD in constant time.
 *   3. On success we set an HMAC-SHA256 signed, httpOnly, Secure, SameSite=Strict
 *      session cookie containing only an expiry timestamp - no user data, no secret.
 *   4. middleware.ts verifies that signature on every /admin and /api/admin request,
 *      at the edge, BEFORE any page or data is rendered.
 *
 * The signature is the security boundary. Hiding the route from navigation is not.
 * Everything uses Web Crypto so the same code runs in Edge middleware and Node routes.
 * Secrets come from the environment and are never committed.
 */

export const ADMIN_COOKIE = 'vbb_admin';

/** Session lifetime. The owner re-enters the password after this. */
export const ADMIN_SESSION_HOURS = 12;

const enc = new TextEncoder();

function secret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  // A short secret would make the HMAC brute-forceable, so refuse it outright rather
  // than issuing weak sessions.
  return s && s.length >= 32 ? s : null;
}

/** True when both required secrets are present. Without them, admin access is refused. */
export function adminConfigured(): boolean {
  return Boolean(secret() && process.env.ADMIN_PASSWORD);
}

async function hmac(payload: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(payload));
  return Buffer.from(new Uint8Array(sig)).toString('base64url');
}

/** Length-independent, constant-time string comparison. */
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  // Compare a fixed number of bytes so the loop count never depends on the inputs.
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

/** Verify a submitted password against ADMIN_PASSWORD. */
export function passwordValid(submitted: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !submitted) return false;
  return timingSafeEqual(submitted, expected);
}

/** Mint a signed session token that expires ADMIN_SESSION_HOURS from now. */
export async function createSessionToken(now: Date = new Date()): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const exp = now.getTime() + ADMIN_SESSION_HOURS * 3_600_000;
  const payload = String(exp);
  return `${payload}.${await hmac(payload, key)}`;
}

/**
 * Verify a session token: signature must match AND the session must not have expired.
 * Returns false for anything malformed - never throws.
 */
export async function verifySessionToken(
  token: string | undefined | null,
  now: Date = new Date(),
): Promise<boolean> {
  const key = secret();
  if (!key || !token) return false;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(payload, key);
  if (!timingSafeEqual(sig, expected)) return false;
  const exp = Number(payload);
  return Number.isFinite(exp) && exp > now.getTime();
}

/** Cookie attributes for the admin session. */
export function adminCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}
