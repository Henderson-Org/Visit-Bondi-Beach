'use client';

/**
 * Interactive footer for the conditions module: the expandable "more detail" row,
 * the source/updated provenance lines, and the beach-safety link.
 *
 * Analytics: fires GA4 events ONLY on genuine interaction (expand, safety click) -
 * never on load. gtag is present only in production (see components/Analytics.tsx),
 * so these are no-ops elsewhere.
 */
import { useState } from 'react';

export interface Labelled {
  label: string;
  value: string;
}
export interface ConditionsFooterProps {
  details: Labelled[];
  hasSurf: boolean;
  weatherSource: string | null;
  weatherUpdated: string | null;
  surfSource: string | null;
  surfUpdated: string | null;
  tideSource: string | null;
  safetyUrl: string | null;
}

function track(event: string) {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  gtag?.('event', event);
}

export function ConditionsFooter(props: ConditionsFooterProps) {
  const { details, hasSurf, weatherSource, weatherUpdated, surfSource, surfUpdated, tideSource, safetyUrl } = props;
  const [open, setOpen] = useState(false);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      track('weather_summary_expanded');
      if (hasSurf) track('surf_details_opened');
    }
  };

  return (
    <div className="mt-3">
      {details.length > 0 && (
        <>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="text-xs font-medium text-ocean-700 hover:underline"
          >
            {open ? 'Hide detail ▴' : 'More detail ▾'}
          </button>
          {open && (
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
              {details.map((d) => (
                <div key={d.label} className="flex justify-between gap-2 border-b border-sand-200 py-1">
                  <dt className="text-xs text-ink-500">{d.label}</dt>
                  <dd className="text-xs font-medium text-ink-900">{d.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
        {weatherSource && (
          <span>
            Weather: {weatherSource}
            {weatherUpdated ? ` · Updated ${weatherUpdated}` : ''}
          </span>
        )}
        {surfSource && (
          <>
            <span aria-hidden="true"> · </span>
            <span>
              Surf: {surfSource}
              {surfUpdated ? ` · Updated ${surfUpdated}` : ''}
            </span>
          </>
        )}
        {tideSource && (
          <>
            <span aria-hidden="true"> · </span>
            <span>Tide: {tideSource}</span>
          </>
        )}
      </p>

      {safetyUrl && (
        <p className="mt-1 text-[11px] text-ink-500">
          Always check current beach conditions and swim between the red and yellow flags -{' '}
          <a
            href={safetyUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={() => track('beach_safety_clicked')}
            className="text-ocean-700 underline"
          >
            beach safety info
          </a>
          .
        </p>
      )}
    </div>
  );
}
