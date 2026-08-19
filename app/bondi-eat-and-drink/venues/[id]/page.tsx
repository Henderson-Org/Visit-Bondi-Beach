import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditorialHero } from '@/components/EditorialHero';
import { RestaurantCard } from '@/components/eat/RestaurantCard';
import { isProduction, seoTitle } from '@/lib/site';
import { breadcrumbJsonLd, restaurantJsonLd } from '@/lib/structured-data';
import { getRestaurant, PRICE_LABEL, PRECINCT_LABEL, VENUE_TYPE_LABEL } from '@/data/restaurants';
import {
  venuesWithPages,
  hasVenuePage,
  outboundLink,
  restaurants,
  venueTypeInPrecinct,
  bookingStatus,
  establishedYear,
  MEAL_LABEL,
  SUITABILITY_LABEL,
  ATTRIBUTE_LABEL,
  DIETARY_LABEL,
} from '@/lib/restaurantGuide';

export const dynamicParams = false;
export const revalidate = 86400;

const HERO = '/images/articles/e7f1fa0c61315488.webp';

export function generateStaticParams() {
  return venuesWithPages().map((r) => ({ id: r.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const r = getRestaurant(id);
  if (!r || !hasVenuePage(r)) return { title: 'Page not found' };
  const title = `${r.name} - ${venueTypeInPrecinct(r)}`;
  const description =
    r.summary.length > 155 ? `${r.summary.slice(0, 152).trimEnd()}…` : r.summary;
  return {
    // seoTitle() measures the FULL rendered title (this + the layout's brand suffix).
    // Testing `title.length > 60` here missed the 20-char suffix, so venue titles were
    // rendering at 61-80 chars and truncating the precinct/type words in the SERP.
    // A handful of venue names are long enough that even "<name> - <type> in <precinct>"
    // overflows on its own, so fall back to the name plus a plain locality.
    title: title.length > 60 ? { absolute: `${r.name}, Bondi Beach` } : seoTitle(title),
    description,
    alternates: { canonical: `/bondi-eat-and-drink/venues/${id}` },
    robots: isProduction() ? undefined : { index: false, follow: true },
    openGraph: { title: r.name, description, type: 'website', images: HERO },
  };
}

const CAP = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function VenuePage({ params }: Props) {
  const { id } = await params;
  const venue = getRestaurant(id);
  if (!venue || !hasVenuePage(venue)) notFound();

  const path = `/bondi-eat-and-drink/venues/${id}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Eat & Drink', path: '/bondi-eat-and-drink' },
    { name: venue.name, path },
  ];
  const out = outboundLink(venue);
  const cuisines = venue.cuisines.filter((c) => c && c !== '-');

  // "More like this" - same precinct first, then same type, excluding self.
  const related = restaurants()
    .filter((r) => r.id !== venue.id && hasVenuePage(r) && (r.precinct === venue.precinct || r.type === venue.type))
    .sort(
      (a, b) =>
        Number(b.precinct === venue.precinct) - Number(a.precinct === venue.precinct) ||
        (b.score ?? 0) - (a.score ?? 0),
    )
    .slice(0, 3);

  const facts: { label: string; value: string }[] = [
    { label: 'Type', value: VENUE_TYPE_LABEL[venue.type] },
    { label: 'Area', value: PRECINCT_LABEL[venue.precinct] },
    { label: 'Price', value: `${PRICE_LABEL[venue.priceBand]} (${'$'.repeat(venue.priceBand)})` },
  ];
  if (cuisines.length) facts.push({ label: 'Cuisine', value: cuisines.join(', ') });
  if (venue.meals.length) facts.push({ label: 'Good for', value: venue.meals.map((m) => MEAL_LABEL[m]).join(', ') });
  if (venue.street) facts.push({ label: 'Where', value: venue.street });
  const booking = bookingStatus(venue);
  if (booking !== 'unknown') facts.push({ label: 'Bookings', value: booking === 'reservations' ? 'Takes reservations' : 'Walk-ins' });
  const since = establishedYear(venue);
  if (since) facts.push({ label: 'Serving Bondi since', value: String(since) });

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            restaurantJsonLd(
              {
                name: venue.name,
                type: venue.type,
                cuisines: venue.cuisines,
                priceBand: venue.priceBand,
                precinctLabel: PRECINCT_LABEL[venue.precinct],
                address: venue.address,
                website: venue.website,
                bookingUrl: venue.bookingUrl,
                instagram: venue.instagram,
                menuUrl: venue.menuUrl,
                summary: venue.summary,
                // No `image`: the shared editorial hero is decorative and is NOT a photo of
                // this specific venue. Asserting it as the venue's schema image would claim a
                // picture we don't have (integrity rule). Only pass a venue-specific image.
              },
              path,
            ),
          ),
        }}
      />

      <EditorialHero
        image={HERO}
        kicker={venueTypeInPrecinct(venue)}
        title={venue.name}
        intro={venue.summary}
        crumbs={crumbs}
      />

      <div className="mx-auto max-w-3xl px-4 py-10">
        {venue.formerName && (
          <p className="mb-4 text-sm text-ink-500">Formerly {venue.formerName}.</p>
        )}

        {/* Quick facts */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-sand-200 bg-sand-50/60 p-5 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-semibold uppercase tracking-widest text-ink-500">{f.label}</dt>
              <dd className="mt-0.5 text-sm text-ink-900">{f.value}</dd>
            </div>
          ))}
        </dl>

        {/* CTA row */}
        {(out || venue.bookingUrl) && (
          <div className="mt-5 flex flex-wrap gap-3">
            {venue.bookingUrl && (
              <a href={venue.bookingUrl} target="_blank" rel="noopener nofollow" className="rounded-full bg-ocean-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ocean-700">
                Book a table ↗
              </a>
            )}
            {out && out.href !== venue.bookingUrl && (
              <a href={out.href} target="_blank" rel="noopener nofollow" className="rounded-full border border-sand-300 bg-white px-5 py-2.5 text-sm font-medium text-ink-800 transition hover:border-ocean-500 hover:text-ocean-700">
                {out.label} ↗
              </a>
            )}
            {venue.menuUrl && venue.menuUrl !== out?.href && (
              <a href={venue.menuUrl} target="_blank" rel="noopener nofollow" className="rounded-full border border-sand-300 bg-white px-5 py-2.5 text-sm font-medium text-ink-800 transition hover:border-ocean-500 hover:text-ocean-700">
                View menu ↗
              </a>
            )}
          </div>
        )}

        {/* Editorial */}
        <div className="mt-8 space-y-5 text-ink-800">
          {venue.whyGo && (
            <section>
              <h2 className="font-display text-2xl text-ink-900">Why we&rsquo;d go</h2>
              <p className="mt-2 leading-relaxed">{venue.whyGo}</p>
            </section>
          )}
          {venue.whatToOrder && (
            <section>
              <h2 className="font-display text-xl text-ink-900">What to order</h2>
              <p className="mt-2 leading-relaxed">{venue.whatToOrder}</p>
            </section>
          )}
          {venue.atmosphere && (
            <section>
              <h2 className="font-display text-xl text-ink-900">The atmosphere</h2>
              <p className="mt-2 leading-relaxed">{venue.atmosphere}</p>
            </section>
          )}
          {venue.localTip && (
            <div className="rounded-xl border-l-4 border-ocean-500 bg-sand-50 py-3 pl-4 pr-3">
              <p className="text-sm"><span className="font-semibold text-ink-900">Local tip:</span> {venue.localTip}</p>
            </div>
          )}
          {venue.tradeOff && (
            <p className="text-sm text-ink-600"><span className="font-semibold text-ink-900">Worth knowing:</span> {venue.tradeOff}</p>
          )}
        </div>

        {/* Good to know chips */}
        {(venue.suitability.length > 0 || venue.attributes.length > 0 || venue.dietary.length > 0) && (
          <div className="mt-8 border-t border-sand-200 pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-500">Good to know</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {venue.suitability.map((s) => (
                <span key={s} className="rounded-full bg-sand-100 px-3 py-1 text-xs text-ink-700">{SUITABILITY_LABEL[s]}</span>
              ))}
              {venue.attributes.map((a) => (
                <span key={a} className="rounded-full bg-sand-100 px-3 py-1 text-xs text-ink-700">{ATTRIBUTE_LABEL[a]}</span>
              ))}
              {venue.dietary.map((d) => (
                <span key={d} className="rounded-full bg-ocean-50 px-3 py-1 text-xs text-ocean-800 ring-1 ring-ocean-500/20">{DIETARY_LABEL[d]}</span>
              ))}
            </div>
          </div>
        )}

        {/* Sources / verification (integrity) */}
        {venue.sources.length > 0 && (
          <details className="mt-8 rounded-xl border border-sand-200 bg-white p-4 text-sm">
            <summary className="cursor-pointer font-medium text-ink-800">
              How we verified this ({CAP(venue.confidence)} confidence · checked {venue.lastVerifiedAt})
            </summary>
            <ul className="mt-3 space-y-1 text-ink-600">
              {venue.sources.slice(0, 6).map((s) => (
                <li key={s} className="truncate">
                  <a href={s} target="_blank" rel="noopener nofollow" className="text-ocean-700 hover:underline">{s}</a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-500">
              {since && since <= 2016
                ? `A long-running Bondi fixture (serving since ${since}), so it's a safe bet - but hours and menus still change, so check the venue's own site for today's trading.`
                : "We confirm each venue is currently trading; hours, prices and menus still change, so check the venue's own site for those before you go."}
            </p>
          </details>
        )}
      </div>

      {/* More like this */}
      {related.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pb-14">
          <h2 className="font-display text-2xl text-ink-900">More like this</h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}><RestaurantCard venue={r} /></li>
            ))}
          </ul>
          <p className="mt-6 text-sm">
            <Link href="/bondi-eat-and-drink" className="text-ocean-700 hover:underline">← All Bondi restaurants, cafés &amp; bars</Link>
          </p>
        </section>
      )}
    </div>
  );
}
