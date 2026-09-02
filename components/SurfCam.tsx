import Link from 'next/link';

/**
 * Watch Bondi live - a link out to North Bondi Surf Life Saving Club's camera.
 *
 * THIS USED TO BE AN EMBEDDED IFRAME. Do not put it back without reading this.
 *
 * The club's camera is hosted on ipcamlive.com, and in about the last week of August 2026
 * a DOMAIN LOCK was switched on for it. The player's own state endpoint says so plainly:
 *
 *   GET https://g3.ipcamlive.com/player/getcamerastreamstate.php?alias=687a39cf71c58
 *   → "domainlockenabled": "1",
 *     "domainlockurl": "northbondisurfclub.com",
 *     "cameracannotbeembedded": true,
 *     "streamavailable": 0,
 *     "streamid": ""
 *
 * With the lock on, the API withholds the stream id from any domain that is not
 * northbondisurfclub.com, so the player loads but has nothing to play and renders as a
 * black rectangle. Nothing on our side was broken and nothing on our side can fix it:
 * the camera, the HLS stream and the picture are all healthy (verified directly - the
 * playlist serves live segments and the snapshot is a correctly exposed daytime frame).
 *
 * Two dead ends worth recording so they are not re-investigated:
 *   - It is NOT mixed content. The player config hands out http:// addresses, which looks
 *     damning on an https page, but ipcamliveplayer.min.js rewrites http→https itself when
 *     location.protocol is https.
 *   - It is NOT the camera being dark or the club's feed being down.
 *
 * And one thing we deliberately did NOT do: the stream's snapshot.jpg endpoint is public
 * and would render a live still here. Using it would route around an access control the
 * club has just deliberately turned on, so it is off the table. The fix is a conversation,
 * not a workaround - ipcamlive's domain lock accepts more than one domain, so the club can
 * add visitbondibeach.com if they are happy for us to embed it.
 *
 * Until then this links to where the camera does work, which is honest and still useful.
 * The live numbers a visitor actually wants are already on the page: WeatherSurfSummary
 * renders the conditions bar directly above this, from our own providers.
 */
const OFFICIAL_URL = 'https://northbondisurfclub.com/webcam/';

export function SurfCam() {
  return (
    <section className="mx-auto max-w-6xl px-4" aria-labelledby="live-north-bondi">
      <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ocean-700">
          Live from the beach
        </p>
        <h2 id="live-north-bondi" className="mt-2 font-display text-2xl text-ink-900 md:text-3xl">
          Watch Bondi right now
        </h2>
        <p className="mt-3 max-w-prose text-ink-700">
          North Bondi Surf Life Saving Club runs a live camera looking south down the beach - the
          quickest way to see the swell, the crowd and what the sand looks like before you leave
          home. It plays on the club&rsquo;s own site.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <a
            href={OFFICIAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-ocean-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-ocean-700 focus:outline-none focus:ring-2 focus:ring-ocean-300"
          >
            Open the North Bondi live cam →
          </a>
          <Link
            href="/bondi-weather"
            className="inline-flex min-h-[44px] items-center text-sm font-medium text-ocean-700 hover:underline"
          >
            Today&rsquo;s surf &amp; weather
          </Link>
        </div>
        <p className="mt-4 text-xs text-ink-500">
          Camera operated by{' '}
          <a
            href={OFFICIAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ocean-700 hover:underline"
          >
            North Bondi Surf Life Saving Club
          </a>
          . We link to it rather than reproducing their stream.
        </p>
      </div>
    </section>
  );
}
