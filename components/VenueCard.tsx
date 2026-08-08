'use client';

import type { ItineraryItem } from '@/lib/generateBondiItinerary';

/** Renders one meal/venue anchor in the itinerary timeline (the food anchor). */
export function VenueCard({ item, timeLabel, debug, onSwap }: { item: ItineraryItem; timeLabel: string; debug?: boolean; onSwap: () => void }) {
  const price = item.priceLevel ? '$'.repeat(item.priceLevel) : null;
  return (
    <div className="rounded-xl border border-ocean-200 bg-ocean-50/40 p-4 sm:p-5 ring-1 ring-ocean-100">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-sm font-semibold tabular-nums text-ocean-700">{timeLabel}</p>
        <span className="text-[11px] font-medium uppercase tracking-wide text-ocean-600">{item.slot ?? 'Meal'}</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg text-ink-900">{item.title}</h3>
        {price && <span className="shrink-0 text-sm font-medium text-ink-500">{price}</span>}
      </div>
      <p className="mt-1.5 text-sm text-ink-700"><span className="font-medium text-ink-900">Why it’s here:</span> {item.why}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-ink-500">⏱ {item.durationMins} mins</span>
        {item.booking && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${item.booking === 'essential' ? 'bg-amber-500/15 text-amber-700' : 'bg-sand-100 text-ink-600'}`}>
            Booking {item.booking}
          </span>
        )}
        {item.hoursVerified === false && <span className="text-[11px] text-ink-400">hours to confirm</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.websiteUrl && (
          <a href={item.websiteUrl} target="_blank" rel="nofollow noopener" className="rounded-lg bg-ocean-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-ocean-700">
            View restaurant ↗
          </a>
        )}
        <button type="button" onClick={onSwap} className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-ocean-500 hover:text-ocean-700">
          Change restaurant
        </button>
      </div>

      {debug && item.debug && (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-ink-900/90 p-3 text-[11px] leading-relaxed text-sand-50">{JSON.stringify(item.debug, null, 2)}</pre>
      )}
    </div>
  );
}
