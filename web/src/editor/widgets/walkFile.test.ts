import { describe, expect, it } from 'vitest';
import { checkWalkFile } from './walkFile';

const walk = (o: object = {}) =>
  JSON.stringify({
    version: 1,
    game: 'adam_2!',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: '' }],
    chapters: [],
    timeline: { fps: 60, frames: 10, chapters: [] },
    ...o,
  });

describe('checkWalkFile', () => {
  it('accepts a walkthrough for the open game', () => {
    expect(checkWalkFile(walk(), 'ADAM_2!.GAM', 9).ok).toBe(true);
  });
  it('refuses another version', () => {
    const r = checkWalkFile(walk({ version: 2 }), 'ADAM_2!.GAM', 9);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.why).toMatch(/version 2/);
  });
  it('refuses another game or scenes it lacks', () => {
    const a = checkWalkFile(walk(), 'OTHER.GAM', 9);
    expect(!a.ok && a.why).toMatch(/not this game/);
    expect(checkWalkFile(walk(), 'ADAM_2!.GAM', 2).ok).toBe(false);
  });
  it('refuses non-walkthroughs', () => {
    expect(checkWalkFile('nope', 'A.GAM', 1).ok).toBe(false);
    expect(checkWalkFile('{"version":1}', 'A.GAM', 1).ok).toBe(false);
  });
});
