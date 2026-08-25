'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { track } from '@/lib/analytics';
import { EVENTS, SEARCH_DEBOUNCE_MS, trackSearch } from '@/lib/analytics/events';
import { useRouter } from 'next/navigation';

type Entry = { t: string; p: string; c: string; k: string };

// Score a match: title prefix > title word-start > title includes > keyword includes.
// A light type weight floats hubs/guides/tools above the long tail of articles on ties.
const TYPE_WEIGHT: Record<string, number> = { Guide: 6, Tool: 6, Data: 5, 'Eat & drink': 3, Page: 2, Article: 1 };
function score(e: Entry, q: string): number {
  const t = e.t.toLowerCase();
  let s = 0;
  if (t.startsWith(q)) s = 100;
  else if (t.includes(` ${q}`)) s = 70;
  else if (t.includes(q)) s = 55;
  else if (e.k.includes(q)) s = 30;
  else return 0;
  return s + (TYPE_WEIGHT[e.c] || 0);
}

export function SiteSearch() {
  const router = useRouter();
  const [index, setIndex] = useState<Entry[] | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy-load the prebuilt index the first time the user engages with search.
  const ensureIndex = useCallback(() => {
    if (index) return;
    fetch('/search-index.json')
      .then((r) => r.json())
      .then((data: Entry[]) => setIndex(data))
      .catch(() => setIndex([]));
  }, [index]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!index || query.length < 2) return [];
    return index
      .map((e) => ({ e, s: score(e, query) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.e.t.length - b.e.t.length)
      .slice(0, 8)
      .map((x) => x.e);
  }, [index, q]);

  useEffect(() => setActive(0), [q]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (ev: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Global shortcut: ⌘K / Ctrl-K, or "/" when not typing in a field, focuses search.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const k = ev.key;
      const meta = ev.metaKey || ev.ctrlKey;
      const el = document.activeElement;
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement)?.isContentEditable;
      if ((meta && k.toLowerCase() === 'k') || (k === '/' && !typing)) {
        ev.preventDefault();
        ensureIndex();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ensureIndex]);

  const go = (p: string) => {
    track(EVENTS.SITE_SEARCH_RESULT_CLICK, { query: q.trim().slice(0, 64), path: p, result_count: results.length });
    setOpen(false);
    setQ('');
    router.push(p);
  };

  // One event once typing settles. A zero-result search is the most useful thing this
  // box can tell us - it names content the site does not have.
  useEffect(() => {
    const q2 = q.trim();
    if (q2.length < 2) return;
    const t = setTimeout(() => trackSearch(EVENTS.SITE_SEARCH, q2, results.length, 'site-header'), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // Intentionally keyed on the query only - depending on results.length would restart
    // the timer as results settle, re-introducing per-keystroke noise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const onKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (ev.key === 'Enter' && results[active]) { ev.preventDefault(); go(results[active].p); }
    else if (ev.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  const showList = open && q.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-full border border-sand-300 bg-white px-3 py-1.5 focus-within:border-ocean-500 focus-within:ring-1 focus-within:ring-ocean-500/30">
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="9" cy="9" r="6" />
          <path d="m14 14 4 4" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={q}
          role="combobox"
          aria-expanded={showList}
          aria-controls="site-search-list"
          aria-label="Search Visit Bondi Beach"
          placeholder="Search Bondi…"
          // min-h keeps the input itself a legitimate tap target; the padded wrapper around it
          // is only decorative, so its height did not count towards the control's.
          className="w-full min-h-[28px] bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
          onFocus={() => { ensureIndex(); setOpen(true); }}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onKeyDown={onKeyDown}
        />
        <kbd className="hidden shrink-0 rounded border border-sand-300 bg-sand-50 px-1.5 text-[10px] text-ink-400 sm:inline">/</kbd>
      </div>

      {showList && (
        <ul
          id="site-search-list"
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 max-h-[70vh] overflow-auto rounded-2xl border border-sand-200 bg-white p-1.5 shadow-xl"
        >
          {results.length === 0 ? (
            <li className="px-3 py-3 text-sm text-ink-500">No matches for “{q.trim()}”.</li>
          ) : (
            results.map((r, i) => (
              <li key={r.p} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r.p)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left ${i === active ? 'bg-ocean-500/10' : 'hover:bg-sand-100'}`}
                >
                  <span className="min-w-0 truncate text-sm text-ink-900">{r.t}</span>
                  <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-ocean-700">{r.c}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
