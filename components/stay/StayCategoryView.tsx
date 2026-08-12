import Link from 'next/link';
import { EditorialHero } from '@/components/EditorialHero';
import { Faq } from '@/components/blocks';
import { AccommodationCard } from '@/components/stay/AccommodationCard';
import { ComparisonTable } from '@/components/stay/ComparisonTable';
import { AffiliateDisclosure } from '@/components/stay/AffiliateDisclosure';
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd } from '@/lib/structured-data';
import type { StayCategory } from '@/data/stay-categories';

/**
 * Shared renderer for the Stay category landing pages. One template, unique authored
 * content per category (via data/stay-categories.ts) - so each page is genuinely
 * distinct, not a thin filter clone. Answer-first copy (AEO) → curated cards →
 * comparison → FAQ → internal links.
 */
export function StayCategoryView({ category }: { category: StayCategory }) {
  const properties = category.select();
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Stay', path: '/stay' },
    { name: category.h1, path: `/stay/${category.slug}` },
  ];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(category.faqs)) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd(category.h1, properties.map((p) => ({ name: p.name, description: p.summary })))) }}
      />

      <EditorialHero
        image={category.heroImage}
        kicker={category.heroKicker}
        title={category.h1}
        intro={undefined}
        crumbs={crumbs}
      />

      {/* Answer-first */}
      <section className="mx-auto max-w-3xl px-4 pt-10">
        <p className="text-lg leading-relaxed text-ink-700">{category.answer}</p>
        {category.intro.map((t, i) => (
          <p key={i} className="mt-4 text-ink-700">{t}</p>
        ))}
        <div className="mt-5">
          <AffiliateDisclosure compact />
        </div>
      </section>

      {/* Curated picks */}
      <section className="mx-auto max-w-5xl px-4 pt-10">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Our picks</h2>
        {properties.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <AccommodationCard key={p.slug} property={p} campaign={`cat-${category.slug}`} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-ink-600">We&rsquo;re still adding places here - check the main <Link href="/stay" className="text-ocean-700 underline">Stay guide</Link> in the meantime.</p>
        )}
      </section>

      {/* Comparison */}
      {properties.length > 1 && (
        <section className="mx-auto max-w-5xl px-4 pt-12">
          <h2 className="font-display text-2xl md:text-3xl text-ink-900">Compared</h2>
          <div className="mt-6">
            <ComparisonTable properties={properties} />
          </div>
        </section>
      )}

      {/* FAQ */}
      {category.faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pt-8">
          <Faq items={category.faqs} />
        </section>
      )}

      {/* Related internal links */}
      <section className="mx-auto max-w-5xl px-4 pt-6">
        <h2 className="font-display text-2xl text-ink-900">Keep planning</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {category.related.map((l) => (
            <li key={l.path}><Link href={l.path} className="text-ocean-700 hover:underline">{l.title} →</Link></li>
          ))}
          <li><Link href="/stay" className="text-ocean-700 hover:underline">All places to stay in Bondi →</Link></li>
        </ul>
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-12 pt-10">
        <AffiliateDisclosure />
      </div>
    </div>
  );
}
