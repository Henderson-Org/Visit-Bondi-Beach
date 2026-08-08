import type { ScoreLine } from '@/data/accommodation-guides';

/**
 * The Visit Bondi Beach rating — a transparent, multi-criteria score rather than a
 * single meaningless star. Every criterion shows its own score and a one-line reason,
 * and the methodology is stated plainly: we score what we can verify (location,
 * proximity, transport, what's nearby), and we don't score room quality or service
 * until we've independently assessed them. Nothing here is a fabricated guest rating.
 */
function Bar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-200" aria-hidden="true">
      <div className="h-full rounded-full bg-ocean-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function VbbRating({ scores, overall }: { scores: ScoreLine[]; overall: number | null }) {
  if (!scores.length || overall == null) return null;
  return (
    <section aria-label="Visit Bondi Beach rating" className="rounded-2xl border border-sand-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-ink-900">Our rating</h2>
          <p className="mt-0.5 text-xs text-ink-500">Visit Bondi Beach editorial score</p>
        </div>
        <div className="text-right">
          <span className="font-display text-4xl leading-none text-ink-900">{overall.toFixed(1)}</span>
          <span className="text-lg text-ink-400">/10</span>
        </div>
      </div>

      <dl className="mt-5 space-y-3.5">
        {scores.map((s) => (
          <div key={s.key}>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm font-medium text-ink-900">{s.label}</dt>
              <dd className="text-sm font-semibold tabular-nums text-ink-700">{s.score.toFixed(1)}</dd>
            </div>
            <div className="mt-1.5"><Bar score={s.score} /></div>
            <p className="mt-1 text-xs text-ink-500">{s.note}</p>
          </div>
        ))}
      </dl>

      <p className="mt-5 border-t border-sand-200 pt-3 text-xs text-ink-500">
        How we score: these are our own editorial ratings, weighted to what we can verify
        from the ground — location, proximity to the beach, transport and what&rsquo;s nearby.
        We don&rsquo;t publish room-quality, cleanliness or service scores of our own; for
        current prices and guest reviews, use the booking sites. We only rate a property when
        we have enough grounded information to justify it.
      </p>
    </section>
  );
}
