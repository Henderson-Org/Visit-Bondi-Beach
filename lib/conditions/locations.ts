/**
 * Destination → data-location mapping (the site's editable data layer).
 *
 * This is the ONE place to edit where each destination gets its weather and surf
 * data, and which official pages to link for authoritative forecasts/safety.
 * Add a destination by adding an entry here — no UI or provider changes needed.
 *
 * `beachFacingDeg` is the compass bearing the beach looks out to sea (used to work
 * out onshore/offshore wind). Bondi faces roughly east-southeast (~110°).
 */
import type { ConditionsLocation } from './types';

export const DESTINATIONS: Record<string, ConditionsLocation> = {
  bondi: {
    key: 'bondi',
    label: 'Bondi',
    displayName: 'Bondi',
    inland: false,
    weather: { lat: -33.8908, lon: 151.2743, label: 'Bondi Beach' },
    surf: { lat: -33.8908, lon: 151.2773, label: 'Bondi Beach', beachFacingDeg: 110 },
    safetyUrl: 'https://beachsafe.org.au/beach/bondi-beach',
    authoritativeWeatherUrl: 'https://www.bom.gov.au/places/nsw/bondi-beach/',
    authoritativeSurfUrl: 'https://www.bom.gov.au/nsw/forecasts/sydneycoast.shtml',
  },
};

export const DEFAULT_DESTINATION = 'bondi';

/** Resolve a destination by key, falling back to the site default. */
export function getDestination(key?: string | null): ConditionsLocation {
  if (key && DESTINATIONS[key]) return DESTINATIONS[key];
  return DESTINATIONS[DEFAULT_DESTINATION];
}

/**
 * Resolve the destination for the page the visitor is viewing. This site is
 * Bondi-only, so every page maps to Bondi; the signature is future-proofed so a
 * multi-destination site can map a path/slug to the right destination here
 * (e.g. a "/sydney/..." or "/gold-coast/..." prefix) without touching the UI.
 */
export function destinationForPath(_path?: string | null): ConditionsLocation {
  return DESTINATIONS[DEFAULT_DESTINATION];
}
