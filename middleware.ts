import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin/auth';

/**
 * A malformed percent-encoded URL is a client mistake, not a server fault.
 *
 * Next decodes route params before /[...slug] runs, and on a broken escape sequence it
 * throws "failed to decode param" - which surfaces as a 500. Verified against the
 * production build: /%, /%zz, /bondi%2, /caf%E9 and /%E0%A4%A all returned 500, while a
 * genuinely missing page correctly returned 404. Scanners probe these constantly, so the
 * site was emitting a steady trickle of server errors for requests that were never valid.
 * That is what Vercel's 5xx anomaly alert was correlating with the decode error logs.
 *
 * Sustained 5xx tells Google the site is unstable and can cost crawl budget; 404 is the
 * honest answer and costs nothing. We cannot try/catch inside the route because the throw
 * happens upstream of it, so the check has to run here, at the edge, first.
 */
function isDecodable(pathname: string): boolean {
  try {
    decodeURIComponent(pathname);
    return true;
  } catch {
    return false;
  }
}

/**
 * The 404 body for an undecodable URL, served from the edge.
 *
 * It is deliberately self-contained rather than a rewrite to the app's not-found page: a
 * rewrite re-enters the routing layer still carrying the original malformed URL, which
 * throws again and produces the same 500 this exists to prevent. Verified - the rewrite
 * version still returned 500. Terminating here is the only way the bad path never reaches
 * param decoding at all.
 */
const MALFORMED_URL_BODY = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Page not found - Visit Bondi Beach</title>
<style>
  :root{color-scheme:light}
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#faf7f2;color:#14181b;
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;padding:24px}
  main{max-width:32rem;text-align:center}
  h1{font-family:Georgia,Cambria,"Times New Roman",serif;font-size:1.75rem;margin:0 0 .5rem;letter-spacing:-.01em}
  p{margin:0 0 1.5rem;color:#3c444a}
  a{display:inline-block;background:#186576;color:#fff;text-decoration:none;
    padding:.65rem 1.1rem;border-radius:.5rem;font-weight:600}
  a:focus-visible{outline:2px solid #1f7a8c;outline-offset:3px}
</style></head>
<body><main>
<h1>That link isn&rsquo;t quite right</h1>
<p>The web address has characters we can&rsquo;t read, so there&rsquo;s no page to show you. It was probably mistyped or copied incompletely.</p>
<a href="/">Go to Visit Bondi Beach</a>
</main></body></html>`;

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

  // Before anything else, including the admin checks - an undecodable path can never match
  // a real page, so answer 404 here and stop, rather than letting it reach param decoding.
  if (!isDecodable(pathname)) {
    return new NextResponse(MALFORMED_URL_BODY, {
      status: 404,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=3600',
        'x-robots-tag': 'noindex, nofollow',
      },
    });
  }

  // Everything below is the admin gate; other paths pass straight through.
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

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
  // The admin gate only needs /admin*, but the malformed-URL guard has to see every request
  // that could reach a dynamic route, so the matcher is now site-wide. Static assets and
  // image optimisation are excluded: they never hit /[...slug], and running middleware on
  // them would add edge invocations for nothing.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|robots.txt|sitemap.xml).*)'],
};
