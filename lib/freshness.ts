/**
 * Freshness / verification state.
 *
 * The design principle here is that `nextReviewAt` and review `status` are DERIVED,
 * never stored. A stored next-review date is a second source of truth that silently
 * drifts the moment a page's cadence changes or someone re-verifies without updating
 * it - which is exactly how "last updated" badges end up lying. So a record stores only
 * what a human actually observed:
 *
 *   lastReviewed   - the date someone checked it          (content/bodies/<slug>.json)
 *   checkType      - how they checked: on the ground ('local') or against sources ('desk')
 *   sources        - what they checked it against (label + url)
 *   freshnessClass - how fast this kind of fact decays
 *
 * Everything else - when it is next due, whether it is overdue, how overdue - is computed
 * from those, so the worklist can never disagree with the data.
 */
import freshnessPolicy from '@/content/freshness-policy.json';
import { FRESHNESS_MAX_DAYS, allPages, type FreshnessClass, type Page, type Source } from '@/lib/content';

export type ReviewStatus =
  /** Verified within cadence. */
  | 'ok'
  /** Still valid, but inside the tail of its window - schedule it now. */
  | 'due-soon'
  /** Past its cadence: the facts on this page are no longer known-good. */
  | 'overdue'
  /** Authored but never verified - no lastReviewed at all. */
  | 'never-verified'
  /** No freshnessClass, so no cadence can be applied. */
  | 'unclassified';

export interface ReviewState {
  path: string;
  title: string;
  freshnessClass: FreshnessClass | null;
  /** What a human observed, ISO date, or null when never verified. */
  lastVerifiedAt: string | null;
  /** 'local' = checked on the ground; 'desk' = re-checked against sources. */
  verificationMethod: 'local' | 'desk' | null;
  sources: Source[];
  /** DERIVED: lastVerifiedAt + the class cadence. Null when there is nothing to derive from. */
  nextReviewAt: string | null;
  status: ReviewStatus;
  /** Days since verification (null when never verified). */
  ageDays: number | null;
  /** Days past due; 0 when not overdue. */
  overdueByDays: number;
}

const DAY_MS = 86_400_000;
const DUE_SOON_FRACTION = freshnessPolicy.dueSoonAtFraction;

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Compute the review state of one page.
 * `now` is injectable so tests are deterministic and never depend on the clock.
 */
export function reviewState(page: Page, now: Date = new Date()): ReviewState {
  const cls = page.freshnessClass ?? null;
  const lastVerifiedAt = page.lastReviewed ?? null;
  const sources = page.sources ?? [];
  const base: Omit<ReviewState, 'status' | 'nextReviewAt' | 'ageDays' | 'overdueByDays'> = {
    path: page.path,
    title: page.title || page.h1 || page.path,
    freshnessClass: cls,
    lastVerifiedAt,
    verificationMethod: page.checkType ?? null,
    sources,
  };

  if (!cls) {
    return { ...base, nextReviewAt: null, status: 'unclassified', ageDays: null, overdueByDays: 0 };
  }
  if (!lastVerifiedAt) {
    return { ...base, nextReviewAt: null, status: 'never-verified', ageDays: null, overdueByDays: 0 };
  }

  const maxDays = FRESHNESS_MAX_DAYS[cls];
  const due = new Date(toDate(lastVerifiedAt).getTime() + maxDays * DAY_MS);
  const ageDays = Math.floor((now.getTime() - toDate(lastVerifiedAt).getTime()) / DAY_MS);
  const overdueByDays = Math.max(0, ageDays - maxDays);

  // Evergreen pages still have a (long) cadence so they are re-read eventually, but they
  // never show a public "checked" date - a stale badge on a history page reads as neglect.
  const status: ReviewStatus =
    overdueByDays > 0 ? 'overdue' : ageDays >= maxDays * DUE_SOON_FRACTION ? 'due-soon' : 'ok';

  return { ...base, nextReviewAt: isoDate(due), status, ageDays, overdueByDays };
}

/** Every page carrying an authored body, with its derived review state. */
export function allReviewStates(now: Date = new Date()): ReviewState[] {
  return allPages()
    .filter((p) => p.authoredBody)
    .map((p) => reviewState(p, now));
}

const RANK: Record<ReviewStatus, number> = {
  overdue: 0, 'never-verified': 1, unclassified: 2, 'due-soon': 3, ok: 4,
};

/**
 * The maintenance worklist: everything needing attention, most urgent first.
 * `ok` records are excluded - the worklist is what to DO, not an inventory.
 */
export function reviewWorklist(now: Date = new Date()): ReviewState[] {
  return allReviewStates(now)
    .filter((r) => r.status !== 'ok')
    .sort((a, b) => RANK[a.status] - RANK[b.status] || b.overdueByDays - a.overdueByDays || a.path.localeCompare(b.path));
}

/** Counts by status, for the admin summary strip. */
export function reviewSummary(now: Date = new Date()): Record<ReviewStatus, number> {
  const out: Record<ReviewStatus, number> = {
    ok: 0, 'due-soon': 0, overdue: 0, 'never-verified': 0, unclassified: 0,
  };
  for (const r of allReviewStates(now)) out[r.status]++;
  return out;
}
