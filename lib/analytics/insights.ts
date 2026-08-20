/**
 * Weekly performance insights - pure logic, no database, fully testable.
 *
 * DELIBERATE NON-FEATURE: there is no invented "SEO score" here. A single 0-100 number
 * would require weights nobody can justify, would look authoritative on the dashboard,
 * and would mean nothing. Everything below is either a quantity actually measured on this
 * site, or a plain-English statement derived from one - and each insight carries the
 * numbers it came from so the owner can check the reasoning rather than trust a figure.
 *
 * What this CAN see: on-site behaviour - how many people arrived, from which channel,
 * to which pages, reading which language.
 * What it CANNOT see: search rankings, impressions, click-through rate or query data.
 * Those live in Search Console. The panel says so rather than implying it knows.
 */

export type Channel = 'search' | 'social' | 'referral' | 'direct';

export const CHANNEL_LABEL: Record<Channel, string> = {
  search: 'Search engines',
  social: 'Social',
  referral: 'Other websites',
  direct: 'Direct / unknown',
};

const SEARCH_HOSTS = [
  'google.', 'www.google.', 'bing.com', 'duckduckgo.com', 'search.yahoo.', 'yahoo.com',
  'baidu.com', 'yandex.', 'ecosia.org', 'search.brave.com', 'qwant.com', 'startpage.com',
  'searx.', 'lite.duckduckgo.com',
];

const SOCIAL_HOSTS = [
  'facebook.com', 'm.facebook.com', 'l.facebook.com', 'instagram.com', 'l.instagram.com',
  't.co', 'twitter.com', 'x.com', 'reddit.com', 'out.reddit.com', 'pinterest.', 'linkedin.com',
  'lnkd.in', 'tiktok.com', 'youtube.com', 'threads.net', 'whatsapp.com',
];

/**
 * Which channel a referrer host belongs to.
 *
 * "Direct" genuinely means "we were told nothing" - a typed URL, a bookmark, an app, or a
 * browser that withheld the referrer. It is NOT proof someone typed the address, and the
 * dashboard labels it "Direct / unknown" for that reason.
 */
export function channelFor(host: string | null | undefined): Channel {
  if (!host) return 'direct';
  const h = host.toLowerCase();
  if (SEARCH_HOSTS.some((s) => h === s.replace(/\.$/, '') || h.startsWith(s) || h.includes(`.${s}`))) {
    return 'search';
  }
  if (SOCIAL_HOSTS.some((s) => h === s || h.endsWith(`.${s}`) || h.startsWith(s))) return 'social';
  return 'referral';
}

/** Percentage change from `prev` to `cur`, or null when there is no baseline to compare. */
export function changePct(cur: number, prev: number): number | null {
  if (prev === 0) return cur === 0 ? 0 : null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

/** Human wording for a change, honest about an absent baseline. */
export function changeLabel(cur: number, prev: number): string {
  const c = changePct(cur, prev);
  if (c === null) return 'no comparison yet';
  if (c === 0) return 'unchanged';
  return `${c > 0 ? 'up' : 'down'} ${Math.abs(c)}%`;
}

export interface PeriodMetrics {
  visits: number;
  visitors: number;
  pageViews: number;
  byChannel: Record<Channel, number>;
  byLanguage: Record<string, number>;
}

export interface Mover {
  pathname: string;
  cur: number;
  prev: number;
}

export interface WeeklyComparison {
  cur: PeriodMetrics;
  prev: PeriodMetrics;
  risers: Mover[];
  fallers: Mover[];
  daysOfData: number;
}

export interface Insight {
  tone: 'good' | 'bad' | 'neutral';
  text: string;
}

/**
 * Turn the week-on-week comparison into plain statements.
 *
 * Every rule is deterministic and every claim quotes the numbers behind it. Where the data
 * is too thin to support a conclusion, it says that instead of manufacturing one - the
 * whole point is that a quiet week reads as "not enough data", never as a bad score.
 */
export function buildInsights(c: WeeklyComparison): Insight[] {
  const out: Insight[] = [];
  const { cur, prev } = c;

  // Guard first: with almost no traffic, week-on-week percentages are noise.
  if (cur.visits < 20 && prev.visits < 20) {
    out.push({
      tone: 'neutral',
      text: `Only ${cur.visits} visit${cur.visits === 1 ? '' : 's'} in the last 7 days and ${prev.visits} the week before. That is too little to read a trend from - treat everything below as early signal, not evidence.`,
    });
  }

  // The headline SEO outcome we can actually observe: search-driven visits.
  const s = cur.byChannel.search;
  const sp = prev.byChannel.search;
  const searchShare = cur.visits ? Math.round((s / cur.visits) * 100) : 0;
  if (s > 0 || sp > 0) {
    out.push({
      tone: s > sp ? 'good' : s < sp ? 'bad' : 'neutral',
      text: `Search engines sent ${s} visit${s === 1 ? '' : 's'} this week (${changeLabel(s, sp)} from ${sp}), which is ${searchShare}% of all visits.`,
    });
  } else {
    out.push({
      tone: 'neutral',
      text: 'No visits arrived from a search engine in either week. Either the pages have not started ranking yet, or referrers are being stripped before they reach us.',
    });
  }

  if (searchShare > 0 && searchShare < 25 && cur.visits >= 20) {
    out.push({
      tone: 'neutral',
      text: `Most traffic is still not coming from search (${100 - searchShare}% arrives direct, social or by referral), so SEO is not yet the main driver of this site.`,
    });
  }

  // Translated content - the question no other tool on this site can answer.
  const totalViews = Object.values(cur.byLanguage).reduce((a, b) => a + b, 0);
  const translatedCur = totalViews - (cur.byLanguage.en ?? 0);
  const prevTotal = Object.values(prev.byLanguage).reduce((a, b) => a + b, 0);
  const translatedPrev = prevTotal - (prev.byLanguage.en ?? 0);
  if (translatedCur > 0 || translatedPrev > 0) {
    const share = totalViews ? Math.round((translatedCur / totalViews) * 100) : 0;
    const top = Object.entries(cur.byLanguage)
      .filter(([l]) => l !== 'en')
      .sort((a, b) => b[1] - a[1])[0];
    out.push({
      tone: translatedCur > translatedPrev ? 'good' : translatedCur < translatedPrev ? 'bad' : 'neutral',
      text: `Translated pages drew ${translatedCur} of ${totalViews} page views (${share}%), ${changeLabel(translatedCur, translatedPrev)} on last week${top ? `. Most read: ${top[0]} with ${top[1]}` : ''}.`,
    });
  } else if (totalViews > 0) {
    out.push({
      tone: 'neutral',
      text: 'No page views on any translated page this week. The translations exist but are not being found yet.',
    });
  }

  // Engagement: are people reading more than one page?
  const ppv = cur.visits ? Math.round((cur.pageViews / cur.visits) * 10) / 10 : 0;
  const ppvPrev = prev.visits ? Math.round((prev.pageViews / prev.visits) * 10) / 10 : 0;
  if (cur.visits >= 10) {
    out.push({
      tone: ppv >= 1.8 ? 'good' : ppv < 1.2 ? 'bad' : 'neutral',
      text:
        ppv < 1.2
          ? `Visitors are reading ${ppv} pages per visit (was ${ppvPrev}). Most arrive, read one page and leave - internal links from your busiest pages are the lever.`
          : `Visitors are reading ${ppv} pages per visit (was ${ppvPrev}).`,
    });
  }

  for (const m of c.risers.slice(0, 2)) {
    out.push({
      tone: 'good',
      text: `${m.pathname} grew from ${m.prev} to ${m.cur} views. Worth more internal links while it has momentum.`,
    });
  }
  for (const m of c.fallers.slice(0, 2)) {
    out.push({
      tone: 'bad',
      text: `${m.pathname} fell from ${m.prev} to ${m.cur} views. Worth checking it still ranks and still answers the question.`,
    });
  }

  return out;
}
