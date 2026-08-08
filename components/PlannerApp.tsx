'use client';

import { useEffect, useMemo, useState } from 'react';
import { PreferenceCards } from '@/components/PreferenceCards';
import { ItineraryTimeline } from '@/components/ItineraryTimeline';
import { generateItinerary, swapExperience, swapVenue, type Itinerary } from '@/lib/generateBondiItinerary';
import type { Preferences } from '@/types/preferences';

const START_LABEL: Record<string, string> = { sunrise: 'Sunrise', morning: 'Morning', midday: 'Midday', afternoon: 'Afternoon', evening: 'Evening' };
const DUR_LABEL: Record<string, string> = { '2h': '2 hours', half: 'Half day', full: 'Full day' };

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

export function PlannerApp() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') setDebug(new URLSearchParams(window.location.search).get('debug') === 'true');
  }, []);

  const build = (p: Preferences) => {
    setPrefs(p);
    setItinerary(generateItinerary(p));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSwap = (index: number) => {
    if (!itinerary || !prefs) return;
    const item = itinerary.items[index];
    setItinerary(item.kind === 'venue' ? swapVenue(itinerary, index, prefs) : swapExperience(itinerary, index, prefs));
  };

  const interestSummary = useMemo(() => prefs?.interests.map((i) => i.replace('-', ' ')).join(' · '), [prefs]);

  if (!itinerary || !prefs) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h2 className="font-display text-2xl text-ink-900">Tell us about your day</h2>
        <p className="mt-1 text-sm text-ink-600">A few quick taps and we’ll build a Bondi day around you.</p>
        <div className="mt-4">
          <PreferenceCards onSubmit={build} />
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

      {itinerary.notes.length > 0 && (
        <ul className="mt-4 space-y-1">
          {itinerary.notes.map((n) => (
            <li key={n} className="rounded-lg border-l-4 border-sand-300 bg-sand-100 px-3 py-2 text-xs text-ink-600">{n}</li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <ItineraryTimeline itinerary={itinerary} debug={debug} onSwap={onSwap} />
      </div>

      <p className="mt-6 text-center text-xs text-ink-400">
        Built around Bondi’s best — swap anything you’re not sure about. Opening hours can change; confirm before you go.
      </p>
    </div>
  );
}
