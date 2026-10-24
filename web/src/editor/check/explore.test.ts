// The level check's explorer and stuck finder on a tiny game built in memory (testGame.ts).
import { describe, expect, it } from 'vitest';
import { MLEN } from '../../formats/map';
import { explore } from './explore';
import { playtestGame } from './playtest';
import { SceneSim, startCharInfo } from './sim';
import { stuckAreas } from './stuck';
import { RIGHT, testGame } from './testGame';
import { parseMap } from '../../formats/map';
import { BACKBL, parseBlocks } from '../../formats/blocks';

// prettier-ignore
const ROWS = [
  '##########',
  '#........#',
  '#........#',
  '#E.S.....#',
  '######..##',
  '#c####..##',
  '######..##',
  '######..##',
  '##########',
];
const cell = (x: number, y: number) => y * MLEN + x;

describe('the level check explorer', () => {
  it('plays back a snapshot exactly', async () => {
    const t = testGame(ROWS);
    const sim = new SceneSim(t.game, 2, t, { x: 3, y: 3 });
    for (let i = 0; i < 5; i++) await sim.tick();
    const s = sim.snapshot();
    sim.hold([RIGHT]);
    for (let i = 0; i < 6; i++) await sim.tick();
    const a = sim.px;
    sim.restore(s);
    sim.hold([RIGHT]);
    for (let i = 0; i < 6; i++) await sim.tick();
    expect(sim.px).toEqual(a);
    expect(a.x).toBeGreaterThan(3 * 20);
  });

  it('finds the exit, the floor it walked, the pit it falls into, and leaves the sealed coin', async () => {
    const t = testGame(ROWS);
    const ex = await explore(t.game, 2, t, { start: { x: 3, y: 3 }, ci: startCharInfo(), clock: 1 });
    expect(ex.complete).toBe(true);
    expect(ex.exits.map((e) => e.toScene)).toEqual([1]);
    for (const x of [2, 4, 5]) expect(ex.heat[cell(x, 3)]).toBeGreaterThan(0);
    expect(ex.heat[cell(6, 7)]).toBeGreaterThan(0);
    expect(ex.heat[cell(1, 5)]).toBe(0);
    const stuck = stuckAreas(ex, parseMap(t.files.get('test.map')!).blocks, parseBlocks(t.files.get('test.bbl')!, BACKBL));
    expect(stuck).toHaveLength(1);
    expect(stuck[0].cells.every((c) => Math.floor(c / MLEN) === 7)).toBe(true);
    expect(stuck[0].reason).toBe('drop');
  });

  it('plays a whole game from the title link to the won scene', async () => {
    const t = testGame(ROWS);
    const run = await playtestGame(t.game, t);
    expect(run.won).toBe(true);
    expect(run.runs.map((r) => r.scene)).toEqual([2]);
  });

  it('calls a pit the hero only dies in a death, not a place to get stuck', async () => {
    // the same pit, its floor spikes that hurt on every tick: in it, every move ends in a death
    const t = testGame(ROWS.map((r, y) => (y === 7 ? '######^^##' : r)));
    const ex = await explore(t.game, 2, t, { start: { x: 3, y: 3 }, ci: startCharInfo(), clock: 1 });
    expect(ex.complete).toBe(true);
    expect(ex.incidents.some((i) => i.kind === 'death')).toBe(true);
    expect(stuckAreas(ex, parseMap(t.files.get('test.map')!).blocks, parseBlocks(t.files.get('test.bbl')!, BACKBL))).toHaveLength(0);
  });

  it('knows spikes the hero can step off don’t hold him', async () => {
    // spikes on the open floor by the start: the bot walks and waits on them, but a step gets away
    const t = testGame(['##########', '#........#', '#........#', '#E.S^^...#', '##########']);
    const ex = await explore(t.game, 2, t, { start: { x: 3, y: 3 }, ci: startCharInfo(), clock: 1 }, { waitEverywhere: true });
    expect(ex.places.some((p) => p.cell === cell(6, 3) && p.hp < 100)).toBe(true);
    expect(ex.incidents.filter((i) => i.kind === 'hurt-lock')).toHaveLength(0);
  });
});
