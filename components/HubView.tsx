import Link from 'next/link';
import {
  getPage,
  displayTitle,
  breadcrumbs,
  relatedPages,
  type Page,
  type HubSection,
} from '@/lib/content';
import { breadcrumbJsonLd, bondiPlaceJsonLd, coastalWalkSchema } from '@/lib/structured-data';
import { siteOrigin } from '@/lib/site';
import { getHubDesign, type SectionLayout } from '@/lib/hubs';
import { conditionsDestinationForPath } from '@/lib/conditions/locations';
import { EditorialHero } from '@/components/EditorialHero';
import { RelatedGuides } from '@/components/RelatedGuides';
import { WeatherSurfSummary } from '@/components/WeatherSurfSummary';
import { RouteMap } from '@/components/RouteMap';
import { GuideCard, FeatureCard, cleanText, excerptFor, type GuideCardData } from '@/components/GuideCard';
import { ContentPlannerPromo } from '@/components/ContentPlannerPromo';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Card data for a hub link - keeps the curated section title, pulls the target
// page's image + a clean excerpt (shared helpers, so hubs and homepage match).
function cardFor(link: { title: string; path: string }): GuideCardData {
  const target = getPage(link.path);
  return {
    title: cleanText(link.title) || (target ? displayTitle(target) : link.path),
    href: link.path,
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

/* --------------------------- sections -------------------------- */

function SectionBlock({ section, layout }: { section: HubSection; layout: SectionLayout }) {
  const cards = (section.links || []).map(cardFor);
  if (cards.length === 0) return null;

  return (
    <section id={slugify(section.heading)} className="scroll-mt-24">
      <div className="max-w-prose">
        {section.eyebrow && (
          <div className="flex items-center gap-3">
            <span className="h-px w-7 bg-ocean-500" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-widest text-ocean-600">
              {section.eyebrow}
            </span>
          </div>
        )}
        <h2 className={`font-display text-2xl md:text-[1.75rem] leading-tight text-ink-900 ${section.eyebrow ? 'mt-3' : ''}`}>
          {section.heading}
        </h2>
        {section.intro && <p className="mt-2.5 text-lg leading-relaxed text-ink-600">{section.intro}</p>}
      </div>

      {layout === 'featured' && cards.length > 1 ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FeatureCard card={cards[0]} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {cards.slice(1).map((c) => (
              <GuideCard key={c.href} card={c} />
            ))}
          </div>
        </div>
      ) : layout === 'carousel' ? (
        <div className="mt-6 -mx-4 overflow-x-auto px-4">
          <div className="flex snap-x gap-4 pb-2">
            {cards.map((c) => (
              <div key={c.href} className="w-64 shrink-0 snap-start sm:w-72">
                <GuideCard card={c} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <GuideCard key={c.href} card={c} />
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
  const hero = design.heroImage ?? heroImageFor(page);
  const sections = page.sections || [];
  const conditionsDest = conditionsDestinationForPath(page.path);

  // ItemList structured data for the curated guides on this hub (SEO/AEO signal).
  // Each element wraps a real `item` (a WebPage with url + name) so the list is a
  // well-formed ItemList, not a bare ListItem stub.
  const listItems = sections
    .flatMap((s) => s.links || [])
    .map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'WebPage',
        '@id': `${siteOrigin()}${l.path}`,
        url: `${siteOrigin()}${l.path}`,
        name: cleanText(l.title),
      },
    }));
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    numberOfItems: listItems.length,
    itemListElement: listItems,
  };

  // Coastal-walk hub: emit the TouristAttraction + HowTo backed by the visible route module.
  const coastalSchema =
    page.path === '/bondi-coastal-walk' && design.route
      ? coastalWalkSchema(design.route.stops, {
          note: design.route.note,
          image: hero || undefined,
        })
      : null;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bondiPlaceJsonLd()) }}
      />
      {listItems.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      {coastalSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(coastalSchema) }}
        />
      )}

      <EditorialHero
        image={hero}
        kicker={design.kicker}
        title={title}
        intro={page.intro}
        crumbs={crumbs}
        chips={sections.map((s) => ({ label: s.heading, href: `#${slugify(s.heading)}` }))}
      />

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

        {/* Light route / where-things-are module (Coastal Walk, Getting Here). */}
        {design.route && (
          <div className={design.practical || conditionsDest ? 'mt-6' : '-mt-6 relative z-10'}>
            <RouteMap title={design.route.title} stops={design.route.stops} note={design.route.note} />
          </div>
        )}

        {/* "Perfect for…" quick discovery - contextual entry points into the sections. */}
        {design.discovery && design.discovery.items.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2.5">
            <span className="mr-1 text-xs font-semibold uppercase tracking-widest text-ink-500">
              {design.discovery.intro}
            </span>
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

        {/* Sections - separated from the quick-browse strip above by a hairline so the
            guide proper reads as its own composed block. */}
        <div className="mt-10 border-t border-sand-200 pt-12 space-y-16 pb-4">
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

        <ContentPlannerPromo context={`${page.path} ${title}`} placement="hub" />
        <div className="pb-12">
          <RelatedGuides pages={relatedPages(page)} />
        </div>
      </div>
    </div>
  );
}
