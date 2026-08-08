'use client';

import type { Itinerary } from '@/lib/generateBondiItinerary';
import { VenueCard } from '@/components/VenueCard';
import { ExperienceCard } from '@/components/ExperienceCard';

function formatClock(min: number): string {
  let h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function ItineraryTimeline({
  itinerary,
  debug,
  onSwap,
}: {
  itinerary: Itinerary;
  debug?: boolean;
  onSwap: (index: number) => void;
}) {
  return (
    <ol className="space-y-0">
      {itinerary.items.map((item, i) => (
        <li key={`${item.key}-${i}`}>
          {item.kind === 'venue' ? (
            <VenueCard item={item} timeLabel={formatClock(item.startMin)} debug={debug} onSwap={() => onSwap(i)} />
          ) : (
            <ExperienceCard item={item} timeLabel={formatClock(item.startMin)} debug={debug} onSwap={() => onSwap(i)} />
          )}
          {item.walkToNextMins !== undefined && (
            <div className="flex items-center gap-2 py-2.5 pl-4 text-xs text-ink-500">
              <span aria-hidden="true">↓</span>
              {item.walkToNextMins <= 1 ? 'Right next door' : `${item.walkToNextMins}-minute walk`}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
