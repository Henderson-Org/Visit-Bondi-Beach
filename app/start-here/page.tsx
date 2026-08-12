import type { Metadata } from 'next';
import Link from 'next/link';
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/structured-data';

/**
 * /start-here - "First time at Bondi? Start here."
 * The site's front door for first-time visitors: one page that takes someone from
 * "I've heard of Bondi" to a fully planned day. Every volatile number on this page was
 * verified against a primary source on 2026-08-12 (TfNSW trip planner, icebergs.com.au,
 * bondipavilion.com.au, bondimarkets.com.au, letsgosurfing.com.au, airportlink.com.au)
 * and is dated in the copy. Anything we couldn't verify links to the authority instead.
 * Built from red-team research: the questions below are the ones real first-timers
 * actually Google (TripAdvisor/forum-mined), in the order they hit them.
 */

const CHECKED = 'checked Aug 2026';

export const metadata: Metadata = {
  title: { absolute: 'First Time at Bondi Beach? Start Here' },
  description:
    'Everything a first-time visitor needs for Bondi Beach: how to get there, what it costs, where to swim safely, lockers, the coastal walk, food and a ready-made first day - with facts checked against official sources.',
  alternates: { canonical: '/start-here' },
  openGraph: {
    title: 'First Time at Bondi Beach? Start Here',
    description:
      'The complete first-timer guide to Bondi Beach: transport, money, safety, swimming, lockers, the coastal walk, food and a ready-made day plan.',
    type: 'website',
    images: '/images/articles/41ae0d79fa63d41a.webp',
  },
};

const FAQS = [
  {
    q: 'Is Bondi Beach worth visiting?',
    a: 'Yes - with the right plan. Come early (before 10am), swim between the flags, walk at least the first stretch of the coastal path towards Bronte, and eat one good meal on Hall Street or Campbell Parade. Bondi disappoints people who arrive at midday on a summer Saturday expecting an empty paradise; it wins over almost everyone who catches it in the morning.',
  },
  {
    q: 'How long should I spend at Bondi?',
    a: 'Half a day covers the essentials: a swim, the walk to Bronte and back, and a meal - about 4-5 hours. A full day lets you add Icebergs, the markets (weekends), and a sunset. If you have less than 3 hours door to door, it is doable but rushed - go early, swim, coffee, leave.',
  },
  {
    q: 'How do I get to Bondi Beach from the city?',
    a: 'Train on the T4 line to Bondi Junction, then the 333 or 380 bus down to Campbell Parade - about 40-45 minutes all up from Circular Quay (checked against the Transport for NSW trip planner, Aug 2026). There is no train station and no ferry at Bondi Beach itself. Tap on with any contactless bank card or phone - it charges the same as an Opal card.',
  },
  {
    q: 'Do I need cash at Bondi?',
    a: 'No. Buses are cashless, and effectively every café, restaurant and shop takes cards and phone payments. Tipping is not expected in Australia. Leave the cash and the passport at your accommodation.',
  },
  {
    q: 'Which end of Bondi Beach is best?',
    a: 'For swimming, the north end (to your left facing the sea) - it is generally gentler and better for families and nervous swimmers. The south end has the famous "Backpackers\' Rip" near the rocks and is best left to experienced surfers. Wherever you swim, stay between the red-and-yellow flags.',
  },
  {
    q: 'Are there sharks at Bondi?',
    a: 'Serious incidents are very rare. Bondi is a heavily patrolled urban beach; the real day-to-day hazard is rip currents, which is exactly why you swim between the flags during patrol hours. Ask a lifeguard if conditions worry you - they would genuinely rather answer questions than perform rescues.',
  },
  {
    q: 'Is Bondi worth visiting in winter?',
    a: 'Yes - it is the locals\' favourite season. Quiet sand, whale season out the back (roughly May to November), sunshine most days, and the ocean pools still open. The sea sits around 17-18°C in late winter, so most visitors watch rather than swim, or do laps at Icebergs.',
  },
  {
    q: 'Where do I leave my stuff while I swim?',
    a: 'Lockers inside Bondi Pavilion (6am-10pm daily; small $6 / large $9 for 4 hours - checked Aug 2026), or bring a waterproof pouch and take phone and card into the water with you. Do not leave valuables on your towel.',
  },
];

const CRUMBS = [
  { name: 'Home', path: '/' },
  { name: 'Start here', path: '/start-here' },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="font-display text-2xl md:text-3xl text-ink-900">{title}</h2>
      <div className="mt-4 space-y-4 text-ink-700 leading-relaxed">{children}</div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-sand-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-1 text-sm text-ink-900">{value}</div>
    </div>
  );
}

const TOC = [
  ['worth-it', 'Is it worth it?'],
  ['getting-there', 'Getting there'],
  ['money', 'Money & payments'],
  ['what-to-bring', 'What to bring'],
  ['arriving', 'When you arrive'],
  ['safety', 'Swim safety'],
  ['where-to-swim', 'Where to swim'],
  ['valuables', 'Lockers & valuables'],
  ['facilities', 'Toilets & showers'],
  ['coastal-walk', 'The coastal walk'],
  ['eating', 'Eating & coffee'],
  ['dont', "What NOT to do"],
  ['first-day', 'Your first day, planned'],
  ['getting-home', 'Getting home'],
] as const;

export default function StartHerePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(CRUMBS)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }} />

      <nav aria-label="Breadcrumb" className="text-xs text-ink-500">
        <Link href="/" className="hover:text-ocean-700">Home</Link> <span aria-hidden>/</span> Start here
      </nav>

      <h1 className="mt-2 font-display text-3xl md:text-5xl leading-tight tracking-tight text-ink-900">
        First time at Bondi Beach? Start here.
      </h1>
      <p className="mt-4 text-lg text-ink-700 leading-relaxed">
        You have seen it on Instagram and maybe on Bondi Rescue. This page is everything we would tell a friend
        landing in Sydney tomorrow - how to get here, what it costs, where to swim without scaring yourself,
        where to put your phone, and exactly how we would spend your first day. Every price and timetable fact
        on this page was checked against the official source in August 2026, and where things change often we
        link you straight to the authority.
      </p>

      {/* The 60-second version */}
      <div className="mt-8 rounded-2xl border border-ocean-200 bg-ocean-50/50 p-5">
        <h2 className="font-display text-xl text-ink-900">The 60-second version</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-700">
          <li><strong>Go early.</strong> Bondi at 7-10am is the postcard; Bondi at noon on a summer Saturday is a crowd.</li>
          <li><strong>Train to Bondi Junction, then bus 333 or 380.</strong> ~40-45 min from Circular Quay. No train or ferry at the beach. Tap a bank card - no ticket needed.</li>
          <li><strong>Swim between the red-and-yellow flags.</strong> North end (your left, facing the sea) is the gentle end.</li>
          <li><strong>The beach is free.</strong> So are showers, toilets and the coastal walk. Icebergs pool is $10 ({CHECKED}).</li>
          <li><strong>Lockers exist</strong> - inside Bondi Pavilion, from $6. Or take a waterproof pouch into the water.</li>
          <li><strong>Walk to Bronte</strong> (2.5 km, ~45-60 min) even if you skip everything else.</li>
          <li><strong>Don&apos;t drive</strong> on a warm weekend. Don&apos;t drink on the sand (alcohol-free zone). Don&apos;t swim outside the flags or after dark.</li>
        </ul>
      </div>

      {/* TOC */}
      <nav aria-label="On this page" className="mt-8 rounded-xl border border-sand-200 bg-sand-100/60 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-500">On this page</div>
        <ol className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
          {TOC.map(([id, label]) => (
            <li key={id}><a href={`#${id}`} className="text-ocean-700 hover:underline">{label}</a></li>
          ))}
        </ol>
      </nav>

      <Section id="worth-it" title="Is Bondi actually worth visiting?">
        <p>
          Honest answer: yes, but the crowd complaints are real too - Bondi tops Australian &quot;overrated beach&quot;
          lists almost entirely because of overcrowding. The fix is timing, not skipping it. Arrive before 10am
          (before 8am in summer) and you get the beach the photos promised: mile of sand, ocean pool at one end,
          clifftop walk unrolling south. Arrive at midday in January and you will queue for everything.
        </p>
        <p>
          <strong>How long do you need?</strong> Three hours is the honest minimum (swim + coffee + a look around).
          Half a day - about 4-5 hours - covers the essentials properly, including the walk to Bronte. A full day adds
          Icebergs, the weekend markets and sunset from the north end. Weighing Bondi against Manly? Bondi has the walk
          and the scene; Manly has the ferry ride. Doing both in one day is possible but a slog - they are on opposite
          sides of the city, 1.5-2 hours apart by public transport. Pick one and do it well; see our{' '}
          <Link href="/bondi-blog/bondi-or-manly-travel-guide" className="text-ocean-700 underline">Bondi vs Manly guide</Link>{' '}
          if you are torn.
        </p>
        <p>
          <strong>Winter or rain?</strong> Still worth it - quieter, moodier, whales offshore roughly May-November, and
          the pools stay open. See{' '}
          <Link href="/bondi-blog/2024/6/9/the-best-time-to-visit-bondi-beach-a-seasonal-guide" className="text-ocean-700 underline">the seasonal guide</Link>{' '}
          and our <Link href="/bondi-weather" className="text-ocean-700 underline">weather &amp; sea temperature hub</Link>.
        </p>
      </Section>

      <Section id="getting-there" title="Getting there (the part everyone gets wrong)">
        <p>
          The single most important fact: <strong>there is no train station at Bondi Beach, and no ferry.</strong>{' '}
          The station called &quot;Bondi Junction&quot; is a shopping district 2.5 km up the hill. Every trip ends with
          a short bus ride or a downhill walk.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Fact label="From the CBD / Circular Quay" value={<>T4 train to Bondi Junction, then bus <strong>333</strong> (Stand A) or <strong>380</strong> (Stand B) to Campbell Parade. ~40-45 min all up; the bus leg is ~15 min. The 333 runs every few minutes in daytime. ({CHECKED}, TfNSW trip planner)</>} />
          <Fact label="Where to get off" value={<>Stay on until the ocean fills the windscreen - the beach stops are on <strong>Campbell Parade</strong>. Aim for the stop opposite Bondi Beach Public School or Stand C at the south end; you cannot really miss it, the beach is right there.</>} />
          <Fact label="Paying" value={<>Tap on and off with any contactless Visa/Mastercard/Amex or your phone - <strong>same price as an Opal card</strong>, with the same daily fare caps. No cash tickets on buses. Kids need a Child Opal card for child fares (a tapped bank card always charges adult fare). Current fares: <a className="text-ocean-700 underline" href="https://transportnsw.info/tickets-opal" rel="nofollow noopener" target="_blank">transportnsw.info</a>.</>} />
          <Fact label="From Sydney Airport" value={<>Train (T8 then change to T4) in 60-90 min - but airport stations add a <strong>$19.00 station access fee</strong> ($18.61 with Opal/contactless, as at mid-2026). Fee-free trick: bus <strong>350</strong> from the Domestic terminal to Bondi Junction, then the 333/380. Taxi: the airport quotes $45-55 to the CBD; Bondi is a similar distance band. Full details: <Link href="/bondi-blog/getting-from-sydney-airport-to-bondi-beach" className="text-ocean-700 underline">airport guide</Link>.</>} />
          <Fact label="Driving" value={<>Genuinely a mistake on warm weekends - parking is metered, scarce and fiercely contested. If you must: <Link href="/bondi-parking" className="text-ocean-700 underline">the parking guide</Link> maps every option including the free-ish streets.</>} />
          <Fact label="Late at night" value={<>The <strong>333 runs 24 hours</strong>, roughly every 20 minutes through the small hours ({CHECKED}). Trains from Bondi Junction stop after midnight - after that it is the night 333 or rideshare.</>} />
        </div>
        <p>
          Deeper dives: <Link href="/getting-to-bondi" className="text-ocean-700 underline">Getting to Bondi hub</Link> ·{' '}
          <Link href="/bondi-blog/how-to-get-to-bondi-beach" className="text-ocean-700 underline">step-by-step from the CBD</Link> ·{' '}
          <Link href="/bondi-blog/nearest-train-station-bondi-beach" className="text-ocean-700 underline">the Bondi Junction explainer</Link>.
        </p>
      </Section>

      <Section id="money" title="Money, cards and tipping">
        <p>
          <strong>The beach itself is free.</strong> So are the showers, toilets, the coastal walk and the people-watching.
          Sydney is close to cashless: every café, restaurant, bus and market-adjacent business takes cards and phone
          payments (a few market stalls prefer cash - that is about it). Small card surcharges (0.5-1.5%) are common
          and normal. <strong>Tipping is not expected anywhere</strong> - not in cafés, not in restaurants, not in taxis;
          round up for exceptional service if you feel like it, never out of obligation.
        </p>
        <p>
          A realistic day&apos;s budget beyond transport: flat white ~$5 (our{' '}
          <Link href="/bondi-coffee-price-index" className="text-ocean-700 underline">Coffee Price Index</Link> tracks the
          real median), brunch $20-30, Icebergs entry $10, fish and chips on the grass $15-25, beginner surf lesson
          from $99 ({CHECKED}). A perfectly good Bondi day runs on $40; a great one on $100.
        </p>
      </Section>

      <Section id="what-to-bring" title="What to bring (and what you can skip)">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>SPF50+ sunscreen, hat, sunglasses.</strong> The Australian sun is not like your sun - UV here burns fast even on cool, cloudy days. Reapply after swimming. Forgot it? Supermarkets and pharmacies around Hall Street sell it.</li>
          <li><strong>Water bottle.</strong> Free refill bubblers sit along the promenade; Sydney tap water is safe to drink.</li>
          <li><strong>Towel + swimwear</strong> - obvious, but there is no towel hire on the sand (Icebergs hires towels for $5 if you end up there).</li>
          <li><strong>Shade if you need it.</strong> Real talk: Bondi is bare sand - <strong>no umbrella or lounger hire on the beach</strong>, and almost no natural shade. Bring a beach umbrella or plan around the grass above the beach and the Pavilion.</li>
          <li><strong>A waterproof phone pouch</strong> if you are solo - it solves the valuables problem (more below).</li>
          <li><strong>Skip:</strong> cash beyond a note or two, your passport, a suitcase (nowhere on the beach fits one - see lockers below), and a wetsuit in summer (Dec-Apr the water is 21-24°C; wetsuit season is roughly May-Oct, hire from $15).</li>
        </ul>
      </Section>

      <Section id="arriving" title="When you step off the bus">
        <p>
          Orientation takes ten seconds: the ocean is in front of you, and facing it, <strong>north is your left</strong>{' '}
          (the grassy hill and the children&apos;s pool), <strong>south is your right</strong> (Icebergs, the famous pool
          in every photo, and the start of the coastal walk). The big Spanish-style building mid-beach is{' '}
          <strong>Bondi Pavilion</strong> - toilets, showers, change rooms, lockers, water and exhibitions. The lifeguard
          tower is just south of the Pavilion; the red-and-yellow flags will be somewhere on the sand between - they move
          with conditions, so look for them before you pick your spot.
        </p>
        <p>
          First moves we recommend: drop anything heavy in a Pavilion locker, check where the flags are, then coffee -
          the promenade side for the view, or one street back on Hall Street/Gould Street where the locals queue.
        </p>
      </Section>

      <Section id="safety" title="Swim safety - the two-minute version that matters">
        <p>
          Bondi is a real surf beach, patrolled year-round by professional lifeguards (the Bondi Rescue crew), with
          volunteer lifesavers on weekends. It is very safe <em>if</em> you follow one rule:{' '}
          <strong>swim between the red-and-yellow flags.</strong> They mark the zone the lifeguards judged safest today
          and watch constantly. The flags move during the day - re-check them after lunch.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Rips are the real hazard</strong> (not sharks). A rip looks deceptively calm: a darker, flatter gap between the breaking waves. The notorious one sits at the south end near the rocks - locals call it the Backpackers&apos; Rip because it catches tourists.</li>
          <li><strong>If you are caught in one:</strong> do not fight it. Stay calm, float, raise one arm - the lifeguards will come. If you swim well, go parallel to the beach until you are out of the channel.</li>
          <li><strong>Weak swimmer or first ocean swim?</strong> Stay waist-deep between the flags at the north end, keep your feet on the sand, and never turn your back on the waves. Or skip the surf entirely - the ocean pools below give you salt water with zero waves.</li>
          <li><strong>After heavy rain</strong>, skip swimming for a day - stormwater runs into the bay. Check the NSW Government&apos;s <a className="text-ocean-700 underline" href="https://www.environment.nsw.gov.au/topics/water/beaches" rel="nofollow noopener" target="_blank">Beachwatch</a> rating first.</li>
          <li><strong>Emergency: dial 000.</strong> During patrol hours, the fastest help is the lifeguard tower near the Pavilion.</li>
        </ul>
        <p>
          Full guides: <Link href="/bondi-blog/2024/9/8/is-it-safe-to-swim-at-bondi-beach-a-complete-guide" className="text-ocean-700 underline">Is it safe to swim at Bondi?</Link> ·{' '}
          <Link href="/bondi-blog/2025/1/5/understanding-bondi-beach-safety-signs" className="text-ocean-700 underline">beach safety signs decoded</Link> ·{' '}
          <Link href="/where-to-swim-at-bondi-beach" className="text-ocean-700 underline">where to swim</Link>.
        </p>
      </Section>

      <Section id="where-to-swim" title="Where to swim (three very different options)">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Between the flags, north end</strong> - the classic Bondi swim. Gentler waves, families, lifeguards watching. Free.</li>
          <li><strong>Bondi Icebergs pool</strong> - the ocean pool from every photo, at the south end. Adult $10, child $7, family $30, sauna included, towel/locker hire $5 each ({CHECKED}). Open 6am-6:30pm weekdays, 6:30am weekends - <strong>closed Thursdays for cleaning</strong> (except sometimes in summer when tides allow). Details: <Link href="/bondi-icebergs" className="text-ocean-700 underline">our Icebergs hub</Link> or <a className="text-ocean-700 underline" href="https://icebergs.com.au" rel="nofollow noopener" target="_blank">icebergs.com.au</a>.</li>
          <li><strong>The free rock pools</strong> - Ross Jones Memorial Pool sits right below Icebergs (free, calm, great for kids and nervous swimmers), and the North Bondi children&apos;s pool anchors the far north corner. Zero waves, zero cost.</li>
        </ul>
      </Section>

      <Section id="valuables" title="Lockers, valuables and the phone problem">
        <p>
          The most-asked Bondi question on every travel forum, so here is the definitive answer:{' '}
          <strong>yes, there are lockers</strong> - inside Bondi Pavilion, available 6am-10pm daily. Small locker
          (fits phone/wallet/keys) $6 for 4 hours or $10 all day; large (fits a daypack) $9 / $15 ({CHECKED}).
          A carry-on suitcase will <em>not</em> reliably fit - leave luggage at your accommodation or a city storage
          service before you come.
        </p>
        <p>
          No locker? Go minimal: bank card + phone in a <strong>waterproof pouch that swims with you</strong> (beach shops
          along Campbell Parade stock them), everything else stays at the hotel. Do not leave a phone wrapped in a towel -
          Bondi is safe as beaches go, but it is still a busy urban beach.{' '}
          Full playbook: <Link href="/bondi-blog/bondi-beach-lockers-where-to-leave-valuables" className="text-ocean-700 underline">lockers &amp; valuables guide</Link>.
        </p>
      </Section>

      <Section id="facilities" title="Toilets, showers, changing">
        <p>
          Three free amenity blocks: north end, mid-beach at the Pavilion, and the south end - plus free outdoor
          showers on the promenade. The Pavilion is the full-service stop: toilets, hot showers, change rooms,
          baby-change, accessible facilities and the lockers, open 6am-10pm daily. Wherever you are on the sand,
          you are never more than a few hundred metres from a toilet.{' '}
          <Link href="/bondi-blog/bondi-beach-toilets-showers-change-rooms" className="text-ocean-700 underline">The full facilities map</Link>{' '}
          - including accessibility details and the{' '}
          <Link href="/bondi-blog/2025/1/5/exploring-bondi-beach-a-guide-to-wheelchair-access" className="text-ocean-700 underline">beach wheelchair loan</Link> (bookings essential, (02) 9083 8400).
        </p>
      </Section>

      <Section id="coastal-walk" title="The coastal walk (do not skip this)">
        <p>
          The Bondi-to-Coogee clifftop path is the best free thing in Sydney&apos;s east. Starting at the south end of
          the beach by Icebergs: <strong>Bondi → Bronte is 2.5 km, 45-60 minutes</strong> at an easy pace - that is the
          stretch to do if you only do one. The full <strong>Bondi → Coogee run is ~6 km, 2-3 hours</strong> with swim
          and coffee stops. There are stairs in several sections, so it is not pram- or wheelchair-friendly beyond the
          first Bondi stretch; the beach promenade itself is flat and step-free.
        </p>
        <p>
          Do it one-way and bus back (Bronte and Coogee both connect to Bondi Junction). Go at sunrise if you possibly can.
          The definitive guide: <Link href="/bondi-coastal-walk" className="text-ocean-700 underline">coastal walk hub</Link> ·{' '}
          <Link href="/bondi-blog/2023/9/21/walking-on-sunshine-the-ultimate-guide-to-the-bondi-to-bronte-coastal-walk" className="text-ocean-700 underline">Bondi to Bronte step-by-step</Link>.
        </p>
      </Section>

      <Section id="eating" title="Eating and coffee, without the tourist tax">
        <p>
          Rule of thumb: <strong>Campbell Parade for the view, Hall Street and the back streets for the food.</strong>{' '}
          Breakfast/brunch is Bondi&apos;s signature meal - queues at the famous spots are real on weekends, so go early
          or go local. Cheap eats cluster one street back (falafel, banh mi, bakeries - eat on the grass with the ocean
          in front of you). For dinner, book anywhere famous.
        </p>
        <p>
          Start with: <Link href="/bondi-eat-and-drink" className="text-ocean-700 underline">the full eat &amp; drink directory</Link> (160+ venues, filter by budget/area) ·{' '}
          <Link href="/bondi-blog/best-breakfast-bondi-right-now" className="text-ocean-700 underline">best breakfast right now</Link> ·{' '}
          <Link href="/bondi-blog/bondi-beach-cheap-food" className="text-ocean-700 underline">eating cheaply</Link> ·{' '}
          <Link href="/bondi-coffee-price-index" className="text-ocean-700 underline">the Coffee Price Index</Link> (median flat white $5.10, from verified menus).
        </p>
      </Section>

      <Section id="dont" title="What NOT to do at Bondi">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Don&apos;t drink alcohol on the beach or in the park</strong> - it is a patrolled alcohol-free zone and rangers do fine people. Glass is banned too. Drink at the venues instead.</li>
          <li><strong>Don&apos;t smoke or vape on the sand</strong> - smoke-free beach.</li>
          <li><strong>Don&apos;t bring the dog</strong> - no dogs on the beach or promenade, ever.</li>
          <li><strong>Don&apos;t fly a drone</strong> without council approval - assume no.</li>
          <li><strong>Don&apos;t swim outside the flags, after dark, or after a big night.</strong> The beach is open 24/7; safe swimming is not.</li>
          <li><strong>Don&apos;t drive in on a warm weekend</strong>, and don&apos;t leave valuables visible in a parked car.</li>
          <li><strong>Don&apos;t stand on the wave-washed rocks</strong> at the south end for photos - king waves are a real thing here.</li>
          <li>Full rulebook: <Link href="/bondi-blog/bondi-beach-rules-what-you-can-and-cant-do" className="text-ocean-700 underline">what is and isn&apos;t allowed at Bondi</Link> · unwritten rules: <Link href="/bondi-blog/2023/10/18/bondi-beach-etiquette-guide" className="text-ocean-700 underline">the etiquette guide</Link>.</li>
        </ul>
      </Section>

      <Section id="first-day" title="Your first day, planned (steal this)">
        <ol className="list-decimal space-y-2 pl-5">
          <li><strong>7:30am</strong> - Bus down from Bondi Junction. Coffee one street back on Hall St/Gould St (10 min walk from the bus).</li>
          <li><strong>8:15am</strong> - Swim between the flags, north end. Or laps at Icebergs if the surf intimidates (open from 6am, closed Thursdays).</li>
          <li><strong>9:30am</strong> - Rinse at the free promenade showers, change at the Pavilion.</li>
          <li><strong>10:00am</strong> - Walk south past Icebergs onto the coastal path → Tamarama → Bronte. Photos at Mackenzies Point. (45-60 min.)</li>
          <li><strong>11:30am</strong> - Early lunch at Bronte, or bus back and eat on Hall Street before the crowds.</li>
          <li><strong>1:00pm</strong> - Pick one: markets (Sat farmers / Sun fashion, at the school on Campbell Parade), Pavilion galleries, North Bondi grass with a gelato, or a beginner surf lesson (from $99, book ahead).</li>
          <li><strong>4:30pm</strong> - Golden hour from the north-end grass or Ben Buckler lookout - the classic across-the-bay shot.</li>
          <li><strong>Evening</strong> - Dinner one street back, then the 333 home (it runs all night).</li>
          <li>Behind schedule? Cut #6 first, then shorten the walk to Tamarama-and-back (30 min). Never cut the swim.</li>
        </ol>
        <p>
          Want it tailored? <Link href="/plan" className="text-ocean-700 underline">The Bondi Day Planner</Link> builds a
          day around your season and hours. More ready-made days: <Link href="/itineraries" className="text-ocean-700 underline">itineraries hub</Link>.
        </p>
      </Section>

      <Section id="getting-home" title="Getting home (or to the airport)">
        <p>
          Reverse the trip: any 333/380 from Campbell Parade up to Bondi Junction, then the T4 train. After midnight the
          <strong> 333 keeps running (24 hours)</strong> even when the trains have stopped. Flying out? Allow 60-90 minutes
          back to the airport by public transport plus your check-in buffer - for international flights that means leaving
          Bondi about 4+ hours before departure. Layover visitors:{' '}
          <Link href="/bondi-blog/getting-from-sydney-airport-to-bondi-beach" className="text-ocean-700 underline">the airport guide</Link>{' '}
          covers the fee-free 350-bus route and timings both ways.
        </p>
      </Section>

      <section className="mt-12 rounded-2xl border border-sand-200 bg-sand-100/60 p-5">
        <h2 className="font-display text-xl text-ink-900">Go deeper</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {[
            ['/things-to-do-in-bondi', 'Things to do'],
            ['/bondi-coastal-walk', 'Coastal walk'],
            ['/where-to-swim-at-bondi-beach', 'Where to swim'],
            ['/bondi-eat-and-drink', 'Eat & drink'],
            ['/stay', 'Where to stay'],
            ['/bondi-with-kids', 'Bondi with kids'],
            ['/bondi-surfing', 'Learn to surf'],
            ['/whats-on', "What's on"],
            ['/bondi-weather', 'Weather & sea temps'],
            ['/bondi-icebergs', 'Icebergs'],
            ['/bondi-parking', 'Parking'],
            ['/itineraries', 'Itineraries'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-lg border border-sand-300 bg-white px-3 py-2 text-ink-700 hover:border-ocean-500">
              {label}
            </Link>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-500">
          Facts on this page checked against Transport for NSW, icebergs.com.au, bondipavilion.com.au,
          bondimarkets.com.au, letsgosurfing.com.au and airportlink.com.au in August 2026. Prices and timetables
          change - the linked official sources are always current.
        </p>
      </section>
    </div>
  );
}
