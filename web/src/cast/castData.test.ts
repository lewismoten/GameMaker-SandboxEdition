import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cdCatalog } from '../../scripts/cdGames';
import { isBizarreGame } from '../project/bizarre';
import { CAST, CAST_GAMES, type CastGame } from './castData';
import CAMEOS from './cameos.json';

const catalog = cdCatalog(join(__dirname, '../../../cd'));
const plain = (s: string) => s.replace(/[‘’]/g, "'");

describe('the cast page', () => {
  it('lists only games in the catalog, under their own titles and families', () => {
    for (const [id, [title, family]] of Object.entries(CAST_GAMES)) {
      const g = catalog.find((e) => e.id === id);
      expect(g, id).toBeDefined();
      expect(plain(title), id).toBe(plain(g!.title));
      expect(family, id).toBe(isBizarreGame(g!) ? 'bizarre' : 'sandbox');
    }
  });

  it('has every "Appears in" game in the catalog, each once per member', () => {
    expect(CAST.length).toBeGreaterThan(8);
    for (const m of CAST) {
      // the tin heart is found in games through cameos.json as it is hidden in them
      if (m.id !== 'tinHeart') expect(m.appears.length, m.id).toBeGreaterThan(0);
      expect(new Set(m.appears.map((a) => a.game)).size, m.id).toBe(m.appears.length);
      for (const a of m.appears) expect(catalog.some((g) => g.id === a.game), `${m.id} in ${a.game}`).toBe(true);
      expect(Object.keys(CAST_GAMES)).toContain(m.art.game as CastGame);
    }
  });

  it('has a picture and alt text for everyone, and unique ids', () => {
    expect(new Set(CAST.map((m) => m.id)).size).toBe(CAST.length);
    for (const m of CAST) {
      expect(existsSync(join(__dirname, '../../public/cast', `${m.id}.png`)), m.id).toBe(true);
      expect(m.art.alt.length, m.id).toBeGreaterThan(10);
    }
  });

  it('takes cameos only for members and games the page knows', () => {
    for (const [id, list] of Object.entries(CAMEOS as Record<string, { game: string; as: string }[]>)) {
      expect(CAST.some((m) => m.id === id), id).toBe(true);
      for (const a of list) {
        expect(Object.keys(CAST_GAMES), `${id} in ${a.game}`).toContain(a.game);
        expect(a.as.length, `${id} in ${a.game}`).toBeGreaterThan(2);
      }
    }
  });

  it('keeps Doc Leo a Doc and Gwinn spelled with two n’s', () => {
    const text = JSON.stringify(CAST);
    expect(text).not.toMatch(/Dr\.? Leo|\bGwin\b/);
  });
});
