import Link from 'next/link';
import type { Page } from '@/lib/content';
import { displayTitle } from '@/lib/content';

/** "Read next" - semantically related guides (brief §43), not random recent posts. */
export function RelatedGuides({ pages }: { pages: Page[] }) {
  if (!pages?.length) return null;
  return (
    <section aria-label="Related guides" className="mt-12 border-t border-sand-200 pt-6">
      <h2 className="font-display text-xl text-ink-900">Read next</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {pages.map((p) => (
          <li key={p.path}>
            <Link
              href={p.path}
              className="block rounded-lg border border-sand-200 bg-white p-4 hover:border-ocean-500"
            >
              <span className="font-medium text-ink-900">{displayTitle(p)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
