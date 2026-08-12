'use client';

import { Children, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CATEGORY_LABEL, type EventCategory, type Audience } from '@/data/events';
import type { EventFacet, DateFilter } from '@/lib/events';

/**
 * Client event browser. Every event card is server-rendered and present in the initial
 * HTML (crawlable, works without JS); filtering only toggles visibility - it never
 * changes the URL, so no crawlable filter-combination pages are created. Date-filter
 * membership is precomputed server-side (needs "today" in Sydney) and passed in as
 * facets, keeping this component light.
 *
 * Mobile-first: primary DATE chips first (the main way people ask "what's on…"),
 * then a compact secondary row. Single-select per group, combined with AND, with an
 * intelligent empty state instead of a dead end.
 */
type DateKey = DateFilter;

const DATE_CHIPS: { key: DateKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'weekend', label: 'This weekend' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
];

export function EventBrowser({
  facets,
  categories,
  audiences,
  children,
}: {
  facets: EventFacet[];
  categories: EventCategory[];
  audiences: Audience[];
  children: ReactNode;
}) {
  const [date, setDate] = useState<DateKey | null>(null);
  const [cat, setCat] = useState<EventCategory | null>(null);
  const [free, setFree] = useState(false);
  const [aud, setAud] = useState<Audience | null>(null);

  const items = Children.toArray(children);

  const visible = useMemo(() => {
    return facets
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => {
        if (date && !f.date[date]) return false;
        if (cat && !f.categories.includes(cat)) return false;
        if (free && f.price !== 'free') return false;
        if (aud && !f.audience.includes(aud)) return false;
        return true;
      })
      .map(({ i }) => i);
  }, [facets, date, cat, free, aud]);

  const anyFilter = date || cat || free || aud;
  const clearAll = () => { setDate(null); setCat(null); setFree(false); setAud(null); };

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-2 text-sm transition ${
      active ? 'border-ocean-500 bg-ocean-600 text-white' : 'border-sand-300 bg-white text-ink-700 hover:border-ocean-500 hover:text-ocean-700'
    }`;

  return (
    <div>
      <div className="rounded-2xl border border-sand-200 bg-sand-50/70 p-4 sm:p-5">
        {/* Primary: date */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="When">
          {DATE_CHIPS.map((d) => (
            <button key={d.key} type="button" className={`${chip(date === d.key)} shrink-0`} aria-pressed={date === d.key} onClick={() => setDate(date === d.key ? null : d.key)}>
              {d.label}
            </button>
          ))}
        </div>

        {/* Secondary: category + price + audience */}
        <div className="mt-3 flex flex-wrap gap-2 border-t border-sand-200 pt-3" role="group" aria-label="Filters">
          <button type="button" className={chip(free)} aria-pressed={free} onClick={() => setFree((v) => !v)}>Free</button>
          {audiences.includes('families') && (
            <button type="button" className={chip(aud === 'families')} aria-pressed={aud === 'families'} onClick={() => setAud(aud === 'families' ? null : 'families')}>With kids</button>
          )}
          {categories.map((c) => (
            <button key={c} type="button" className={chip(cat === c)} aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)}>
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-sand-200 pt-3 text-sm text-ink-500">
          <span aria-live="polite">{visible.length} {visible.length === 1 ? 'event' : 'events'}</span>
          {anyFilter && <button type="button" className="text-ocean-700 hover:underline" onClick={clearAll}>Clear filters</button>}
        </div>
      </div>

      {visible.length > 0 ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((i) => (
            <li key={facets[i].slug}>{items[i]}</li>
          ))}
        </ul>
      ) : (
        <EmptyState date={date} onClearDate={() => setDate(null)} onWeekend={() => { clearAll(); setDate('weekend'); }} onAll={clearAll} />
      )}
    </div>
  );
}

function EmptyState({ date, onClearDate, onWeekend, onAll }: { date: DateKey | null; onClearDate: () => void; onWeekend: () => void; onAll: () => void }) {
  return (
    <div className="mt-8 rounded-2xl border border-sand-200 bg-white p-6 text-center">
      <p className="font-display text-lg text-ink-900">Nothing matches that combination</p>
      <p className="mt-1 text-sm text-ink-600">Try widening your search:</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {date && <button type="button" className="rounded-full border border-sand-300 bg-white px-3.5 py-2 text-sm text-ink-700 hover:border-ocean-500" onClick={onClearDate}>Any date</button>}
        <button type="button" className="rounded-full border border-sand-300 bg-white px-3.5 py-2 text-sm text-ink-700 hover:border-ocean-500" onClick={onWeekend}>What&rsquo;s on this weekend</button>
        <button type="button" className="rounded-full bg-ocean-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-ocean-700" onClick={onAll}>See all upcoming events</button>
      </div>
    </div>
  );
}
