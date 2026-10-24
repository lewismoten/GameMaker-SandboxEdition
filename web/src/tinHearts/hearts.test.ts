// The tin hearts the web counts are really in the games: hearts.json matches every about.json,
// and each declared heart's block is on its disk at that place and is reported when touched.
import { describe, expect, it } from 'vitest';
import { heartProblems, readAbouts, touchHeadless } from '../../../games/kit/tinHeartDisk';
import { buildManifest, heartsCount, isHeartAt, type HeartManifest } from './manifest';
import json from './hearts.json';

const hearts = json as unknown as HeartManifest;

const abouts = readAbouts();

describe('tin hearts', () => {
  it('has hearts.json up to date (rerun npx vite-node ../games/kit/tinHearts.ts)', () => {
    expect(buildManifest(abouts)).toEqual(hearts);
  });

  it('counts every Sandbox and Bard of Bizarre game, and no secret one', () => {
    const counted = [...Object.keys(hearts.hearts), ...hearts.pending].sort();
    expect(counted).toEqual(
      Object.keys(abouts)
        .filter((id) => heartsCount(abouts[id]))
        .sort(),
    );
    for (const id of counted) expect(abouts[id].secret, id).not.toBe(true);
    expect(counted.length).toBeGreaterThanOrEqual(24);
  });

  for (const [id, place] of Object.entries(hearts.hearts))
    it(`finds ${id}'s heart on its disk, and the engine reports touching it`, () => {
      expect(heartProblems(id, place)).toEqual([]);
      expect(touchHeadless(id, place)).toBe(true);
      // a plain cell elsewhere on the row is not the heart (49 over: 50 over in Shakespeare in
      // Sweatpants is The Hive's tip jar, a pickup whose own touch the engine rightly reports)
      expect(touchHeadless(id, { map: place.map, at: [(place.at[0] + 49) % 100, place.at[1]] })).toBe(false);
    });

  it('matches a touch by map file and cell', () => {
    const p = { map: 'port.map', at: [10, 33] as [number, number] };
    expect(isHeartAt(p, 'PORT.MAP', 10, 33)).toBe(true);
    expect(isHeartAt(p, 'port.map', 11, 33)).toBe(false);
    expect(isHeartAt(p, undefined, 10, 33)).toBe(false);
  });
});
