import { describe, expect, it } from 'vitest';
import { BACKBL, CHARBL, MONBL, newBlockSet, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newCharacter, parseCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { ADVTYPE, MAXSCENELINKS, NOSCENE, emptyScene, newGame, parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { newMap, parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { LASTSL, emptyMonster, newMonsterSet, parseMonsters, serializeMonsters } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { serializePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { GameFiles } from '../../project/files';
import { planDisk } from './plan';

const pal = (shade: number) => {
  const p = new Uint8Array(768);
  for (let i = 0; i < 256; i++) p.fill((i + shade) & 63, i * 3, i * 3 + 3);
  p[3] = shade; // not one solid color
  return serializePalette(p);
};

/** Two rooms, each with its own palette-sharing files: a map with one placed monster, a monster file, a monster block set. */
function twoRooms(opts: { fatMbl?: boolean; birth?: boolean } = {}): GameFiles {
  const f = new GameFiles();
  f.set('a.pal', pal(0));
  f.set('b.pal', pal(0));
  f.set('c.pal', pal(9));
  f.set('ada.cbl', serializeBlocks(newBlockSet('cbl')));
  const chr = newCharacter();
  if (opts.birth) chr.sequences[5].frames[0] = { ...chr.sequences[5].frames[0], pic1: 0, pic2: MONBL };
  f.set('ada.chr', serializeCharacter(chr));
  const game = newGame('T');
  for (const k of ['a', 'b']) {
    const mbl = newBlockSet('mbl');
    const n = k === 'a' ? 3 : opts.fatMbl ? 99 : 4;
    for (let i = 0; i < n; i++) {
      mbl[i + 1] = { ...mbl[i + 1], pixels: new Uint8Array(400).fill(30 + i + (k === 'a' ? 0 : 20)) };
    }
    f.set(`${k}.mbl`, serializeBlocks(mbl));
    const mon = newMonsterSet();
    mon[2] = { ...emptyMonster(), used: 1 };
    mon[2].pic[0] = [1, 2];
    mon[2].pic[1] = [2, 2];
    if (k === 'b' && opts.fatMbl)
      for (let m = 4; m < 12; m++) {
        mon[m] = { ...emptyMonster(), used: 1 };
        for (let sl = 0; sl <= LASTSL; sl++) mon[m].pic[sl] = [Math.min(99, 1 + (m - 4) * (LASTSL + 1) + sl), 2];
      }
    mon[3] = { ...emptyMonster(), used: 1, newmon: 2 };
    mon[3].pic[0] = [3, 1];
    f.set(`${k}.mon`, serializeMonsters(mon));
    const map = newMap();
    map.monsters[0] = { monnum: 3, status: 0, xtra: 0, curx: 4, cury: 4, extra: 0 };
    f.set(`${k}.map`, serializeMap(map));
    const bbl = newBlockSet('bbl');
    bbl[7] = { ...bbl[7], birthMon: 2, birthTime: 5 };
    f.set(`${k}.bbl`, serializeBlocks(bbl));
    const s = emptyScene(ADVTYPE);
    s.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    s.files = [k === 'a' ? 'a.pal' : 'b.pal', `${k}.map`, `${k}.bbl`, `${k}.mon`, `${k}.mbl`, 'ada.chr', 'ada.cbl', '', '', '', '', ...new Array(9).fill('')];
    game.scenes.push(s);
  }
  f.set('t.gam', serializeGame(game));
  return f;
}

describe('disk space plan', () => {
  it('merges identical palettes, then monster blocks, then monsters, and then has nothing left', () => {
    const f = twoRooms();
    const plan = planDisk(f, 't.gam');
    expect(plan.steps.map((s) => s.kind)).toEqual(['mbl', 'mon', 'pal', 'bbl']);
    const saved = plan.steps.reduce((a, s) => a + s.saves, 0);
    const before = f.names().reduce((a, n) => a + f.get(n)!.length, 0);
    for (const s of plan.steps) s.apply(f, 't.gam');
    expect(f.names().reduce((a, n) => a + f.get(n)!.length, 0)).toBeLessThanOrEqual(before - saved);
    expect(f.has('b.mbl') || f.has('b.mon') || f.has('b.pal') || f.has('b.bbl')).toBe(false);
    expect(planDisk(f, 't.gam').steps).toEqual([]);

    const game = parseGame(f.get('t.gam')!);
    expect(game.scenes.slice(2).map((s) => [s.files[3], s.files[4], s.files[0]])).toEqual([
      ['a.mon', 'a.mbl', 'a.pal'],
      ['a.mon', 'a.mbl', 'a.pal'],
    ]);
    expect(game.scenes.slice(2).map((s) => s.files[2])).toEqual(['a.bbl', 'a.bbl']);
    // b's blocks (1-4) went to the first free slots (4-7 after a's 1-3); b's monsters 2 and 3 took slots 0 and 1
    // (a's own 2 and 3 stay put), and monster 1 (was 3) now turns into slot 0 (was 2) when it dies
    const mons = parseMonsters(f.get('a.mon')!);
    const blocks = parseBlocks(f.get('a.mbl')!, MONBL);
    expect(mons.map((m) => m.used).slice(0, 4)).toEqual([1, 1, 1, 1]);
    expect(blocks[mons[0].pic[0][0]].pixels[0]).toBe(50);
    expect([mons[1].newmon, mons[3].newmon, mons[2].newmon]).toEqual([0, 2, 64]);
    // b's map and its birth block follow the renumbered monsters; a's are untouched
    expect(parseMap(f.get('a.map')!).monsters[0].monnum).toBe(3);
    expect(parseMap(f.get('b.map')!).monsters[0].monnum).toBe(1);
    // b's birth block was renumbered before b.bbl joined a.bbl; a's own block 7 is untouched, and b's undrawn one is dropped
    const bbl = parseBlocks(f.get('a.bbl')!, BACKBL);
    expect(bbl[7].birthMon).toBe(2);
    expect(bbl.filter((b) => b.birthTime === 5).map((b) => b.birthMon)).toEqual([2]);
    expect(parseMap(f.get('b.map')!).blocks.every((v) => v === 0)).toBe(true);
  });

  it('leaves a monster file alone when the character shared by both rooms fires monsters', () => {
    const f = twoRooms({ birth: true });
    const plan = planDisk(f, 't.gam');
    expect(plan.steps.map((s) => s.kind)).toEqual(['mbl', 'pal', 'bbl']);
    expect(plan.notes.some((n) => /ada\.chr/.test(n.why))).toBe(true);
    expect(parseCharacter(f.get('ada.chr')!).sequences[5].frames[0].pic1).toBe(0);
    expect(CHARBL).toBe(50);
  });

  it('keeps two block sets apart when their drawn blocks do not fit in one file', () => {
    const f = twoRooms({ fatMbl: true });
    const kinds = planDisk(f, 't.gam').steps.map((s) => s.kind);
    expect(kinds).not.toContain('mbl');
    expect(kinds).not.toContain('mon');
  });

  it('refuses an apply after a file changed under the preview', () => {
    const f = twoRooms();
    const [first] = planDisk(f, 't.gam').steps;
    f.set('b.mbl', serializeBlocks(newBlockSet('mbl')));
    expect(() => first.apply(f, 't.gam')).toThrow(/changed since/);
  });
});
