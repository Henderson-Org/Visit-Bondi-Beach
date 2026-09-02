/**
 * The North Bondi camera is domain-locked to northbondisurfclub.com (ipcamlive's own state
 * endpoint returns cameracannotbeembedded: true and withholds the stream id for any other
 * domain). Embedding it here therefore renders a black rectangle, which is what it did on
 * the homepage for about a week before anyone noticed - a silent failure, because the
 * iframe still returns 200 and simply plays nothing.
 *
 * These tests exist so it cannot come back silently. The full investigation, including the
 * two dead ends, is in the comment at the top of components/SurfCam.tsx.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Assert against the CODE, not the comments. The comment block above the component names
// the player URL and the snapshot endpoint on purpose - it is the record of what was
// investigated - so matching raw file text would fail on its own documentation.
const SRC = readFileSync('components/SurfCam.tsx', 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

describe('SurfCam', () => {
  it('does not embed the domain-locked player', () => {
    expect(SRC, 'the ipcamlive player is domain-locked and renders black here').not.toContain(
      'ipcamlive.com/player',
    );
    expect(SRC).not.toMatch(/<iframe/);
  });

  it('does not hotlink the stream or its snapshot', () => {
    // Both are reachable, and using either would route around an access control the club
    // deliberately turned on. Linking out is the deal.
    expect(SRC).not.toContain('.m3u8');
    expect(SRC).not.toContain('snapshot.jpg');
    expect(SRC).not.toMatch(/s\d+\.ipcamlive\.com/);
  });

  it('links to the club, where the camera does work', () => {
    expect(SRC).toContain('https://northbondisurfclub.com/webcam/');
  });

  it('renders nothing that can look like a dead black box', () => {
    // The old markup was a 16:9 container with bg-ink-900 behind the iframe, so when the
    // player played nothing the module WAS the black rectangle.
    expect(SRC).not.toContain('bg-ink-900');
  });
});
