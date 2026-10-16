/**
 * Pure freshness-classification rules, extracted from classify-freshness.mjs so they can
 * be tested directly (scripts/freshness-rules.test.mjs). The script owns reading and
 * writing files; this module owns the decision and has no side effects.
 *
 * Read the header of classify-freshness.mjs for WHY the monthly tier is gated on a quoted,
 * undated figure rather than on topic words - that calibration is the whole point.
 */

/**
 * A figure on the page that goes stale.
 *
 *  - money: any dollar amount. Decisive on its own - a quoted price is the single most
 *    damaging thing to let rot, and there is no innocent reading of "$10".
 *  - trading hours: a clock time, but ONLY when its own sentence is about opening,
 *    closing, trading or service. This is the distinction that matters: "open 7am to 1pm"
 *    decays, "get there by 7.30am to beat the queue" is advice and does not.
 */
const MONEY_RE = /\$\s?\d/;
const CLOCK_RE = /\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/i;
const HOURS_CONTEXT_RE = /\bopen\w*\b|\bclos\w*\b|\bhours?\b|\btrading\b|\bpatrol\w*\b|\bservice\b|\bruns?\s+(?:from|until|till)\b|\blast\s+(?:train|bus|ferry|entry)\b/i;

/**
 * An as-at disclosure next to a figure: "as at August 2026", "as of mid-2026",
 * "correct at the time of writing". This is the difference between a figure that lies as
 * it ages and one that merely gets older, and it is what separates a 45-day obligation
 * from a 100-day one. A dated price cannot mislead a reader who can see its vintage.
 */
const AS_AT_RE = /\b(?:as at|as of|correct(?:\s+as)?\s+at|checked)\s+(?:early |mid[- ]|late )?(?:[A-Z][a-z]+\s+)?20\d\d\b|\bat (?:the )?time of writing\b/i;

function volatileFigures(text) {
  const amounts = new Set(text.match(/\$\s?\d[\d,]*(?:\.\d{2})?/g) || []);
  const hasMoney = amounts.size > 0;
  const dated = AS_AT_RE.test(text);
  // Split on sentence-ish boundaries so "hours" three paragraphs away can't license a time.
  const tradingHours = text
    .split(/(?<=[.!?])\s+|\n+/)
    .some((s) => CLOCK_RE.test(s) && HOURS_CONTEXT_RE.test(s));
  return {
    money: hasMoney,
    /** Distinct dollar amounts. Three or more is a price list, whatever the page is about. */
    moneyCount: amounts.size,
    /** Money the reader cannot date, and therefore the only kind that earns `monthly`. */
    undatedMoney: hasMoney && !dated,
    dated,
    tradingHours,
    any: (hasMoney && !dated) || tradingHours,
  };
}

/**
 * Ordered rules — FIRST match wins, so the most volatile signal takes precedence.
 * Each rule tests the page path + the body's plain text.
 *
 * `needsFigure: true` marks the monthly tier: the topic alone is not enough, the page must
 * also quote a figure (see volatileFigures). When it doesn't, the rule's `fallback` class
 * applies instead.
 */
const RULES = [
  // --- monthly: operational facts WITH a price or a timetable actually quoted ---
  [/\bparking\b|\bcarpark\b|\bcar[- ]parks?\b|\bparking[- ]meters?\b|\bticket[- ]machine\b/i, 'monthly',
    'quotes parking rates or meter hours, which change with council pricing',
    { needsFigure: true, fallback: 'quarterly', fallbackWhy: 'parking guidance, no rate or meter hour quoted' }],
  [/\bfares?\b|\bopal\b|\btimetables?\b|\bairport\b|how[- ]to[- ]get[- ]to|getting[- ]to[- ]bondi|getting[- ]from/i, 'monthly',
    'quotes a fare or service time, set by Transport for NSW and changed without notice',
    { needsFigure: true, fallback: 'quarterly', fallbackWhy: 'transport guidance, no fare or timetable quoted' }],
  [/\bprices?\b|\bcosts?\b|how[- ]much[- ]does|\bentry[- ]fee\b|\bfees\b|\badmission\b/i, 'monthly',
    'quotes prices; a stale figure is worse than no figure',
    { needsFigure: true, fallback: 'quarterly', fallbackWhy: 'discusses cost without quoting a figure' }],
  [/opening[- ]hours|open[- ]late|\btrading[- ]hours\b/i, 'monthly',
    'quotes trading hours, which change seasonally and on short notice',
    { needsFigure: true, fallback: 'quarterly', fallbackWhy: 'hours-oriented page with no hours quoted' }],

  // --- annual: a fixed rule whose dates shift once a year ---
  [/daylight[- ]saving|clock[- ]change|\bdst\b/i, 'annual',
    'the rule is fixed; only the changeover dates move, once a year'],

  // --- quarterly: venue line-ups ---
  [/\brestaurants?\b|\bcaf[eé]s?\b|\bcoffee\b|\bbars?\b|\bpubs?\b|\bbrunch\b|\bbreakfast\b|\blunch\b|\bdinner\b|\beats?\b|\bfood\b|\bdining\b|\bbakery\b|ice[- ]cream|\bgelato\b|\bvegan\b|\bvegetarian\b|\btakeaway\b|\bnightlife\b|\bdrinks?\b/i,
    'quarterly', 'venues open, close and change hands constantly'],
  [/\baccommodation\b|\bhotels?\b|\bhostels?\b|\bairbnb\b|where[- ]to[- ]stay|\bbackpackers?\b|\bhousemate\b/i, 'quarterly',
    'properties change ownership, standards and availability'],
  [/\bshopping\b|\bmarkets?\b|\bbookstore\b|\bgyms?\b|surf[- ]school|\blessons?\b|\btours?\b/i, 'quarterly',
    'operators and offerings change through the year'],
  // Generic transport words land HERE, not in the monthly tier. Which bus goes to Bondi
  // changes far less often than what it costs, and these words appear in passing in almost
  // every guide on the site - they were the single biggest source of false monthlies.
  [/\btrains?\b|\bbuses\b|\bbus\b|\bferry\b|\btransport\b|train[- ]station|how[- ]far[- ]is/i, 'quarterly',
    'routes and services change, though far less often than fares'],

  // --- annual: a recurring event with per-edition detail ---
  [/city2surf|city[- ]to[- ]surf|\bmarathon\b|\bfestival\b|\bsculptures?\b|new[- ]years?\b|\bnye\b|\bchristmas\b|australia[- ]day|\banzac\b|event[- ]calendar/i,
    'annual', 'a recurring edition whose dates and details are reset each year'],

  // --- seasonal: keyed to time of year ---
  [/\bweather\b|\btemperatures?\b|\bseasons?\b|\bsummer\b|\bwinter\b|\bautumn\b|\bspring\b|\bwhales?\b|best[- ]time[- ]to|\bsunrise\b|\bsunset\b|\buv\b|\brain\b|\bstorms?\b|\bswell\b/i,
    'seasonal', 'guidance is keyed to the time of year'],
  [/\bswim\w*\b|\bsurf\w*\b|\bflags?\b|\bpatrol\w*\b|\blifeguards?\b|\bsharks?\b|\brips?\b|\bbluebottles?\b|water[- ]quality|beach[- ]safety/i,
    'seasonal', 'patrol seasons, water conditions and hazards vary through the year'],

  // --- evergreen: facts that do not decay ---
  [/\bhistor\w*\b|\borigins?\b|why[- ]is[- ]bondi|why[- ]bondi|\bfamous\b|\bpronounce\b|\bmeaning\b|\bnamed\b|\baboriginal\b|\bheritage\b|\barchitecture\b|man[- ]made|\bgeograph\w*\b|\bcemetery\b/i,
    'evergreen', 'historical and factual material that does not decay'],
];

/**
 * Minimum times a pattern must appear in the BODY to classify off body text alone.
 * The path has no such threshold - a slug naming the topic is decisive on its own.
 *
 * This was 3, which was far too low. Measured against the real corpus, the false positives
 * sat at 3-6 hits ("bus" mentioned in passing in a coastal-walk guide) and the genuine
 * topic pages at 12-35. 8 separates them cleanly; combined with the monthly tier's
 * figure requirement, an incidental mention can no longer set a cadence.
 */
const BODY_MIN_HITS = 8;

/** Fallback when nothing matches: a visitor guide that should still be re-read yearly. */
const DEFAULT_CLASS = 'annual';
const DEFAULT_WHY = 'general visitor guidance - re-read once a year for drift';

function textOf(rec) {
  const parts = [rec.path];
  for (const b of rec.blocks || []) {
    if (typeof b.text === 'string') parts.push(b.text);
    if (Array.isArray(b.items)) {
      for (const it of b.items) {
        if (typeof it === 'string') parts.push(it);
        else if (it && typeof it === 'object') parts.push(it.label ?? '', it.value ?? '', it.q ?? '', it.a ?? '');
      }
    }
  }
  return parts.join(' ');
}

/**
 * Resolve one matched rule, applying the monthly tier's figure requirement. A rule that
 * needs a figure and doesn't find one degrades to its own declared fallback rather than
 * falling through to the next rule - the topic match was still correct, only the cadence
 * was too aggressive.
 */
function resolve([, cls, why, opts], figures, via) {
  if (opts?.needsFigure && !figures.any) {
    const why2 = figures.dated
      ? `${opts.fallbackWhy}; figures carry an as-at date, so they cannot mislead as they age`
      : opts.fallbackWhy;
    return [opts.fallback, why2, `${via}/${figures.money ? 'dated-$' : 'no-figure'}`];
  }
  const detail = opts?.needsFigure ? `${via}/${figures.undatedMoney ? '$' : 'hours'}` : via;
  return [cls, why, detail];
}

function classify(rec) {
  const body = textOf(rec);
  const figures = volatileFigures(body);

  // A QUOTED PRICE OUTRANKS RULE ORDER.
  //
  // Without this, the body-count loop below hands the page to whichever rule reaches
  // BODY_MIN_HITS first, and an operational page loses its monthly cadence to a
  // higher-count topic word. Measured: the locker guide quotes $6/$9/$10/$15 and 6am-10pm
  // but said "café" eight times, so it was about to drop from a 45-day to a 100-day clock.
  // A page carrying live dollar figures is monthly whatever else it talks about.
  if (figures.undatedMoney) {
    const operational = RULES.filter(([, , , o]) => o?.needsFigure);
    for (const rule of operational) {
      if (rule[0].test(rec.path)) return resolve(rule, figures, 'path/$');
      const hits = body.match(new RegExp(rule[0].source, 'gi'));
      if (hits && hits.length >= 2) return resolve(rule, figures, `money×${hits.length}`);
    }
    // No operational topic word, but several distinct undated amounts: that IS a price
    // list, and the topic it sits under does not make the prices age more slowly.
    if (figures.moneyCount >= 3) {
      return ['monthly', `quotes ${figures.moneyCount} undated prices`, `amounts×${figures.moneyCount}`];
    }
  }

  // The path carries the strongest topical signal - a slug naming the topic is
  // decisive, so test it first and take the first (most volatile) match.
  for (const rule of RULES) if (rule[0].test(rec.path)) return resolve(rule, figures, 'path');

  // Otherwise fall back to the body, but only on a REPEATED signal - one passing
  // mention of a bus or a price is incidental in a travel article and would
  // otherwise drag most of the corpus into the monthly bucket.
  for (const rule of RULES) {
    const hits = body.match(new RegExp(rule[0].source, 'gi'));
    if (hits && hits.length >= BODY_MIN_HITS) return resolve(rule, figures, `body×${hits.length}`);
  }
  return [DEFAULT_CLASS, DEFAULT_WHY, 'default'];
}

export { MONEY_RE, CLOCK_RE, AS_AT_RE, RULES, BODY_MIN_HITS, DEFAULT_CLASS, DEFAULT_WHY, volatileFigures, textOf, classify };
