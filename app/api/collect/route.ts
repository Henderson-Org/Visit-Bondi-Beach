import { NextResponse, type NextRequest } from 'next/server';
import { isbot } from 'isbot';
import { collectionEnabled, query } from '@/lib/analytics/db';
import {
  SESSION_COOKIE,
  SESSION_INACTIVITY_MINUTES,
  VISITOR_COOKIE,
  VISITOR_COOKIE_DAYS,
  classifyPath,
  isExcludedPath,
  normaliseCountry,
  referrerHost,
} from '@/lib/analytics/core';

/**
 * First-party page-view collector.
 *
 * Design rules:
 *  - It always answers 204, whatever happens. A failed analytics write must never be
 *    visible to a visitor or block a page, so every error is swallowed after logging.
 *  - The visitor and session ids are minted and set HERE, server-side, in httpOnly
 *    cookies. Client JavaScript can never read them, and nothing is derived from IP,
 *    user agent or any fingerprint.
 *  - Language and content id are derived on the SERVER from the pathname, so a forged
 *    request cannot mislabel a page's language, and admin/API paths cannot be injected
 *    into public analytics.
 *  - No IP address is stored, in any form. Country comes from the platform's own
 *    geolocation header, so we record a two-letter country and never touch the IP
 *    it was resolved from.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  try {
    if (!collectionEnabled()) return noContent();

    // Conservative bot filtering: `isbot` is a maintained, well-tested library rather
    // than a hand-rolled UA list. A missing UA is NOT treated as a bot, so we don't
    // discard real people behind privacy tooling.
    const ua = req.headers.get('user-agent');
    if (ua && isbot(ua)) return noContent();

    const body = (await req.json().catch(() => null)) as
      | { eventId?: unknown; pathname?: unknown; title?: unknown; referrer?: unknown }
      | null;
    if (!body) return noContent();

    const eventId = typeof body.eventId === 'string' && UUID_RE.test(body.eventId) ? body.eventId : null;
    const rawPath = typeof body.pathname === 'string' ? body.pathname : '';
    if (!eventId || !rawPath.startsWith('/')) return noContent();

    // Server-side exclusion of admin, API and internal routes.
    if (isExcludedPath(rawPath)) return noContent();

    const { path, language, contentId } = classifyPath(rawPath);

    // Vercel resolves the country at the edge and passes it as a header. Country only -
    // we deliberately ignore the region/city headers. Absent off-platform (local dev),
    // in which case this is null and the dashboard shows "Unknown".
    const country = normaliseCountry(
      req.headers.get('x-vercel-ip-country') ?? req.headers.get('cf-ipcountry'),
    );

    const title =
      typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 300) : null;
    const referrer =
      typeof body.referrer === 'string' && body.referrer.trim()
        ? body.referrer.trim().slice(0, 500)
        : null;

    // Reuse the existing anonymous ids where present; mint new ones otherwise.
    const existingVisitor = req.cookies.get(VISITOR_COOKIE)?.value;
    const existingSession = req.cookies.get(SESSION_COOKIE)?.value;
    const visitorId = existingVisitor && UUID_RE.test(existingVisitor) ? existingVisitor : crypto.randomUUID();
    const sessionId = existingSession && UUID_RE.test(existingSession) ? existingSession : crypto.randomUUID();

    const res = noContent();

    // Visitor cookie: long-lived so "unique visitors" is meaningful across days.
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: VISITOR_COOKIE_DAYS * 24 * 60 * 60,
    });
    // Session cookie: a rolling 30-minute expiry. Re-setting it on every page view
    // means the session ends exactly SESSION_INACTIVITY_MINUTES after the last view,
    // which is the documented definition of a visit.
    res.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_INACTIVITY_MINUTES * 60,
    });

    // ON CONFLICT DO NOTHING makes the write idempotent: a retried or double-fired
    // beacon carrying the same eventId can never create a second page view.
    await query(
      `INSERT INTO analytics_page_view
         (event_id, occurred_at, visitor_id, session_id, pathname, page_title, content_id, language, country, referrer, referrer_host)
       VALUES ($1::uuid, now(), $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (event_id) DO NOTHING`,
      [eventId, visitorId, sessionId, path, title, contentId, language, country, referrer, referrerHost(referrer)],
    );

    return res;
  } catch (err) {
    // Never surface analytics failures to the visitor.
    console.error('[analytics] collect failed', err);
    return noContent();
  }
}
