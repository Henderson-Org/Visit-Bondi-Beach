#!/usr/bin/env node
/**
 * coffee-index.mjs — computes the Bondi Coffee Index from the RAW observation dataset
 * (data/bondi-coffee-index.csv) into derived metrics (data/bondi-coffee-index.derived.json)
 * that the page renders. Raw data → derived metrics → presentation are kept separate, so no
 * headline number is ever hand-typed: every figure on the page is generated from real,
 * sourced observations here.
 *
 * Headline index = MEDIAN standard-coffee price per year. Only HIGH/MEDIUM confidence
 * observations feed the headline calcs (LOW kept in raw for transparency, excluded here).
 *
 * It also republishes the raw CSV to public/data/, which is the URL the page's download
 * link and its Dataset schema `distribution` point at. That copy used to be made by hand
 * and had silently drifted from the source (a venue's suburb was missing from the published
 * file), so the file we hand to Google Dataset Search disagreed with the file we compute
 * from. Copying it here makes drift impossible; lib/coffeeIndex.test.ts asserts it.
 *
 *   node scripts/coffee-index.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const CSV = 'data/bondi-coffee-index.csv';
const OUT = 'data/bondi-coffee-index.derived.json';
const PUBLISHED_CSV = 'public/data/bondi-coffee-index.csv';

// --- tiny CSV parser (quoted fields, commas, escaped quotes) ---
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      if (field !== '' || row.length) { row.push(field); rows.push(row); row = []; field = ''; }
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const csvText = readFileSync(CSV, 'utf8');
const raw = parseCsv(csvText);
const header = raw.shift().map((h) => h.trim());
const obs = raw
  .filter((r) => r.length >= header.length && r.some((c) => c.trim() !== ''))
  .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));

// Headline set: valid numeric price, HIGH or MEDIUM confidence.
const priced = obs
  .map((o) => ({ ...o, year: Number(o.year), price: Number(o.price_aud), conf: (o.confidence || '').toUpperCase() }))
  .filter((o) => o.year && Number.isFinite(o.price) && o.price > 0);
const headline = priced.filter((o) => o.conf === 'HIGH' || o.conf === 'MEDIUM');

const q = (arr, p) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const idx = (s.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return +(s[lo] + (s[hi] - s[lo]) * (idx - lo)).toFixed(2);
};
const round = (n, d = 2) => (n == null ? null : +n.toFixed(d));

const years = [...new Set(headline.map((o) => o.year))].sort((a, b) => a - b);
const byYear = {};
for (const y of years) {
  const prices = headline.filter((o) => o.year === y).map((o) => o.price);
  byYear[y] = {
    year: y,
    n: prices.length,
    median: q(prices, 0.5),
    mean: round(prices.reduce((a, b) => a + b, 0) / prices.length),
    min: Math.min(...prices),
    max: Math.max(...prices),
    p25: q(prices, 0.25),
    p75: q(prices, 0.75),
    bands: {
      under5: prices.filter((p) => p < 5).length,
      b5_549: prices.filter((p) => p >= 5 && p < 5.5).length,
      b550_599: prices.filter((p) => p >= 5.5 && p < 6).length,
      b6plus: prices.filter((p) => p >= 6).length,
    },
  };
}

const latest = years[years.length - 1];
const earliest = years[0];
const idxLatest = byYear[latest]?.median ?? null;
const idxEarliest = byYear[earliest]?.median ?? null;

// Year-on-year deltas (median).
const trend = years.map((y, i) => {
  const prev = i > 0 ? byYear[years[i - 1]].median : null;
  const cur = byYear[y].median;
  return {
    year: y, median: cur, n: byYear[y].n,
    yoyAbs: prev != null ? round(cur - prev) : null,
    yoyPct: prev != null ? round(((cur - prev) / prev) * 100, 1) : null,
  };
});

// Five-year totals + CAGR (only if >=2 years).
let fiveYear = null;
if (idxEarliest != null && idxLatest != null && years.length >= 2) {
  const span = latest - earliest;
  fiveYear = {
    fromYear: earliest, toYear: latest,
    fromMedian: idxEarliest, toMedian: idxLatest,
    totalAbs: round(idxLatest - idxEarliest),
    totalPct: round(((idxLatest - idxEarliest) / idxEarliest) * 100, 1),
    cagrPct: span > 0 ? round((Math.pow(idxLatest / idxEarliest, 1 / span) - 1) * 100, 1) : null,
  };
}

// Current-year ranked list (cheapest -> dearest), one obs per venue (lowest priced std coffee).
const curObs = headline.filter((o) => o.year === latest);
const byVenue = {};
for (const o of curObs) {
  if (!byVenue[o.venue_id] || o.price < byVenue[o.venue_id].price) byVenue[o.venue_id] = o;
}
const ranked = Object.values(byVenue)
  .map((o) => ({ venue_id: o.venue_id, venue_name: o.venue_name, suburb: o.suburb, price: o.price, item: o.coffee_item, source_url: o.source_url }))
  .sort((a, b) => a.price - b.price);

// Matched cohort: venues with a HIGH/MEDIUM price in BOTH earliest and latest year.
const inEarliest = new Map(headline.filter((o) => o.year === earliest).map((o) => [o.venue_id, o.price]));
const inLatest = new Map(headline.filter((o) => o.year === latest).map((o) => [o.venue_id, o.price]));
const matched = [...inEarliest.keys()].filter((v) => inLatest.has(v)).map((v) => ({
  venue_id: v,
  venue_name: (headline.find((o) => o.venue_id === v)?.venue_name) || v,
  from: inEarliest.get(v), to: inLatest.get(v),
  abs: round(inLatest.get(v) - inEarliest.get(v)),
  pct: round(((inLatest.get(v) - inEarliest.get(v)) / inEarliest.get(v)) * 100, 1),
})).sort((a, b) => b.pct - a.pct);
const matchedMedianFrom = q(matched.map((m) => m.from), 0.5);
const matchedMedianTo = q(matched.map((m) => m.to), 0.5);

const derived = {
  generatedFrom: CSV,
  totalObservations: obs.length,
  headlineObservations: headline.length,
  lowConfidenceExcluded: priced.length - headline.length,
  years, earliest, latest,
  index: { latest: idxLatest, earliest: idxEarliest },
  byYear, trend, fiveYear,
  ranked,
  cheapest: ranked[0] || null,
  dearest: ranked[ranked.length - 1] || null,
  currentBands: byYear[latest]?.bands || null,
  currentN: byYear[latest]?.n || 0,
  matched: {
    n: matched.length,
    medianFrom: matchedMedianFrom, medianTo: matchedMedianTo,
    medianPct: matchedMedianFrom ? round(((matchedMedianTo - matchedMedianFrom) / matchedMedianFrom) * 100, 1) : null,
    rows: matched,
  },
  coveragePerYear: Object.fromEntries(years.map((y) => [y, byYear[y].n])),
};

writeFileSync(OUT, JSON.stringify(derived, null, 2) + '\n');
writeFileSync(PUBLISHED_CSV, csvText);
console.log(`Bondi Coffee Index — ${headline.length} headline obs (of ${obs.length} raw) across years ${years.join(', ') || '(none yet)'}`);
if (idxLatest != null) console.log(`  ${latest} index (median): $${idxLatest.toFixed(2)}  ·  ${byYear[latest].n} venues`);
if (fiveYear) console.log(`  ${fiveYear.fromYear}->${fiveYear.toYear}: ${fiveYear.totalPct}%  (CAGR ${fiveYear.cagrPct}%/yr)`);
console.log(`  matched cohort: ${matched.length} venues`);
console.log(`  wrote ${OUT}`);
console.log(`  wrote ${PUBLISHED_CSV}`);
