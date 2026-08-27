import { getConditions } from '@/lib/conditions/service';
import {
  FORECAST_LABEL, GRADE_LABEL, sampleAgeDays, isSampleStale, waterAdvice,
  RAIN_RULE, BEACHWATCH_SOURCE,
} from '@/lib/waterQuality';

/**
 * Standalone water-quality module for the swim pages.
 *
 * Answers a question the site could not answer before — "is the water at Bondi clean?" —
 * with the authoritative source rather than an opinion. It is a separate component from
 * the Bondi Today dashboard because the swim page needs it prominently and on its own,
 * without the rest of the conditions furniture.
 *
 * The conditions fetch is deduplicated by Next's fetch cache, so rendering this alongside
 * the dashboard costs one upstream request, not two.
 *
 * Two rules it must never break: today's pollution FORECAST and the most recent lab SAMPLE
 * are different claims about different days and are always labelled as such; and nothing
 * here ever tells anyone the water is safe. Beachwatch grades pollution risk. The flags and
 * the lifeguards decide swimming.
 */
export async function WaterQualityPanel({ destination = 'bondi' }: { destination?: string }) {
  const c = await getConditions(destination);
  const w = c.water;
  if (!w || w.forecast === 'unknown') return null;

  const advice = waterAdvice(w);
  if (!advice) return null;

  const age = sampleAgeDays(w);
  const showSample = w.grade !== 'unknown' && !isSampleStale(w);

  return (
    <section aria-labelledby="water-quality" className="rounded-2xl border border-sand-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="water-quality" className="font-display text-xl text-ink-900">
          Is the water clean today?
        </h2>
        <p className="text-xs text-ink-500">
          Source:{' '}
          <a href={BEACHWATCH_SOURCE.url} rel="nofollow noopener" target="_blank" className="underline">
            {BEACHWATCH_SOURCE.label}
          </a>
        </p>
      </div>

      <p className="mt-3 font-display text-2xl leading-snug text-ink-900">{FORECAST_LABEL[w.forecast]}</p>
      <p className="mt-2 max-w-prose leading-relaxed text-ink-700">{advice}</p>

      {showSample && (
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-ink-500">Last lab sample</dt>
            <dd className="mt-0.5 font-display text-xl text-ink-900">{GRADE_LABEL[w.grade]}</dd>
          </div>
          <div className="rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5">
            <dt className="text-xs uppercase tracking-wide text-ink-500">Sample taken</dt>
            <dd className="mt-0.5 font-display text-xl text-ink-900">
              {age === 0 ? 'Today' : `${age}d ago`}
            </dd>
          </div>
          {w.stars != null && (
            <div className="rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5">
              <dt className="text-xs uppercase tracking-wide text-ink-500">Beachwatch rating</dt>
              <dd className="mt-0.5 font-display text-xl text-ink-900">{w.stars} / 4</dd>
            </div>
          )}
        </dl>
      )}

      <p className="mt-4 rounded-lg border-l-4 border-ocean-500 bg-sand-50 py-3 pl-4 pr-3 text-sm leading-relaxed text-ink-700">
        <span className="font-semibold text-ink-900">After rain:</span> {RAIN_RULE}
      </p>

      <p className="mt-3 text-xs leading-relaxed text-ink-500">
        Beachwatch grades pollution risk, not swimming safety — it says nothing about surf, rips
        or currents. Swim between the red and yellow flags and follow the lifeguards.
      </p>
    </section>
  );
}
