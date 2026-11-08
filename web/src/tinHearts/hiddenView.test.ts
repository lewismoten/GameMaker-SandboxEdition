// Tin hearts and Easter eggs stay out of sight until the player goes looking (TIN-HEARTS.md,
// "Out of sight"): off screen at every scene's start (and its first 3 seconds), and in none of
// the level shots, box shots, poster or title demo. games/kit/hiddenView.ts does the looking
// (npx vite-node ../games/kit/hiddenView.ts for the full table, disk pictures too).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hiddenView } from '../../../games/kit/hiddenView';

/**
 * Items that still show, being moved. Take a game's entry out once its item is moved; the test
 * fails while an entry here is hidden already, so the list only shrinks.
 */
const STILL_SHOWN = new Set<string>([]);

// The built disks are git-ignored output (npm ci builds them); with one missing, these are skipped.
const GAMES = join(__dirname, '../../../games');
const declared = readdirSync(GAMES).filter((id) => {
  const about = join(GAMES, id, 'about.json');
  if (!existsSync(about)) return false;
  const a = JSON.parse(readFileSync(about, 'utf8')) as { tinHeart?: unknown; easterEgg?: unknown };
  return Boolean(a.tinHeart || a.easterEgg);
});
const hasDisks = declared.every((id) => existsSync(join(GAMES, id, 'disk')));

describe.skipIf(!hasDisks)('tin hearts and Easter eggs out of sight', async () => {
  const all = hasDisks ? await hiddenView(undefined, false) : [];
  it('finds the declared items', () => expect(all.length).toBeGreaterThanOrEqual(40));
  for (const s of all) {
    const key = `${s.game}:${s.item}`;
    it(`${key} (${s.map} ${s.at.join(',')}) shows at no scene start, shot or demo`, () => {
      if (STILL_SHOWN.has(key)) expect(s.seen, `${key} is hidden now: take it out of STILL_SHOWN`).not.toEqual([]);
      else expect(s.seen).toEqual([]);
    });
  }
});
