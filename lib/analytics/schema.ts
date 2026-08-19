/**
 * Visit Bondi Beach - first-party analytics schema.
 *
 * Single source of truth for the DDL, shared by:
 *   - the runtime (lib/analytics/db.ts `ensureSchema()`, which self-provisions on first use)
 *   - the manual migration script (scripts/migrate-analytics.ts)
 *
 * DURABILITY CONTRACT (do not weaken without the site owner's explicit decision):
 *   * `analytics_page_view` is the RAW event log and the permanent source of truth.
 *   * Nothing in this project deletes, prunes, truncates or rolls off rows from it.
 *     There is no TTL, no retention job and no cron. Raw history is kept indefinitely.
 *   * Aggregate/rollup tables may be added later for performance, but they must be
 *     derived FROM this table - never a replacement for it.
 *
 * Every statement is idempotent, so applying this repeatedly is safe and is exactly
 * what lets the runtime call it on every cold start without risk.
 */
export const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS analytics_page_view (
     id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     -- Client-generated UUID per page view. UNIQUE so a retried/duplicated beacon
     -- (network retry, double-fire, back/forward cache) collapses to one row.
     event_id      UUID        NOT NULL,
     -- When the page view happened. Stored in UTC; reported in Australia/Sydney.
     occurred_at   TIMESTAMPTZ NOT NULL,
     -- Anonymous, random, first-party. Not derived from IP, UA or any fingerprint.
     visitor_id    UUID        NOT NULL,
     session_id    UUID        NOT NULL,
     pathname      TEXT        NOT NULL,
     page_title    TEXT,
     -- Canonical English path shared by every translation of the same article, so
     -- language performance can be compared without merging unrelated pages.
     content_id    TEXT,
     -- Normalised language of the RENDERED content (never the browser's Accept-Language).
     -- 'en' for the English original, otherwise the site's locale code (ja, zh-cn, ...).
     language      TEXT        NOT NULL,
     referrer      TEXT,
     referrer_host TEXT,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,

  // Idempotency: the same event_id can only ever produce one row.
  `CREATE UNIQUE INDEX IF NOT EXISTS analytics_page_view_event_id_key
     ON analytics_page_view (event_id)`,

  // Dashboard query paths. Every panel filters by occurred_at first, so the composite
  // indexes lead with it.
  `CREATE INDEX IF NOT EXISTS analytics_page_view_occurred_at_idx
     ON analytics_page_view (occurred_at)`,
  `CREATE INDEX IF NOT EXISTS analytics_page_view_occurred_visitor_idx
     ON analytics_page_view (occurred_at, visitor_id)`,
  `CREATE INDEX IF NOT EXISTS analytics_page_view_occurred_session_idx
     ON analytics_page_view (occurred_at, session_id)`,
  `CREATE INDEX IF NOT EXISTS analytics_page_view_occurred_pathname_idx
     ON analytics_page_view (occurred_at, pathname)`,
  `CREATE INDEX IF NOT EXISTS analytics_page_view_occurred_language_idx
     ON analytics_page_view (occurred_at, language)`,
  `CREATE INDEX IF NOT EXISTS analytics_page_view_occurred_content_idx
     ON analytics_page_view (occurred_at, content_id)`,
];

/**
 * Guard against a destructive statement ever being introduced here. Both the runtime and
 * the migration script check this before executing anything.
 */
export function schemaIsNonDestructive(): boolean {
  return !SCHEMA_STATEMENTS.some((s) => /\b(drop|truncate|delete)\b/i.test(s));
}
