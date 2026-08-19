#!/usr/bin/env node
/**
 * Analytics migration runner.
 *
 * Applies lib/analytics/schema.sql. Every statement in that file is idempotent
 * (CREATE TABLE / CREATE INDEX ... IF NOT EXISTS), so this is safe to run repeatedly
 * and safe to re-run after a failed deploy.
 *
 * It only ever CREATES. It contains no DROP, DELETE or TRUNCATE, so running it can
 * never destroy collected analytics.
 *
 * Usage:  POSTGRES_URL=postgres://... npm run analytics:migrate
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('POSTGRES_URL (or DATABASE_URL) is not set. Nothing to migrate against.');
  process.exit(1);
}
const { default: pg } = await import('pg');
const client = new pg.Client({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
});
await client.connect();

const ddl = await readFile(join(ROOT, 'lib', 'analytics', 'schema.sql'), 'utf8');

// Split on semicolons at end of line, ignoring comment-only fragments.
const statements = ddl
  .split(/;\s*$/m)
  .map((s) => s.trim())
  .filter((s) => s && !s.split('\n').every((l) => l.trim().startsWith('--')));

if (/\b(drop|truncate|delete)\b/i.test(ddl)) {
  console.error('Refusing to run: schema.sql contains a destructive statement.');
  process.exit(1);
}

console.log(`Applying ${statements.length} statement(s)…`);
for (const [i, stmt] of statements.entries()) {
  const first = stmt.split('\n').find((l) => l.trim() && !l.trim().startsWith('--')) ?? '';
  process.stdout.write(`  ${i + 1}. ${first.trim().slice(0, 70)}… `);
  await client.query(stmt);
  console.log('ok');
}

const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM analytics_page_view');
console.log(`\nMigration complete. analytics_page_view currently holds ${rows[0].n} row(s).`);
await client.end();
process.exit(0);
