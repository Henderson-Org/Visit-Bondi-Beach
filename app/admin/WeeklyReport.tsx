import {
  CHANNEL_LABEL,
  buildInsights,
  changeLabel,
  type Channel,
  type WeeklyComparison,
} from '@/lib/analytics/insights';

/**
 * Weekly performance panel.
 *
 * This is deliberately NOT an "SEO score". There is no invented composite number: every
 * figure is something measured on this site, and every statement quotes the numbers it
 * came from. It also states plainly what it cannot see, so it is never mistaken for a
 * view of how Google ranks the site.
 */
function Delta({ cur, prev }: { cur: number; prev: number }) {
  const up = cur > prev;
  const flat = cur === prev;
  return (
    <span
      className={`text-xs ${flat ? 'text-ink-500' : up ? 'text-emerald-700' : 'text-red-700'}`}
    >
      {flat ? '—' : up ? '▲' : '▼'} {changeLabel(cur, prev)}
    </span>
  );
}

function Stat({ label, cur, prev }: { label: string; cur: number; prev: number }) {
  return (
    <div className="rounded-xl border border-sand-200 p-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-500">{label}</p>
      <p className="mt-0.5 font-display text-2xl text-ink-900">{cur.toLocaleString()}</p>
      <p className="mt-0.5">
        <Delta cur={cur} prev={prev} />
        <span className="ml-1 text-xs text-ink-500">vs {prev.toLocaleString()}</span>
      </p>
    </div>
  );
}

export function WeeklyReport({ data }: { data: WeeklyComparison }) {
  const { cur, prev } = data;
  const insights = buildInsights(data);
  const channels: Channel[] = ['search', 'referral', 'social', 'direct'];
  const totalChannelVisits = channels.reduce((a, c) => a + cur.byChannel[c], 0);

  return (
    <section className="mt-8 rounded-2xl border border-sand-200 bg-white p-5">
      <h2 className="font-display text-xl text-ink-900">How the last 7 days went</h2>
      <p className="mt-1 text-sm text-ink-600">
        The last 7 days compared with the 7 before, recalculated every time you open this
        page. Always current - there is no weekly job that can fail silently.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Visits" cur={cur.visits} prev={prev.visits} />
        <Stat label="Unique visitors" cur={cur.visitors} prev={prev.visitors} />
        <Stat label="Page views" cur={cur.pageViews} prev={prev.pageViews} />
        <Stat label="From search" cur={cur.byChannel.search} prev={prev.byChannel.search} />
      </div>

      <h3 className="mt-6 font-display text-base text-ink-900">Where visits came from</h3>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-ink-500">
            <th scope="col" className="py-2 pr-3">Channel</th>
            <th scope="col" className="py-2 pr-2 text-right">Visits</th>
            <th scope="col" className="py-2 pr-2 text-right">Share</th>
            <th scope="col" className="py-2 text-right">vs last week</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((c) => {
            const v = cur.byChannel[c];
            const share = totalChannelVisits ? Math.round((v / totalChannelVisits) * 100) : 0;
            return (
              <tr key={c} className="border-b border-sand-100 last:border-0">
                <td className="py-2 pr-3 text-ink-900">{CHANNEL_LABEL[c]}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{v.toLocaleString()}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{share}%</td>
                <td className="py-2 text-right">
                  <Delta cur={v} prev={prev.byChannel[c]} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h3 className="mt-6 font-display text-base text-ink-900">What that means</h3>
      <ul className="mt-2 space-y-2">
        {insights.map((i, n) => (
          <li key={n} className="flex items-start gap-2.5 text-sm">
            <span
              aria-hidden="true"
              className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                i.tone === 'good' ? 'bg-emerald-500' : i.tone === 'bad' ? 'bg-amber-500' : 'bg-ink-300'
              }`}
            />
            <span className="text-ink-700">{i.text}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl border border-sand-200 bg-sand-50/60 p-4 text-xs leading-relaxed text-ink-600">
        <p className="font-medium text-ink-800">What this can and cannot tell you</p>
        <p className="mt-1">
          These are measurements of what happened on the site: who arrived, from where, and
          what they read. There is deliberately no single &ldquo;SEO score&rdquo; here,
          because any such number would need weightings nobody can justify and would look
          more authoritative than it deserves.
        </p>
        <p className="mt-1.5">
          It cannot see your rankings, search impressions or click-through rate - those exist
          only in Google Search Console. &ldquo;From search&rdquo; counts visits whose
          referrer was a search engine, which understates the real figure whenever a browser
          strips the referrer.
          {data.daysOfData < 14 && (
            <>
              {' '}
              Tracking has only been running {data.daysOfData} day
              {data.daysOfData === 1 ? '' : 's'}, so the previous week is incomplete and the
              comparisons will not be meaningful until about two weeks of data exist.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
