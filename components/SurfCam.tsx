/**
 * Live from North Bondi — an embedded live surf camera.
 *
 * Source: the North Bondi Surf Life Saving Club's own public beach camera, hosted on
 * ipcamlive.com (a webcam-embed provider). The club publishes this exact iframe on
 * https://northbondisurfclub.com/webcam/ and the player sets no X-Frame-Options /
 * frame-ancestors, so it is designed for third-party embedding — we frame it directly
 * rather than downloading, re-hosting or proxying the stream.
 *
 * The iframe is the ONLY third-party resource (no player SDK / scripts). It's muted and
 * lazy-loaded, keeps a 16:9 ratio at every width, and never overflows on mobile.
 */
const CAM_SRC =
  'https://g3.ipcamlive.com/player/player.php?alias=687a39cf71c58&skin=white&autoplay=1&mute=1&disableframecapture=1&disablestorageplayer=1&disabledownloadbutton=1&disableuserpause=1';
const OFFICIAL_URL = 'https://northbondisurfclub.com/webcam/';

export function SurfCam() {
  return (
    <section className="mx-auto max-w-6xl px-4" aria-labelledby="live-north-bondi">
      <h2 id="live-north-bondi" className="font-display text-2xl md:text-3xl text-ink-900">
        Live from North Bondi
      </h2>
      <p className="mt-2 max-w-prose text-ink-700">
        Check the surf, weather and beach conditions at North Bondi right now.
      </p>

      <div className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-sand-200 bg-ink-900 shadow-sm">
        <iframe
          src={CAM_SRC}
          title="Live surf camera at North Bondi Beach"
          className="h-full w-full border-0"
          loading="lazy"
          allow="fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <p className="mt-2 text-xs text-ink-500">
        Live camera courtesy of{' '}
        <a
          href={OFFICIAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ocean-700 hover:underline"
        >
          North Bondi Surf Life Saving Club
        </a>
      </p>
    </section>
  );
}
