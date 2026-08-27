#!/usr/bin/env node
/**
 * snapshot-water-quality.mjs — appends today's Beachwatch reading for the Bondi-to-Coogee
 * beaches to data/water-quality-history.csv.
 *
 * WHY THIS EXISTS, rather than reading a history API: there isn't one. Beachwatch's public
 * feed (api.beachwatch.nsw.gov.au/public/sites/geojson) is a SNAPSHOT — one current
 * forecast and one latest sample per site. Every per-site history path we probed
 * (/results, /history, /samples) returns 404, and the legacy enterococci download at
 * environment.nsw.gov.au now redirects to the current site. The long-run record exists
 * only inside the annual "State of the Beaches" PDFs.
 *
 * So the series is something we CREATE by observing the feed daily. That is the whole
 * point: after twelve months this file holds a per-beach daily record of Sydney's most
 * famous beaches that is not available anywhere else in machine-readable form — the same
 * model as data/bondi-coffee-index.csv, applied to a source that updates every day.
 *
 * Integrity rules this obeys:
 *  - It only ever RECORDS what Beachwatch published, with the date Beachwatch published it.
 *  - It never interpolates a missing day. A gap in the series stays a gap.
 *  - It is append-only and idempotent: re-running on the same day rewrites that day's rows
 *    rather than duplicating them, so a cron that fires twice cannot corrupt the record.
 *
 * Run daily:  node scripts/snapshot-water-quality.mjs
 * Check only: node scripts/snapshot-water-quality.mjs --dry
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'data', 'water-quality-history.csv');
const ENDPOINT = 'https://api.beachwatch.nsw.gov.au/public/sites/geojson';
const DRY = process.argv.includes('--dry');

/** The beaches we track: Bondi plus every stop on the Bondi-to-Coogee coastal walk. */
const SITES = [
  'Bondi Beach', 'Tamarama Beach', 'Bronte Beach',
  'Clovelly Beach', 'Gordons Bay (East)', 'Coogee Beach',
];

const COLUMNS = [
  'observed_date',   // the Sydney date this row was recorded (YYYY-MM-DD)
  'site_name',       // Beachwatch's own site name
  'site_id',         // Beachwatch's stable site id
  'pollution_forecast',        // Unlikely | Possible | Likely | (blank)
  'forecast_issued_at',        // Beachwatch's own timestamp for that forecast
  'latest_result',             // Good | Fair | Poor | (blank)
  'latest_result_rating',      // 1-4
  'latest_sample_date',        // when the LAB SAMPLE was taken - not when we fetched
  'source_url',
  'fetched_at',                // when we fetched it
];

/** Today's date in Sydney, without pulling in a date library. */
function sydneyDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function main() {
  const res = await fetch(ENDPOINT, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Beachwatch responded ${res.status}`);
  const json = await res.json();

  const wanted = new Set(SITES.map((s) => s.toLowerCase()));
  const fetchedAt = new Date().toISOString();
  const today = sydneyDate();

  const rows = [];
  for (const f of json.features ?? []) {
    const p = f.properties ?? {};
    if (!p.siteName || !wanted.has(String(p.siteName).toLowerCase())) continue;
    rows.push([
      today,
      p.siteName,
      p.id ?? '',
      p.pollutionForecast ?? '',
      p.pollutionForecastTimeStamp ?? '',
      p.latestResult ?? '',
      p.latestResultRating ?? '',
      p.latestResultObservationDate ?? '',
      ENDPOINT,
      fetchedAt,
    ]);
  }

  if (rows.length === 0) throw new Error('no tracked sites found in the feed — refusing to write an empty snapshot');
  const missing = SITES.filter((s) => !rows.some((r) => r[1] === s));
  if (missing.length) console.warn(`⚠ not in today's feed: ${missing.join(', ')}`);

  // Read the existing series, dropping any rows already recorded for today so a second run
  // replaces rather than duplicates them.
  let existing = [];
  try {
    const raw = await readFile(OUT, 'utf8');
    existing = raw.trim().split('\n').slice(1).filter((line) => line && !line.startsWith(`${today},`));
  } catch { /* first run */ }

  const sorted = rows.sort((a, b) => SITES.indexOf(a[1]) - SITES.indexOf(b[1]));
  const body = [...existing, ...sorted.map((r) => r.map(csvCell).join(','))];

  console.log(`${DRY ? '[dry run] ' : ''}${today}: ${rows.length} site(s)`);
  for (const r of sorted) {
    console.log(`  ${r[1].padEnd(20)} forecast=${(r[3] || '—').padEnd(10)} latest=${(r[5] || '—').padEnd(6)} sampled=${(r[7] || '—').slice(0, 10)}`);
  }
  if (DRY) return;

  await writeFile(OUT, `${COLUMNS.join(',')}\n${body.join('\n')}\n`);
  console.log(`\ndata/water-quality-history.csv: ${body.length} observation(s) total.`);
}

main().catch((e) => { console.error(String(e.message || e)); process.exit(1); });
