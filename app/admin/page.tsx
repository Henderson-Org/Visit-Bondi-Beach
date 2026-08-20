import Link from 'next/link';
import type { Metadata } from 'next';
import { DateFilter } from './DateFilter';
import { VisitsChart, type ChartPoint } from './VisitsChart';
import { analyticsConfigured, connectionSource, connectionTarget } from '@/lib/analytics/db';
import {
  bucketFor,
  formatBucketLabel,
  generateBuckets,
  languageLabel,
  pct,
  resolveRange,
} from '@/lib/analytics/core';
import {
  countDistinctPages,
  fetchFirstEventDate,
  fetchKpis,
  fetchLanguages,
  fetchSeries,
  fetchTopPages,
  type LanguageRow,
  type TopPage,
} from '@/lib/analytics/queries';

export const metadata: Metadata = {
  title: { absolute: 'Analytics' },
  robots: { index: false, follow: false, nocache: true },
};

// Always render fresh: analytics that are cached are analytics that mislead.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 20;

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">{label}</p>
      <p className="mt-1 font-display text-3xl text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-2xl border border-sand-200 bg-white p-5">
      <h2 className="font-display text-xl text-ink-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

type Props = {
  searchParams: Promise<{ preset?: string; from?: string; to?: string; page?: string }>;
};

export default async function AdminDashboard({ searchParams }: Props) {
  const sp = await searchParams;
  const range = resolveRange({ preset: sp.preset, from: sp.from, to: sp.to });
  const bucket = bucketFor(range);
  const pageNum = Math.max(1, Number(sp.page) || 1);
  const target = connectionTarget();
  const source = connectionSource();

  if (!analyticsConfigured()) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-2xl text-ink-900">Analytics</h1>
        <div role="alert" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-ink-800">
          <p className="font-medium">No analytics database is configured.</p>
          <p className="mt-1">
            Set <code className="font-mono text-xs">ANALYTICS_DATABASE_URL</code> (or
            <code className="font-mono text-xs"> POSTGRES_URL</code> /
            <code className="font-mono text-xs"> DATABASE_URL</code>) in the deployment
            environment and redeploy. The table is created automatically on first use - no
            manual SQL. See <code className="font-mono text-xs">docs/analytics.md</code>.
          </p>
        </div>
      </main>
    );
  }

  // One failure must not take the whole dashboard down; each panel degrades on its own.
  const [kpis, series, topPages, languages, distinctPages, firstDate] = await Promise.all([
    fetchKpis(range).catch(() => null),
    fetchSeries(range, bucket).catch(() => null),
    fetchTopPages(range, PAGE_SIZE, (pageNum - 1) * PAGE_SIZE).catch(() => null),
    fetchLanguages(range).catch(() => null),
    countDistinctPages(range).catch(() => 0),
    fetchFirstEventDate().catch(() => null),
  ]);

  const dbDown = kpis === null && series === null && topPages === null && languages === null;

  const byBucket = new Map((series ?? []).map((p) => [p.bucket, p.visits]));
  const points: ChartPoint[] = generateBuckets(range, bucket).map((key) => ({
    key,
    label: formatBucketLabel(bucket === 'hour' ? key : `${key}-01`, bucket),
    visits: byBucket.get(key) ?? 0,
  }));

  const totalViews = kpis?.pageViews ?? 0;
  const hasMore = distinctPages > pageNum * PAGE_SIZE;
  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    if (range.preset === 'custom') {
      p.set('preset', 'custom');
      p.set('from', range.from);
      p.set('to', range.to);
    } else p.set('preset', range.preset);
    for (const [k, v] of Object.entries(over)) p.set(k, v);
    return `?${p.toString()}`;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink-900">Analytics</h1>
          <p className="mt-1 text-sm text-ink-600">
            First-party data for visitbondibeach.com. Times are Australia/Sydney.
          </p>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="rounded-lg border border-sand-300 bg-white px-3 py-1.5 text-sm text-ink-700 transition hover:border-ocean-400 focus:outline-none focus:ring-2 focus:ring-ocean-300"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="mt-6">
        <DateFilter preset={range.preset} from={range.from} to={range.to} />
        {range.invalid && (
          <p role="alert" className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {range.invalid}
          </p>
        )}
      </div>

      {dbDown ? (
        <div role="alert" className="mt-8 rounded-xl border border-red-300 bg-red-50 p-5 text-sm text-red-900">
          <p className="font-medium">The analytics database is temporarily unavailable.</p>
          <p className="mt-1">No data has been lost - this page will recover when the database does.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Visits" value={(kpis?.visits ?? 0).toLocaleString()} hint="Distinct sessions" />
            <Kpi
              label="Unique visitors"
              value={(kpis?.visitors ?? 0).toLocaleString()}
              hint="Anonymous browsers"
            />
            <Kpi label="Page views" value={totalViews.toLocaleString()} hint="Public pages only" />
            <Kpi label="Pages per visit" value={(kpis?.pagesPerVisit ?? 0).toFixed(1)} />
          </div>

          <Panel title="Visits over time">
            <VisitsChart points={points} />
          </Panel>

          <Panel title="Top pages">
            {!topPages?.length ? (
              <p className="py-8 text-center text-sm text-ink-500">No page views in this period.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-ink-500">
                        <th scope="col" className="py-2 pr-3">Page</th>
                        <th scope="col" className="py-2 pr-3">Path</th>
                        <th scope="col" className="py-2 pr-3 text-right">Views</th>
                        <th scope="col" className="py-2 pr-3 text-right">Visitors</th>
                        <th scope="col" className="py-2 text-right">% of views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPages.map((p: TopPage) => (
                        <tr key={p.pathname} className="border-b border-sand-100 last:border-0">
                          <td className="py-2 pr-3 text-ink-900">
                            {p.pageTitle ?? <span className="text-ink-400">Untitled</span>}
                            <span className="ml-2 rounded bg-sand-100 px-1.5 py-0.5 text-[11px] text-ink-600">
                              {languageLabel(p.language)}
                            </span>
                          </td>
                          <td className="py-2 pr-3 font-mono text-xs text-ink-600">{p.pathname}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{p.pageViews.toLocaleString()}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{p.visitors.toLocaleString()}</td>
                          <td className="py-2 text-right tabular-nums">{pct(p.pageViews, totalViews)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(hasMore || pageNum > 1) && (
                  <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Top pages pagination">
                    {pageNum > 1 ? (
                      <Link href={`/admin${qs({ page: String(pageNum - 1) })}`} className="text-ocean-700 underline">
                        ← Previous
                      </Link>
                    ) : <span />}
                    <span className="text-ink-500">
                      {(pageNum - 1) * PAGE_SIZE + 1}-{(pageNum - 1) * PAGE_SIZE + topPages.length} of{' '}
                      {distinctPages.toLocaleString()}
                    </span>
                    {hasMore ? (
                      <Link href={`/admin${qs({ page: String(pageNum + 1) })}`} className="text-ocean-700 underline">
                        View more →
                      </Link>
                    ) : <span />}
                  </nav>
                )}
              </>
            )}
          </Panel>

          <Panel title="Page views by language">
            {!languages?.length ? (
              <p className="py-8 text-center text-sm text-ink-500">No page views in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-ink-500">
                      <th scope="col" className="py-2 pr-3">Language</th>
                      <th scope="col" className="py-2 pr-3">Share</th>
                      <th scope="col" className="py-2 pr-3 text-right">Views</th>
                      <th scope="col" className="py-2 pr-3 text-right">% of total</th>
                      <th scope="col" className="py-2 text-right">Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {languages.map((l: LanguageRow) => {
                      const share = pct(l.pageViews, totalViews);
                      return (
                        <tr key={l.language} className="border-b border-sand-100 last:border-0">
                          <td className="py-2 pr-3 text-ink-900">{languageLabel(l.language)}</td>
                          <td className="py-2 pr-3">
                            {/* Horizontal bar, not a pie - readable with eight languages. */}
                            <div className="h-2 w-full min-w-[80px] rounded-full bg-sand-100">
                              <div
                                className="h-2 rounded-full bg-ocean-500"
                                style={{ width: `${Math.max(share, share > 0 ? 2 : 0)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums">{l.pageViews.toLocaleString()}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{share}%</td>
                          <td className="py-2 text-right tabular-nums">{l.visitors.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <footer className="mt-8 text-xs leading-relaxed text-ink-500">
            {target && (
              <p className="mb-1">
                Reading from <code className="font-mono">{target.database}</code> on{' '}
                <code className="font-mono">{target.host}</code>
                {source ? ` (via ${source})` : ''}. Set{' '}
                <code className="font-mono">ANALYTICS_DATABASE_URL</code> to pin this to a
                specific database if the project has more than one.
              </p>
            )}
            <p>
              {firstDate
                ? `First-party tracking has been recording since ${firstDate}. Nothing before that date exists in this database.`
                : 'No events recorded yet. Figures will populate once the site receives traffic with tracking enabled.'}
            </p>
            <p className="mt-1">
              A visit is a session that ends after 30 minutes of inactivity. Unique visitors are
              anonymous browsers identified by a first-party cookie, not people. Language is the
              language of the page actually served. Admin and API traffic is excluded, and known
              bots are filtered.
            </p>
          </footer>
        </>
      )}
    </main>
  );
}
