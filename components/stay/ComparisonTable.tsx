import Link from 'next/link';
import { TAG_LABEL, type Property, type Tag } from '@/data/accommodation';
import { getGuide, overallScore } from '@/data/accommodation-guides';
import { PriceBadge } from './primitives';

/**
 * Elegant, mobile-friendly comparison table. Scrolls horizontally on small screens
 * inside its own container so the page body never scrolls sideways. Rating shows the
 * Visit Bondi Beach editorial score only where a full guide exists - never a fabricated
 * number.
 */
function yesNo(v: boolean | undefined): string {
  return v ? 'Yes' : '-';
}

function primaryTag(tags: Tag[]): string {
  return tags[0] ? TAG_LABEL[tags[0]] : '-';
}

export function ComparisonTable({ properties }: { properties: Property[] }) {
  if (!properties.length) return null;
  return (
    <div className="overflow-x-auto rounded-2xl border border-sand-200">
      <table className="w-full min-w-[44rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-sand-200 bg-sand-50 text-left">
            <th className="px-4 py-3 font-medium text-ink-700">Property</th>
            <th className="px-4 py-3 font-medium text-ink-700">Walk to beach</th>
            <th className="px-4 py-3 font-medium text-ink-700">Best for</th>
            <th className="px-4 py-3 font-medium text-ink-700">Family</th>
            <th className="px-4 py-3 font-medium text-ink-700">Pool</th>
            <th className="px-4 py-3 font-medium text-ink-700">Price</th>
            <th className="px-4 py-3 font-medium text-ink-700">Rating</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => {
            const guide = getGuide(p.slug);
            const score = guide ? overallScore(guide.scores) : null;
            return (
              <tr key={p.slug} className="border-b border-sand-200 last:border-0 align-middle">
                <th scope="row" className="px-4 py-3 text-left font-medium text-ink-900">
                  {guide ? (
                    <Link href={`/stay/${p.slug}`} className="text-ocean-700 hover:underline">{p.name}</Link>
                  ) : (
                    p.name
                  )}
                </th>
                <td className="px-4 py-3 text-ink-700">{p.walkText}</td>
                <td className="px-4 py-3 text-ink-700">{primaryTag(p.bestFor)}</td>
                <td className="px-4 py-3 text-ink-700">{yesNo(p.bestFor.includes('families'))}</td>
                <td className="px-4 py-3 text-ink-700">{yesNo(p.amenities.pool)}</td>
                <td className="px-4 py-3"><PriceBadge band={p.priceBand} /></td>
                <td className="px-4 py-3 text-ink-700">
                  {score != null ? <span className="font-semibold text-ink-900">{score.toFixed(1)}</span> : <span className="text-ink-400">-</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
