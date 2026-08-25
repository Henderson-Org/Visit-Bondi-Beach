import Link from 'next/link';
import { NAV } from '@/lib/site';

const TOP_GUIDES = [
  { label: 'Ultimate Bondi Beach travel guide', href: '/bondi-blog/what-to-do-bondi-beach-travel-guide' },
  { label: 'Getting to Bondi from the airport', href: '/bondi-blog/getting-from-sydney-airport-to-bondi-beach' },
  { label: 'Where to swim at Bondi', href: '/where-to-swim-at-bondi-beach' },
  { label: 'Bondi Icebergs guide', href: '/bondi-icebergs' },
  { label: 'Bondi to Bronte coastal walk', href: '/bondi-blog/2023/9/21/walking-on-sunshine-the-ultimate-guide-to-the-bondi-to-bronte-coastal-walk' },
  { label: 'Bondi parking guide', href: '/bondi-blog/where-to-find-carpark-bondi-beach' },
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="font-display text-6xl text-ocean-600">404</p>
      <h1 className="mt-4 font-display text-3xl text-ink-900">This page took a swim</h1>
      <p className="mt-3 text-ink-700">
        We couldn&rsquo;t find that page. It may have moved during our site upgrade. Try a
        popular guide below, or start from a main section.
      </p>

      <h2 className="mt-8 text-sm uppercase tracking-wide text-ink-500">Popular guides</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {TOP_GUIDES.map((g) => (
          <li key={g.href}>
            <Link href={g.href} className="block rounded-lg border border-sand-200 bg-white p-3 text-sm text-ink-800 hover:border-ocean-500">
              {g.label}
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-sm uppercase tracking-wide text-ink-500">Sections</h2>
      <nav aria-label="Main sections" className="mt-3 flex flex-wrap gap-2">
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
