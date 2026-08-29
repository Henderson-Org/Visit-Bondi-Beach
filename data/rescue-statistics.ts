/**
 * Surf lifesaving statistics for the Sydney Branch, extracted from Surf Life Saving NSW
 * annual reports.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * READ THIS BEFORE USING THESE NUMBERS FOR ANYTHING.
 *
 * These are NOT "rescues at Bondi Beach". Two separate services rescue people at Bondi,
 * and this dataset covers one of them, at a wider geography:
 *
 *   • Waverley Council lifeguards — the paid, year-round professionals seen on Bondi
 *     Rescue. They patrol Bondi, Tamarama and Bronte 365 days a year and perform the
 *     majority of Bondi's rescues. Their per-beach figures are NOT published in any
 *     source we could obtain; they appear only in council reporting. See
 *     docs/rescue-data-request.md for the GIPA request that would obtain them, and for
 *     how to merge them in WITHOUT summing the two services (they count differently).
 *
 *   • Volunteer surf lifesavers — the club members in red and yellow, patrolling
 *     weekends and public holidays in season. Their statistics are published by Surf
 *     Life Saving NSW, but only aggregated to BRANCH level, never per beach.
 *
 * So the figures below are Surf Life Saving Sydney Branch: every volunteer club from
 * the eastern beaches through to the south, of which Bondi's two clubs (Bondi Surf
 * Bathers' Life Saving Club and North Bondi SLSC) are a part. Presenting them as Bondi
 * figures would be a fabrication. Every consumer of this data must carry that framing.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * Extraction method: each figure was read from the branch-column table in the report's
 * own statistics appendix and reconciled against the NSW total printed in that same row.
 * Any figure whose columns did not sum to the printed total was REJECTED rather than
 * guessed at — which is why one preventative-actions figure below is null.
 */

export interface RescueSeason {
  /** Australian surf lifesaving season, July–June, e.g. "2023/24". */
  season: string;
  /** Calendar year the season ended — used for sorting and charting. */
  endYear: number;
  /** Rescues by Sydney Branch volunteer surf lifesavers. */
  rescues: number;
  /** Preventative actions (moving swimmers to safety before trouble). Null if unverified. */
  preventativeActions: number | null;
  /** First aid treatments. */
  firstAids: number | null;
  /** Beach attendance recorded across the branch's patrolled beaches. */
  attendance: number | null;
  /** NSW-wide rescues that season, for context. */
  nswRescues: number;
  source: {
    title: string;
    url: string;
    /** 0-indexed PDF page the statistics table appears on. */
    page: number;
  };
}

const REPORT = (year: number, url: string, page: number) => ({
  title: `Surf Life Saving NSW Annual Report ${year - 1}/${String(year).slice(2)}`,
  url,
  page,
});

/**
 * Seasons we could verify. Gaps are real gaps: the 2018/19, 2020/21 and 2021/22 reports
 * were either not retrievable or did not reconcile, and are omitted rather than estimated.
 */
export const RESCUE_SEASONS: RescueSeason[] = [
  {
    season: '2016/17', endYear: 2017,
    rescues: 1801, preventativeActions: 32141, firstAids: 4857, attendance: 1607246,
    nswRescues: 4966,
    source: REPORT(2017, 'https://www.surflifesaving.com.au/wp-content/uploads/sites/2/2017/11/2017-SLSNSW-Annual-Report.pdf', 75),
  },
  {
    season: '2017/18', endYear: 2018,
    rescues: 1547, preventativeActions: 39748, firstAids: 4226, attendance: 1423861,
    nswRescues: 4377,
    source: REPORT(2018, 'https://www.surflifesaving.com.au/wp-content/uploads/sites/2/2021/07/2017-18-SLSNSW-Annual-Report_0.pdf', 95),
  },
  {
    season: '2019/20', endYear: 2020,
    rescues: 747, preventativeActions: 70407, firstAids: 1910, attendance: 1263363,
    nswRescues: 2526,
    source: REPORT(2020, 'https://www.surflifesaving.com.au/wp-content/uploads/sites/2/2021/07/2020-Annual-Report.pdf', 89),
  },
  {
    season: '2022/23', endYear: 2023,
    rescues: 1284,
    // The preventative-actions row in this report did not reconcile against its own
    // printed NSW total (columns summed to 166,146 against a printed 175,684), so the
    // branch figure is not trustworthy and is omitted.
    preventativeActions: null,
    firstAids: 2173, attendance: 1801931,
    nswRescues: 3505,
    source: REPORT(2023, 'https://www.surflifesaving.com.au/wp-content/uploads/sites/2/2023/10/2023-Surf-Life-Saving-NSW-Annual-Report.pdf', 79),
  },
  {
    season: '2023/24', endYear: 2024,
    rescues: 1166, preventativeActions: 44512, firstAids: 3129, attendance: 1759273,
    nswRescues: 3222,
    source: REPORT(2024, 'https://www.surflifesaving.com.au/wp-content/uploads/sites/2/2024/10/2024-Surf-Life-Saving-NSW-Annual-Report.pdf', 77),
  },
];

/** The Bondi-area clubs that sit inside this branch. */
export const BONDI_CLUBS = [
  'Bondi Surf Bathers’ Life Saving Club',
  'North Bondi SLSC',
] as const;

/** Neighbouring clubs also inside the branch, so the scope is concrete for a reader. */
export const NEIGHBOURING_CLUBS = ['Tamarama SLSC', 'Bronte SLSC', 'Clovelly SLSC'] as const;

export const DATASET_LAST_UPDATED = '2026-08-28';
