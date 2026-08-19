import { Pool, type QueryResultRow } from 'pg';
import { SCHEMA_STATEMENTS, schemaIsNonDestructive } from './schema';

/**
 * Database access for analytics.
 *
 * Storage is Postgres, reached with `pg` (node-postgres). `pg` is used rather than a
 * vendor-specific driver so the same code runs against Vercel Postgres, Neon, Supabase,
 * RDS or a local Postgres - the owner is never locked to one provider, which matters
 * because this database is the permanent home of the site's analytics history.
 *
 * This is the project's first database; there was none before. See docs/analytics.md.
 */

function connectionString(): string | undefined {
  return process.env.POSTGRES_URL || process.env.DATABASE_URL || undefined;
}

/** True when a database connection string is configured. */
export function analyticsConfigured(): boolean {
  return Boolean(connectionString());
}

/**
 * Whether the collector should record events.
 *
 * Off by default: it requires ANALYTICS_ENABLED === 'true' AND a configured database,
 * so local development, CI and automated tests never write into production analytics.
 */
export function collectionEnabled(): boolean {
  return process.env.ANALYTICS_ENABLED === 'true' && analyticsConfigured();
}

/**
 * One lazily-created pool per server instance, cached on globalThis so Next.js's dev
 * hot-reload and serverless module re-evaluation don't leak connections.
 */
declare global {
  // eslint-disable-next-line no-var
  var __vbbAnalyticsPool: Pool | undefined;
}

export function pool(): Pool {
  if (!globalThis.__vbbAnalyticsPool) {
    const cs = connectionString();
    if (!cs) throw new Error('POSTGRES_URL (or DATABASE_URL) is not configured');
    globalThis.__vbbAnalyticsPool = new Pool({
      connectionString: cs,
      // Managed Postgres (Vercel/Neon/Supabase) requires TLS; a local dev database does not.
      ssl: /localhost|127\.0\.0\.1/.test(cs) ? undefined : { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return globalThis.__vbbAnalyticsPool;
}

/**
 * Create the analytics table and indexes if they are not already there.
 *
 * The site owner should not have to run SQL by hand to switch analytics on, so the app
 * provisions its own schema on first use. This is safe to call constantly because every
 * statement is `IF NOT EXISTS`, and the result is cached per process, so the DDL runs at
 * most once per server instance rather than once per request.
 *
 * It only ever CREATEs. `schemaIsNonDestructive()` refuses to run anything that could
 * drop or delete data, so this path can never destroy collected analytics.
 */
let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      if (!schemaIsNonDestructive()) {
        throw new Error('Refusing to apply analytics schema: it contains a destructive statement.');
      }
      const p = pool();
      for (const stmt of SCHEMA_STATEMENTS) await p.query(stmt);
    })().catch((err) => {
      // Let the next call retry rather than caching a permanent failure (e.g. the
      // database was still waking up, as Neon does after idling).
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

/**
 * Run a parameterised query. Never interpolate user input into the SQL text.
 * Ensures the schema exists first, so a fresh database works with no manual setup.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  await ensureSchema();
  const res = await pool().query<T>(text, params as never[]);
  return res.rows;
}
