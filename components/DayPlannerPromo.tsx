'use client';

import Link from 'next/link';
import { track } from '@/lib/analytics';
import { plannerHref } from '@/lib/plannerContext';
import type { Interest } from '@/types/preferences';

/**
 * Reusable Day Planner promo. `variant="homepage"` is the prominent hero-adjacent module;
 * `variant="inline"` is the compact end-of-article unit. Both deep-link into /plan with any
 * contextual interests pre-selected, and fire a GA4 CTA-click event with the placement.
 */
export function DayPlannerPromo({
  variant = 'inline',
  interests = [],
  heading,
  placement,
}: {
  variant?: 'homepage' | 'inline';
  interests?: Interest[];
  heading?: string;
  placement: string;
}) {
  const href = plannerHref(interests);
  const onClick = () => track('planner_cta_click', { placement, variant, interests: interests.join(',') });

  if (variant === 'homepage') {
    return (
      <section className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-2xl border border-ocean-200 bg-ocean-50/50 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ocean-600">Bondi Day Planner</p>
              <h2 className="mt-1 font-display text-2xl md:text-3xl text-ink-900">Plan your perfect Bondi day</h2>
              <p className="mt-2 text-ink-700">
                Tell us what you’re into and how much time you have, and we’ll build a Bondi day around the best
                swims, walks, food, views, markets and activities.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Icebergs', 'Bondi to Bronte', 'markets', 'great food', 'beach time', 'local activities'].map((t) => (
                  <span key={t} className="rounded-full border border-ocean-200 bg-white/70 px-2.5 py-0.5 text-[11px] text-ink-600">{t}</span>
                ))}
              </div>
            </div>
            <div className="shrink-0 sm:text-center">
              <Link href={href} onClick={onClick} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ocean-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-ocean-700 sm:w-auto">
                Build my free Bondi itinerary
                <span aria-hidden="true">→</span>
              </Link>
              <p className="mt-2 text-xs text-ink-500">Free · takes under a minute</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <aside className="my-8 rounded-xl border border-ocean-200 bg-ocean-50/40 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg text-ink-900">{heading ?? 'Turn this into a Bondi itinerary'}</p>
          <p className="mt-1 text-sm text-ink-700">Tell us how much time you have and what you like, and we’ll build a personalised Bondi day around you.</p>
        </div>
        <Link href={href} onClick={onClick} className="shrink-0 rounded-lg bg-ocean-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-700">
          Plan my Bondi day
        </Link>
      </div>
    </aside>
  );
}
