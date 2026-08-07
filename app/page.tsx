import Link from 'next/link';
import { recentArticles } from '@/lib/content';
import { ArticleCard } from '@/components/ArticleCard';
import { SITE } from '@/lib/site';

const QUICK_LINKS = [
  { label: 'Where to swim', href: '/where-to-swim-at-bondi-beach' },
  { label: 'Bondi Icebergs', href: '/bondi-icebergs' },
  { label: 'Bondi Rescue', href: '/bondi-rescue' },
  { label: 'Accommodation', href: '/accommodation' },
  { label: 'Tours', href: '/tours' },
  { label: "What's on", href: '/bondi-blog' },
];

export default function HomePage() {
  const featured = recentArticles(9);
  return (
    <>
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-10 md:pt-20 md:pb-14">
          <p className="text-ocean-600 font-medium tracking-wide uppercase text-sm">
            Sydney · Eastern Beaches
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-6xl leading-[1.05] tracking-tight text-ink-900 max-w-3xl">
            The local&rsquo;s guide to Bondi Beach
          </h1>
          <p className="mt-5 text-lg text-ink-700 max-w-prose">{SITE.description}</p>
          <nav aria-label="Quick links" className="mt-7 flex flex-wrap gap-2">
            {QUICK_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full border border-sand-300 bg-white px-4 py-2 text-sm text-ink-700 hover:border-ocean-500 hover:text-ocean-700"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl md:text-3xl text-ink-900">Latest from Bondi</h2>
          <Link href="/bondi-blog" className="text-sm text-ocean-700 hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-6 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <ArticleCard key={p.path} page={p} />
          ))}
        </div>
      </section>
    </>
  );
}
