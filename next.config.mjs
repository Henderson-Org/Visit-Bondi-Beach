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
    ];
  },
};
export default nextConfig;
