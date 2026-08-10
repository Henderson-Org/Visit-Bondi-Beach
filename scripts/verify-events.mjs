#!/usr/bin/env node
/**
 * verify-events.mjs — event date-quality & freshness check.
 *
 * Two jobs:
 *   1. HARD validation (exit 1): contradictory date states that must never ship
 *      (announced without a date, endDate<startDate, tbc with a concrete date, etc.).
 *      These are ALSO enforced by lib/events.test.ts; this script is the CI/cron entry point.
 *   2. SOFT freshness report (exit 0): editions that have passed, annual events approaching
 *      their window with no confirmed date, and stale verifications — i.e. the events whose
 *      dates a human should go and re-research. This is what stops "Dates TBC" from silently
 *      returning every year.
 *
 * Usage: node scripts/verify-events.mjs [--today=YYYY-MM-DD] [--stale-days=120]
 *
 * It text-parses data/events.ts (no TS runtime in this repo). The file has a stable,
 * one-object-per-event shape, so field extraction is straightforward and covered by tests.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dir, '..', 'data', 'events.ts');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const TODAY = typeof args.today === 'string' ? args.today : new Date().toISOString().slice(0, 10);
const STALE_DAYS = Number(args['stale-days'] ?? 120);

const raw = readFileSync(SRC, 'utf8');

// Split into per-event blocks: everything from one `id:` up to the next.
const body = raw.slice(raw.indexOf('EVENTS: BondiEvent[] = ['));
const blocks = body.split(/\n\s*\{\n/).slice(1); // each event object body

function field(block, name) {
  const m = block.match(new RegExp(`${name}:\\s*'([^']*)'`)) || block.match(new RegExp(`${name}:\\s*"([^"]*)"`));
  return m ? m[1] : undefined;
}
function num(block, name) {
  const m = block.match(new RegExp(`${name}:\\s*(\\d+)`));
  return m ? Number(m[1]) : undefined;
}
function recurrence(block) {
  const m = block.match(/recurrence:\s*\{([^}]*)\}/);
  if (!m) return undefined;
  const freq = (m[1].match(/freq:\s*'([^']+)'/) || [])[1];
  const month = (m[1].match(/month:\s*(\d+)/) || [])[1];
  const day = (m[1].match(/day:\s*(\d+)/) || [])[1];
  return { freq, month: month ? Number(month) : undefined, day: day ? Number(day) : undefined };
}
function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

const events = blocks
  .map((b) => ({
    id: field(b, 'id'),
    title: field(b, 'title'),
    dateStatus: field(b, 'dateStatus'),
    startDate: field(b, 'startDate'),
    endDate: field(b, 'endDate'),
    dateVerifiedAt: field(b, 'dateVerifiedAt'),
    nextEditionYear: num(b, 'nextEditionYear'),
    rec: recurrence(b),
  }))
  .filter((e) => e.id);

const VALID = ['confirmed', 'announced', 'recurring', 'estimated', 'tbc'];
const errors = [];
const warnings = [];

for (const e of events) {
  const tag = e.id || '(unknown)';
  // ---- HARD validation ----
  if (!e.dateStatus || !VALID.includes(e.dateStatus)) errors.push(`${tag}: missing/invalid dateStatus (${e.dateStatus})`);
  if (e.dateStatus === 'announced' && !e.startDate) errors.push(`${tag}: dateStatus 'announced' but no startDate`);
  if (e.dateStatus === 'confirmed' && !e.startDate && !(e.rec?.freq === 'annual' && e.rec?.day != null))
    errors.push(`${tag}: dateStatus 'confirmed' but no startDate and no fixed-day recurrence`);
  if (e.startDate && e.endDate && e.endDate < e.startDate) errors.push(`${tag}: endDate ${e.endDate} before startDate ${e.startDate}`);
  if (e.dateStatus === 'tbc' && e.startDate) errors.push(`${tag}: dateStatus 'tbc' but has a concrete startDate ${e.startDate}`);

  // ---- SOFT freshness ----
  if ((e.dateStatus === 'announced' || e.dateStatus === 'confirmed') && e.startDate) {
    const end = e.endDate ?? e.startDate;
    if (end < TODAY) warnings.push(`${tag}: ${e.dateStatus} edition (${e.startDate}${e.endDate ? `..${e.endDate}` : ''}) has PASSED — research the next edition`);
  }
  // Annual event approaching its window with no confirmed date.
  if (e.rec?.freq === 'annual' && e.rec.month != null && (e.dateStatus === 'tbc' || e.dateStatus === 'estimated' || e.dateStatus === 'recurring')) {
    const yr = e.nextEditionYear ?? Number(TODAY.slice(0, 4));
    const approx = `${yr}-${String(e.rec.month).padStart(2, '0')}-15`;
    const lead = daysBetween(TODAY, approx);
    if (lead >= 0 && lead <= 270) warnings.push(`${tag}: annual (~${approx}) is within ~9 months and still '${e.dateStatus}' — check for announced dates`);
  }
  // Stale verification.
  if (e.dateVerifiedAt && daysBetween(e.dateVerifiedAt, TODAY) > STALE_DAYS)
    warnings.push(`${tag}: date last verified ${e.dateVerifiedAt} (> ${STALE_DAYS} days ago) — re-check the source`);
}

console.log(`\nevent date check — ${events.length} events · today=${TODAY}\n`);
if (warnings.length) {
  console.log('FRESHNESS (research these):');
  for (const w of warnings) console.log('  ⚠ ' + w);
  console.log('');
}
if (errors.length) {
  console.log('ERRORS (must fix):');
  for (const er of errors) console.log('  ✗ ' + er);
  console.log(`\n${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`0 errors, ${warnings.length} warning(s).`);
