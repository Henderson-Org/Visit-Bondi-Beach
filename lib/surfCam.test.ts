/**
 * The North Bondi camera IS embeddable. An earlier change removed the iframe on the
 * strength of a `getcamerastreamstate.php` response that reported
 * cameracannotbeembedded:true - but that request omitted the `token` and `targetdomain`
 * parameters the player actually sends, and without them the endpoint returns that for
 * every domain, including the club's own. Sent correctly, it answers streamavailable:1
 * for this site. The reasoning is recorded in components/SurfCam.tsx.
 *
 * These tests keep the embed in place and keep the escape hatch next to it, so a dark
 * player is never again a bare black rectangle with no way out.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const RAW = readFileSync('components/SurfCam.tsx', 'utf8');
// Assert on the code, not the explanatory comment above it.
const SRC = RAW.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('SurfCam', () => {
  it('embeds the club camera', () => {
    expect(SRC).toMatch(/<iframe/);
    expect(SRC).toContain('g3.ipcamlive.com/player/player.php');
    expect(SRC, 'wrong camera alias').toContain('alias=687a39cf71c58');
  });

  it('keeps the embed muted, lazy and non-overflowing', () => {
    expect(SRC).toContain('mute=1');
    expect(SRC).toContain('loading="lazy"');
    // A fixed height would overflow on a phone; the ratio box is what keeps it safe.
    expect(SRC).toMatch(/aspect-\[16\/9\]/);
  });

  it('offers a way out if the player is ever dark again', () => {
    // The failure mode that went unnoticed for a week was a black rectangle with no
    // explanation and nothing to click.
    expect(SRC).toContain('https://northbondisurfclub.com/webcam/');
    expect(SRC).toMatch(/Not loading/i);
  });

  it('does not hotlink the raw stream or its snapshot', () => {
    // We frame the club's player, which carries their branding. We do not reproduce the
    // stream itself.
    expect(SRC).not.toContain('.m3u8');
    expect(SRC).not.toContain('snapshot.jpg');
    expect(SRC).not.toMatch(/s\d+\.ipcamlive\.com/);
  });
});
