// levelViews.json is current: every game that gets Level Maps is in it, scanned from the disk it
// has now (else rerun scripts/levelViews.ts for that game), never a secret game; and a Level Map
// cropped to it still holds every mark.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import VIEWS from './levelViews.json';
import SECRETS from './levelSecrets.json';
import { levelViewsHash } from '../../../scripts/levelViewsScan';
import { parseGame } from '../../formats/game';
import { levelsOf } from './levelMapLayout';
import type { LevelViews } from './levelViews';

const games = join(__dirname, '../../../../games');
const views = VIEWS as unknown as LevelViews;

describe('Level Maps crop to what the player sees', () => {
  it('lists every game that gets Level Maps, scanned from its disk as it is now', () => {
    expect(Object.keys(views).sort()).toEqual(Object.keys(SECRETS).sort());
    for (const id of Object.keys(views)) expect(views[id].hash, `${id}: rerun npx vite-node scripts/levelViews.ts ${id}`).toBe(levelViewsHash(games, id));
  });

  it('keeps every arrival and way out inside the crop, and the crop inside the map in use', () => {
    for (const [id, v] of Object.entries(views)) {
      const dir = join(games, id, 'disk');
      const files = new Map(readdirSync(dir).map((n) => [n.toLowerCase(), new Uint8Array(readFileSync(join(dir, n)))]));
      const game = parseGame(files.get([...files.keys()].find((n) => n.endsWith('.gam'))!)!);
      for (const l of levelsOf(game, { get: (n) => files.get(n.toLowerCase()) }, (SECRETS as Record<string, Record<string, number[]>>)[id], v.maps)) {
        const a = l.area;
        expect(a.x >= l.whole.x && a.y >= l.whole.y && a.x + a.w <= l.whole.x + l.whole.w && a.y + a.h <= l.whole.y + l.whole.h, `${id} ${l.group.map}`).toBe(
          true,
        );
        for (const m of l.marks)
          expect(m.x >= a.x && m.y >= a.y && m.x + m.w <= a.x + a.w && m.y + m.h <= a.y + a.h, `${id} ${l.group.map} ${m.kind} ${m.x},${m.y}`).toBe(true);
      }
    }
  });
});
