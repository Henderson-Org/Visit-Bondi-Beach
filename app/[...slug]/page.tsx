import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  allContentPaths,
  getPageBySegments,
  displayTitle,
  recentArticles,
  relatedPages,
  breadcrumbs,
  articles,
  categories,
  type Page,
} from '@/lib/content';
import { isProduction, AUTHOR } from '@/lib/site';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/structured-data';
import { ArticleCard } from '@/components/ArticleCard';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RelatedGuides } from '@/components/RelatedGuides';
import { AdSlot } from '@/components/AdSlot';
import { BodyBlocks } from '@/components/BodyBlocks';

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
      return <HubPage page={page} />;
    case 'category':
    case 'tag':
      return <ArchivePage page={page} />;
    default:
      return <ArticlePage page={page} />;
  }
}

function HubPage({ page }: { page: Page }) {
  const crumbs = breadcrumbs(page);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
      />
      <Breadcrumbs items={crumbs} />
      <h1 className="mt-2 font-display text-3xl md:text-4xl leading-tight tracking-tight text-ink-900">
        {displayTitle(page)}
      </h1>
      {page.intro && <p className="mt-4 text-lg text-ink-700 max-w-prose">{page.intro}</p>}
      {(page.sections || []).map((sec) => (
        <section key={sec.heading} className="mt-10">
          <h2 className="font-display text-2xl text-ink-900">{sec.heading}</h2>
          {sec.intro && <p className="mt-2 text-ink-700 max-w-prose">{sec.intro}</p>}
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {sec.links.map((l) => (
              <li key={l.path}>
                <Link
                  href={l.path}
                  className="block rounded-lg border border-sand-200 bg-white p-4 font-medium text-ink-900 hover:border-ocean-500"
                >
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <RelatedGuides pages={relatedPages(page)} />
    </div>
  );
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

function ArticlePage({ page }: { page: Page }) {
  const title = displayTitle(page);
  const crumbs = breadcrumbs(page);
  const isArticle = page.section === 'blog';
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      {isArticle && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(page)) }}
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.heroImage}
          alt={title}
          className="mt-6 w-full rounded-xl object-cover"
        />
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
