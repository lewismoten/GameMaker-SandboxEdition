// Level Maps keep the secrets: levelSecrets/*.json matches the games, and no map draws or marks a tin
// heart or an egg.
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SECRETS } from './levelMetadata';
import { scanLevelSecrets } from '../../../scripts/levelSecretsScan';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { levelsOf } from './levelMapLayout';

const games = join(__dirname, '../../../../games');
const about = (id: string) => JSON.parse(readFileSync(join(games, id, 'about.json'), 'utf8')) as Record<string, unknown>;
const disk = (id: string) => {
  const dir = join(games, id, 'disk');
  const files = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), new Uint8Array(readFileSync(join(dir, n)))]));
  return { game: parseGame(files.get([...files.keys()].find((n) => n.endsWith('.gam'))!)!), files: { get: (n: string) => files.get(n.toLowerCase()) } };
};

// Each game's levels are worked out once, for both map tests.
const laid = new Map<string, { files: ReturnType<typeof disk>['files']; levels: ReturnType<typeof levelsOf> }>();
const levelsFor = (id: string, secret: Record<string, number[]>) => {
  let got = laid.get(id);
  if (!got) {
    const { game, files } = disk(id);
    got = { files, levels: levelsOf(game, files, secret) };
    laid.set(id, got);
  }
  return got;
};

describe('Level Maps keep the secrets', () => {
  it('lists the blocks the games’ about.json and disks hide (else rerun scripts/levelSecrets.ts), never a secret game', () => {
    const scanned = scanLevelSecrets(games);
    expect(SECRETS).toEqual(scanned);
    for (const [id, value] of Object.entries(scanned))
      expect(readFileSync(join(__dirname, 'levelSecrets', `${id}.json`), 'utf8')).toBe(`${JSON.stringify(value)}\n`);
    for (const id of readdirSync(games))
      if (existsSync(join(games, id, 'about.json')) && about(id).secret === true) expect(Object.keys(SECRETS)).not.toContain(id);
  });

  it('never draws or marks a tin heart, an Easter egg or a felt egg', { timeout: 60000 }, () => {
    for (const [id, secret] of Object.entries(SECRETS as Record<string, Record<string, number[]>>)) {
      const { files, levels } = levelsFor(id, secret);
      const a = about(id) as { tinHeart?: { map: string; at: [number, number] }; easterEgg?: { map: string; at: [number, number] } };
      for (const l of levels) {
        const hide = new Set(secret[l.group.bbl] ?? []);
        // nothing secret left in what is drawn
        expect(
          l.cells.some((b) => hide.has(b)),
          `${id} ${l.group.map}`,
        ).toBe(false);
        // no mark on a cell that held a secret block
        const orig = parseMap(files.get(l.group.map)!).blocks;
        const marked: string[] = [];
        for (const m of l.marks)
          for (let y = m.y; y < m.y + m.h; y++)
            for (let x = m.x; x < m.x + m.w; x++) if (hide.has(orig[y * MLEN + x])) marked.push(`${id} ${l.group.map} ${x},${y}`);
        expect(marked).toEqual([]);
        // and the declared places are drawn as something else
        for (const p of [a.tinHeart, a.easterEgg])
          if (p && p.map.toLowerCase() === l.group.map) expect(l.cells[p.at[1] * MLEN + p.at[0]]).not.toBe(orig[p.at[1] * MLEN + p.at[0]]);
      }
    }
  });

  it('hides only a handful of cells on any map', () => {
    for (const [id, secret] of Object.entries(SECRETS as Record<string, Record<string, number[]>>)) {
      const { files, levels } = levelsFor(id, secret);
      for (const l of levels) {
        const orig = parseMap(files.get(l.group.map)!).blocks;
        let changed = 0;
        for (let i = 0; i < orig.length; i++) if (orig[i] !== l.cells[i]) changed++;
        expect(changed, `${id} ${l.group.map}`).toBeLessThanOrEqual(6);
      }
    }
  });
});
