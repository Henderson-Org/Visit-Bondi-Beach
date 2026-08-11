/**
 * LocationMap — a lightweight embedded map for a location page.
 *
 * Uses a Google Maps place-name query embed (no API key, no JS library, no tracking SDK),
 * so we add zero mapping dependency and never assert our own coordinates — Google resolves
 * the named place. Lazy-loaded and kept inside the content width with a fixed aspect ratio,
 * so it never overflows on mobile.
 */
export function LocationMap({ query, name }: { query: string; name: string }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
  return (
    <div className="mt-4 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-sand-200 bg-sand-100 shadow-sm sm:aspect-[16/9]">
      <iframe
        src={src}
        title={`Map of ${name}, Bondi`}
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
