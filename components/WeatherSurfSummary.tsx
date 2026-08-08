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
  if (c.summary.surfOutlook) rows.push({ label: 'Outlook', value: c.summary.surfOutlook.replace(/^Surf outlook:\s*/, '') });
  return rows;
}

export async function WeatherSurfSummary({ destination }: { destination?: string }) {
  const c = await getConditions(destination);
  const { location, current, summary } = c;

  const temp = roundTemp(current?.temperatureC ?? null);
  const emoji = current?.weather?.emoji ?? c.today?.weather?.emoji ?? '🌤️';
  const label = current?.weather?.label ?? c.today?.weather?.label ?? null;

  // If we truly have nothing, render nothing rather than an empty shell.
  if (!current && !c.today && !c.surf) return null;

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
        safetyUrl={location.safetyUrl}
      />
    </section>
  );
}
