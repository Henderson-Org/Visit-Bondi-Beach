'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { TOPIC_LABEL, type ArticleTopic, type ArticleFacet } from '@/lib/articles';

/**
 * Lightweight, filterable article index. Text rows (not image cards) so it scales to
 * hundreds of posts with minimal DOM/JS and no layout shift. Topic filter is client-side
 * visibility only - no URL params, no crawl traps. All rows are in the initial HTML.
 */
function dateLabel(iso: string): string {
  if (!iso) return '';
  const [y, m] = iso.split('-').map(Number);
  if (!y || !m) return '';
  return new Intl.DateTimeFormat('en-AU', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, 1, 12)));
}

export function ArticleList({
  facets,
  topics,
}: {
  facets: ArticleFacet[];
  topics: { topic: ArticleTopic; count: number }[];
}) {
  const [topic, setTopic] = useState<ArticleTopic | null>(null);
  const visible = useMemo(() => (topic ? facets.filter((f) => f.topic === topic) : facets), [facets, topic]);

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm transition ${active ? 'border-ocean-500 bg-ocean-600 text-white' : 'border-sand-300 bg-white text-ink-700 hover:border-ocean-500 hover:text-ocean-700'}`;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={chip(!topic)} onClick={() => setTopic(null)}>All ({facets.length})</button>
        {topics.map((t) => (
          <button key={t.topic} type="button" className={chip(topic === t.topic)} onClick={() => setTopic(topic === t.topic ? null : t.topic)}>
            {TOPIC_LABEL[t.topic]} ({t.count})
          </button>
        ))}
      </div>

      <ul className="mt-6 divide-y divide-sand-200 rounded-xl border border-sand-200 bg-white">
        {visible.map((f) => (
          <li key={f.path}>
            <Link href={f.path} className="flex items-baseline justify-between gap-4 px-4 py-3 hover:bg-sand-50">
              <span className="text-ink-900 hover:text-ocean-700">{f.title}</span>
              <span className="flex shrink-0 items-center gap-3 text-xs text-ink-500">
                <span className="hidden sm:inline rounded-full border border-sand-200 px-2 py-0.5">{TOPIC_LABEL[f.topic]}</span>
                {dateLabel(f.date) && <span className="tabular-nums">{dateLabel(f.date)}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
