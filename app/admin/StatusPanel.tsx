import type { AnalyticsStatus } from '@/lib/analytics/db';

/**
 * Setup status.
 *
 * Recording needs several independent things to be true at once, and every failure is
 * silent on the public site by design. This turns "I don't think it's working" into a
 * specific, readable answer, with the exact fix next to whatever is wrong.
 */
function Row({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex items-start gap-2.5 py-1.5">
      <span
        aria-hidden="true"
        className={`mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`}
      />
      <span className="text-sm">
        <span className="sr-only">{ok ? 'OK: ' : 'Problem: '}</span>
        <span className={ok ? 'text-ink-700' : 'font-medium text-ink-900'}>{label}</span>
        {detail && <span className="block text-xs text-ink-500">{detail}</span>}
      </span>
    </li>
  );
}

export function StatusPanel({ status }: { status: AnalyticsStatus }) {
  const fixes: string[] = [];
  if (!status.dbConfigured) fixes.push('Set ANALYTICS_DATABASE_URL (or POSTGRES_URL) to your Neon connection string.');
  if (status.dbConfigured && !status.dbReachable) fixes.push('The connection string is set but the database refused the connection - check it is the pooled string and that the database is not paused.');
  if (!status.serverSwitch) fixes.push('Set ANALYTICS_ENABLED to exactly true (lowercase).');
  if (!status.clientSwitch) fixes.push('Set NEXT_PUBLIC_ANALYTICS_ENABLED to exactly true (lowercase).');
  if (fixes.length) fixes.push('Then redeploy - environment variables only take effect on a new deployment.');

  return (
    <section className="mt-6 rounded-2xl border border-sand-200 bg-white p-5">
      <h2 className="font-display text-xl text-ink-900">Setup status</h2>
      <ul className="mt-3 divide-y divide-sand-100">
        <Row
          ok={status.dbConfigured}
          label={status.dbConfigured ? 'Database configured' : 'No database configured'}
          detail={
            status.dbTarget
              ? `${status.dbTarget.database} on ${status.dbTarget.host}${status.dbSource ? ` (via ${status.dbSource})` : ''}`
              : undefined
          }
        />
        <Row
          ok={status.dbReachable}
          label={status.dbReachable ? 'Database reachable' : 'Cannot reach the database'}
          detail={status.dbError ?? undefined}
        />
        <Row
          ok={status.tableExists}
          label={status.tableExists ? 'Analytics table ready' : 'Analytics table not created yet'}
          detail={
            status.tableExists
              ? `${(status.totalRows ?? 0).toLocaleString()} event${status.totalRows === 1 ? '' : 's'} stored${status.lastEventAt ? `, most recent ${status.lastEventAt}` : ''}`
              : 'It is created automatically on the first recorded page view.'
          }
        />
        <Row
          ok={status.serverSwitch}
          label={`Server recording switch (ANALYTICS_ENABLED): ${status.serverSwitch ? 'on' : 'off'}`}
          detail={status.serverSwitch ? undefined : 'Page views are being received and silently discarded.'}
        />
        <Row
          ok={status.clientSwitch}
          label={`Browser beacon switch (NEXT_PUBLIC_ANALYTICS_ENABLED): ${status.clientSwitch ? 'on' : 'off'}`}
          detail={
            status.clientSwitch
              ? undefined
              : 'This one is baked in at build time, so it needs a redeploy after changing.'
          }
        />
      </ul>

      {fixes.length > 0 ? (
        <div role="alert" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-ink-800">
          <p className="font-medium">Analytics is not recording. To fix:</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {fixes.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-ink-800">
          Everything is connected and recording.
          {status.totalRows === 0
            ? ' No page views yet - open the site in a normal browser tab and they will appear here within a few seconds.'
            : ''}
        </p>
      )}
    </section>
  );
}
