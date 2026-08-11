import Link from 'next/link';
import { HUB_NAV, SITE } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-sand-200 bg-sand-100">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-2 md:grid-cols-5">
        <div className="sm:col-span-2 md:col-span-1">
          <div className="font-display text-lg text-ink-900">Visit Bondi Beach</div>
          <p className="mt-2 text-sm text-ink-500 max-w-xs">{SITE.tagline}.</p>
          <a href={SITE.instagram} className="mt-3 inline-block text-sm text-ink-500 hover:text-ocean-700">
            @visitbondibeach
          </a>
        </div>
        {/* Full hub set — the crawlable authority backbone: every topic hub one click from every page. */}
        {HUB_NAV.map((col) => (
          <nav key={col.group} aria-label={col.group} className="text-sm">
            <h2 className="font-medium text-ink-900 mb-2">{col.group}</h2>
            <ul className="space-y-1">
              {col.items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="text-ink-500 hover:text-ocean-700">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-sand-200">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-ink-500">
          © {new Date().getFullYear()} Visit Bondi Beach. Sydney, Australia.
        </div>
      </div>
    </footer>
  );
}
