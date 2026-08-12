/**
 * Thin wrapper over the site's existing GA4 (window.gtag). No new dependency. Safe to call
 * anywhere - it no-ops when analytics isn't loaded (e.g. non-production, or before consent).
 */
type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: string, params: Params = {}): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event, params);
  }
}
