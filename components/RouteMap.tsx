/**
 * Light route / "where things are" module — a static, horizontally-scrollable
 * stepped route (connected dots + labels). No external map tiles or JS, so it's
 * fast and needs no API key; it gives visitors the sequence and context at a
 * glance (used on Coastal Walk and Getting Here).
 */
export interface RouteStop {
  label: string;
  sub?: string;
}

export function RouteMap({ title, stops, note }: { title?: string; stops: RouteStop[]; note?: string }) {
  if (!stops?.length) return null;
  return (
    <section aria-label={title || 'Route'} className="rounded-2xl border border-sand-200 bg-white p-5 sm:p-6">
      {title && <h2 className="font-display text-xl text-ink-900">{title}</h2>}
      <ol className={`${title ? 'mt-4' : ''} flex overflow-x-auto pb-2`}>
        {stops.map((s, i) => (
          <li key={s.label} className="relative flex min-w-[7rem] flex-1 flex-col items-center px-2 text-center sm:min-w-0">
            {i > 0 && (
              <span className="absolute left-[-50%] top-[7px] -z-0 h-0.5 w-full bg-sand-300" aria-hidden="true" />
            )}
            <span className="relative z-10 h-4 w-4 rounded-full border-2 border-ocean-500 bg-white" />
            <p className="mt-2 text-sm font-medium leading-tight text-ink-900">{s.label}</p>
            {s.sub && <p className="mt-0.5 text-xs leading-tight text-ink-500">{s.sub}</p>}
          </li>
        ))}
      </ol>
      {note && <p className="mt-3 text-xs text-ink-500">{note}</p>}
    </section>
  );
}
