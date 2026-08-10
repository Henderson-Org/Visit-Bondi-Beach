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
    ];
  },
};
export default nextConfig;
