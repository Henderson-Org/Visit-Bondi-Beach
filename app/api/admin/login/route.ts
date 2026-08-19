import { NextResponse, type NextRequest } from 'next/server';
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_HOURS,
  adminConfigured,
  adminCookieOptions,
  createSessionToken,
  passwordValid,
} from '@/lib/admin/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin login.
 *
 * Brute-force protection is a per-instance sliding window keyed on the client IP: five
 * failures in fifteen minutes locks that IP out for the rest of the window. On a
 * serverless platform this is per-instance rather than global, so it slows an attacker
 * rather than perfectly stopping a distributed one - the real protection is a long,
 * high-entropy ADMIN_PASSWORD plus the constant-time comparison. Documented in
 * docs/analytics.md.
 */
const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; first: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) return false;
  return rec.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW_MS) attempts.set(key, { count: 1, first: now });
  else rec.count += 1;
}

export async function POST(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: 'Admin access is not configured on this deployment.' },
      { status: 503 },
    );
  }

  // Only used transiently for rate limiting; never stored.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const password = form ? String(form.get('password') ?? '') : '';
  const next = form ? String(form.get('next') ?? '/admin') : '/admin';

  if (!passwordValid(password)) {
    recordFailure(ip);
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = `?error=1${next && next !== '/admin' ? `&next=${encodeURIComponent(next)}` : ''}`;
    return NextResponse.redirect(url, { status: 303 });
  }

  attempts.delete(ip);
  const token = await createSessionToken();
  if (!token) {
    return NextResponse.json({ error: 'Admin session secret is not configured.' }, { status: 503 });
  }

  // Only allow redirects back into the admin area, so `next` cannot be used as an
  // open redirect to an external site.
  const safeNext = next.startsWith('/admin') ? next : '/admin';
  const url = req.nextUrl.clone();
  url.pathname = safeNext.split('?')[0];
  url.search = safeNext.includes('?') ? `?${safeNext.split('?')[1]}` : '';

  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set(ADMIN_COOKIE, token, adminCookieOptions(ADMIN_SESSION_HOURS * 3600));
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
