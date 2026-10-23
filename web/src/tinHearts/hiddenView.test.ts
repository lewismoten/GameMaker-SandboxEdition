// Tin hearts and Easter eggs stay out of sight until the player goes looking (TIN-HEARTS.md,
// "Out of sight"): off screen at every scene's start (and its first 3 seconds), and in none of
// the level shots, box shots, poster or title demo. games/kit/hiddenView.ts does the looking
// (npx vite-node ../games/kit/hiddenView.ts for the full table, disk pictures too).
import { describe, expect, it } from 'vitest';
import { hiddenView } from '../../../games/kit/hiddenView';

/**
 * Items that still show, being moved. Take a game's entry out once its item is moved; the test
 * fails while an entry here is hidden already, so the list only shrinks.
 */
const STILL_SHOWN = new Set([
  'logic:tinHeart',
  'logic:easterEgg',
  'maximus:tinHeart',
  'maximus:easterEgg',
]);

describe('tin hearts and Easter eggs out of sight', async () => {
  const all = await hiddenView(undefined, false);
  it('finds the declared items', () => expect(all.length).toBeGreaterThanOrEqual(40));
  for (const s of all) {
    const key = `${s.game}:${s.item}`;
    it(`${key} (${s.map} ${s.at.join(',')}) shows at no scene start, shot or demo`, () => {
      if (STILL_SHOWN.has(key)) expect(s.seen, `${key} is hidden now: take it out of STILL_SHOWN`).not.toEqual([]);
      else expect(s.seen).toEqual([]);
    });
  }
});
