import Link from 'next/link';
import { SUBURB_LABEL, venuesInSuburb, populatedSuburbs, byVisitorUsefulness } from '@/lib/fitness';

/**
 * "Where these actually are" - the geographic module for the fitness hub.
 *
 * WHY THIS IS NOT A TILE MAP. This site ships no external map tiles anywhere (see
 * components/RouteMap.tsx): no API key, no third-party script, nothing to break, and
 * next.config.mjs blocks remote image hosts outright. A tile map would also fail the
 * requirement that every venue link be crawlable without client-side interaction, since
 * markers only exist once JavaScript runs.
 *
 * So this renders the geography as text and structure: two areas, how far apart they
 * really are, and every venue listed under the suburb it is actually in, each one a real
 * server-rendered link. That is simultaneously the map, the accessible alternative to a
 * map, and the crawlable index - screen reader, search engine and phone all get the same
 * thing. Each venue's own page links out to a map for door-to-door directions.
 */
export function FitnessMap() {
  const suburbs = populatedSuburbs();
  return (
    <section aria-labelledby="fitness-map" className="rounded-2xl border border-sand-200 bg-white p-5 sm:p-6">
      <h2 id="fitness-map" className="font-display text-xl text-ink-900 md:text-2xl">
        Where these actually are
      </h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-700">
        Bondi Beach and Bondi Junction are two separate suburbs about 2.5 km apart — roughly a 10-minute bus ride on the
        333 or 380, or a half-hour walk uphill. Studios in one are not walkable from the other with a gym bag, so the
        suburb on each listing below is the practical fact to check first.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {suburbs.map((s) => {
          const venues = venuesInSuburb(s).sort(byVisitorUsefulness);
          const beachside = s !== 'bondi-junction';
          return (
            <div key={s} className="rounded-xl border border-sand-200 bg-sand-50 p-4">
              <h3 className="font-display text-lg text-ink-900">{SUBURB_LABEL[s]}</h3>
              <p className="mt-0.5 text-xs text-ink-500">
                {beachside ? 'On the coast — walk to the sand' : 'Inland — the transport and shopping centre'}
              </p>
              <ul className="mt-3 space-y-1.5">
                {venues.map((v) => (
                  <li key={v.id} className="text-sm">
                    <Link href={`/fitness/venues/${v.id}`} className="text-ocean-700 hover:underline">
                      {v.name}
                    </Link>
                    <span className="text-ink-500"> — {v.address}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-ink-500">
        Getting between the two:{' '}
        <Link href="/getting-to-bondi" className="text-ocean-700 hover:underline">
          buses, trains and how long it really takes
        </Link>
        .
      </p>
    </section>
  );
}
