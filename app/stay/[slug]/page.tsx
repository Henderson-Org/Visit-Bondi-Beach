import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditorialHero } from '@/components/EditorialHero';
import { Faq } from '@/components/blocks';
import { AccommodationCard } from '@/components/stay/AccommodationCard';
import { AffiliateButton } from '@/components/stay/AffiliateButton';
import { AffiliateDisclosure } from '@/components/stay/AffiliateDisclosure';
import { AtAGlance } from '@/components/stay/AtAGlance';
import { VbbRating } from '@/components/stay/VbbRating';
import { PriceBadge } from '@/components/stay/primitives';
import { isProduction, AUTHOR } from '@/lib/site';
import { bookingLinkFor } from '@/lib/stay';
import {
  breadcrumbJsonLd,
  faqJsonLd,
  lodgingBusinessJsonLd,
} from '@/lib/structured-data';
import { siteOrigin, SITE } from '@/lib/site';
import { getProperty, getArea, STAY_TYPE_LABEL, type Property } from '@/data/accommodation';
import { getGuide, guideSlugs, overallScore, type PropertyGuide } from '@/data/accommodation-guides';

export const dynamicParams = false;
export const revalidate = 86400;

export function generateStaticParams() {
  return guideSlugs().map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProperty(slug);
  const g = getGuide(slug);
  if (!p || !g) return { title: 'Page not found' };
  const title = `${p.name} - Review & Guide`;
  return {
    title,
    description: g.verdict,
    alternates: { canonical: `/stay/${slug}` },
    robots: isProduction() ? undefined : { index: false, follow: true },
    openGraph: { title, description: g.verdict, type: 'article' },
  };
}

function articleReviewJsonLd(p: Property, g: PropertyGuide, path: string) {
  const url = `${siteOrigin()}${path}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${p.name} - Review & Guide`,
    description: g.verdict,
    url,
    mainEntityOfPage: url,
    author: { '@type': AUTHOR.type, name: AUTHOR.name, url: AUTHOR.url },
    publisher: { '@type': 'Organization', name: SITE.name, url: siteOrigin() },
    dateModified: p.lastReviewed,
    about: p.name,
  };
}

function ProsCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="rounded-xl border border-sand-200 bg-white p-5">
        <h3 className="font-display text-lg text-ink-900">The good</h3>
        <ul className="mt-3 space-y-2 text-sm text-ink-700">
          {pros.map((t) => (
            <li key={t} className="flex gap-2"><span aria-hidden="true" className="text-ocean-600">+</span>{t}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-sand-200 bg-white p-5">
        <h3 className="font-display text-lg text-ink-900">Worth knowing</h3>
        <ul className="mt-3 space-y-2 text-sm text-ink-700">
          {cons.map((t) => (
            <li key={t} className="flex gap-2"><span aria-hidden="true" className="text-ink-400">–</span>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-8">
      <h2 className="font-display text-2xl text-ink-900">{title}</h2>
      <div className="mt-3 space-y-3 text-ink-700">{children}</div>
    </section>
  );
}

export default async function PropertyGuidePage({ params }: Props) {
  const { slug } = await params;
  const property = getProperty(slug);
  const guide = getGuide(slug);
  if (!property || !guide) notFound();

  const area = getArea(property.area);
  const path = `/stay/${slug}`;
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Stay', path: '/stay' },
    { name: property.name, path },
  ];
  const booking = bookingLinkFor(property, `guide-${slug}`);
  const overall = overallScore(guide.scores);
  const alsoConsider = guide.alsoConsider.map(getProperty).filter(Boolean) as Property[];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(lodgingBusinessJsonLd(property, path)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleReviewJsonLd(property, guide, path)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(guide.faqs)) }} />

      <EditorialHero
        image={property.image ?? null}
        kicker={`${STAY_TYPE_LABEL[property.type]}${area ? ` · ${area.name}` : ''}`}
        title={property.name}
        intro={guide.verdict}
        crumbs={crumbs}
      />

      {/* Key facts + CTA bar */}
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-700">
          <span><span className="text-ink-500">Type </span>{STAY_TYPE_LABEL[property.type]}</span>
          <span className="border-l border-sand-200 pl-5"><span className="text-ink-500">Beach </span>{property.walkText}</span>
          <span className="border-l border-sand-200 pl-5"><span className="text-ink-500">Price </span><PriceBadge band={property.priceBand} /></span>
          {area && <span className="border-l border-sand-200 pl-5"><span className="text-ink-500">Area </span>{area.name}</span>}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {property.officialUrl && (
            <a
              href={property.officialUrl}
              target="_blank"
              rel="nofollow noopener"
              className="inline-flex items-center gap-1.5 rounded-lg bg-ocean-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-ocean-700"
            >
              Visit hotel website <span aria-hidden="true">↗</span>
            </a>
          )}
          <AffiliateButton
            href={booking.href}
            label={booking.label}
            cta={property.officialUrl ? 'Check prices' : 'Check availability & prices'}
            provider={booking.provider}
            propertyName={property.name}
            propertySlug={property.slug}
            page={`guide-${slug}`}
            placement="guide-hero"
            variant={property.officialUrl ? 'outline' : 'solid'}
          />
        </div>
        <p className="mt-2 text-xs text-ink-500">External links open on the provider&rsquo;s site - you&rsquo;re leaving Visit Bondi Beach.</p>

        <p className="mt-6 text-lg leading-relaxed text-ink-700">{guide.intro}</p>
      </div>

      {/* Rating + at a glance */}
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <VbbRating scores={guide.scores} overall={overall} />
          <div>
            <h2 className="font-display text-xl text-ink-900">At a glance</h2>
            <div className="mt-4">
              <AtAGlance property={property} transport={area?.name === 'Bondi Junction' ? 'Train + bus' : 'Buses to the beach'} />
            </div>
          </div>
        </div>
      </div>

      {/* Editorial body */}
      <div className="mx-auto max-w-3xl px-4">
        <Section title="Why stay here?">
          {guide.whyStay.map((t, i) => <p key={i}>{t}</p>)}
        </Section>

        <Section title="Who is it best for?">
          <p>{guide.bestForProse}</p>
        </Section>

        <Section title="What is the location really like?">
          {guide.location.map((t, i) => <p key={i}>{t}</p>)}
        </Section>

        <Section title="How far is it from Bondi Beach?">
          <p className="font-medium text-ink-900">{guide.beachDistance}</p>
        </Section>

        <Section title="Is it good for families?">
          <p>{guide.family}</p>
        </Section>

        <Section title="What’s nearby?">
          <ul className="list-disc space-y-1 pl-5">
            {guide.nearby.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </Section>

        <Section title="Getting there">
          <p><span className="font-medium text-ink-900">From Sydney Airport: </span>{guide.fromAirport}</p>
          <p><span className="font-medium text-ink-900">Into the Sydney CBD: </span>{guide.toCbd}</p>
        </Section>

        <div className="pt-8">
          <h2 className="font-display text-2xl text-ink-900">Pros &amp; cons</h2>
          <div className="mt-4"><ProsCons pros={guide.pros} cons={guide.cons} /></div>
        </div>

        <div className="pt-8">
          <Faq items={guide.faqs} />
        </div>

        {/* Topic-cluster internal links */}
        <section className="pt-2">
          <h2 className="font-display text-2xl text-ink-900">Plan the rest of your trip</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {guide.relatedLinks.map((l) => (
              <li key={l.path}><Link href={l.path} className="text-ocean-700 hover:underline">{l.title} →</Link></li>
            ))}
          </ul>
        </section>

        <p className="mt-8 border-t border-sand-200 pt-4 text-sm text-ink-500">
          Last reviewed{' '}
          <time dateTime={property.lastReviewed}>
            {new Date(property.lastReviewed).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </time>
          . We keep prices and availability off the page on purpose - check the booking links for today&rsquo;s rates.
        </p>
      </div>

      {/* Also consider */}
      {alsoConsider.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 pt-12">
          <h2 className="font-display text-2xl text-ink-900">Other places worth considering</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {alsoConsider.map((p) => (
              <AccommodationCard key={p.slug} property={p} campaign={`guide-${slug}-alt`} />
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-5xl px-4 pb-12 pt-10">
        <AffiliateDisclosure />
      </div>
    </div>
  );
}
