'use client';

import type { ReactNode } from 'react';
import type { ProviderId } from '@/lib/affiliate';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Whole-card link that leaves Visit Bondi Beach (a booking search or official site).
 * Marked sponsored/nofollow, opens in a new tab, and fires a GA4 affiliate_click when
 * it's a booking provider. Used for properties that don't yet have an internal guide.
 */
export function ExternalCardLink({
  href,
  provider,
  item,
  campaign,
  className = '',
  children,
}: {
  href: string;
  provider?: ProviderId;
  item?: string;
  campaign?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={className}
      onClick={() => {
        if (provider && typeof window !== 'undefined' && typeof window.gtag === 'function') {
          window.gtag('event', 'affiliate_click', { provider, item, campaign });
        }
      }}
    >
      {children}
    </a>
  );
}
