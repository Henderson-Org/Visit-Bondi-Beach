import Link from 'next/link';
import type { ReviewState, ReviewStatus } from '@/lib/freshness';

const STATUS_STYLE: Record<ReviewStatus, { label: string; chip: string }> = {
  overdue: { label: 'Overdue', chip: 'bg-red-100 text-red-800 border-red-200' },
  'never-verified': { label: 'Never verified', chip: 'bg-amber-100 text-amber-900 border-amber-200' },
  unclassified: { label: 'No cadence', chip: 'bg-sand-200 text-ink-700 border-sand-300' },
  'due-soon': { label: 'Due soon', chip: 'bg-ocean-100 text-ocean-800 border-ocean-200' },
  ok: { label: 'OK', chip: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
};

function Chip({ status }: { status: ReviewStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-block shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${s.chip}`}>
      {s.label}
    </span>
  );
}

/** Plain-English "when": days past due, or the derived next-review date. */
function timing(r: ReviewState): string {
  if (r.status === 'overdue') return `${r.overdueByDays}d past due`;
  if (r.status === 'never-verified') return 'no review recorded';
  if (r.status === 'unclassified') return 'assign a freshnessClass';
  if (r.nextReviewAt) return `due ${r.nextReviewAt}`;
  return '';
}

/**
 * The content maintenance worklist. Shows only records needing action (overdue,
 * never verified, unclassified, due soon) - an inventory of healthy pages is noise.
 * Every value here is DERIVED from lastReviewed + freshnessClass (see lib/freshness.ts),
 * so this panel can never disagree with the underlying content files.
 */
export function FreshnessPanel({
  worklist,
  summary,
}: {
  worklist: ReviewState[];
  summary: Record<ReviewStatus, number>;
}) {
  const needsAction = worklist.length;
  return (
    <section className="rounded-xl border border-sand-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl text-ink-900">Content freshness</h2>
        <p className="text-sm text-ink-500">
          {summary.ok} of {summary.ok + needsAction} within cadence
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['overdue', 'never-verified', 'due-soon', 'unclassified'] as const).map((k) => (
          <div key={k} className="rounded-lg border border-sand-200 bg-sand-50 px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-ink-500">{STATUS_STYLE[k].label}</dt>
            <dd className="mt-0.5 font-display text-2xl text-ink-900">{summary[k]}</dd>
          </div>
        ))}
      </dl>

      {needsAction === 0 ? (
        <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Everything is within its review cadence. Nothing to re-check right now.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <caption className="sr-only">Pages needing review, most urgent first</caption>
            <thead>
              <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-ink-500">
                <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                <th scope="col" className="py-2 pr-3 font-medium">Page</th>
                <th scope="col" className="py-2 pr-3 font-medium">Cadence</th>
                <th scope="col" className="py-2 pr-3 font-medium">Last verified</th>
                <th scope="col" className="py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {worklist.map((r) => (
                <tr key={r.path} className="border-b border-sand-100 align-top">
                  <td className="py-2 pr-3"><Chip status={r.status} /></td>
                  <td className="py-2 pr-3">
                    <Link href={r.path} className="text-ocean-700 hover:underline">{r.title}</Link>
                    <span className="block text-xs text-ink-400">{r.path}</span>
                  </td>
                  <td className="py-2 pr-3 text-ink-600">{r.freshnessClass ?? '—'}</td>
                  <td className="py-2 pr-3 text-ink-600">
                    {r.lastVerifiedAt ?? '—'}
                    {r.verificationMethod && (
                      <span className="block text-xs text-ink-400">
                        {r.verificationMethod === 'local' ? 'on the ground' : 'desk check'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-ink-600">{timing(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-ink-500">
        Cadences are set in <code>content/freshness-policy.json</code>. A page&rsquo;s class and last
        review live in its <code>content/bodies/*.json</code> source file; next-review dates are derived,
        never stored. Run <code>npm run freshness:audit</code> for the same list on the command line.
      </p>
    </section>
  );
}
