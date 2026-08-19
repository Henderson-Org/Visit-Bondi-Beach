import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, adminCookieOptions } from '@/lib/admin/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Clear the admin session cookie and return to the login screen. */
export async function POST(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = '';
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set(ADMIN_COOKIE, '', adminCookieOptions(0));
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}
