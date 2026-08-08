'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';
import type { ItineraryItem } from '@/lib/generateBondiItinerary';

/**
 * A bookable (affiliate) activity in the itinerary. Tasteful, not an ad — a small
 * "Bookable" tag and a single compact CTA. Only renders a live "Book on Klook" link when a
 * real affiliateUrl is set; otherwise it shows a non-linked bookable label (no fabricated
 * URLs). Fires GA4 klook_shown on render and affiliate_click on the CTA.
 */
export function KlookCard({ item, timeLabel, debug, onSwap, onAlt }: { item: ItineraryItem; timeLabel: string; debug?: boolean; onSwap: () => void; onAlt: () => void }) {
  useEffect(() => {
    track('klook_activity_shown', { activity: item.refId, activity_type: item.activityType });
  }, [item.refId, item.activityType]);

  return (
    <div className="rounded-xl border border-sand-300 bg-white p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-sm font-semibold tabular-nums text-ocean-700">{timeLabel}</p>
        <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">Bookable</span>
      </div>
      <h3 className="mt-1 font-display text-lg text-ink-900">{item.title}</h3>
      <p className="mt-1.5 text-sm text-ink-700"><span className="font-medium text-ink-900">Why it’s here:</span> {item.why}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <span>⏱ {item.durationMins} mins</span>
        {item.bookingDuration && <span className="border-l border-sand-200 pl-2">Booking: {item.bookingDuration}</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.affiliateUrl ? (
          <a
            href={item.affiliateUrl}
            target="_blank"
            rel="sponsored nofollow noopener"
            onClick={() => track('affiliate_click', { provider: item.affiliateProvider || 'klook', activity: item.refId, cta: 'book_experience', placement: 'itinerary' })}
            className="rounded-lg bg-ocean-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-ocean-700"
          >
            Book on Klook ↗
          </a>
        ) : (
          <span className="rounded-lg border border-sand-300 bg-sand-50 px-3 py-1.5 text-xs text-ink-500">Bookable experience</span>
        )}
        <button type="button" onClick={onSwap} className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-ocean-500 hover:text-ocean-700">
          Change activity
        </button>
      </div>

      {item.alt && (
        <p className="mt-2.5 text-xs text-ink-500">
          Not into surfing?{' '}
          <button type="button" onClick={onAlt} className="font-medium text-ocean-700 underline decoration-ocean-300 underline-offset-2 hover:decoration-ocean-600">
            Swap for {item.alt.title.toLowerCase()}
          </button>{' '}
          instead.
        </p>
      )}

      {debug && item.debug && (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-ink-900/90 p-3 text-[11px] leading-relaxed text-sand-50">{JSON.stringify(item.debug, null, 2)}</pre>
      )}
    </div>
  );
}
