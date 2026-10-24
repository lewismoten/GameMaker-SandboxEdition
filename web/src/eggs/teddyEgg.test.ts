// Teddy's special egg shows only with all three of his felt eggs found (and its achievement
// only from saves), is never one of the felt eggs, and teddy3's own egg is The Birthday Egg
// its game hides; the felt egg registry matches the games' about.json.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EGGS } from './eggs';
import { TEDDY_EGG, TEDDY_GAMES, hasTeddyEgg, laidFromSaves } from './teddyEgg';

const games = join(__dirname, '../../../games');
const state = (game: string, inSave: boolean) => ({ inSave, egg: { game } });

describe("Teddy's special egg", () => {
  it('needs the felt eggs of all three Teddy adventures', () => {
    expect(hasTeddyEgg([])).toBe(false);
    expect(hasTeddyEgg(['teddy', 'teddy2'])).toBe(false);
    expect(hasTeddyEgg(['teddy', 'teddy3', 'blaster'])).toBe(false);
    expect(hasTeddyEgg(['teddy3', 'teddy', 'teddy2'])).toBe(true);
    expect(hasTeddyEgg(['blaster', 'teddy', 'teddy2', 'teddy3', 'year2000'])).toBe(true);
  });

  it('earns its achievement from saves only, not from eggs EGG.EXE adds', () => {
    expect(laidFromSaves([state('teddy', true), state('teddy2', true), state('teddy3', true)])).toBe(true);
    expect(laidFromSaves([state('teddy', true), state('teddy2', true), state('teddy3', false)])).toBe(false);
    expect(laidFromSaves([state('teddy', true), state('teddy2', true)])).toBe(false);
  });

  it('each of the three has a felt egg a save can hold', () => {
    for (const g of TEDDY_GAMES) expect(EGGS.find((e) => e.game === g)?.detect, g).toBeTruthy();
  });

  it('is a bonus, never one of the felt eggs', () => {
    expect(EGGS.some((e) => e.name === TEDDY_EGG.name)).toBe(false);
    expect(EGGS.length).toBe(13);
  });
});

describe('the felt eggs', () => {
  it('are thirteen, one per game', () => {
    expect(EGGS.length).toBe(13);
    expect(new Set(EGGS.map((e) => e.game)).size).toBe(EGGS.length);
  });

  it('match each game’s about.json "egg", and none is in a game kept out of sight', () => {
    for (const e of EGGS) {
      const about = JSON.parse(readFileSync(join(games, e.game, 'about.json'), 'utf8'));
      expect(about.secret, e.game).not.toBe(true);
      expect(about.egg, e.game).toEqual(e.detect);
    }
    // and every open game that declares one is in the registry
    for (const id of readdirSync(games)) {
      const f = join(games, id, 'about.json');
      if (!existsSync(f)) continue;
      const about = JSON.parse(readFileSync(f, 'utf8'));
      if (about.egg && !about.secret)
        expect(
          EGGS.some((e) => e.game === id),
          id,
        ).toBe(true);
    }
  });

  it('teddy3’s is The Birthday Egg, as its game’s egg page says', () => {
    const egg = EGGS.find((e) => e.game === 'teddy3')!;
    expect(egg.name).toBe('The Birthday Egg');
    expect(egg.look).toMatchObject({ pattern: 'confetti', motif: 'cake' });
    const page = readFileSync(join(games, 'teddy3/disk/egg.txt'), 'latin1').replace(/\s+/g, ' ');
    expect(page).toContain(egg.description.replace('é', 'e'));
  });
});
