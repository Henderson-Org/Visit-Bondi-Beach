import Link from 'next/link';
import { NAV } from '@/lib/site';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="font-display text-6xl text-ocean-600">404</p>
      <h1 className="mt-4 font-display text-3xl text-ink-900">This page took a swim</h1>
      <p className="mt-3 text-ink-700">
        We couldn&rsquo;t find that page. Try one of these instead:
      </p>
      <nav aria-label="Helpful links" className="mt-6 flex flex-wrap justify-center gap-2">
        {NAV.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className="rounded-full border border-sand-300 bg-white px-4 py-2 text-sm text-ink-700 hover:border-ocean-500 hover:text-ocean-700"
          >
            {i.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
