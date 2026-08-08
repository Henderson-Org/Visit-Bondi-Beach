/**
 * Centralised affiliate-link system (Travelpayouts).
 *
 * The whole site asks for affiliate URLs through `getAffiliateLink()` and never
 * constructs provider URLs itself — so adding a property to data/accommodation.ts
 * automatically produces correct, tracked CTAs with no per-page URL maintenance.
 *
 * How it works:
 *  - Each provider adapter knows how to build a *target URL* on that provider's
 *    site (a destination or property search), given a destination + optional
 *    property name / provider-specific id.
 *  - If a Travelpayouts marker + the provider's program id are configured, the
 *    target URL is wrapped in a Travelpayouts redirect (tp.media/r) that carries
 *    the affiliate marker + a sub_id for granular tracking. If not configured yet,
 *    we return the plain provider URL — the CTA still works for users, it just
 *    isn't monetised until the marker is set. So the site is fully functional now
 *    and starts earning the moment the env vars are added.
 *
 * Security: the Travelpayouts MARKER and program ids are NOT secrets — they appear
 * in every affiliate URL by design — so they live in NEXT_PUBLIC_ env vars. The
 * private Travelpayouts API token is never used here and is never sent to the browser.
 */

export type ProviderId = 'booking' | 'hostelworld' | 'tripadvisor';

export interface AffiliateRequest {
  provider: ProviderId;
  /** Destination to search, e.g. "Bondi Beach". */
  destination: string;
  /** Optional specific property name to search for, e.g. "QT Bondi". */
  property?: string;
  /** Optional provider-specific id/url for a precise deep link (future use). */
  providerId?: string;
  /** Sub-tracking: where the click came from (page + placement). */
  campaign?: string;
}

interface ProviderConfig {
  id: ProviderId;
  label: string;
  /** Default CTA verb for this provider. */
  cta: string;
  /** Travelpayouts program id ("p"), from env; undefined ⇒ untracked fallback. */
  programId: () => string | undefined;
  /** Build the target URL on the provider's own site. */
  targetUrl: (req: AffiliateRequest) => string;
}

const enc = encodeURIComponent;

// The affiliate marker is public (it's in the URL). Untracked fallback if unset.
const marker = (): string | undefined => process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || undefined;

const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  booking: {
    id: 'booking',
    label: 'Booking.com',
    cta: 'Check availability',
    programId: () => process.env.NEXT_PUBLIC_TP_P_BOOKING,
    targetUrl: ({ destination, property }) =>
      `https://www.booking.com/searchresults.html?ss=${enc(property ? `${property}, ${destination}` : destination)}`,
  },
  hostelworld: {
    id: 'hostelworld',
    label: 'Hostelworld',
    cta: 'See hostel availability',
    programId: () => process.env.NEXT_PUBLIC_TP_P_HOSTELWORLD,
    targetUrl: ({ destination, property }) =>
      `https://www.hostelworld.com/search?search_keywords=${enc(property ? `${property} ${destination}` : destination)}`,
  },
  tripadvisor: {
    id: 'tripadvisor',
    label: 'Tripadvisor',
    cta: 'Compare on Tripadvisor',
    programId: () => process.env.NEXT_PUBLIC_TP_P_TRIPADVISOR,
    targetUrl: ({ destination, property }) =>
      `https://www.tripadvisor.com/Search?q=${enc(property ? `${property} ${destination}` : `hotels ${destination}`)}`,
  },
};

/** A clean, filesystem/analytics-safe sub_id from a campaign string. */
function sanitizeCampaign(c?: string): string {
  return (c || 'stay').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

/**
 * Wrap a provider target URL in a Travelpayouts redirect when configured,
 * otherwise return the target URL unchanged (functional but untracked).
 */
function wrap(provider: ProviderConfig, targetUrl: string, campaign?: string): string {
  const m = marker();
  const p = provider.programId();
  if (!m || !p) return targetUrl; // graceful: works now, monetises once configured
  const params = new URLSearchParams({ marker: m, p, u: targetUrl, sub_id: sanitizeCampaign(campaign) });
  return `https://tp.media/r?${params.toString()}`;
}

export interface AffiliateLink {
  provider: ProviderId;
  label: string;
  cta: string;
  href: string;
  /** True when a Travelpayouts marker + program id are configured. */
  tracked: boolean;
}

/** The single entry point the UI uses. Never construct provider URLs elsewhere. */
export function getAffiliateLink(req: AffiliateRequest): AffiliateLink {
  const provider = PROVIDERS[req.provider];
  const target = provider.targetUrl(req);
  const href = wrap(provider, target, req.campaign);
  return {
    provider: req.provider,
    label: provider.label,
    cta: provider.cta,
    href,
    tracked: Boolean(marker() && provider.programId()),
  };
}

export function providerLabel(id: ProviderId): string {
  return PROVIDERS[id].label;
}
