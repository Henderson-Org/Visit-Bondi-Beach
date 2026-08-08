'use client';

import type { ItineraryItem } from '@/lib/generateBondiItinerary';

/** Renders one experience stop in the itinerary timeline. */
export function ExperienceCard({ item, timeLabel, debug, onSwap }: { item: ItineraryItem; timeLabel: string; debug?: boolean; onSwap: () => void }) {
  return (
    <div className="rounded-xl border border-sand-200 bg-white p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-sm font-semibold tabular-nums text-ocean-700">{timeLabel}</p>
        <span className="text-[11px] uppercase tracking-wide text-ink-400">Experience</span>
      </div>
      <h3 className="mt-1 font-display text-lg text-ink-900">{item.title}</h3>
      <p className="mt-1.5 text-sm text-ink-700"><span className="font-medium text-ink-900">Why you’ll like it:</span> {item.why}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-ink-500">⏱ {item.durationMins} mins</span>
        <button type="button" onClick={onSwap} className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-ocean-500 hover:text-ocean-700">
          Swap this
        </button>
      </div>
      {debug && item.debug && (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-ink-900/90 p-3 text-[11px] leading-relaxed text-sand-50">{JSON.stringify(item.debug, null, 2)}</pre>
      )}
    </div>
  );
}
