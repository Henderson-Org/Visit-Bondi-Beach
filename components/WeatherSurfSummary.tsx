/**
 * Daily Weather & Surf Summary — a compact, prominent "what's the day look like?"
 * module for the top of the page.
 *
 * Server component: it fetches (server-side, cached) and renders the written
 * summary as real HTML text, so search engines and AI assistants can read
 * statements like "Surf at Bondi today is around 1–1.5m, cleanest in the morning."
 * The interactive/secondary bits (expandable raw data, source lines, safety link)
 * live in the ConditionsFooter client component.
 *
 * Degrades gracefully: weather-only for inland destinations, and if a provider
 * is unavailable the module still renders whatever data it has.
 */
import Link from 'next/link';
import { getConditions } from '@/lib/conditions/service';
import { surfBand, roundTemp } from '@/lib/conditions/geo';
import type { Conditions } from '@/lib/conditions/types';
import { ConditionsFooter, type Labelled } from './ConditionsFooter';

/** Format Open-Meteo's local ISO time ("2026-08-08T11:15") as "11:15am". */
function clockTime(iso: string | null): string | null {
  if (!iso) return null;
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2];
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${min}${ampm}`;
}

function compactRow(c: Conditions): Labelled[] {
  const rows: Labelled[] = [];
  const max = roundTemp(c.today?.maxTempC ?? null);
  if (max != null) rows.push({ label: 'Max', value: `${max}°` });
  if (c.today?.rainChancePct != null) rows.push({ label: 'Rain', value: `${c.today.rainChancePct}%` });
  if (c.current?.windSpeedKmh != null) {
    const dir = c.current.windCompass ? `${c.current.windCompass} ` : '';
    rows.push({ label: 'Wind', value: `${dir}${Math.round(c.current.windSpeedKmh)} km/h` });
  }
  const band = surfBand(c.surf?.waveHeightM ?? null);
  if (band) rows.push({ label: 'Surf', value: band.label });
  if (c.surf?.waterTempC != null) rows.push({ label: 'Water', value: `${roundTemp(c.surf.waterTempC)}°` });
  if (c.summary.bestSurfTime) rows.push({ label: 'Best surf', value: c.summary.bestSurfTime });
  return rows;
}

function detailRows(c: Conditions): Labelled[] {
  const rows: Labelled[] = [];
  if (c.current?.apparentTemperatureC != null) rows.push({ label: 'Feels like', value: `${roundTemp(c.current.apparentTemperatureC)}°` });
  const uv = c.today?.uvIndexMax ?? c.current?.uvIndex ?? null;
  if (uv != null) rows.push({ label: 'UV max', value: `${Math.round(uv)}` });
  if (c.current?.windGustKmh != null) rows.push({ label: 'Wind gusts', value: `${Math.round(c.current.windGustKmh)} km/h` });
  const sr = clockTime(c.today?.sunrise ?? null);
  const ss = clockTime(c.today?.sunset ?? null);
  if (sr) rows.push({ label: 'Sunrise', value: sr });
  if (ss) rows.push({ label: 'Sunset', value: ss });
  if (c.surf?.swellHeightM != null) {
    const dir = c.surf.swellCompass ? `${c.surf.swellCompass} ` : '';
    rows.push({ label: 'Swell', value: `${dir}${c.surf.swellHeightM.toFixed(1)}m` });
  }
  if (c.surf?.swellPeriodS != null) rows.push({ label: 'Swell period', value: `${Math.round(c.surf.swellPeriodS)}s` });
  const tide = c.surf?.tide;
  if (tide?.state) {
    const nextTime = tide.state === 'rising' ? tide.nextHighTime : tide.nextLowTime;
    const label = { rising: 'Rising', falling: 'Falling', high: 'High', low: 'Low' }[tide.state] ?? '';
    const next = clockTime(nextTime);
    rows.push({ label: 'Tide', value: next ? `${label} (${tide.state === 'rising' ? 'high' : 'low'} ${next})` : label });
  }
  if (c.summary.surfOutlook) rows.push({ label: 'Outlook', value: c.summary.surfOutlook.replace(/^Surf outlook:\s*/, '') });
  return rows;
}

/**
 * Conditions information panel — a slim band high on the homepage that shows the whole
 * day's weather + surf at once (no horizontal scroll). The stats wrap into a responsive
 * auto-fitting grid, so every figure — including the richer surf/sun detail — stays
 * visible at any width. Same compact type size throughout. The full written summary lives
 * on the /bondi-weather hub.
 */
function ConditionsBar({ c }: { c: Conditions }) {
  const { location, current } = c;
  const temp = roundTemp(current?.temperatureC ?? null);
  const emoji = current?.weather?.emoji ?? c.today?.weather?.emoji ?? '🌤️';
  const label = current?.weather?.label ?? c.today?.weather?.label ?? null;
  const updated = clockTime(c.weatherMeta?.providerUpdatedAt ?? null);

  // Everything in one panel: the headline stats plus the detail that used to hide behind
  // the scroll. Keep the long-form "Outlook" out of the grid (shown as a caption below).
  const stats = [...compactRow(c), ...detailRows(c).filter((r) => r.label !== 'Outlook')];
  const outlook = detailRows(c).find((r) => r.label === 'Outlook')?.value ?? null;

  return (
    <section
      aria-label={`Today's weather and surf in ${location.displayName}`}
      className="border-b border-sand-200 bg-sand-50"
    >
      <div className="mx-auto max-w-6xl px-4 py-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-sm text-ink-700">
            <span className="font-semibold text-ink-900">
              <span aria-hidden="true">{emoji}</span> {temp != null ? `${temp}°` : '—'}
            </span>
            {label && <span className="ml-2 text-ink-500">{label}</span>}
            <span className="ml-2 text-ink-400">· Bondi today</span>
          </p>
          <p className="flex items-center gap-x-3 text-xs text-ink-500">
            {updated && <span>Updated {updated}</span>}
            <Link href="/bondi-weather" className="font-medium text-ocean-700 hover:underline">
              Full forecast →
            </Link>
          </p>
        </div>

        {stats.length > 0 && (
          <dl className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-x-4 gap-y-1.5 border-t border-sand-200 pt-2">
            {stats.map((r) => (
              <div key={r.label}>
                <dt className="text-[11px] uppercase tracking-wide text-ink-500">{r.label}</dt>
                <dd className="text-sm font-semibold text-ink-900">{r.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {outlook && (
          <p className="mt-1.5 text-xs text-ink-500">
            <span className="uppercase tracking-wide">Outlook</span> · {outlook}
          </p>
        )}
      </div>
    </section>
  );
}

export async function WeatherSurfSummary({
  destination,
  variant = 'full',
}: {
  destination?: string;
  variant?: 'full' | 'bar';
}) {
  const c = await getConditions(destination);
  const { location, current, summary } = c;

  // If we truly have nothing, render nothing rather than an empty shell.
  if (!current && !c.today && !c.surf) return null;

  if (variant === 'bar') return <ConditionsBar c={c} />;

  const temp = roundTemp(current?.temperatureC ?? null);
  const emoji = current?.weather?.emoji ?? c.today?.weather?.emoji ?? '🌤️';
  const label = current?.weather?.label ?? c.today?.weather?.label ?? null;

  return (
    <section
      aria-label={`Today's weather and surf in ${location.displayName}`}
      className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ocean-700">
        Today in {location.displayName}
      </p>

      <div className="mt-2 flex items-center gap-3">
        <span className="text-3xl leading-none" aria-hidden="true">{emoji}</span>
        <p className="text-2xl font-semibold text-ink-900">
          {temp != null ? `${temp}°C` : '—'}
          {label && <span className="ml-2 text-base font-normal text-ink-500">{label}</span>}
        </p>
      </div>

      {/* Primary output: the written summary, as real server-rendered text. */}
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink-700">{summary.paragraph}</p>

      {/* Compact secondary data row. */}
      {compactRow(c).length > 0 && (
        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {compactRow(c).map((r) => (
            <div key={r.label} className="min-w-[64px]">
              <dt className="text-[11px] uppercase tracking-wide text-ink-500">{r.label}</dt>
              <dd className="text-sm font-semibold text-ink-900">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <ConditionsFooter
        details={detailRows(c)}
        hasSurf={Boolean(c.surf)}
        weatherSource={c.weatherMeta?.name ?? null}
        weatherUpdated={clockTime(c.weatherMeta?.providerUpdatedAt ?? null)}
        surfSource={c.surfMeta?.name ?? null}
        surfUpdated={clockTime(c.surfMeta?.providerUpdatedAt ?? null)}
        tideSource={c.surf?.tide?.state ? (c.tideMeta?.name ?? null) : null}
        safetyUrl={location.safetyUrl}
      />
    </section>
  );
}
