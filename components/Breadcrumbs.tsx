import Link from 'next/link';

/** Visible breadcrumb nav (brief §4). The matching BreadcrumbList JSON-LD is emitted by the page. */
export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  if (!items || items.length < 2) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-ink-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={it.path} className="flex items-center gap-1.5">
              {last ? (
                <span aria-current="page" className="text-ink-700 line-clamp-1">{it.name}</span>
              ) : (
                <Link href={it.path} className="inline-flex min-h-[24px] items-center hover:text-ocean-700">{it.name}</Link>
              )}
              {!last && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
