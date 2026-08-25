'use client';

import { useEffect, useMemo, useState } from 'react';
import { PreferenceCards } from '@/components/PreferenceCards';
import { ItineraryTimeline } from '@/components/ItineraryTimeline';
import { weatherAppliesTo, type PlanWeather } from '@/lib/weatherFit';
import { generateItinerary, swapExperience, swapVenue, swapKlook, useAlternative, type Itinerary } from '@/lib/generateBondiItinerary';
import { track } from '@/lib/analytics';
import type { Interest, Preferences } from '@/types/preferences';

const VALID_INTERESTS = new Set<Interest>(['swimming', 'beach', 'coastal-walks', 'food', 'coffee', 'markets', 'shopping', 'photography', 'relaxing', 'fitness', 'iconic', 'family', 'nightlife']);

const START_LABEL: Record<string, string> = { sunrise: 'Sunrise', morning: 'Morning', midday: 'Midday', afternoon: 'Afternoon', evening: 'Evening' };
const DUR_LABEL: Record<string, string> = { '2h': '2 hours', half: 'Half day', full: 'Full day' };

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

export function PlannerApp({
  todayWeather = null,
  todayDate,
}: {
  /** Today's conditions, fetched server-side. Null when the providers were unavailable. */
  todayWeather?: PlanWeather | null;
  /** Today's date in Sydney, resolved on the server so client-clock skew cannot shift it. */
  todayDate: string;
}) {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [debug, setDebug] = useState(false);
  const [preset, setPreset] = useState<Interest[] | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    setDebug(q.get('debug') === 'true');
    const raw = q.get('interests');
    if (raw) {
      const list = raw.split(',').map((s) => s.trim()).filter((s): s is Interest => VALID_INTERESTS.has(s as Interest));
      if (list.length) { setPreset(list); track('planner_started', { placement: 'query', interests: list.join(',') }); }
    }
  }, []);

  const build = (p: Preferences) => {
    // Weather shapes the plan only when the visitor is planning TODAY - that is the only
    // day we hold conditions for. Any other date generates exactly as it did before rather
    // than being shaped by a forecast that does not apply to it.
    const weather = todayWeather && weatherAppliesTo(p.date, todayDate) ? todayWeather : null;
    const generated = generateItinerary(p, weather);
    setPrefs(p);
    setItinerary(generated);
    track('itinerary_generated', {
      interests: p.interests.join(','), duration: p.duration, pace: p.pace,
      stops: generated.items.length, affiliate_shown: generated.hasAffiliate ? 1 : 0,
      weather_aware: weather ? 1 : 0,
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSwap = (index: number) => {
    if (!itinerary || !prefs) return;
    const item = itinerary.items[index];
    const next = item.kind === 'venue' ? swapVenue(itinerary, index, prefs)
      : item.kind === 'klook' ? swapKlook(itinerary, index, prefs)
      : swapExperience(itinerary, index, prefs);
    setItinerary(next);
    track('itinerary_swap', { kind: item.kind, from: item.refId });
  };

  // Switch a bookable to its free alternative - the "surf lesson or the coastal walk" fallback.
  const onAlt = (index: number) => {
    if (!itinerary || !prefs) return;
    const item = itinerary.items[index];
    setItinerary(useAlternative(itinerary, index, prefs));
    track('itinerary_use_alternative', { from: item.refId, to: item.alt?.refId });
  };

  const interestSummary = useMemo(() => prefs?.interests.map((i) => i.replace('-', ' ')).join(' · '), [prefs]);

  if (!itinerary || !prefs) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h2 className="font-display text-2xl text-ink-900">Tell us about your day</h2>
        <p className="mt-1 text-sm text-ink-600">A few quick taps and we’ll build a Bondi day around you.</p>
        <div className="mt-4">
          <PreferenceCards key={preset ? preset.join(',') : 'default'} initialInterests={preset ?? undefined} onSubmit={build} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ocean-600">Your perfect Bondi day</p>
          <h2 className="mt-1 font-display text-2xl md:text-3xl text-ink-900">{formatDate(prefs.date)}</h2>
          <p className="mt-1 text-sm text-ink-600">{START_LABEL[prefs.startTime]} start · {DUR_LABEL[prefs.duration]} · {interestSummary}</p>
        </div>
        <button
          type="button"
          onClick={() => { setItinerary(null); setPrefs(null); }}
          className="shrink-0 rounded-lg border border-sand-300 bg-white px-3 py-2 text-xs font-medium text-ink-700 hover:border-ocean-500"
        >
          Start over
        </button>
      </div>

      {/* Safety advisories first and visually distinct - surf and UV are the two things
          on this page that can actually hurt someone. */}
      {itinerary.advisories.length > 0 && (
        <ul className="mt-4 space-y-1" aria-label="Conditions advisories">
          {itinerary.advisories.map((a) => (
            <li
              key={a}
              className="rounded-lg border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-xs text-amber-900"
            >
              {a}
            </li>
          ))}
        </ul>
      )}

      {itinerary.notes.length > 0 && (
        <ul className="mt-4 space-y-1">
          {itinerary.notes.map((n) => (
            <li key={n} className="rounded-lg border-l-4 border-sand-300 bg-sand-100 px-3 py-2 text-xs text-ink-600">{n}</li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <ItineraryTimeline itinerary={itinerary} debug={debug} onSwap={onSwap} onAlt={onAlt} />
      </div>

      {itinerary.hasAffiliate && (
        <p className="mt-5 rounded-lg border border-sand-200 bg-sand-100 px-3 py-2 text-xs text-ink-500">
          Some activities are bookable experiences with affiliate links. We may earn a commission if you book,
          at no extra cost to you - and it never changes what we recommend.
        </p>
      )}

      <p className="mt-4 text-center text-xs text-ink-400">
        Built around Bondi’s best - swap anything you’re not sure about. Opening hours can change; confirm before you go.
      </p>
    </div>
  );
}
