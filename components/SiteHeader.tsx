import Link from 'next/link';
import { NAV } from '@/lib/site';
import { SiteSearch } from '@/components/SiteSearch';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-sand-50/90 backdrop-blur border-b border-sand-200">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-white focus:px-3 focus:py-2 focus:z-50">
        Skip to content
      </a>
      <div className="mx-auto max-w-6xl px-4 flex items-center gap-3 md:gap-6 h-16">
        <Link href="/" className="shrink-0 font-display text-lg md:text-xl tracking-tight text-ink-900">
          Visit <span className="text-ocean-600">Bondi Beach</span>
        </Link>
        <div className="flex-1 min-w-0 md:max-w-xs">
          <SiteSearch />
        </div>
        <nav aria-label="Primary" className="hidden lg:block shrink-0">
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
