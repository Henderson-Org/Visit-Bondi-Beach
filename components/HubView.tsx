import Link from 'next/link';
import Image from 'next/image';
import {
  getPage,
  displayTitle,
  breadcrumbs,
  relatedPages,
  type Page,
  type HubSection,
} from '@/lib/content';
import { breadcrumbJsonLd } from '@/lib/structured-data';
import { siteOrigin } from '@/lib/site';
import { getHubDesign, type SectionLayout } from '@/lib/hubs';
import { conditionsDestinationForPath } from '@/lib/conditions/locations';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RelatedGuides } from '@/components/RelatedGuides';
import { WeatherSurfSummary } from '@/components/WeatherSurfSummary';

interface CardData {
  title: string;
  path: string;
  image: string | null;
  excerpt: string;
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Decode the handful of HTML entities that survive in crawled text, and strip the
// brand/nav boilerplate ("… — Visit Bondi Beach Visit Bondi Beach What's On …")
// that pollutes some crawled intros. Authored meta/body text is already clean.
function cleanText(s = ''): string {
  return s
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&').replace(/&#39;|&rsquo;|&apos;/g, '’')
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"').replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ')
    .replace(/\s*[—-]?\s*Visit Bondi Beach\b.*$/i, '') // cut brand suffix + any trailing nav dump
    .replace(/\s+/g, ' ')
    .trim();
}

// Excerpt from authored meta description, else the first paragraph of an authored
// body — never the raw crawled intro (which is nav boilerplate). Empty is fine.
function excerptFor(target: Page | undefined): string {
  const md = cleanText(target?.metaDescription || '');
  if (md.length >= 20) return md;
  const firstP = (target?.blocks || []).find((b) => b.type === 'p' && 'text' in b && b.text);
  return firstP && 'text' in firstP ? cleanText(firstP.text) : '';
}

function cardFor(link: { title: string; path: string }): CardData {
  const target = getPage(link.path);
  return {
    title: cleanText(link.title) || (target ? displayTitle(target) : link.path),
    path: link.path,
    image: target?.heroImage || null,
    excerpt: excerptFor(target),
  };
}

function heroImageFor(page: Page): string | null {
  if (page.heroImage) return page.heroImage;
  for (const s of page.sections || []) {
    for (const l of s.links || []) {
      const t = getPage(l.path);
      if (t?.heroImage) return t.heroImage;
    }
  }
  return null;
}

/* ---------------------------- cards ---------------------------- */

function FeatureCard({ card }: { card: CardData }) {
  return (
    <Link
      href={card.path}
      className="group relative flex h-full min-h-[15rem] flex-col justify-end overflow-hidden rounded-2xl bg-ink-900 sm:min-h-[20rem]"
    >
      {card.image && (
        <Image
          src={card.image}
          alt={card.title}
          fill
          sizes="(max-width: 1024px) 100vw, 640px"
          className="object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/30 to-transparent" aria-hidden="true" />
      <div className="relative p-5 sm:p-6">
        <h3 className="font-display text-2xl leading-tight text-white sm:text-3xl">{card.title}</h3>
        {card.excerpt && <p className="mt-2 max-w-prose text-sm text-sand-50/90 line-clamp-2">{card.excerpt}</p>}
        <span className="mt-3 inline-block text-sm font-medium text-sand-50 group-hover:underline">Read the guide →</span>
      </div>
    </Link>
  );
}

function Card({ card }: { card: CardData }) {
  return (
    <Link
      href={card.path}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-sand-200 bg-white transition hover:border-ocean-500 hover:shadow-sm"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand-200">
        {card.image && (
          <Image
            src={card.image}
            alt={card.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg leading-snug text-ink-900 group-hover:text-ocean-700">{card.title}</h3>
        {card.excerpt && <p className="mt-1.5 text-sm text-ink-500 line-clamp-2">{card.excerpt}</p>}
      </div>
    </Link>
  );
}

/* --------------------------- sections -------------------------- */

function SectionBlock({ section, layout }: { section: HubSection; layout: SectionLayout }) {
  const cards = (section.links || []).map(cardFor);
  if (cards.length === 0) return null;

  return (
    <section id={slugify(section.heading)} className="scroll-mt-24">
      <div className="max-w-prose">
        <h2 className="font-display text-2xl md:text-3xl text-ink-900">{section.heading}</h2>
        {section.intro && <p className="mt-2 text-ink-700">{section.intro}</p>}
      </div>

      {layout === 'featured' && cards.length > 1 ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FeatureCard card={cards[0]} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {cards.slice(1).map((c) => (
              <Card key={c.path} card={c} />
            ))}
          </div>
        </div>
      ) : layout === 'carousel' ? (
        <div className="mt-6 -mx-4 overflow-x-auto px-4">
          <div className="flex snap-x gap-4 pb-2">
            {cards.map((c) => (
              <div key={c.path} className="w-64 shrink-0 snap-start sm:w-72">
                <Card card={c} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Card key={c.path} card={c} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ----------------------------- view ---------------------------- */

export function HubView({ page }: { page: Page }) {
  const design = getHubDesign(page.path);
  const crumbs = breadcrumbs(page);
  const title = displayTitle(page);
  const hero = heroImageFor(page);
  const sections = page.sections || [];
  const conditionsDest = conditionsDestinationForPath(page.path);

  // ItemList structured data for the curated guides on this hub (SEO/AEO signal).
  const listItems = sections
    .flatMap((s) => s.links || [])
    .map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${siteOrigin()}${l.path}`,
      name: cleanText(l.title),
    }));
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    itemListElement: listItems,
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
      />
      {listItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      {/* Editorial hero */}
      <section className="relative isolate overflow-hidden bg-ink-900">
        {hero && (
          <Image src={hero} alt="" fill priority sizes="100vw" className="object-cover opacity-55" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/95 via-ink-900/60 to-ink-900/40" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-8 md:pb-14 md:pt-10">
          <div className="[&_*]:!text-sand-50/80">
            <Breadcrumbs items={crumbs} />
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-ocean-500 [text-shadow:0_1px_2px_rgb(0_0_0/40%)]">
            {design.kicker}
          </p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl leading-[1.05] tracking-tight text-white md:text-6xl">
            {title}
          </h1>
          {page.intro && <p className="mt-4 max-w-prose text-lg text-sand-50/95">{page.intro}</p>}
          {sections.length > 1 && (
            <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2">
              {sections.map((s) => (
                <a
                  key={s.heading}
                  href={`#${slugify(s.heading)}`}
                  className="rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-sm text-white backdrop-blur-sm hover:border-white hover:bg-white/20"
                >
                  {s.heading}
                </a>
              ))}
            </nav>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4">
        {/* Practical facts strip */}
        {design.practical && design.practical.length > 0 && (
          <dl className="-mt-6 relative z-10 grid grid-cols-2 divide-x divide-y divide-sand-200 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm sm:grid-cols-4 sm:divide-y-0">
            {design.practical.map((f) => (
              <div key={f.label} className="p-4">
                <dt className="text-[11px] uppercase tracking-wide text-ink-500">{f.label}</dt>
                <dd className="mt-1 font-display text-lg text-ink-900">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Live conditions on the weather hub */}
        {conditionsDest && (
          <div className={design.practical ? 'mt-6' : '-mt-6 relative z-10'}>
            <WeatherSurfSummary destination={conditionsDest} />
          </div>
        )}

        {/* "Perfect for…" quick discovery — contextual entry points into the sections. */}
        {design.discovery && design.discovery.items.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-ink-900">{design.discovery.intro}</span>
            {design.discovery.items.map((d) => {
              const target = sections[d.section];
              if (!target) return null;
              return (
                <a
                  key={d.label}
                  href={`#${slugify(target.heading)}`}
                  className="rounded-full border border-sand-300 bg-white px-3.5 py-1.5 text-sm text-ink-700 transition hover:border-ocean-500 hover:text-ocean-700"
                >
                  {d.label}
                </a>
              );
            })}
          </div>
        )}

        {/* Sections */}
        <div className="mt-12 space-y-14 pb-4">
          {sections.map((s, i) => (
            <SectionBlock key={s.heading} section={s} layout={design.sectionLayouts[i] ?? 'grid'} />
          ))}
        </div>

        {/* CTA band */}
        {design.cta && (
          <section className="mt-6 overflow-hidden rounded-2xl bg-ocean-700 px-6 py-8 text-center sm:px-10 sm:py-10">
            <h2 className="font-display text-2xl text-white sm:text-3xl">{design.cta.title}</h2>
            <p className="mx-auto mt-2 max-w-prose text-sand-50/90">{design.cta.text}</p>
            <Link
              href={design.cta.href}
              className="mt-5 inline-block rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ocean-700 hover:bg-sand-100"
            >
              {design.cta.label}
            </Link>
          </section>
        )}

        <div className="pb-12">
          <RelatedGuides pages={relatedPages(page)} />
        </div>
      </div>
    </div>
  );
}
