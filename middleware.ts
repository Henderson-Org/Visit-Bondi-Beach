import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin/auth';

/**
 * Server-side authorisation for the private admin area.
 *
 * This runs at the edge before any admin page renders or any admin API responds, so
 * unauthenticated requests never reach the dashboard, its data, or the database.
 * Hiding /admin from navigation is NOT the security mechanism - this is.
 *
 * It also stamps X-Robots-Tag on every admin response as a second indexing guard
 * alongside the route's own noindex metadata and the robots.txt disallow.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const noindex = (res: NextResponse) => {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return res;
  };

  // The login page and the login/logout endpoints must stay reachable, or there
  // would be no way to authenticate. They hold no analytics data.
  const isPublicAdminRoute =
    pathname === '/admin/login' ||
    pathname === '/api/admin/login' ||
    pathname === '/api/admin/logout';

  if (isPublicAdminRoute) return noindex(NextResponse.next());

  const authed = await verifySessionToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (authed) return noindex(NextResponse.next());

  // Admin APIs answer 401 as JSON; pages redirect to the login form and remember
  // where the owner was heading.
  if (pathname.startsWith('/api/admin')) {
    return noindex(
      NextResponse.json({ error: 'Unauthorised' }, { status: 401 }),
    );
  }

  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = pathname === '/admin' && !search ? '' : `?next=${encodeURIComponent(pathname + search)}`;
  return noindex(NextResponse.redirect(url));
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
