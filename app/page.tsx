import Link from 'next/link';
import Image from 'next/image';
import { featuredArticles } from '@/lib/content';
import { ArticleCard } from '@/components/ArticleCard';
import { WeatherSurfSummary } from '@/components/WeatherSurfSummary';
import { SITE } from '@/lib/site';

const QUICK_LINKS = [
  { label: 'Things to do', href: '/things-to-do-in-bondi' },
  { label: 'Where to swim', href: '/where-to-swim-at-bondi-beach' },
  { label: 'Bondi Rescue', href: '/bondi-rescue' },
  { label: 'Coastal walk', href: '/bondi-coastal-walk' },
  { label: 'With kids', href: '/bondi-with-kids' },
  { label: 'Weather', href: '/bondi-weather' },
  { label: 'Accommodation', href: '/accommodation' },
  { label: "What's on", href: '/bondi-blog' },
];

export default function HomePage() {
  const featured = featuredArticles(9);
  return (
    <>
      <section className="relative isolate flex min-h-[78vh] items-end overflow-hidden">
        <Image
          src="/images/hero-bondi-sunrise.webp"
          alt="Sunrise over Bondi Beach and the Icebergs ocean pool, with swimmers and the North Bondi headland beyond"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        {/* Scrim for legibility over the bright sky/water */}
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900/85 via-ink-900/35 to-ink-900/10"
          aria-hidden="true"
        />
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-28 md:pb-16">
          <p className="text-sand-100 font-medium tracking-wide uppercase text-sm drop-shadow">
            Sydney · Eastern Beaches
          </p>
          <h1 className="mt-3 font-display text-4xl md:text-6xl leading-[1.05] tracking-tight text-white max-w-3xl drop-shadow-md">
            The local&rsquo;s guide to Bondi Beach
          </h1>
          <p className="mt-5 text-lg text-sand-50/95 max-w-prose drop-shadow">{SITE.description}</p>
          <nav aria-label="Quick links" className="mt-7 flex flex-wrap gap-2">
            {QUICK_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm hover:bg-white/20 hover:border-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* Daily Weather & Surf Summary — prominent, high on the page. The card lifts
          over the hero's lower edge. Compact so it doesn't push guides far down. */}
      <section className="relative z-10 mx-auto -mt-12 max-w-3xl px-4 sm:-mt-16">
        <WeatherSurfSummary destination="bondi" />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl md:text-3xl text-ink-900">Popular Bondi guides</h2>
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
