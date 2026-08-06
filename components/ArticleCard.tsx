import Link from 'next/link';
import type { Page } from '@/lib/content';
import { displayTitle } from '@/lib/content';

export function ArticleCard({ page }: { page: Page }) {
  const title = displayTitle(page);
  return (
    <article className="group">
      <Link href={page.path} className="block">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-sand-200">
          {page.heroImage ? (
            // Migration note: Squarespace-hosted original; re-host before launch.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={page.heroImage}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-ocean-500/20 to-sand-200" />
          )}
        </div>
        <h3 className="mt-3 font-display text-lg leading-snug text-ink-900 group-hover:text-ocean-700">
          {title}
        </h3>
      </Link>
      {page.metaDescription && (
        <p className="mt-1 text-sm text-ink-500 line-clamp-2">{page.metaDescription}</p>
      )}
    </article>
  );
}
