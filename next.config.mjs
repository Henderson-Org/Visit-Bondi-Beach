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
    ];
  },
};
export default nextConfig;
