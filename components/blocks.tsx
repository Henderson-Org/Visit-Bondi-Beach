/**
 * Reusable editorial content blocks for practical visitor information.
 * Semantic HTML first so content stays crawlable and accessible (brief §8, §23, §31).
 * These are presentation only - facts come from structured content, never hardcoded here.
 */
import type { ReactNode } from 'react';

export interface QuickFact {
  label: string;
  value: string;
  /** Marks a fact whose value is injected live at render (see lib/content QuickFact). */
  live?: 'waterTemp';
}

/** Editorial "quick facts" strip - Best for / Cost / Time / etc. */
export function QuickFacts({ items }: { items: QuickFact[] }) {
  if (!items?.length) return null;
  // Separate tiles (not a divided grid) so any number of facts wraps cleanly -
  // a divided grid leaves broken partial borders when the last row isn't full.
  return (
    <dl aria-label="Quick facts" className="my-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {items.map((f) => (
        <div key={f.label} className="rounded-xl border border-sand-200 bg-white p-4">
          <dt className="text-[11px] uppercase tracking-wide text-ink-500">{f.label}</dt>
          <dd className="mt-1 text-sm font-medium text-ink-900">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Answer-first block (AEO). A short, self-contained direct answer placed at the top of a
 * page under a question-phrased H2 - the passage answer engines (AI Overviews, ChatGPT,
 * Perplexity) lift as the extractable answer. Rendered as a distinct lead so both readers
 * and machines see it as *the* answer. Keep it factual and ~40–55 words.
 */
export function Answer({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 rounded-xl border border-ocean-500/25 bg-ocean-500/5 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ocean-700">The short answer</p>
      <div className="mt-1.5 text-[15px] leading-relaxed text-ink-900">{children}</div>
    </div>
  );
}

/**
 * Comparison table - a real semantic <table> so per-option/per-month answers (Bondi vs Manly,
 * airport options, parking, sea temps) are extractable by search + answer engines rather than
 * buried in prose. Scrolls horizontally on small screens; first column is a row header.
 */
export function DataTable({ caption, columns, rows }: { caption?: string; columns: string[]; rows: ReactNode[][] }) {
  if (!columns?.length || !rows?.length) return null;
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="mb-2 text-left text-xs text-ink-500">{caption}</caption>}
        <thead>
          <tr className="border-b border-sand-300">
            {columns.map((c, i) => (
              <th key={i} scope="col" className="px-3 py-2 text-left font-semibold text-ink-900">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-sand-200 align-top">
              {r.map((cell, ci) => (
                ci === 0
                  ? <th key={ci} scope="row" className="px-3 py-2 text-left font-medium text-ink-900">{cell}</th>
                  : <td key={ci} className="px-3 py-2 text-ink-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Local-knowledge callout (brief §9). Use only for genuinely supported local advice. */
export function LocalTip({ children }: { children: ReactNode }) {
  return (
    <aside className="my-6 rounded-xl border-l-4 border-ocean-500 bg-ocean-500/5 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ocean-700">Local tip</p>
      <div className="mt-1 text-sm text-ink-700">{children}</div>
    </aside>
  );
}

/** Generic callout: note / warning. Keep safety info clear, not alarmist (brief §66). */
export function Callout({ tone = 'note', title, children }: { tone?: 'note' | 'warning'; title?: string; children: ReactNode }) {
  const styles =
    tone === 'warning'
      ? 'border-amber-500 bg-amber-500/5'
      : 'border-sand-300 bg-sand-100';
  return (
    <aside className={`my-6 rounded-xl border-l-4 ${styles} p-4`}>
      {title && <p className="text-sm font-semibold text-ink-900">{title}</p>}
      <div className="mt-1 text-sm text-ink-700">{children}</div>
    </aside>
  );
}

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * FAQ list. Renders visible Q&A (required for FAQ schema validity, brief §24).
 * The matching FAQPage JSON-LD is emitted by the page via lib/structured-data.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  if (!items?.length) return null;
  return (
    <section aria-label="Frequently asked questions" className="my-8">
      <h2 className="font-display text-2xl text-ink-900">Frequently asked questions</h2>
      <div className="mt-4 divide-y divide-sand-200 rounded-xl border border-sand-200 bg-white">
        {items.map((f, i) => (
          <details key={i} className="group p-4">
            <summary className="cursor-pointer list-none font-medium text-ink-900 flex justify-between gap-3">
              {f.q}
              <span className="text-ocean-600 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="mt-2 text-sm text-ink-700">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export interface ItineraryStop {
  time: string;
  title: string;
  detail?: string;
}

/** Itinerary timeline (brief §12) - realistic sequencing, mobile-friendly. */
export function ItineraryTimeline({ stops }: { stops: ItineraryStop[] }) {
  if (!stops?.length) return null;
  return (
    <ol className="my-6 space-y-0">
      {stops.map((s, i) => (
        <li key={i} className="grid grid-cols-[64px_1fr] gap-4">
          <div className="text-right">
            <span className="text-sm font-medium tabular-nums text-ocean-700">{s.time}</span>
          </div>
          <div className="relative border-l border-sand-300 pl-4 pb-6">
            <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-ocean-500" aria-hidden="true" />
            <p className="font-medium text-ink-900">{s.title}</p>
            {s.detail && <p className="mt-0.5 text-sm text-ink-500">{s.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
