import Link from 'next/link';
import { EditorialHero } from '@/components/EditorialHero';
import { QuickFacts, Faq } from '@/components/blocks';
import { LocationMap } from '@/components/location/LocationMap';
import { breadcrumbJsonLd, faqJsonLd, locationPlaceJsonLd } from '@/lib/structured-data';
import { CATEGORY_LABEL, type LocationPageData } from '@/data/locations';

/** Breadcrumb trail: sub-locations sit under Bondi Beach; Bondi Beach sits under Home. */
function crumbsFor(loc: LocationPageData): { name: string; path: string }[] {
  const home = { name: 'Home', path: '/' };
  if (loc.path === '/bondi-beach') return [home, { name: loc.name, path: loc.path }];
  return [home, { name: 'Bondi Beach', path: '/bondi-beach' }, { name: loc.name, path: loc.path }];
}

const MODE_LABEL: Record<string, string> = {
  walk: 'Walk', bus: 'Bus', train: 'Train', drive: 'Driving', parking: 'Parking', rideshare: 'Rideshare',
};

/**
 * Reusable Bondi location / destination page. All content comes from one LocationPageData
 * record (data/locations.ts) — the template renders the sections that record supplies, so
 * new location pages are added by adding data, not code. Answer-first copy, explicit factual
 * headings and location-specific FAQs make it strong for search and AI extraction; JSON-LD
 * (Place/Beach/…, BreadcrumbList, FAQPage) is emitted from the same verified data.
 */
export function LocationPage({ location: loc }: { location: LocationPageData }) {
  const crumbs = crumbsFor(loc);
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(locationPlaceJsonLd({ ...loc, image: loc.heroImage }, loc.path)) }}
      />
      {loc.faqs.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(loc.faqs)) }} />
      )}

      <EditorialHero
        image={loc.heroImage ?? null}
        kicker={CATEGORY_LABEL[loc.category]}
        title={loc.name}
        intro={loc.shortDescription}
        crumbs={crumbs}
        chips={[
          { label: 'Quick facts', href: '#quick-facts' },
          { label: 'What to do', href: '#what-to-do' },
          { label: 'Local tips', href: '#local-tips' },
          { label: 'Getting there', href: '#getting-there' },
          { label: 'Nearby', href: '#nearby' },
          { label: 'FAQ', href: '#faq' },
        ]}
      />

      {/* Quick facts — answer-first, scannable, AI-extractable */}
      <section id="quick-facts" className="mx-auto max-w-3xl px-4 pt-10">
        <QuickFacts items={loc.quickFacts} />
      </section>

      {/* Why visit */}
      <section className="mx-auto max-w-3xl px-4 pt-10">
        <h2 className="font-display text-2xl text-ink-900">Why visit {loc.name}</h2>
        {loc.whyVisit.map((p, i) => (
          <p key={i} className="mt-3 text-lg leading-relaxed text-ink-700">{p}</p>
        ))}
      </section>

      {/* What to do */}
      {loc.activities.length > 0 && (
        <section id="what-to-do" className="mx-auto max-w-5xl px-4 pt-14">
          <h2 className="font-display text-2xl md:text-3xl text-ink-900">What to do at {loc.name}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {loc.activities.map((a) => (
              <li key={a.title} className="rounded-2xl border border-sand-200 bg-white p-5">
                <h3 className="font-display text-lg text-ink-900">{a.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{a.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Local tips — prominent */}
      {loc.localTips.length > 0 && (
        <section id="local-tips" className="mx-auto max-w-3xl px-4 pt-14">
          <div className="rounded-2xl border border-ocean-200 bg-ocean-50/50 p-5 sm:p-6">
            <h2 className="font-display text-2xl text-ink-900">Local tips</h2>
            <ul className="mt-4 space-y-3">
              {loc.localTips.map((t, i) => (
                <li key={i} className="flex gap-3 text-ink-800">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ocean-600" />
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Best time to visit */}
      {loc.bestTime.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pt-14">
          <h2 className="font-display text-2xl text-ink-900">Best time to visit</h2>
          {loc.bestTime.map((p, i) => (
            <p key={i} className="mt-3 leading-relaxed text-ink-700">{p}</p>
          ))}
        </section>
      )}

      {/* Getting there */}
      {loc.gettingThere.length > 0 && (
        <section id="getting-there" className="mx-auto max-w-3xl px-4 pt-14">
          <h2 className="font-display text-2xl text-ink-900">Getting to {loc.name}</h2>
          <dl className="mt-4 divide-y divide-sand-200 border-y border-sand-200">
            {loc.gettingThere.map((g) => (
              <div key={g.mode} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-4">
                <dt className="w-28 shrink-0 text-xs font-semibold uppercase tracking-widest text-ocean-700">{g.label || MODE_LABEL[g.mode]}</dt>
                <dd className="text-sm leading-relaxed text-ink-700">{g.detail}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <LocationMap query={loc.mapQuery} name={loc.name} />
          </div>
        </section>
      )}

      {/* Nearby places */}
      {loc.nearby.length > 0 && (
        <section id="nearby" className="mx-auto max-w-5xl px-4 pt-14">
          <h2 className="font-display text-2xl md:text-3xl text-ink-900">Nearby places worth visiting</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loc.nearby.map((n) => (
              <li key={n.name} className="flex h-full flex-col rounded-2xl border border-sand-200 bg-white p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg text-ink-900">
                    {n.href ? <Link href={n.href} className="hover:text-ocean-700">{n.name}</Link> : n.name}
                  </h3>
                  {n.walk && <span className="shrink-0 text-xs text-ink-500">{n.walk}</span>}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{n.description}</p>
                {n.href && (
                  <span className="mt-auto pt-3 text-sm font-medium text-ocean-700">
                    <Link href={n.href} className="hover:underline">Explore {n.name} →</Link>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Where to eat nearby */}
      {loc.nearbyFood && loc.nearbyFood.links.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pt-14">
          <h2 className="font-display text-2xl text-ink-900">Where to eat nearby</h2>
          <p className="mt-2 text-ink-700">{loc.nearbyFood.intro}</p>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {loc.nearbyFood.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex items-center justify-between rounded-xl border border-sand-200 bg-white px-4 py-3 text-ink-900 transition hover:border-ocean-500 hover:text-ocean-700">
                  <span className="font-medium">{l.title}</span>
                  <span aria-hidden="true" className="text-ocean-600">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ */}
      {loc.faqs.length > 0 && (
        <section id="faq" className="mx-auto max-w-3xl px-4 pt-14">
          <Faq items={loc.faqs} />
        </section>
      )}

      {/* Related guides */}
      {loc.relatedGuides.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-14 pt-14">
          <h2 className="font-display text-2xl text-ink-900">Related Bondi guides</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {loc.relatedGuides.map((g) => (
              <li key={g.href}>
                <Link href={g.href} className="text-ocean-700 hover:underline">{g.title} →</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Provenance — sources + last reviewed (integrity, mirrors article bodies) */}
      {loc.sources.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-16">
          <details className="rounded-xl border border-sand-200 bg-white p-4 text-sm">
            <summary className="cursor-pointer font-medium text-ink-800">Sources &amp; last reviewed ({loc.lastReviewed})</summary>
            <ul className="mt-3 space-y-1 text-ink-600">
              {loc.sources.map((s) => (
                <li key={s.url} className="truncate">
                  <a href={s.url} target="_blank" rel="noopener nofollow" className="text-ocean-700 hover:underline">{s.label}</a>
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </div>
  );
}
