import Link from 'next/link';
import { getConditions } from '@/lib/conditions/service';
import { buildToday, type DataKind, type DerivedCall } from '@/lib/conditions/today';
import { RAIN_RULE } from '@/lib/waterQuality';
import { sydneyToday, weekdayOf, upcomingEvents, passesDateFilter, whenLabel } from '@/lib/events';

/**
 * "Bondi today" — the live dashboard.
 *
 * Server component. Conditions are fetched server-side through the cached provider layer
 * (30-minute revalidate, stale-while-revalidate), so this costs the visitor no client-side
 * request and no JavaScript: the numbers arrive as real HTML text that search engines and
 * AI assistants can read and cite.
 *
 * Every figure is labelled with what KIND of claim it is — measured now, forecast for
 * today, or derived by us — because a dashboard that renders an observation and an
 * inference in the same style is quietly asserting things it does not know. Derived calls
 * additionally show their reasoning inline, so a reader can audit the inference instead of
 * trusting it.
 *
 * Degrades to nothing: if every provider is down the whole module returns null rather than
 * rendering an empty shell or, worse, placeholder numbers.
 */

const KIND_LABEL: Record<DataKind, string> = {
  measured: 'Measured now',
  forecast: 'Forecast for today',
  derived: 'Our estimate',
};

const KIND_CHIP: Record<DataKind, string> = {
  measured: 'bg-ocean-100 text-ocean-800',
  forecast: 'bg-sand-200 text-ink-700',
  derived: 'bg-amber-100 text-amber-900',
};

function KindDot({ kind }: { kind: DataKind }) {
  return (
    <span
      className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${KIND_CHIP[kind]}`}
      title={KIND_LABEL[kind]}
    >
      {kind === 'measured' ? 'now' : kind === 'forecast' ? 'fcst' : 'est'}
    </span>
  );
}

function Call({ title, call }: { title: string; call: DerivedCall }) {
  return (
    <div className="rounded-xl border border-sand-200 bg-white p-4">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{title}</h3>
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${KIND_CHIP.derived}`}>
          our estimate
        </span>
      </div>
      <p className="mt-1.5 font-display text-lg leading-snug text-ink-900">{call.verdict}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{call.because}</p>
    </div>
  );
}

export async function BondiToday({ heading = 'Bondi right now' }: { heading?: string }) {
  const conditions = await getConditions('bondi');
  const today = sydneyToday();
  const model = buildToday(conditions, weekdayOf(today));

  // Nothing measured and nothing forecast: every provider failed. Render nothing rather
  // than an empty dashboard - an absent module reads as "not today", a blank one reads broken.
  if (model.stats.length === 0) return null;

  // Events actually happening today, selected through the same date-filter the
  // /whats-on/today page uses - so the two can never disagree, and the exact-day
  // semantics (no recycled annual dates) are the audited ones in lib/events.ts.
  const onToday = upcomingEvents(today)
    .filter((r) => passesDateFilter(r.event, 'today', today))
    .slice(0, 3);

  const updated = model.sources[0]?.fetchedAt;

  return (
    <section aria-labelledby="bondi-today" className="rounded-2xl border border-sand-200 bg-sand-50 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="bondi-today" className="font-display text-2xl text-ink-900">{heading}</h2>
        {updated && (
          <p className="text-xs text-ink-500">
            Updated{' '}
            <time dateTime={updated}>
              {new Date(updated).toLocaleTimeString('en-AU', {
                hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Sydney',
              })}
            </time>{' '}
            Sydney time
          </p>
        )}
      </div>

      {/* The headline written summary - real prose, so it can be read and quoted. */}
      <p className="mt-3 max-w-prose text-base leading-relaxed text-ink-700">
        {conditions.summary.paragraph}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        {model.stats.map((s) => (
          <div key={s.key} className="rounded-xl border border-sand-200 bg-white px-3 py-2.5">
            <dt className="flex items-baseline justify-between gap-1 text-xs uppercase tracking-wide text-ink-500">
              <span>{s.label}</span>
              <KindDot kind={s.kind} />
            </dt>
            <dd className="mt-0.5 font-display text-2xl leading-tight text-ink-900">{s.value}</dd>
            {s.note && <dd className="text-xs text-ink-500">{s.note}</dd>}
          </div>
        ))}
      </dl>

      <p className="mt-2 text-xs text-ink-500">
        <span className={`rounded-full px-1.5 py-0.5 font-medium ${KIND_CHIP.measured}`}>now</span>{' '}
        measured ·{' '}
        <span className={`rounded-full px-1.5 py-0.5 font-medium ${KIND_CHIP.forecast}`}>fcst</span>{' '}
        forecast ·{' '}
        <span className={`rounded-full px-1.5 py-0.5 font-medium ${KIND_CHIP.derived}`}>est</span>{' '}
        our estimate
      </p>

      {/* Water quality. Separated from the swim verdict on purpose: that one is OUR
          inference, this is NSW Beachwatch's. The lab sample carries its own age so a
          week-old grade can never read as a measurement of the water right now. */}
      {model.water?.advice && (
        <div className="mt-5 rounded-xl border border-sand-200 bg-white p-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Water quality</h3>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${KIND_CHIP.forecast}`}>
              NSW Beachwatch
            </span>
          </div>
          <p className="mt-1.5 font-display text-lg leading-snug text-ink-900">{model.water.forecastLabel}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{model.water.advice}</p>
          {model.water.sample && (
            <p className="mt-1.5 text-xs text-ink-400">
              Most recent lab sample graded {model.water.sample.grade.toLowerCase()},{' '}
              {model.water.sample.ageDays === 0
                ? 'taken today'
                : `taken ${model.water.sample.ageDays} day${model.water.sample.ageDays === 1 ? '' : 's'} ago`}
              .
            </p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-ink-500">{RAIN_RULE}</p>
        </div>
      )}

      {(model.swim || model.busyness) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {model.swim && <Call title="Good time to swim?" call={model.swim} />}
          {model.busyness && <Call title="How busy?" call={model.busyness} />}
        </div>
      )}

      {onToday.length > 0 && (
        <div className="mt-5 rounded-xl border border-sand-200 bg-white p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-500">On today</h3>
          <ul className="mt-2 space-y-1.5">
            {onToday.map((r) => (
              <li key={r.event.slug} className="text-sm">
                <Link href={`/whats-on/${r.event.slug}`} className="font-medium text-ocean-700 hover:underline">
                  {r.event.title}
                </Link>
                <span className="text-ink-500"> · {whenLabel(r)}</span>
              </li>
            ))}
          </ul>
          <Link href="/whats-on" className="mt-2 inline-block text-sm text-ocean-700 hover:underline">
            Everything on in Bondi →
          </Link>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link href="/where-to-swim-at-bondi-beach" className="text-ocean-700 hover:underline">Where to swim →</Link>
        <Link href="/bondi-weather" className="text-ocean-700 hover:underline">Weather &amp; seasons →</Link>
        <Link href="/getting-to-bondi" className="text-ocean-700 hover:underline">Getting here →</Link>
        <Link href="/bondi-parking" className="text-ocean-700 hover:underline">Parking →</Link>
      </div>

      {model.sources.length > 0 && (
        <p className="mt-4 border-t border-sand-200 pt-3 text-xs leading-relaxed text-ink-500">
          Conditions from{' '}
          {model.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && (i === model.sources.length - 1 ? ' and ' : ', ')}
              <a href={s.url} rel="nofollow noopener" target="_blank" className="underline">{s.label}</a>
            </span>
          ))}
          . Swimming and surf guidance is our own reading of those numbers, not official advice —
          for beach safety always follow the flags and the lifeguards, and check{' '}
          {conditions.location.safetyUrl ? (
            <a href={conditions.location.safetyUrl} rel="nofollow noopener" target="_blank" className="underline">
              Beachsafe
            </a>
          ) : (
            'the official beach-safety service'
          )}
          .
        </p>
      )}
    </section>
  );
}
