import Link from 'next/link';
import Image from 'next/image';
import type { Page } from '@/lib/content';
import { displayTitle } from '@/lib/content';

export function ArticleCard({ page }: { page: Page }) {
  const title = displayTitle(page);
  return (
    <article className="group">
      <Link href={page.path} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-sand-200">
          {page.heroImage ? (
            <Image
              src={page.heroImage}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
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
