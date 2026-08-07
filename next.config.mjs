/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Squarespace CDN originals are read during migration; re-host before launch.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.squarespace-cdn.com' },
      { protocol: 'https', hostname: '**.squarespace-cdn.com' },
      { protocol: 'https', hostname: 'static1.squarespace.com' },
    ],
  },
  async redirects() {
    // Host normalization (apex -> www, http -> https) is handled at the Vercel/DNS
    // layer. Per-URL 301s go here only if a slug must change. See migration/redirect-map.
    return [];
  },
};
export default nextConfig;
