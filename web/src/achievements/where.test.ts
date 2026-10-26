// where.ts: a hidden achievement never says where until it is found, every catalog game with a
// spot of its own links to that game, and no link goes to a game kept out of sight.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACHIEVEMENTS } from './catalog';
import { GAME_SPOTS } from './index';
import { placesOf } from './where';

const games = join(__dirname, '../../../games');

describe('placesOf', () => {
  it('keeps a hidden one quiet until it is unlocked', () => {
    for (const a of ACHIEVEMENTS.filter((x) => x.hidden)) expect(placesOf(a, false), a.id).toEqual([]);
  });

  it('links each GAME_SPOTS achievement to its game', () => {
    for (const s of GAME_SPOTS) {
      const a = ACHIEVEMENTS.find((x) => x.id === s.id)!;
      expect(placesOf(a, true).map((p) => p.href)).toContain(`#/game/cd:${s.game}`);
    }
  });

  it('links only to pages of the site and to games on the shelf', () => {
    for (const a of ACHIEVEMENTS)
      for (const p of placesOf(a, true)) {
        expect(p.href, a.id).toMatch(/^(#\/(desk|cast|library|magazine|mac|windows|linux|game\/cd:[a-z0-9]+)|\.\/dos\.html)$/);
        const game = /^#\/game\/cd:(.+)$/.exec(p.href)?.[1];
        if (game) expect((JSON.parse(readFileSync(join(games, game, 'about.json'), 'utf8')) as { secret?: boolean }).secret, a.id).not.toBe(true);
      }
  });
});
