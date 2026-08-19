import type { Metadata } from 'next';

/**
 * Private admin shell.
 *
 * Indexing is blocked in four independent ways: this noindex metadata, the
 * X-Robots-Tag header set by middleware.ts, the robots.txt disallow, and the absence
 * of /admin from the sitemap and from every public link. None of these is the security
 * boundary - middleware auth is.
 */
export const metadata: Metadata = {
  title: { absolute: 'Analytics' },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-sand-50">{children}</div>;
}
