import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { featuredArticles } from '@/lib/content';
import { GuideCard, guideCardFromPage } from '@/components/GuideCard';
import { WeatherSurfSummary } from '@/components/WeatherSurfSummary';
import { SurfCam } from '@/components/SurfCam';
import { TodayRecommendations } from '@/components/TodayRecommendations';
import { UpcomingEvents } from '@/components/events/UpcomingEvents';
import { DayPlannerPromo } from '@/components/DayPlannerPromo';
import { SITE, HUB_NAV } from '@/lib/site';
import { bondiPlaceJsonLd } from '@/lib/structured-data';

// First-timer "plan your visit" path — the highest-intent visitor question ("I'm coming
// to Bondi, now what?"), routed to the four hubs that answer it, then the day planner.
const PLAN_TILES = [
  { q: 'How long to spend?', href: '/itineraries', sub: 'Itineraries for a few hours to a weekend' },
  { q: 'When to go?', href: '/bondi-weather', sub: 'Weather, seasons & sea temperatures' },
  { q: 'How to get here?', href: '/getting-to-bondi', sub: 'Train, bus, driving & parking' },
  { q: 'Where to stay?', href: '/stay', sub: 'Hotels, apartments & hostels' },
];

const META_TITLE = 'Bondi Beach Sydney: Experience It Like You Live Here';
const META_DESCRIPTION =
  'Discover Bondi Beach like a local. Where to swim, eat and walk, what to see, and the local tips worth knowing before you visit Sydney’s most famous beach.';

export const metadata: Metadata = {
  // Absolute title so the homepage uses this verbatim instead of the site-name template.
  title: { absolute: META_TITLE },
  description: META_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { title: META_TITLE, description: META_DESCRIPTION, type: 'website' },
  twitter: { title: META_TITLE, description: META_DESCRIPTION },
};

const QUICK_LINKS = [
  { label: 'Things to do', href: '/things-to-do-in-bondi' },
  { label: 'Where to swim', href: '/where-to-swim-at-bondi-beach' },
  { label: 'Bondi Rescue', href: '/bondi-rescue' },
  { label: 'Coastal walk', href: '/bondi-coastal-walk' },
  { label: 'With kids', href: '/bondi-with-kids' },
  { label: 'Weather', href: '/bondi-weather' },
  { label: 'Where to stay', href: '/stay' },
  { label: "What's on", href: '/whats-on' },
  { label: 'Plan your day', href: '/plan' },
];

export default function HomePage() {
  const featured = featuredArticles(9);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bondiPlaceJsonLd()) }}
      />
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
          <h1 className="mt-3 font-display text-4xl md:text-6xl leading-[1.05] tracking-tight text-white max-w-4xl drop-shadow-md">
            Bondi Beach Like You Live Here: The Best of Sydney&rsquo;s Most Famous Beach
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

      {/* Daily Weather & Surf Summary — a slim, unobtrusive bar (scrolls sideways on
          mobile). The full forecast lives on the /bondi-weather hub. */}
      <WeatherSurfSummary destination="bondi" variant="bar" />

      {/* "Start here" — the visual front door to every topic hub, so the homepage is a
          gateway to the whole guide rather than only a feed of recent articles. */}
      <section className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Start here</h2>
        <p className="mt-1 text-ink-500">Everything you need to visit Bondi, by topic.</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HUB_NAV.map((col) => (
            <div key={col.group} className="rounded-2xl border border-sand-200 bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-ocean-700">{col.group}</h3>
              <ul className="mt-3 space-y-2">
                {col.items.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} className="text-ink-800 hover:text-ocean-700">
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* "Plan your visit" band — the first-timer conversion path into the day planner. */}
      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="rounded-2xl bg-ocean-500/5 border border-ocean-500/15 p-6 md:p-8">
          <h2 className="font-display text-2xl md:text-3xl text-ink-900">Planning your visit?</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_TILES.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className="rounded-xl border border-sand-200 bg-white p-4 transition hover:border-ocean-500"
              >
                <p className="font-medium text-ink-900">{t.q}</p>
                <p className="mt-1 text-sm text-ink-500">{t.sub}</p>
              </Link>
            ))}
          </div>
          <Link
            href="/plan"
            className="mt-5 inline-block rounded-full bg-ocean-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-ocean-700"
          >
            Build my Bondi day →
          </Link>
        </div>
      </section>

      {/* Day Planner — a prominent product entry point, directly under the hero and
          above the articles. One of the most prominent homepage modules. */}
      <div className="pt-8">
        <DayPlannerPromo variant="homepage" placement="homepage" />
      </div>

      {/* Live surf cam — a genuinely useful live feature, pairing with the conditions bar
          above. Embedded iframe (North Bondi SLSC's own public camera). */}
      <div className="pt-10">
        <SurfCam />
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-8 pt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl md:text-3xl text-ink-900">Popular Bondi guides</h2>
          <Link href="/articles" className="text-sm text-ocean-700 hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <GuideCard key={p.path} card={guideCardFromPage(p)} />
          ))}
        </div>
      </section>

      {/* What's on — surface current events on the homepage (date-aware; renders
          nothing if there's nothing on). */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <UpcomingEvents heading="What's on in Bondi" limit={3} />
      </section>

      {/* Conditions-driven suggestions — kept below the main guides so it doesn't
          crowd the top of the page. */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <TodayRecommendations destination="bondi" />
      </section>
    </>
  );
}
