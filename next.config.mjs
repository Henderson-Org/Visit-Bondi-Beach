/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // All images are self-hosted under /public/images and optimised by Vercel's
    // next/image. No remote hosts are allowed — in particular NO Squarespace CDN:
    // if a Squarespace image URL ever slipped back into the content, next/image
    // would refuse to render it (a build/runtime error) rather than silently
    // loading from Squarespace. This makes the independence enforced, not incidental.
    remotePatterns: [],
  },
  async redirects() {
    // Host normalization (apex -> www, http -> https) is handled at the Vercel/DNS
    // layer. Per-URL 301s go here only if a slug must change. See migration/redirect-map.
    return [
      // The old single accommodation page was rebuilt as the /stay section.
      // 301 (permanent) so the page's existing link equity flows to the new hub.
      { source: '/accommodation', destination: '/stay', statusCode: 301 },
      // Thin, 0-impression guide superseded by the richer /bondi-beach location page.
      { source: '/visit-bondi-beach-guide', destination: '/bondi-beach', statusCode: 301 },
      // "What's On" became the events hub; the old blog INDEX is now the Articles hub.
      // Only the index redirects — individual /bondi-blog/[post] article URLs are
      // preserved exactly to keep their rankings and backlinks.
      { source: '/bondi-blog', destination: '/articles', statusCode: 301 },

      // Content consolidation (301s to the stronger page in each cluster) — removes
      // keyword cannibalisation between near-duplicate articles. No redirect chains:
      // every destination is a canonical page that is not itself redirected.
      // Café / coffee cluster → the canonical Bondi cafés guide:
      { source: '/bondi-blog/2026/3/24/bondis-best-cafs-right-now-where-to-eat-sip-and-soak-up-the-beach-vibe', destination: '/bondi-blog/2025/4/27/top-10-bondi-cafs-in-2025-best-coffee-brunch-by-the-beach', statusCode: 301 },
      { source: '/bondi-blog/2025/6/26/ranked-bondis-top-10-coffee-spots-you-cant-miss', destination: '/bondi-blog/2025/4/27/top-10-bondi-cafs-in-2025-best-coffee-brunch-by-the-beach', statusCode: 301 },
      { source: '/bondi-blog/2024/1/19/bondis-best-coffee-shops', destination: '/bondi-blog/2025/4/27/top-10-bondi-cafs-in-2025-best-coffee-brunch-by-the-beach', statusCode: 301 },
      // Bondi Rescue cluster → the stronger page in each pair:
      { source: '/bondi-blog/2024/12/1/ranked-20-most-dramatic-bondi-rescue-rescues', destination: '/bondi-blog/2025/1/12/the-20-most-dramatic-moments-on-bondi-rescue', statusCode: 301 },
      { source: '/bondi-blog/2025/4/29/behind-the-scenes-at-bondi-rescue-20-things-you-may-not-know-about-the-show', destination: '/bondi-blog/2023/9/5/20-obscure-facts-about-bondi-rescue', statusCode: 301 },
      { source: '/bondi-blog/meet-bondi-lifeguards', destination: '/bondi-blog/bondi-rescue-who-are-the-lifeguards', statusCode: 301 },

      // Cannibalisation consolidation, round 2 (evidence-based on embedded Search Console
      // impressions — each source is a near-zero-impression duplicate; destination is the
      // higher-equity canonical page in its cluster). No redirect chains: every destination
      // is itself indexable and not a redirect source.
      // "Why is Bondi famous / popular" → the 25-impression history/fame page:
      { source: '/bondi-blog/why-is-bondi-so-popular', destination: '/bondi-blog/2024/9/12/why-bondi-beach-is-so-famous-history-fame-and-culture', statusCode: 301 },
      { source: '/bondi-blog/why-is-bondi-beach-famous', destination: '/bondi-blog/2024/9/12/why-bondi-beach-is-so-famous-history-fame-and-culture', statusCode: 301 },
      // "Best time to visit" → the 11-impression seasonal guide:
      { source: '/bondi-blog/2018/10/17/when-is-the-best-time-to-visit-bondi-beach', destination: '/bondi-blog/2024/6/9/the-best-time-to-visit-bondi-beach-a-seasonal-guide', statusCode: 301 },
      { source: '/bondi-blog/2025/3/8/best-time-to-visit-bondi-beach-seasonal-guide-to-weather-events', destination: '/bondi-blog/2024/6/9/the-best-time-to-visit-bondi-beach-a-seasonal-guide', statusCode: 301 },
      // Ice cream (generic) → the canonical best-ice-cream guide:
      { source: '/bondi-blog/2024/9/21/locals-guide-to-bondi-beachs-best-ice-cream', destination: '/bondi-blog/2024/2/12/an-insiders-guide-to-the-best-ice-cream-in-bondi', statusCode: 301 },
      // "How far is Bondi" → the 20-impression key-locations page:
      { source: '/bondi-blog/2018/9/11/how-far-is-bondi-beach-from-sydney', destination: '/bondi-blog/2025/1/2/how-far-is-bondi-beach-from-key-sydney-locations', statusCode: 301 },
      // Getting there → the 11-impression how-to-get-to page:
      { source: '/bondi-blog/transport-to-bondi-beach', destination: '/bondi-blog/how-to-get-to-bondi-beach', statusCode: 301 },
      // Rainy day / wet weather → the single canonical rainy-day guide:
      { source: '/bondi-blog/2025/4/29/ultimate-wet-weather-guide-to-bondi-rainy-day-activities-tips', destination: '/bondi-blog/2025/5/23/rain-or-shine-7-must-do-indoor-activities-in-bondi-beach-on-a-rainy-day', statusCode: 301 },
      { source: '/bondi-blog/2023/11/5/things-to-do-at-bondi-beach-in-the-rain', destination: '/bondi-blog/2025/5/23/rain-or-shine-7-must-do-indoor-activities-in-bondi-beach-on-a-rainy-day', statusCode: 301 },

      // Cannibalisation consolidation, round 3 (all near-zero impressions; no chains —
      // destinations are canonical pages that are not themselves redirect sources).
      // Restaurants (3 competing "best Bondi restaurants" pages) → the clean-slug canonical:
      { source: '/bondi-blog/2023/11/8/definitive-guide-to-bondis-best-restaurants', destination: '/bondi-blog/best-restaurants-bondi-beach', statusCode: 301 },
      { source: '/bondi-blog/2025/4/25/must-experience-bondi-restaurants-our-top-10-best-restaurants-ranked', destination: '/bondi-blog/best-restaurants-bondi-beach', statusCode: 301 },
      // Best time to visit (thin duplicate) → the 11-impression seasonal guide:
      { source: '/bondi-blog/best-time-to-visit-bondi-beach', destination: '/bondi-blog/2024/6/9/the-best-time-to-visit-bondi-beach-a-seasonal-guide', statusCode: 301 },
      // City2Surf training duplicates → the 58-impression Heartbreak Hill training pillar:
      { source: '/bondi-blog/2017/4/28/city2surf-time-to-start-training', destination: '/bondi-blog/2025/6/18/how-to-train-for-heartbreak-hill-without-being-a-fitness-freak', statusCode: 301 },
      { source: '/bondi-blog/city-to-surf-training-plan', destination: '/bondi-blog/2025/6/18/how-to-train-for-heartbreak-hill-without-being-a-fitness-freak', statusCode: 301 },
      { source: '/bondi-blog/2024/7/25/help-3-week-city2surf-training-plan', destination: '/bondi-blog/2025/6/18/how-to-train-for-heartbreak-hill-without-being-a-fitness-freak', statusCode: 301 },

      // Cannibalisation consolidation, round 4 (owner-approved 2026-08-11). Each source is a
      // near-zero-traffic duplicate whose intent is fully covered by a RICHER survivor, so no
      // content is buried (the "migrate the richer body first" rule is satisfied — survivor
      // word counts exceed every source below). No chains: destinations are canonical pages.
      // "Ultimate Bondi travel guide" cluster (3 dups) → the 1,982-word what-to-do pillar (465 YTD):
      { source: '/bondi-blog/2026/2/21/the-ultimate-bondi-beach-travel-guide-2026-edition', destination: '/bondi-blog/what-to-do-bondi-beach-travel-guide', statusCode: 301 },
      { source: '/bondi-blog/2025/4/30/ultimate-bondi-beach-travel-guide-how-to-get-there-when-to-visit-top-things-to-do', destination: '/bondi-blog/what-to-do-bondi-beach-travel-guide', statusCode: 301 },
      { source: '/bondi-blog/2025/3/8/the-ultimate-bondi-beach-travel-guide-must-see-spots-hidden-gems', destination: '/bondi-blog/what-to-do-bondi-beach-travel-guide', statusCode: 301 },
      // Bondi Icebergs "can you swim" swarm → the two protected pillars (kept). Thin satellites only:
      { source: '/bondi-blog/2025/1/5/who-can-swim-at-bondi-icebergs-ocean-pool', destination: '/bondi-blog/can-anyone-swim-at-bondi-icebergs-swimming-pool', statusCode: 301 },
      { source: '/bondi-blog/access-bondi-icebergs-pool', destination: '/bondi-blog/can-anyone-swim-at-bondi-icebergs-swimming-pool', statusCode: 301 },
      { source: '/bondi-blog/is-bondi-icebergs-pool-heated', destination: '/bondi-blog/2025/4/30/bondi-icebergs-ocean-pool-faq-20-essential-questions-answered-hours-fees-membership-more', statusCode: 301 },
      { source: '/bondi-blog/how-long-is-bondi-icebergs-poo', destination: '/bondi-blog/2025/4/30/bondi-icebergs-ocean-pool-faq-20-essential-questions-answered-hours-fees-membership-more', statusCode: 301 },
      // Round 5 (GSC-driven consolidation, 2026-08-14): three cannibalising clusters.
      // Whale watching: two dated near-dupes (3 + 4 impressions) -> the evergreen guide (8, translated x7).
      { source: '/bondi-blog/whale-watching-bondi-guide-2024', destination: '/bondi-blog/whale-watching-bondi-beach', statusCode: 301 },
      { source: '/bondi-blog/2025/4/27/whale-watching-season-at-bondi-2025-everything-you-need-to-know', destination: '/bondi-blog/whale-watching-bondi-beach', statusCode: 301 },
      // Icebergs public-access: same query intent (9 imp) -> the 46-impression survivor; richer body migrated first.
      { source: '/bondi-blog/2024/9/21/can-the-public-swim-at-bondi-icebergs-ocean-pool', destination: '/bondi-blog/can-anyone-swim-at-bondi-icebergs-swimming-pool', statusCode: 301 },
      // Bondi parking: duplicate topic (15 imp) -> the 75-impression, most-backlinked article; unique blocks migrated.
      { source: '/bondi-blog/2025/4/25/ultimate-bondi-beach-parking-guide-free-and-paid-options-for-busy-days', destination: '/bondi-blog/where-to-find-carpark-bondi-beach', statusCode: 301 },
      // Festival of the Winds: a dated 2023 URL whose title still said "2024" -> one
      // evergreen guide that is updated each year rather than a new page per edition.
      { source: '/bondi-blog/2023/9/9/soaring-high-at-bondi-beach-festival-of-the-winds', destination: '/bondi-blog/festival-of-the-winds-bondi', statusCode: 301 },
    ];
  },
};
export default nextConfig;
