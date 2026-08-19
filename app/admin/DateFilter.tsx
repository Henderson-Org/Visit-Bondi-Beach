'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const PRESETS: { key: string; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'year', label: 'This year' },
  { key: 'all', label: 'All time' },
];

/**
 * Date filter. The selection lives entirely in the URL query string, so a filtered
 * dashboard view can be refreshed, bookmarked or shared inside the admin area and
 * every panel below re-queries from the same range.
 */
export function DateFilter({ preset, from, to }: { preset: string; from: string; to: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);
  const [openCustom, setOpenCustom] = useState(preset === 'custom');

  const go = (qs: string) => router.push(`/admin${qs}`);

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Date range" className="flex flex-wrap gap-2">
        {PRESETS.map((p) => {
          const active = preset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setOpenCustom(false);
                go(`?preset=${p.key}`);
              }}
              className={`rounded-full px-3.5 py-1.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-ocean-300 ${
                active
                  ? 'bg-ocean-600 text-white'
                  : 'border border-sand-300 bg-white text-ink-700 hover:border-ocean-400'
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={preset === 'custom'}
          aria-expanded={openCustom}
          onClick={() => setOpenCustom((v) => !v)}
          className={`rounded-full px-3.5 py-1.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-ocean-300 ${
            preset === 'custom'
              ? 'bg-ocean-600 text-white'
              : 'border border-sand-300 bg-white text-ink-700 hover:border-ocean-400'
          }`}
        >
          Custom
        </button>
      </div>

      {openCustom && (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            go(`?preset=custom&from=${customFrom}&to=${customTo}`);
          }}
        >
          <div>
            <label htmlFor="from" className="block text-xs font-medium text-ink-600">
              Start date
            </label>
            <input
              id="from"
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="mt-1 rounded-lg border border-sand-300 px-2.5 py-1.5 text-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-200"
            />
          </div>
          <div>
            <label htmlFor="to" className="block text-xs font-medium text-ink-600">
              End date
            </label>
            <input
              id="to"
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
              className="mt-1 rounded-lg border border-sand-300 px-2.5 py-1.5 text-sm focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-200"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-ocean-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-ocean-700 focus:outline-none focus:ring-2 focus:ring-ocean-300"
          >
            Apply
          </button>
        </form>
      )}
      <p className="text-xs text-ink-500">
        Showing {from} to {to} (Australia/Sydney)
        {params.get('page') ? ' · page ' + params.get('page') : ''}
      </p>
    </div>
  );
}
