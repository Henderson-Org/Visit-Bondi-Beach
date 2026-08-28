#!/usr/bin/env node
/**
 * build-rescue-csv.mjs — writes public/data/bondi-area-rescue-statistics.csv from
 * data/rescue-statistics.ts.
 *
 * The CSV is the file journalists and Google Dataset Search actually download, so it must
 * never drift from the figures rendered on the page. Generating it from the same source
 * makes drift impossible, and lib/rescueStats.test.ts asserts the published file matches.
 *
 * Run: npm run build:rescue-csv
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'data', 'rescue-statistics.ts');
const OUT_DIR = join(ROOT, 'public', 'data');
const OUT = join(OUT_DIR, 'bondi-area-rescue-statistics.csv');

export const COLUMNS = [
  'season', 'end_year', 'rescues', 'preventative_actions', 'first_aids',
  'beach_attendance', 'nsw_rescues_total', 'source_title', 'source_url', 'source_page',
];

/**
 * Parse the season objects out of the TypeScript source. Reading the .ts directly (rather
 * than importing it) keeps this script dependency-free, and the strict field-by-field
 * regex means a malformed record fails loudly instead of emitting a blank cell.
 */
export function parseSeasons(ts) {
  const body = ts.slice(ts.indexOf('RESCUE_SEASONS'));
  const out = [];
  const blocks = body.split(/\n  \{\n/).slice(1);
  for (const b of blocks) {
    const get = (k, re) => {
      const m = b.match(re);
      if (!m) throw new Error(`rescue-statistics.ts: could not read "${k}" from a season block`);
      return m[1];
    };
    const season = get('season', /season:\s*'([^']+)'/);
    const endYear = Number(get('endYear', /endYear:\s*(\d+)/));
    const rescues = Number(get('rescues', /\brescues:\s*(\d+)/));
    const num = (k) => {
      const m = b.match(new RegExp(`${k}:\\s*(null|\\d+)`));
      return m ? (m[1] === 'null' ? null : Number(m[1])) : null;
    };
    out.push({
      season, end_year: endYear, rescues,
      preventative_actions: num('preventativeActions'),
      first_aids: num('firstAids'),
      beach_attendance: num('attendance'),
      nsw_rescues_total: num('nswRescues'),
      // The title is built by the REPORT() helper in the source, so there is no literal
      // to read — it is derived from the season instead (see titleFor).
      source_url: get('source url', /REPORT\(\d+,\s*'([^']+)'/),
      source_page: Number(get('source page', /REPORT\(\d+,\s*'[^']+',\s*(\d+)\)/)),
    });
  }
  return out;
}

/** Season labels are derived from the season string, not the template literal. */
function titleFor(season) {
  return `Surf Life Saving NSW Annual Report ${season}`;
}

const cell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows) {
  const lines = rows.map((r) =>
    [r.season, r.end_year, r.rescues, r.preventative_actions, r.first_aids,
     r.beach_attendance, r.nsw_rescues_total, titleFor(r.season), r.source_url, r.source_page]
      .map(cell).join(','),
  );
  return `${COLUMNS.join(',')}\n${lines.join('\n')}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ts = await readFile(SRC, 'utf8');
  const rows = parseSeasons(ts);
  if (rows.length === 0) throw new Error('no seasons parsed — refusing to write an empty dataset');
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT, toCsv(rows));
  console.log(`public/data/bondi-area-rescue-statistics.csv: ${rows.length} season(s).`);
  for (const r of rows) console.log(`  ${r.season}  rescues=${String(r.rescues).padStart(5)}  prev=${r.preventative_actions ?? '—'}`);
}
