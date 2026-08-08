'use client';

import type { ProviderId } from '@/lib/affiliate';

/**
 * The affiliate CTA used across the Stay section. Renders a resolved affiliate href
 * (built server-side by lib/affiliate.getAffiliateLink) and fires a GA4 `affiliate_click`
 * event on click with rich dimensions for reporting.
 *
 * Compliance: rel="sponsored nofollow noopener" (sponsored+nofollow mark the monetised
 * link for search engines; noopener is a security default), target="_blank".
 */
export interface AffiliateButtonProps {
  href: string;
  label: string;
  cta: string;
  provider: ProviderId;
  /** Analytics dimensions. */
  propertyName?: string;
  propertySlug?: string;
  page?: string;
  placement?: string;
  /** CTA identifier for analytics, e.g. "check_availability". */
  ctaId?: string;
  variant?: 'solid' | 'outline';
  block?: boolean;
  /** Show the provider label as a subtle suffix ("· Booking.com"). */
  showLabel?: boolean;
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
  propertyName,
  propertySlug,
  page,
  placement,
  ctaId = 'check_availability',
  variant = 'solid',
  block = false,
  showLabel = true,
}: AffiliateButtonProps) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition';
  const style = variant === 'solid' ? 'bg-ocean-600 text-white hover:bg-ocean-700' : 'border border-sand-300 bg-white text-ink-900 hover:border-ocean-500';
  const width = block ? 'w-full' : '';
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={`${base} ${style} ${width}`}
      onClick={() => {
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          window.gtag('event', 'affiliate_click', {
            provider,
            cta: ctaId,
            property_name: propertyName,
            property_slug: propertySlug,
            page,
            placement: placement || undefined,
          });
        }
      }}
    >
      {cta}
      {showLabel && <span className="text-xs opacity-80">· {label}</span>}
    </a>
  );
}
