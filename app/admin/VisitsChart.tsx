'use client';

import { useId, useState } from 'react';

export interface ChartPoint {
  key: string;
  label: string;
  visits: number;
}

/**
 * "Visits over time" line graph.
 *
 * Inline SVG, matching the approach already used by the Coffee Index page - no charting
 * dependency, so the admin bundle stays tiny. Plots per-bucket visits (never cumulative).
 * Hovering or focusing a point shows its exact value; the underlying data is also exposed
 * as a real table to screen readers via aria-describedby.
 */
export function VisitsChart({ points }: { points: ChartPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();

  if (!points.length) {
    return (
      <p className="py-12 text-center text-sm text-ink-500">
        No visits recorded in this period.
      </p>
    );
  }

  const W = 100;
  const H = 32;
  const max = Math.max(...points.map((p) => p.visits), 1);
  const n = points.length;
  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - (v / max) * H;

  const line = points.map((p, i) => `${x(i).toFixed(2)},${y(p.visits).toFixed(2)}`).join(' ');
  const area = `0,${H} ${line} ${W},${H}`;

  // Show at most ~6 x-axis labels so they never overlap on small screens.
  const step = Math.max(1, Math.ceil(n / 6));
  const shown = points.map((p, i) => ({ p, i })).filter(({ i }) => i % step === 0 || i === n - 1);

  const current = active === null ? null : points[active];

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`-2 -3 ${W + 4} ${H + 8}`}
          className="w-full"
          role="img"
          aria-label={`Visits over time. Peak ${max} visits.`}
          aria-describedby={tableId}
          preserveAspectRatio="none"
          style={{ height: 220 }}
        >
          <polygon points={area} fill="currentColor" className="text-ocean-500/10" />
          <polyline
            points={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.6}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="text-ocean-600"
            vectorEffect="non-scaling-stroke"
          />
          {points.map((p, i) => (
            <circle
              key={p.key}
              cx={x(i)}
              cy={y(p.visits)}
              r={active === i ? 1.4 : 0.8}
              className="text-ocean-700"
              fill="currentColor"
              tabIndex={0}
              role="button"
              aria-label={`${p.label}: ${p.visits} visits`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            />
          ))}
        </svg>

        {current && (
          <div
            role="status"
            className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg bg-ink-900 px-2.5 py-1 text-xs text-white shadow"
          >
            {current.label}: <strong>{current.visits.toLocaleString()}</strong> visit
            {current.visits === 1 ? '' : 's'}
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-ink-500">
        {shown.map(({ p }) => (
          <span key={p.key}>{p.label}</span>
        ))}
      </div>

      {/* Accessible equivalent of the graph. */}
      <table id={tableId} className="sr-only">
        <caption>Visits over time</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Visits</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.key}>
              <th scope="row">{p.label}</th>
              <td>{p.visits}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
