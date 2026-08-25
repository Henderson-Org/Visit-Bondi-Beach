import type { Metadata } from 'next';
import Image from 'next/image';
import { PlannerApp } from '@/components/PlannerApp';
import { isProduction, seoTitle } from '@/lib/site';
import { getConditions } from '@/lib/conditions/service';
import { sydneyToday } from '@/lib/events';
import { isWetCode } from '@/lib/conditions/wmo';
import type { PlanWeather } from '@/lib/weatherFit';

const TITLE = 'Bondi Day Planner';
const DESCRIPTION =
  'Plan your perfect Bondi day. Tell us what you’re into and we’ll build your day around Bondi’s best beaches, walks, cafés and restaurants - with a great meal at its heart.';
const HERO = '/images/hero-bondi-sunrise.webp';

export function generateMetadata(): Metadata {
  return {
    title: seoTitle(TITLE),
    description: DESCRIPTION,
    alternates: { canonical: '/plan' },
    robots: isProduction() ? undefined : { index: false, follow: true },
    openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', images: HERO },
  };
}

/**
 * Today's conditions, reduced to what the planner reasons about. Fetched server-side
 * through the cached provider layer, so the planner costs the visitor no extra request and
 * the client bundle gains nothing. Returns null if the providers are down - the planner
 * then behaves exactly as it did before, rather than planning around invented weather.
 */
async function todayWeather(): Promise<PlanWeather | null> {
  try {
    const c = await getConditions('bondi');
    if (!c.current && !c.today) return null;
    return {
      wet: isWetCode(c.current?.weather?.code ?? null),
      rainChancePct: c.today?.rainChancePct ?? null,
      maxTempC: c.today?.maxTempC ?? null,
      waveHeightM: c.surf?.waveHeightM ?? null,
      waterTempC: c.surf?.waterTempC ?? null,
      uvIndexMax: c.today?.uvIndexMax ?? null,
    };
  } catch {
    return null;
  }
}

export default async function PlanPage() {
  const [weather, today] = [await todayWeather(), sydneyToday()];
  return (
    <div>
      {/* Compact hero - deliberately short on mobile so the planner is front-and-centre. */}
      <section className="relative isolate flex h-44 items-end overflow-hidden bg-ink-900 sm:h-64 md:h-72">
        <Image src={HERO} alt="Bondi Beach at sunrise" fill priority sizes="100vw" className="object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/40 to-ink-900/20" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-2xl px-4 pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ocean-300">Bondi Day Planner</p>
          <h1 className="mt-1 font-display text-2xl leading-tight text-white sm:text-4xl">Plan your perfect Bondi day</h1>
          <p className="mt-1.5 hidden max-w-prose text-sm text-sand-50/90 sm:block">
            Tell us what you’re into and we’ll build your day around Bondi’s best beaches, walks, cafés and restaurants.
          </p>
        </div>
      </section>

      {/* Supporting line (kept out of the short mobile hero so it doesn't crowd the image). */}
      <div className="mx-auto max-w-2xl px-4 pt-5">
        <p className="text-sm text-ink-600">
          Whether you want Icebergs and the coastal walk, a long lunch at Sean’s, markets and coffee, or just the perfect
          swim and sunset drink - we’ll build a Bondi day around you.
        </p>
      </div>

      <PlannerApp todayWeather={weather} todayDate={today} />
    </div>
  );
}
