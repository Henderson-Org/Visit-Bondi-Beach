/**
 * "Because of today's conditions…" - a slim, one-line strip of on-site guides
 * chosen from today's weather/surf (see lib/conditions/recommend.ts). Kept
 * deliberately understated (a strip, not a section) so it doesn't crowd the page.
 *
 * Grounded: recommended links are filtered against real pages (getPage), so a link
 * only shows if the page genuinely exists - no dead ends, no invented suggestions.
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
    <section aria-label="Suggested for today" className="overflow-x-auto border-t border-sand-200">
      <div className="flex items-center gap-x-3 whitespace-nowrap py-3 text-sm">
        <span className="shrink-0 text-ink-500">{rec.message}</span>
        {links.map((l) => (
          <Link
            key={l.path}
            href={l.path}
            className="shrink-0 border-l border-sand-200 pl-3 font-medium text-ocean-700 hover:underline"
          >
            {l.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
