import type { Metadata } from 'next';
import Link from 'next/link';
import { venuesInSuburb, byVisitorUsefulness } from '@/lib/fitness';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/structured-data';

export const revalidate = 86400;

const TITLE = 'Bondi Beach or Bondi Junction? Where to Train, and Why It Matters';
const DESC =
  'Bondi Beach and Bondi Junction are two different suburbs 2.5 km apart. What that means for gyms, studios and pools — and how to tell which one a “Bondi” gym is actually in.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: '/fitness/bondi-beach-or-bondi-junction' },
  openGraph: { title: TITLE, description: DESC, type: 'article', url: '/fitness/bondi-beach-or-bondi-junction' },
  twitter: { title: TITLE, description: DESC },
};

const FAQ = [
  {
    q: 'Is Bondi Junction the same as Bondi Beach?',
    a: 'No. They are separate suburbs with separate postcodes — Bondi Beach is 2026, Bondi Junction is 2022 — about 2.5 km apart. Bondi Junction is the inland transport and shopping centre built around the train station and Westfield; Bondi Beach is the beachfront suburb. A business can legitimately have “Bondi” in its name and be in neither.',
  },
  {
    q: 'How far is Bondi Junction from Bondi Beach?',
    a: 'About 2.5 km, which is roughly a 10-minute ride on the 333 or 380 bus down Bondi Road, or a half-hour walk that is uphill on the way back. It is not a distance you would casually cover twice with a gym bag, which is why the suburb matters when you pick a studio.',
  },
  {
    q: 'Which is better for a visitor who wants to train?',
    a: 'Bondi Beach, almost always — the studios are close to where you are staying and to the water, and several publish drop-in classes and single sessions. Bondi Junction is the better answer if you want a large indoor club, want to train in bad weather, or are staying near the station.',
  },
  {
    q: 'Why do Bondi Junction gyms describe themselves as “Bondi”?',
    a: '“Bondi” is the stronger name, so it appears in branding well beyond the beach suburb. It is rarely dishonest — the address is usually published correctly — but listings and aggregators flatten it, which is how people end up booking a class 2.5 km from where they thought. Check the street address, not the business name.',
  },
];

export default function BondiBeachOrJunctionPage() {
  const beach = venuesInSuburb('bondi-beach').sort(byVisitorUsefulness);
  const junction = venuesInSuburb('bondi-junction').sort(byVisitorUsefulness);

  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Fitness & wellness', path: '/fitness' },
    { name: 'Bondi Beach or Bondi Junction?', path: '/fitness/bondi-beach-or-bondi-junction' },
  ];

  const rows: { label: string; beach: string; junction: string }[] = [
    { label: 'What it is', beach: 'The beachfront suburb', junction: 'The inland transport & shopping centre' },
    { label: 'Postcode', beach: 'NSW 2026', junction: 'NSW 2022' },
    { label: 'Typical venue', beach: 'Small studios and boutique gyms', junction: 'Large indoor clubs and chain studios' },
    { label: 'Where they cluster', beach: 'Hall St, Curlewis St, Campbell Pde', junction: 'Oxford St and Westfield' },
    { label: 'Best for', beach: 'Training then swimming; drop-ins while visiting', junction: 'Big facilities, wet weather, staying near the station' },
    { label: 'Getting there', beach: '333/380 bus; parking is the hard part', junction: 'Train and bus interchange on the doorstep' },
    { label: 'Swimming', beach: 'Ocean pools and the surf', junction: 'No ocean pool — indoor facilities only' },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQ)) }} />

      <Breadcrumbs items={crumbs} />

      <header className="mt-2 max-w-prose">
        <h1 className="mt-2 font-display text-3xl leading-tight tracking-tight text-ink-900 md:text-4xl">
          Bondi Beach or Bondi Junction?
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-700">
          This is the single most useful thing to understand before you book a class around here, and the thing
          aggregator listings get wrong most often. Bondi Beach and Bondi Junction are two different suburbs about 2.5 km
          apart, and a gym branded &ldquo;Bondi&rdquo; is frequently in the second one — inside a shopping centre, nowhere
          near the sand.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-700">
          Neither is better. They are built for different things, and if you know which you want, the choice is easy.
        </p>
      </header>

      <section aria-labelledby="side-by-side" className="mt-8">
        <h2 id="side-by-side" className="font-display text-2xl text-ink-900">
          Side by side
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <caption className="sr-only">Bondi Beach compared with Bondi Junction for fitness</caption>
            <thead>
              <tr className="border-b border-sand-300">
                <th scope="col" className="py-2 pr-4 font-medium text-ink-500"> </th>
                <th scope="col" className="py-2 pr-4 font-display text-base text-ink-900">Bondi Beach</th>
                <th scope="col" className="py-2 font-display text-base text-ink-900">Bondi Junction</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-sand-200 align-top">
                  <th scope="row" className="py-3 pr-4 font-medium text-ink-500">{r.label}</th>
                  <td className="py-3 pr-4 text-ink-700">{r.beach}</td>
                  <td className="py-3 text-ink-700">{r.junction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="choose" className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ocean-500/25 bg-ocean-500/5 p-5">
          <h2 id="choose" className="font-display text-xl text-ink-900">Choose Bondi Beach if…</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-700">
            <li>You want to swim before or after you train.</li>
            <li>You are staying near the beach and do not want a bus each way.</li>
            <li>You want a drop-in class rather than a membership.</li>
            <li>You would rather run the coastal walk than a treadmill.</li>
          </ul>
          <p className="mt-4 text-sm text-ink-500">{beach.length} verified venues here.</p>
        </div>
        <div className="rounded-2xl border border-sand-300 bg-sand-50 p-5">
          <h2 className="font-display text-xl text-ink-900">Choose Bondi Junction if…</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-700">
            <li>You want a big gym floor and a full class timetable under one roof.</li>
            <li>It is raining, or the surf is unswimmable.</li>
            <li>You are arriving by train, or combining it with shopping.</li>
            <li>You want sauna and recovery facilities on site.</li>
          </ul>
          <p className="mt-4 text-sm text-ink-500">{junction.length} verified venues here.</p>
        </div>
      </section>

      <section aria-labelledby="lists" className="mt-10">
        <h2 id="lists" className="font-display text-2xl text-ink-900">What is actually in each</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-display text-lg text-ink-900">Bondi Beach — NSW 2026</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {beach.map((v) => (
                <li key={v.id}>
                  <Link href={`/fitness/venues/${v.id}`} className="text-ocean-700 hover:underline">{v.name}</Link>
                  <span className="text-ink-500"> — {v.address}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-display text-lg text-ink-900">Bondi Junction — NSW 2022</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {junction.map((v) => (
                <li key={v.id}>
                  <Link href={`/fitness/venues/${v.id}`} className="text-ocean-700 hover:underline">{v.name}</Link>
                  <span className="text-ink-500"> — {v.address}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="faq" className="mt-12">
        <h2 id="faq" className="font-display text-2xl text-ink-900">Common questions</h2>
        <dl className="mt-5 space-y-5">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-2xl border border-sand-200 bg-white p-5">
              <dt className="font-display text-lg text-ink-900">{f.q}</dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-ink-700">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/fitness" className="text-ocean-700 hover:underline">← All fitness in Bondi</Link>
        {' · '}
        <Link href="/stay/bondi-beach-vs-bondi-junction" className="text-ocean-700 hover:underline">
          The same question for accommodation →
        </Link>
      </p>
    </main>
  );
}
