'use client';

import { useState } from 'react';
import type {
  Budget, Duration, FoodStyle, Interest, Pace, Preferences, StartTime, Walking,
} from '@/types/preferences';

const INTERESTS: { v: Interest; label: string }[] = [
  { v: 'swimming', label: 'Swimming' }, { v: 'beach', label: 'Beach time' }, { v: 'coastal-walks', label: 'Coastal walks' },
  { v: 'food', label: 'Food' }, { v: 'coffee', label: 'Coffee' }, { v: 'markets', label: 'Markets' },
  { v: 'shopping', label: 'Shopping' }, { v: 'photography', label: 'Photography / views' }, { v: 'relaxing', label: 'Relaxing' },
  { v: 'fitness', label: 'Fitness / active' }, { v: 'iconic', label: 'Iconic Bondi' }, { v: 'family', label: 'Family-friendly' },
  { v: 'nightlife', label: 'Drinks / nightlife' },
];

const FOOD_STYLES: { v: FoodStyle; label: string }[] = [
  { v: 'coffee', label: 'Great coffee' }, { v: 'brunch', label: 'Breakfast / brunch' }, { v: 'casual', label: 'Casual local food' },
  { v: 'healthy', label: 'Healthy' }, { v: 'seafood', label: 'Seafood' }, { v: 'japanese', label: 'Japanese' },
  { v: 'modern-au', label: 'Modern Australian' }, { v: 'special-occasion', label: 'Special occasion' }, { v: 'fine-dining', label: 'Fine dining' },
  { v: 'cocktails', label: 'Cocktails / drinks' }, { v: 'sunset-drinks', label: 'Sunset drinks' }, { v: 'dessert', label: 'Dessert / sweet' },
  { v: 'no-pref', label: 'No preference' },
];

const START_TIMES: { v: StartTime; label: string }[] = [
  { v: 'sunrise', label: 'Sunrise / early' }, { v: 'morning', label: 'Morning' }, { v: 'midday', label: 'Midday' },
  { v: 'afternoon', label: 'Afternoon' }, { v: 'evening', label: 'Evening' },
];
const DURATIONS: { v: Duration; label: string }[] = [{ v: '2h', label: '2 hours' }, { v: 'half', label: 'Half day' }, { v: 'full', label: 'Full day' }];
const WALKING: { v: Walking; label: string }[] = [{ v: 'low', label: 'Low' }, { v: 'medium', label: 'Medium' }, { v: 'high', label: 'High' }];
const PACES: { v: Pace; label: string }[] = [{ v: 'relaxed', label: 'Relaxed' }, { v: 'balanced', label: 'Balanced' }, { v: 'max', label: 'See as much as possible' }];
const BUDGETS: { v: Budget; label: string }[] = [{ v: 1, label: '$' }, { v: 2, label: '$$' }, { v: 3, label: '$$$' }, { v: 4, label: '$$$$' }];

function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

function chip(active: boolean) {
  return `rounded-full border px-3.5 py-2 text-sm transition ${active ? 'border-ocean-500 bg-ocean-600 text-white' : 'border-sand-300 bg-white text-ink-700 hover:border-ocean-500'}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-4">
      <h3 className="text-sm font-semibold text-ink-900">{label}</h3>
      <div className="mt-2.5 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function PreferenceCards({ onSubmit }: { onSubmit: (p: Preferences) => void }) {
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState<StartTime>('morning');
  const [duration, setDuration] = useState<Duration>('full');
  const [interests, setInterests] = useState<Interest[]>(['food', 'swimming', 'iconic']);
  const [foodStyles, setFoodStyles] = useState<FoodStyle[]>([]);
  const [budget, setBudget] = useState<Budget>(3);
  const [walking, setWalking] = useState<Walking>('medium');
  const [pace, setPace] = useState<Pace>('balanced');

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <form
      className="divide-y divide-sand-200"
      onSubmit={(e) => { e.preventDefault(); onSubmit({ date, startTime, duration, interests, foodStyles, budget, walking, pace }); }}
    >
      <Field label="When are you visiting?">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-ink-900"
        />
      </Field>

      <Field label="What time will you start?">
        {START_TIMES.map((o) => (
          <button key={o.v} type="button" className={chip(startTime === o.v)} onClick={() => setStartTime(o.v)}>{o.label}</button>
        ))}
      </Field>

      <Field label="How long do you have?">
        {DURATIONS.map((o) => (
          <button key={o.v} type="button" className={chip(duration === o.v)} onClick={() => setDuration(o.v)}>{o.label}</button>
        ))}
      </Field>

      <Field label="What are you into? (pick a few)">
        {INTERESTS.map((o) => (
          <button key={o.v} type="button" className={chip(interests.includes(o.v))} onClick={() => toggle(interests, o.v, setInterests)}>{o.label}</button>
        ))}
      </Field>

      <Field label="Food style (optional — pick any)">
        {FOOD_STYLES.map((o) => (
          <button key={o.v} type="button" className={chip(foodStyles.includes(o.v))} onClick={() => toggle(foodStyles, o.v, setFoodStyles)}>{o.label}</button>
        ))}
      </Field>

      <Field label="Budget">
        {BUDGETS.map((o) => (
          <button key={o.v} type="button" className={chip(budget === o.v)} onClick={() => setBudget(o.v)}>{o.label}</button>
        ))}
      </Field>

      <Field label="Walking tolerance">
        {WALKING.map((o) => (
          <button key={o.v} type="button" className={chip(walking === o.v)} onClick={() => setWalking(o.v)}>{o.label}</button>
        ))}
      </Field>

      <Field label="Pace">
        {PACES.map((o) => (
          <button key={o.v} type="button" className={chip(pace === o.v)} onClick={() => setPace(o.v)}>{o.label}</button>
        ))}
      </Field>

      <div className="pt-5">
        <button
          type="submit"
          disabled={interests.length === 0}
          className="w-full rounded-xl bg-ocean-600 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-ocean-700 disabled:opacity-50"
        >
          Build my Bondi itinerary
        </button>
        {interests.length === 0 && <p className="mt-2 text-center text-xs text-ink-500">Pick at least one interest to start.</p>}
      </div>
    </form>
  );
}
