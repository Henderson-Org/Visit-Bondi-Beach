'use client';

import { Children, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { VenueFacet } from '@/lib/restaurantGuide';
import {
  MEAL_LABEL,
  SUITABILITY_LABEL,
  ATTRIBUTE_LABEL,
  DIETARY_LABEL,
  PRECINCT_LABEL,
  VENUE_TYPE_LABEL,
} from '@/lib/restaurantGuide';
import type { VenueType, Precinct, Meal, Suitability, Attribute, Dietary } from '@/data/restaurants';

/**
 * Client-side browser for the restaurant directory. Every card is server-rendered and
 * present in the initial HTML (crawlable, works without JS); filtering only toggles
 * visibility and reorders — it never changes the URL, so no low-value facet/parameter
 * pages are created (an explicit SEO decision). Filters combine as AND across groups;
 * within a group, options are OR. A free-text box narrows by name, cuisine or area.
 */
type SortKey = 'featured' | 'price-asc' | 'price-desc';

interface Options {
  types: VenueType[];
  precincts: Precinct[];
  meals: Meal[];
  suitability: Suitability[];
  attributes: Attribute[];
  dietary: Dietary[];
  cuisines: string[];
}

export function RestaurantBrowser({
  facets,
  options,
  children,
}: {
  facets: VenueFacet[];
  options: Options;
  children: ReactNode;
}) {
  const [q, setQ] = useState('');
  const [type, setType] = useState<VenueType | null>(null);
  const [precinct, setPrecinct] = useState<Precinct | null>(null);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [suit, setSuit] = useState<Suitability | null>(null);
  const [attr, setAttr] = useState<Attribute | null>(null);
  const [diet, setDiet] = useState<Dietary | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>('featured');
  const [showMore, setShowMore] = useState(false);

  const items = Children.toArray(children);
  const query = q.trim().toLowerCase();

  const order = useMemo(() => {
    const idx = facets.map((_, i) => i);
    const visible = idx.filter((i) => {
      const f = facets[i];
      if (query && !f.text.includes(query)) return false;
      if (type && f.type !== type) return false;
      if (precinct && f.precinct !== precinct) return false;
      if (meal && !f.meals.includes(meal)) return false;
      if (cuisine && !f.cuisines.some((c) => c.includes(cuisine.toLowerCase()))) return false;
      if (suit && !f.suitability.includes(suit)) return false;
      if (attr && !f.attributes.includes(attr)) return false;
      if (diet && !f.dietary.includes(diet)) return false;
      if (price && f.price !== price) return false;
      return true;
    });
    if (sort === 'price-asc') visible.sort((a, b) => facets[a].price - facets[b].price || facets[b].score - facets[a].score);
    else if (sort === 'price-desc') visible.sort((a, b) => facets[b].price - facets[a].price || facets[b].score - facets[a].score);
    return visible;
  }, [facets, query, type, precinct, meal, cuisine, suit, attr, diet, price, sort]);

  const anyFilter = type || precinct || meal || cuisine || suit || attr || diet || price || query;
  const clearAll = () => {
    setQ(''); setType(null); setPrecinct(null); setMeal(null); setCuisine(null);
    setSuit(null); setAttr(null); setDiet(null); setPrice(null);
  };

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm transition ${
      active
        ? 'border-ocean-500 bg-ocean-600 text-white'
        : 'border-sand-300 bg-white text-ink-700 hover:border-ocean-500 hover:text-ocean-700'
    }`;

  return (
    <div>
      <div className="rounded-2xl border border-sand-200 bg-sand-50/70 p-4 sm:p-5">
        {/* Search */}
        <div className="relative">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, cuisine or street…"
            aria-label="Search venues"
            className="w-full rounded-xl border border-sand-300 bg-white px-4 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-ocean-500 focus:outline-none focus:ring-2 focus:ring-ocean-500/30"
          />
        </div>

        <div className="mt-3 space-y-1">
          <FilterRow label="Type">
            {options.types.map((t) => (
              <button key={t} type="button" className={chip(type === t)} onClick={() => setType(type === t ? null : t)}>
                {VENUE_TYPE_LABEL[t]}
              </button>
            ))}
          </FilterRow>

          <FilterRow label="Area">
            {options.precincts.map((p) => (
              <button key={p} type="button" className={chip(precinct === p)} onClick={() => setPrecinct(precinct === p ? null : p)}>
                {PRECINCT_LABEL[p]}
              </button>
            ))}
          </FilterRow>

          <FilterRow label="Meal">
            {options.meals.map((m) => (
              <button key={m} type="button" className={chip(meal === m)} onClick={() => setMeal(meal === m ? null : m)}>
                {MEAL_LABEL[m]}
              </button>
            ))}
          </FilterRow>

          <FilterRow label="Price">
            {[1, 2, 3, 4].map((p) => (
              <button key={p} type="button" className={chip(price === p)} onClick={() => setPrice(price === p ? null : p)}>
                {'$'.repeat(p)}
              </button>
            ))}
          </FilterRow>

          {showMore && (
            <>
              {options.suitability.length > 0 && (
                <FilterRow label="Good for">
                  {options.suitability.map((s) => (
                    <button key={s} type="button" className={chip(suit === s)} onClick={() => setSuit(suit === s ? null : s)}>
                      {SUITABILITY_LABEL[s]}
                    </button>
                  ))}
                </FilterRow>
              )}
              {options.attributes.length > 0 && (
                <FilterRow label="Features">
                  {options.attributes.map((a) => (
                    <button key={a} type="button" className={chip(attr === a)} onClick={() => setAttr(attr === a ? null : a)}>
                      {ATTRIBUTE_LABEL[a]}
                    </button>
                  ))}
                </FilterRow>
              )}
              {options.dietary.length > 0 && (
                <FilterRow label="Dietary">
                  {options.dietary.map((d) => (
                    <button key={d} type="button" className={chip(diet === d)} onClick={() => setDiet(diet === d ? null : d)}>
                      {DIETARY_LABEL[d]}
                    </button>
                  ))}
                </FilterRow>
              )}
              {options.cuisines.length > 0 && (
                <FilterRow label="Cuisine">
                  {options.cuisines.map((c) => (
                    <button key={c} type="button" className={chip(cuisine === c)} onClick={() => setCuisine(cuisine === c ? null : c)}>
                      {c}
                    </button>
                  ))}
                </FilterRow>
              )}
            </>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-sand-200 pt-3">
          <div className="flex items-center gap-2">
            <button type="button" className="text-sm text-ocean-700 hover:underline" onClick={() => setShowMore((v) => !v)}>
              {showMore ? '− Fewer filters' : '+ More filters'}
            </button>
            <span className="text-sand-300">·</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-ink-500">Sort</span>
            <button type="button" className={chip(sort === 'featured')} onClick={() => setSort('featured')}>Our pick</button>
            <button type="button" className={chip(sort === 'price-asc')} onClick={() => setSort('price-asc')}>$ → $$$$</button>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-500">
            <span aria-live="polite">{order.length} {order.length === 1 ? 'venue' : 'venues'}</span>
            {anyFilter && (
              <button type="button" className="text-ocean-700 hover:underline" onClick={clearAll}>Clear</button>
            )}
          </div>
        </div>
      </div>

      {order.length > 0 ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {order.map((i) => (
            <li key={facets[i].id}>{items[i]}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 rounded-xl border border-sand-200 bg-white p-6 text-center text-sm text-ink-600">
          No venues match that combination.{' '}
          <button type="button" className="text-ocean-700 underline" onClick={clearAll}>Clear the filters</button> to see everywhere to eat and drink.
        </p>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-1.5 sm:flex-row sm:items-start">
      <span className="w-20 shrink-0 pt-1.5 text-xs font-semibold uppercase tracking-widest text-ink-500">{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
