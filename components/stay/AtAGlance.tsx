import { TAG_LABEL, type Property } from '@/data/accommodation';
import { GlanceItem } from './primitives';

const PARKING_LABEL: Record<NonNullable<Property['amenities']['parking']>, string> = {
  onsite: 'On-site',
  paid: 'Paid nearby',
  limited: 'Limited',
  none: 'None on-site',
};

/**
 * "At a glance" facts grid for a property page. Renders only what we actually know
 * (unknown fields are omitted, never guessed). Values are durable facts.
 */
export function AtAGlance({ property, transport }: { property: Property; transport?: string }) {
  const a = property.amenities;
  const items: { label: string; value: string }[] = [];

  if (property.bestFor.length) {
    items.push({ label: 'Best for', value: property.bestFor.slice(0, 2).map((t) => TAG_LABEL[t]).join(' · ') });
  }
  items.push({ label: 'Beach proximity', value: property.walkText });
  items.push({ label: 'Family suitability', value: property.bestFor.includes('families') ? 'Well suited' : 'Better for couples' });
  if (a.pool !== undefined) items.push({ label: 'Pool', value: a.pool ? 'Yes' : 'No' });
  if (a.kitchen !== undefined) items.push({ label: 'Kitchen', value: a.kitchen ? 'In-room' : 'No' });
  if (a.parking) items.push({ label: 'Parking', value: PARKING_LABEL[a.parking] });
  if (a.oceanViews !== undefined) items.push({ label: 'Views', value: a.oceanViews ? 'Ocean (some rooms)' : 'Not ocean-facing' });
  if (transport) items.push({ label: 'Transport', value: transport });
  if (a.accessibility) items.push({ label: 'Accessibility', value: a.accessibility });

  return (
    <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {items.map((it) => (
        <GlanceItem key={it.label} label={it.label} value={it.value} />
      ))}
    </dl>
  );
}
