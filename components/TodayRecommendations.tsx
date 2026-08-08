/**
 * "Because of today's conditions…" — a compact strip of on-site guides chosen
 * from today's weather/surf (see lib/conditions/recommend.ts). Server-rendered.
 *
 * Grounded: recommended links are filtered against real pages (getPage), so a link
 * only shows if the page genuinely exists — no dead ends, no invented suggestions.
 */
import Link from 'next/link';
import { getConditions } from '@/lib/conditions/service';
import { recommendFromConditions } from '@/lib/conditions/recommend';
import { getPage } from '@/lib/content';

export async function TodayRecommendations({ destination }: { destination?: string }) {
  const c = await getConditions(destination);
  const rec = recommendFromConditions(c);
  const links = rec.links.filter((l) => getPage(l.path)?.indexable);
  if (links.length === 0) return null;

  return (
    <section aria-label="Suggested for today" className="rounded-2xl border border-sand-200 bg-sand-50 p-5 sm:p-6">
      <p className="text-[15px] font-medium text-ink-900">{rec.message}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((l) => (
          <li key={l.path}>
            <Link
              href={l.path}
              className="block h-full rounded-xl border border-sand-200 bg-white p-4 hover:border-ocean-500"
            >
              <span className="block font-medium text-ink-900">{l.title}</span>
              <span className="mt-0.5 block text-sm text-ink-500">{l.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
