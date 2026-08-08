'use client';

import type { ProviderId } from '@/lib/affiliate';

/**
 * The single affiliate CTA used across the Stay section. It renders a resolved
 * affiliate href (built server-side by lib/affiliate.getAffiliateLink so no env/
 * URL logic runs in the browser) and fires a GA4 `affiliate_click` event on click.
 *
 * Compliance:
 *  - rel="sponsored nofollow noopener" — sponsored+nofollow tell search engines this
 *    is a monetised link; noopener is a security default for target=_blank.
 *  - target="_blank" — the provider opens in a new tab so the guide stays put.
 */
export interface AffiliateButtonProps {
  href: string;
  label: string;
  cta: string;
  provider: ProviderId;
  /** Property or area this CTA is for — sent to analytics, not required. */
  item?: string;
  /** Where on the site the click came from (placement), sent to analytics. */
  campaign?: string;
  variant?: 'solid' | 'outline';
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function AffiliateButton({
  href,
  label,
  cta,
  provider,
  item,
  campaign,
  variant = 'solid',
}: AffiliateButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition';
  const style =
    variant === 'solid'
      ? 'bg-ocean-600 text-white hover:bg-ocean-700'
      : 'border border-sand-300 bg-white text-ink-900 hover:border-ocean-500';
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={`${base} ${style}`}
      onClick={() => {
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          window.gtag('event', 'affiliate_click', {
            provider,
            item: item || undefined,
            campaign: campaign || undefined,
          });
        }
      }}
    >
      {cta}
      <span className="text-xs opacity-80">· {label}</span>
    </a>
  );
}
