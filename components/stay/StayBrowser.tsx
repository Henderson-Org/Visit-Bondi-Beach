'use client';

import { Children, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Facet } from '@/lib/stay';
import { TAG_LABEL, STAY_TYPE_PLURAL, type Tag, type StayType } from '@/data/accommodation';

/**
 * Client-side browser for the accommodation grid. All cards are server-rendered and
 * present in the initial HTML (so everything is crawlable and works without JS);
 * filtering only toggles visibility and reorders - it never changes the URL, so no
 * low-value parameter pages are created. Filters combine as AND across groups; each
 * group is single-select for a clean, predictable UX.
 */
type SortKey = 'featured' | 'nearest';

export function StayBrowser({
  facets,
  areas,
  tags,
  types,
  children,
}: {
  facets: Facet[];
  areas: { slug: string; name: string }[];
  tags: Tag[];
  types: StayType[];
  children: ReactNode;
}) {
  const [area, setArea] = useState<string | null>(null);
  const [tag, setTag] = useState<Tag | null>(null);
  const [type, setType] = useState<StayType | null>(null);
  const [guideOnly, setGuideOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('featured');

  const items = Children.toArray(children);

  const order = useMemo(() => {
    const idx = facets.map((_, i) => i);
    const visible = idx.filter((i) => {
      const f = facets[i];
      if (area && f.area !== area) return false;
      if (tag && !f.tags.includes(tag)) return false;
      if (type && f.type !== type) return false;
      if (guideOnly && !f.hasGuide) return false;
      return true;
    });
    if (sort === 'nearest') visible.sort((a, b) => facets[a].walk - facets[b].walk);
    return visible;
  }, [facets, area, tag, type, guideOnly, sort]);

  const anyFilter = area || tag || type || guideOnly;
  const clearAll = () => { setArea(null); setTag(null); setType(null); setGuideOnly(false); };

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm transition ${
      active
        ? 'border-ocean-500 bg-ocean-600 text-white'
        : 'border-sand-300 bg-white text-ink-700 hover:border-ocean-500 hover:text-ocean-700'
    }`;

  return (
    <div>
      <div className="rounded-2xl border border-sand-200 bg-sand-50/70 p-4 sm:p-5">
        <FilterRow label="Where">
          <button type="button" className={chip(!area)} onClick={() => setArea(null)}>All of Bondi</button>
          {areas.map((a) => (
            <button key={a.slug} type="button" className={chip(area === a.slug)} onClick={() => setArea(area === a.slug ? null : a.slug)}>
              {a.name}
            </button>
          ))}
        </FilterRow>

        <FilterRow label="Best for">
          {tags.map((t) => (
            <button key={t} type="button" className={chip(tag === t)} onClick={() => setTag(tag === t ? null : t)}>
              {TAG_LABEL[t]}
            </button>
          ))}
        </FilterRow>

        <FilterRow label="Type">
          {types.map((t) => (
            <button key={t} type="button" className={chip(type === t)} onClick={() => setType(type === t ? null : t)}>
              {STAY_TYPE_PLURAL[t]}
            </button>
          ))}
          <button type="button" className={chip(guideOnly)} aria-pressed={guideOnly} onClick={() => setGuideOnly((v) => !v)}>
            Has our guide
          </button>
        </FilterRow>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-sand-200 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-ink-500">Sort</span>
            <button type="button" className={chip(sort === 'featured')} onClick={() => setSort('featured')}>Featured</button>
            <button type="button" className={chip(sort === 'nearest')} onClick={() => setSort('nearest')}>Nearest to beach</button>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-500">
            <span aria-live="polite">{order.length} {order.length === 1 ? 'place' : 'places'}</span>
            {anyFilter && (
              <button type="button" className="text-ocean-700 hover:underline" onClick={clearAll}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {order.length > 0 ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {order.map((i) => (
            <li key={facets[i].slug}>{items[i]}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-xl border border-sand-200 bg-white p-6 text-center text-sm text-ink-600">
          No places match that combination. <button type="button" className="text-ocean-700 underline" onClick={() => { setArea(null); setTag(null); setType(null); }}>Clear the filters</button> to see everywhere to stay.
        </p>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-1.5 sm:flex-row sm:items-center">
      <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-widest text-ink-500">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
