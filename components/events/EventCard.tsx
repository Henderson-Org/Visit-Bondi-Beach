import Link from 'next/link';
import Image from 'next/image';
import { CATEGORY_LABEL } from '@/data/events';
import { type ResolvedEvent, whenLabel } from '@/lib/events';

/**
 * Reusable event card. Date/time is the most scannable element. Whole card links to
 * the event detail page. No scraped imagery — a clean text-led design when we don't
 * hold a rights-cleared photo.
 */
export function EventCard({ resolved }: { resolved: ResolvedEvent }) {
  const e = resolved.event;
  const priceLabel = e.priceType === 'free' ? 'Free' : e.priceType === 'paid' ? 'Ticketed' : 'Varies';

  return (
    <Link
      href={`/whats-on/${e.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-sand-200 bg-white transition hover:border-ocean-500 hover:shadow-sm"
    >
      {e.image && (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand-200">
          <Image src={e.image} alt={e.imageAlt || e.title} fill sizes="(max-width:640px) 100vw, 360px" className="object-cover transition duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wide text-ocean-600">{whenLabel(resolved)}</span>
          {e.datesToConfirm && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Dates TBC</span>}
        </div>

        <h3 className="mt-1.5 font-display text-lg leading-snug text-ink-900 group-hover:text-ocean-700">{e.title}</h3>

        <p className="mt-1 text-sm text-ink-500">
          {e.venue} · {e.suburb}
        </p>

        <p className="mt-2 text-sm text-ink-700 line-clamp-2">{e.summary}</p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${e.priceType === 'free' ? 'bg-ocean-500/10 text-ocean-700' : 'bg-sand-100 text-ink-600'}`}>{priceLabel}</span>
          {e.categories.slice(0, 2).map((c) => (
            <span key={c} className="rounded-full border border-sand-200 px-2 py-0.5 text-[11px] text-ink-600">{CATEGORY_LABEL[c]}</span>
          ))}
        </div>

        <p className="mt-4 pt-1 text-sm font-medium text-ocean-700">Event details <span aria-hidden="true">→</span></p>
      </div>
    </Link>
  );
}
