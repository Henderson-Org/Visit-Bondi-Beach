#!/usr/bin/env node --experimental-strip-types
/**
 * Analytics migration runner (optional).
 *
 * The app provisions its own schema on first use (lib/analytics/db.ts `ensureSchema()`),
 * so running this is NOT required. It exists for anyone who prefers to apply the schema
 * explicitly, or to confirm the table exists without waiting for first traffic.
 *
 * It shares the exact statements the runtime uses, so the two can never drift.
 * It only ever CREATEs - no DROP, DELETE or TRUNCATE - so it cannot destroy analytics.
 *
 * Usage:  POSTGRES_URL=postgres://... npm run analytics:migrate
 */
import pg from 'pg';
import { SCHEMA_STATEMENTS, schemaIsNonDestructive } from '../lib/analytics/schema.ts';

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('POSTGRES_URL (or DATABASE_URL) is not set. Nothing to migrate against.');
  process.exit(1);
}

if (!schemaIsNonDestructive()) {
  console.error('Refusing to run: the schema contains a destructive statement.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
});
await client.connect();

console.log(`Applying ${SCHEMA_STATEMENTS.length} statement(s)…`);
for (const [i, stmt] of SCHEMA_STATEMENTS.entries()) {
  const first = stmt.split('\n')[0].trim();
  process.stdout.write(`  ${i + 1}. ${first.slice(0, 70)}… `);
  await client.query(stmt);
  console.log('ok');
}

const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM analytics_page_view');
console.log(`\nDone. analytics_page_view currently holds ${rows[0].n} row(s).`);
await client.end();
process.exit(0);
