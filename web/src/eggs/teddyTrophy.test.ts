// Teddy's trophy shows only with all three of his felt eggs found, and draws him as the cast
// stage does; the felt egg registry matches the games' about.json.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EGGS } from './eggs';
import { TEDDY_FIGURE, TEDDY_GAMES, hasTeddyTrophy } from './teddyTrophy';

const games = join(__dirname, '../../../games');

describe("Teddy's trophy", () => {
  it('needs the felt eggs of all three Teddy adventures', () => {
    expect(hasTeddyTrophy([])).toBe(false);
    expect(hasTeddyTrophy(['teddy', 'teddy2'])).toBe(false);
    expect(hasTeddyTrophy(['teddy', 'teddy3', 'blaster'])).toBe(false);
    expect(hasTeddyTrophy(['teddy3', 'teddy', 'teddy2'])).toBe(true);
    expect(hasTeddyTrophy(['blaster', 'teddy', 'teddy2', 'teddy3', 'year2000'])).toBe(true);
  });

  it('each of the three has a felt egg a save can hold', () => {
    for (const g of TEDDY_GAMES) expect(EGGS.find((e) => e.game === g)?.detect, g).toBeTruthy();
  });

  it('draws Teddy as the cast stage does (sprites.json, facing you)', () => {
    const teddy = JSON.parse(readFileSync(join(__dirname, '../../public/cast/sprites.json'), 'utf8')).teddy;
    expect([teddy.w, teddy.h]).toEqual([TEDDY_FIGURE.w, TEDDY_FIGURE.h]);
    expect(teddy.colors).toEqual(TEDDY_FIGURE.colors);
    expect(teddy.frames).toContain(TEDDY_FIGURE.frame);
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
});
