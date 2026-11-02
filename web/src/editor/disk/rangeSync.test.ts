import { describe, expect, it } from 'vitest';
import { MONBL, newBlockSet, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { emptyMonster, newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { serializePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { GameFiles } from '../../project/files';
import { planDisk } from './plan';
import { rangeSyncs } from './rangeSync';

/** Two scenes share one monster set; the palettes put the monster's two colors at 100/101, and differ at 50/51 (the reserved range). */
function room(bAt100: [number, number, number] = [60, 0, 0]): GameFiles {
  const f = new GameFiles();
  const mk = (at100: [number, number, number], junk: number) => {
    const p = new Uint8Array(768);
    p.set(at100, 300);
    p.set([0, 60, 0], 303);
    p.set([junk, junk, 1], 150);
    p.set([junk, 2, junk], 153);
    p[3] = 9;
    return serializePalette(p);
  };
  f.set('a.pal', mk([60, 0, 0], 5));
  f.set('b.pal', mk(bAt100, 6));
  const mbl = newBlockSet('mbl');
  mbl[1] = { ...mbl[1], pixels: new Uint8Array(400).map((_, i) => 100 + (i % 2)) };
  f.set('m.mbl', serializeBlocks(mbl));
  const mon = newMonsterSet();
  mon[1] = { ...emptyMonster(), used: 1 };
  mon[1].pic[0] = [1, MONBL];
  f.set('m.mon', serializeMonsters(mon));
  f.set('a.map', serializeMap(newMap()));
  f.set('b.map', serializeMap(newMap()));
  f.set('a.bbl', serializeBlocks(newBlockSet('bbl')));
  const game = newGame('T');
  for (const k of ['a', 'b']) {
    const s = emptyScene(ADVTYPE);
    s.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    s.files = [`${k}.pal`, `${k}.map`, 'a.bbl', 'm.mon', 'm.mbl', '', '', '', '', '', '', ...new Array(9).fill('')];
    game.scenes.push(s);
  }
  f.set('t.gam', serializeGame(game));
  return f;
}
const ranges = [{ first: 50, last: 52, role: 'monster' as const }];

describe('syncing a reserved range', () => {
  it('is a step when no scene looks different, and leaves the same range in both palettes', () => {
    const f = room();
    const plan = planDisk(f, 't.gam', ranges);
    const step = plan.steps.find((s) => s.kind === 'sync');
    expect(step).toBeDefined();
    step!.apply(f, 't.gam');
    const [a, b] = [f.get('a.pal')!, f.get('b.pal')!];
    expect(Array.from(a.subarray(150, 159))).toEqual(Array.from(b.subarray(150, 159)));
    const px = parseBlocks(f.get('m.mbl')!.subarray(0, 42000), 100)[1].pixels;
    expect(new Set(px).size).toBe(2);
    expect([...px].every((v) => v >= 50 && v <= 52)).toBe(true);
    expect(a[px[0] * 3]).toBe(60);
    expect(rangeSyncs(f, 't.gam', ranges).syncs).toEqual([]);
  });
  it('is a proposal with a score, not a step, when a scene would draw a different color', () => {
    const f = room([0, 0, 60]);
    expect(planDisk(f, 't.gam', ranges).steps.some((s) => s.kind === 'sync')).toBe(false);
    const { syncs } = rangeSyncs(f, 't.gam', ranges);
    expect(syncs).toHaveLength(1);
    expect(syncs[0].lossless).toBe(false);
    expect(syncs[0].score.worst).toBeGreaterThan(20);
    syncs[0].apply(f, 't.gam');
    expect(rangeSyncs(f, 't.gam', ranges).syncs).toEqual([]);
  });
});
