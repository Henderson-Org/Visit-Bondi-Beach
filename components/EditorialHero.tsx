import Image from 'next/image';
import { Breadcrumbs } from '@/components/Breadcrumbs';

/**
 * Editorial hero band — a topical image with a scrim, kicker, large display
 * title, intro and optional "jump" chips. Shared by category hubs and the
 * hub-styled core pages (Swim, Stay) so they read as one system.
 */
export interface HeroChip {
  label: string;
  href: string;
}

export function EditorialHero({
  image,
  kicker,
  title,
  intro,
  crumbs,
  chips,
}: {
  image: string | null;
  kicker: string;
  title: string;
  intro?: string | null;
  crumbs: { name: string; path: string }[];
  chips?: HeroChip[];
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink-900">
      {image && (
        <Image src={image} alt="" fill priority sizes="100vw" className="object-cover opacity-55" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/95 via-ink-900/60 to-ink-900/40" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-8 md:pb-14 md:pt-10">
        <div className="[&_*]:!text-sand-50/80">
          <Breadcrumbs items={crumbs} />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-ocean-500 [text-shadow:0_1px_2px_rgb(0_0_0/40%)]">
          {kicker}
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl leading-[1.05] tracking-tight text-white md:text-6xl">
          {title}
        </h1>
        {intro && <p className="mt-4 max-w-prose text-lg text-sand-50/95">{intro}</p>}
        {chips && chips.length > 1 && (
          <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2">
            {chips.map((c) => (
              <a
                key={c.href}
                href={c.href}
                className="rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-sm text-white backdrop-blur-sm hover:border-white hover:bg-white/20"
              >
                {c.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
