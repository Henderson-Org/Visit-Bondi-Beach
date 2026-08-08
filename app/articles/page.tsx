import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialHero } from '@/components/EditorialHero';
import { GuideCard, guideCardFromPage } from '@/components/GuideCard';
import { ArticleList } from '@/components/articles/ArticleList';
import { UpcomingEvents } from '@/components/events/UpcomingEvents';
import { isProduction } from '@/lib/site';
import { breadcrumbJsonLd } from '@/lib/structured-data';
import { featuredArticles } from '@/lib/content';
import { articleFacets, articleTopicsWithCounts, TOPIC_LABEL, TOPIC_SECTION } from '@/lib/articles';

const TITLE = 'Bondi Articles & Guides';
const DESCRIPTION =
  'Bondi Beach articles and guides from local writers — things to do, where to eat, swimming, the coastal walk, getting here and more. Browse every Visit Bondi Beach guide by topic.';
const HERO = '/images/articles/4f6ca1a5ae308e04.webp';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/articles' },
    robots: isProduction() ? undefined : { index: false, follow: true },
    openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', images: HERO },
  };
}

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Articles', path: '/articles' },
];

export default function ArticlesHub() {
  const featured = featuredArticles(6);
  const facets = articleFacets();
  const topics = articleTopicsWithCounts();

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(CRUMBS)) }} />

      <EditorialHero
        image={HERO}
        kicker="Articles"
        title={TITLE}
        intro="Every Bondi guide and story in one place — written by locals. Browse by topic, or dive into the sections below."
        crumbs={CRUMBS}
      />

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 pt-10">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Featured guides</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <GuideCard key={p.path} card={guideCardFromPage(p)} />
          ))}
        </div>
      </section>

      {/* Jump into a section (topic cluster) */}
      <section className="mx-auto max-w-6xl px-4 pt-12">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">Browse by section</h2>
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => {
            const href = TOPIC_SECTION[t.topic];
            const label = `${TOPIC_LABEL[t.topic]} (${t.count})`;
            return href ? (
              <Link key={t.topic} href={href} className="flex items-center justify-between rounded-xl border border-sand-200 bg-white px-4 py-3 text-ink-900 transition hover:border-ocean-500 hover:text-ocean-700">
                <span className="font-medium">{label}</span>
                <span aria-hidden="true" className="text-ocean-600">→</span>
              </Link>
            ) : (
              <div key={t.topic} className="flex items-center justify-between rounded-xl border border-sand-200 bg-white px-4 py-3 text-ink-700">
                <span className="font-medium">{label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Full, filterable index */}
      <section className="mx-auto max-w-4xl px-4 pt-12">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">All articles</h2>
        <p className="mt-2 text-ink-700">Filter by topic to find what you&rsquo;re after.</p>
        <div className="mt-6">
          <ArticleList facets={facets} topics={topics} />
        </div>
      </section>

      {/* Cross-link to events */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-14">
        <UpcomingEvents heading="While you're here — what's on in Bondi" limit={3} />
      </section>
    </div>
  );
}
