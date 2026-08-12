/**
 * Affiliate disclosure. Shown wherever affiliate CTAs appear so the monetisation is
 * transparent (FTC / editorial-integrity requirement). Deliberately plain and honest:
 * we say what the links are and, crucially, that they don't change our recommendations.
 */
export function AffiliateDisclosure({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs text-ink-500">
        Some booking links are affiliate links - if you book through them we may earn a
        commission, at no extra cost to you. It never changes what we recommend.
      </p>
    );
  }
  return (
    <aside className="rounded-xl border border-sand-200 bg-sand-100 p-4 text-sm text-ink-500">
      <p className="font-medium text-ink-900">A note on booking links</p>
      <p className="mt-1">
        Some links on this page are affiliate links to booking partners such as Booking.com,
        Hostelworld and Tripadvisor. If you book through them we may earn a small commission -
        at no extra cost to you. We only list places we would genuinely point a friend to, and
        the commission never changes what we recommend or how we rank it. We don&rsquo;t publish
        star ratings or review scores of our own; use the booking sites for current prices,
        availability and guest reviews.
      </p>
    </aside>
  );
}
