import Link from 'next/link';
import { NAV, SITE } from '@/lib/site';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-sand-50/90 backdrop-blur border-b border-sand-200">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-white focus:px-3 focus:py-2 focus:z-50">
        Skip to content
      </a>
      <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-16">
        <Link href="/" className="font-display text-lg md:text-xl tracking-tight text-ink-900">
          Visit <span className="text-ocean-600">Bondi Beach</span>
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-5 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-ink-700 hover:text-ocean-700">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href={SITE.instagram}
          className="md:hidden text-sm text-ocean-700 font-medium"
          aria-label="Menu"
        >
          Menu
        </a>
      </div>
      {/* Mobile nav: simple, crawlable, no JS dependency */}
      <nav aria-label="Primary mobile" className="md:hidden border-t border-sand-200 overflow-x-auto">
        <ul className="flex gap-4 px-4 py-2 text-sm whitespace-nowrap">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="text-ink-700 hover:text-ocean-700">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
