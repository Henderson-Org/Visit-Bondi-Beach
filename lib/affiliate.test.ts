import { describe, it, expect } from 'vitest';
import { getAffiliateLink } from './affiliate';

describe('affiliate link safety', () => {
  it('strips any third-party affiliate/tracking params from an OTA target URL', () => {
    // A Booking URL contaminated with a foreign Commission Junction affiliate id + trackers,
    // exactly like the one an affiliate-injecting browser extension produced.
    const dirty =
      'https://www.booking.com/searchresults.html?ss=QT+Bondi&aid=818288&label=affnetcj-11916287_pub-5108952&utm_source=affnetcj&cjevent=abc123';
    const { href } = getAffiliateLink({ provider: 'booking', destination: 'Bondi Beach', targetUrl: dirty });
    expect(href).not.toMatch(/aid=/);
    expect(href).not.toMatch(/818288/);
    expect(href).not.toMatch(/affnetcj/);
    expect(href).not.toMatch(/cjevent/);
    expect(href).not.toMatch(/utm_/);
    // The functional search param survives.
    expect(href).toMatch(/ss=QT/);
  });

  it('generated Booking search links carry no affiliate id of any kind', () => {
    const { href } = getAffiliateLink({ provider: 'booking', destination: 'Bondi Beach', property: 'QT Bondi' });
    expect(href).not.toMatch(/aid=/);
    expect(href).not.toMatch(/affnetcj|cjevent|818288/);
  });

  it('never rewrites our own Klook affiliate deep link', () => {
    const klook = 'https://s.klook.com/c/2XALb2zD3l';
    const { href, label } = getAffiliateLink({ provider: 'booking', destination: 'Bondi', targetUrl: klook });
    expect(href).toBe(klook);
    expect(label).toBe('Klook');
  });
});
