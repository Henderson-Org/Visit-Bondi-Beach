import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  allContentPaths,
  getPageBySegments,
  displayTitle,
  recentArticles,
  articles,
  categories,
  type Page,
} from '@/lib/content';
import { isProduction } from '@/lib/site';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/structured-data';
import { ArticleCard } from '@/components/ArticleCard';

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
    case 'category':
    case 'tag':
      return <ArchivePage page={page} />;
    default:
      return <ArticlePage page={page} />;
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

function ArticlePage({ page }: { page: Page }) {
  const title = displayTitle(page);
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: "What's On", path: '/bondi-blog' },
    { name: title, path: page.path },
  ];
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(page)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
      />
      <nav aria-label="Breadcrumb" className="text-xs text-ink-500">
        <Link href="/bondi-blog" className="hover:text-ocean-700">
          What&rsquo;s On
        </Link>
      </nav>
      <h1 className="mt-2 font-display text-3xl md:text-4xl leading-tight tracking-tight text-ink-900">
        {title}
      </h1>
      {page.publishedAt && (
        <time className="mt-2 block text-sm text-ink-500" dateTime={page.publishedAt}>
          {new Date(page.publishedAt).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
      )}
      {page.heroImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.heroImage}
          alt={title}
          className="mt-6 w-full rounded-xl object-cover"
        />
      )}
      <div className="prose-editorial mt-6">
        {page.intro && <p className="text-lg text-ink-700">{page.intro}</p>}
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
      <MigrationNote page={page} />
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
