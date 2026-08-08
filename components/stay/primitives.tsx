import { PRICE_LABEL, TAG_LABEL, type PriceBand, type Tag } from '@/data/accommodation';

/** Price positioning shown as $ / $$ / $$$ / $$$$ (active glyphs inked, rest muted). */
export function PriceBadge({ band, className = '' }: { band: PriceBand; className?: string }) {
  const active = band.length;
  return (
    <span
      className={`font-medium tabular-nums ${className}`}
      title={`${band} · ${PRICE_LABEL[band]}`}
      aria-label={`Price ${PRICE_LABEL[band]}`}
    >
      <span className="text-ink-900">{'$'.repeat(active)}</span>
      <span className="text-ink-300">{'$'.repeat(4 - active)}</span>
    </span>
  );
}

/** A row of small "best for" tag chips (capped, with an optional +N). */
export function TagChips({ tags, max = 4 }: { tags: Tag[]; max?: number }) {
  if (!tags.length) return null;
  const shown = tags.slice(0, max);
  const extra = tags.length - shown.length;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Best for">
      {shown.map((t) => (
        <li key={t} className="rounded-full border border-sand-200 px-2 py-0.5 text-[11px] text-ink-600">
          {TAG_LABEL[t]}
        </li>
      ))}
      {extra > 0 && <li className="px-1 py-0.5 text-[11px] text-ink-400">+{extra}</li>}
    </ul>
  );
}

/** Small labelled fact used in "at a glance" grids. */
export function GlanceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-sand-200 bg-white p-3.5">
      <dt className="text-[11px] uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}
