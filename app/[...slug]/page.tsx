import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  allContentPaths,
  getPage,
  getPageBySegments,
  displayTitle,
  recentArticles,
  relatedPages,
  breadcrumbs,
  articles,
  categories,
  faqItems,
  type Page,
} from '@/lib/content';
import { isProduction, AUTHOR } from '@/lib/site';
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from '@/lib/structured-data';
import { getCorePageHub } from '@/lib/hubs';
import { ArticleCard } from '@/components/ArticleCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RelatedGuides } from '@/components/RelatedGuides';
import { AdSlot } from '@/components/AdSlot';
import { BodyBlocks } from '@/components/BodyBlocks';
import { HubView } from '@/components/HubView';
import { EditorialHero } from '@/components/EditorialHero';
import { GuideCard, excerptFor } from '@/components/GuideCard';

export const dynamicParams = true;

// Statically generate all clean paths. Percent/plus-encoded slugs (a handful of
// category/tag archives) are resolved on demand to avoid build-time encoding issues.
export function generateStaticParams() {
  return allContentPaths()
    .filter((p) => !/[%+]/.test(p))
    .map((p) => ({ slug: p.split('/').filter(Boolean) }));
}

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySegments(slug);
  if (!page) return { title: 'Page not found' };
  const title = page.title
    ? page.title.replace(/\s*[—-]\s*Visit Bondi Beach\s*$/i, '').trim()
    : displayTitle(page);
  const indexable = page.indexable && isProduction();
  return {
    title,
    description: page.metaDescription || undefined,
    alternates: { canonical: page.path },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description: page.metaDescription || undefined,
      type: page.section === 'blog' ? 'article' : 'website',
      images: page.ogImage || page.heroImage || undefined,
    },
  };
}

export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params;
  const page = getPageBySegments(slug);
  if (!page) notFound();

  switch (page.contentType) {
    case 'blog-index':
      return <BlogIndex />;
    case 'hub':
      return <HubView page={page} />;
    case 'category':
    case 'tag':
      return <ArchivePage page={page} />;
    default:
      return getCorePageHub(page.path) ? <CorePageHubView page={page} /> : <ArticlePage page={page} />;
  }
}

function MigrationNote({ page }: { page: Page }) {
  return (
    <p className="mt-8 rounded-lg border border-sand-200 bg-sand-100 px-4 py-3 text-sm text-ink-500">
      This page is being migrated from Squarespace. The full article is available on the{' '}
      <a href={page.liveUrl} className="text-ocean-700 underline">
        current live site
      </a>{' '}
      while the content import completes.
    </p>
  );
}

/**
 * Hub-styled core page (Swim, Stay): editorial hero + curated "explore" cards,
 * while keeping the page's existing body content (so no crawlable SEO copy is lost).
 */
function CorePageHubView({ page }: { page: Page }) {
  const coreHub = getCorePageHub(page.path)!;
  const crumbs = breadcrumbs(page);
  const title = displayTitle(page);
  const faqs = faqItems(page);
  const cards = coreHub.explore.links.map((l) => {
    const target = getPage(l.path);
    return { title: l.title, href: l.path, image: target?.heroImage || null, excerpt: excerptFor(target) };
  });
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
      />
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
        />
      )}
      <EditorialHero
        image={coreHub.heroImage}
        kicker={coreHub.kicker}
        title={title}
        intro={coreHub.intro}
        crumbs={crumbs}
      />
      {page.blocks && page.blocks.length > 0 && (
        <div className="mx-auto max-w-3xl px-4 pt-10">
          <BodyBlocks blocks={page.blocks} />
          {page.authoredBody && (page.lastReviewed || (page.sources && page.sources.length > 0)) && (
            <footer className="mt-8 border-t border-sand-200 pt-4 text-sm text-ink-500">
              {page.lastReviewed && (
                <p>
                  Last reviewed{' '}
                  <time dateTime={page.lastReviewed}>
                    {new Date(page.lastReviewed).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                  .
                </p>
              )}
              {page.sources && page.sources.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-ink-700">Sources</p>
                  <ul className="mt-1 list-disc pl-5">
                    {page.sources.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} className="text-ocean-700 underline" rel="nofollow noopener" target="_blank">
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </footer>
          )}
        </div>
      )}
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">{coreHub.explore.heading}</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <GuideCard key={c.href} card={c} />
          ))}
        </div>
        <RelatedGuides pages={relatedPages(page)} />
      </div>
    </div>
  );
}

function ArticlePage({ page }: { page: Page }) {
  const title = displayTitle(page);
  const crumbs = breadcrumbs(page);
  const isArticle = page.section === 'blog';
  // FAQPage schema is emitted only when the same Q&As are visibly rendered on the
  // page (i.e. an authored body includes a `faq` block).
  const faqs = faqItems(page);
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      {isArticle && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(page)) }}
        />
      )}
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-2 font-display text-3xl md:text-4xl leading-tight tracking-tight text-ink-900">
        {title}
      </h1>
      {isArticle && (
        <p className="mt-2 text-sm text-ink-500">
          By {AUTHOR.name}
          {page.publishedAt && (
            <>
              {' · '}
              <time dateTime={page.publishedAt}>
                {new Date(page.publishedAt).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            </>
          )}
          {page.lastmod && page.lastmod !== page.publishedAt && (
            <>
              {' · Updated '}
              <time dateTime={page.lastmod}>
                {new Date(page.lastmod).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            </>
          )}
        </p>
      )}
      {page.heroImage && (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-sand-200">
          <Image
            src={page.heroImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            priority
            className="object-cover"
          />
        </div>
      )}
      {page.blocks && page.blocks.length > 0 ? (
        <>
          <BodyBlocks blocks={page.blocks.slice(0, 3)} />
          {isArticle && <AdSlot slot={process.env.NEXT_PUBLIC_AD_SLOT_INARTICLE} />}
          <BodyBlocks blocks={page.blocks.slice(3)} />
        </>
      ) : (
        <div className="prose-editorial mt-6">
          {page.intro && <p className="text-lg text-ink-700">{page.intro}</p>}
          {isArticle && <AdSlot slot={process.env.NEXT_PUBLIC_AD_SLOT_INARTICLE} />}
          {page.headings.length > 0 && (
            <>
              <h2>In this guide</h2>
              <ul>
                {page.headings.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
      {page.authoredBody && (page.lastReviewed || (page.sources && page.sources.length > 0)) && (
        <footer className="mt-8 border-t border-sand-200 pt-4 text-sm text-ink-500">
          {page.lastReviewed && (
            <p>
              Last reviewed{' '}
              <time dateTime={page.lastReviewed}>
                {new Date(page.lastReviewed).toLocaleDateString('en-AU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
              .
            </p>
          )}
          {page.sources && page.sources.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-ink-700">Sources</p>
              <ul className="mt-1 list-disc pl-5">
                {page.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} className="text-ocean-700 underline" rel="nofollow noopener" target="_blank">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </footer>
      )}
      {isArticle && (
        <aside className="mt-10 rounded-xl border border-sand-200 bg-sand-100 p-4">
          <p className="text-sm font-semibold text-ink-900">{AUTHOR.name}</p>
          <p className="mt-1 text-sm text-ink-500">{AUTHOR.bio}</p>
        </aside>
      )}
      <RelatedGuides pages={relatedPages(page)} />
      {!(page.blocks && page.blocks.length > 0) && <MigrationNote page={page} />}
    </article>
  );
}

function ArchivePage({ page }: { page: Page }) {
  const name = decodeURIComponent(page.path.split('/').pop() || '').replace(/\+/g, ' ');
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm text-ocean-600 uppercase tracking-wide">
        {page.contentType === 'tag' ? 'Tag' : 'Category'}
      </p>
      <h1 className="mt-1 font-display text-3xl md:text-4xl text-ink-900">{name}</h1>
      <p className="mt-3 text-ink-500 max-w-prose">
        Browse Bondi guides in this {page.contentType}. Full archive filtering is being
        rebuilt during the migration —{' '}
        <a href={page.liveUrl} className="text-ocean-700 underline">
          view on the live site
        </a>
        .
      </p>
      <div className="mt-8 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {recentArticles(6).map((p) => (
          <ArticleCard key={p.path} page={p} />
        ))}
      </div>
    </div>
  );
}

function BlogIndex() {
  const all = articles();
  const cats = categories();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl text-ink-900">What&rsquo;s On in Bondi</h1>
      <p className="mt-3 text-ink-700 max-w-prose">
        {all.length} guides and stories from Bondi Beach and Sydney&rsquo;s Eastern Beaches.
      </p>
      {cats.length > 0 && (
        <nav aria-label="Categories" className="mt-6 flex flex-wrap gap-2">
          {cats.map((c) => (
            <Link
              key={c.path}
              href={c.path}
              className="rounded-full border border-sand-300 bg-white px-3 py-1.5 text-sm text-ink-700 hover:border-ocean-500"
            >
              {decodeURIComponent(c.path.split('/').pop() || '').replace(/\+/g, ' ')}
            </Link>
          ))}
        </nav>
      )}
      <div className="mt-8 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {[...all]
          .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
          .map((p) => (
            <ArticleCard key={p.path} page={p} />
          ))}
      </div>
    </div>
  );
}
