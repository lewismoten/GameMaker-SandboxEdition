// The level check's file checks and its whole report, on the tiny game in testGame.ts.
import { describe, expect, it } from 'vitest';
import { GameFiles } from '../../project/files';
import { parseBlocks, serializeBlocks, BACKBL } from '../../formats/blocks';
import { hazardArt, opposites, everyTickBlocks, waits } from './checks/blockChecks';
import { mentions } from './checks/gameChecks';
import { runChecks } from './report';
import { scenesOf } from './sceneData';
import { COIN, SPIKES, testGame } from './testGame';

// prettier-ignore
const ROWS = [
  '##########',
  '#........#',
  '#........#',
  '#E.S..^..#',
  '##########',
];

const sceneOf = (t: ReturnType<typeof testGame>) => scenesOf(t.game, t)[0];

describe('the level check’s file checks', () => {
  it('finds hazard art that fills a quarter of its cell', () => {
    const f = hazardArt(sceneOf(testGame(ROWS)));
    expect(f.map((x) => x.where.block?.n)).toEqual([SPIKES]);
    expect(f[0].title).toContain('25%');
  });

  it('finds a block that scores every tick, and opposite pulls side by side', () => {
    const t = testGame(['##########', '#..ab....#', '#..ab....#', '#E.S..c..#', '##########']);
    const bbl = parseBlocks(t.files.get('test.bbl')!, BACKBL);
    bbl[COIN].touchBl = COIN;
    bbl[10].grav = 2;
    bbl[11].grav = 8;
    t.files.set('test.bbl', serializeBlocks(bbl));
    const map = t.files.get('test.map')!;
    // 'a' and 'b' are painted as air by testGame: make them the two opposite blocks
    for (const y of [1, 2]) {
      map[(y * 100 + 3) * 2] = 10;
      map[(y * 100 + 4) * 2] = 11;
    }
    const d = sceneOf(t);
    expect(everyTickBlocks(d).map((x) => x.where.block?.n)).toEqual([COIN]);
    expect(opposites(d)).toHaveLength(1);
  });

  it('times a block that stays shut too long', () => {
    const t = testGame(ROWS);
    const bbl = parseBlocks(t.files.get('test.bbl')!, BACKBL);
    Object.assign(bbl[SPIKES], { nextBl: 20, ntime: 90, solid: 15 });
    Object.assign(bbl[20], { nextBl: SPIKES, ntime: 10 });
    t.files.set('test.bbl', serializeBlocks(bbl));
    const f = waits(sceneOf(t));
    expect(f).toHaveLength(1);
    expect(f[0].title).toContain('4.9 s');
  });

  it('knows a key is named in the text', () => {
    expect(mentions('Press SPACE to jump', 57)).toBe(true);
    expect(mentions('F digs a hole', 33)).toBe(true);
    expect(mentions('Find the key', 33)).toBe(false);
  });

  it('reports a whole game, play included', async () => {
    const t = testGame(ROWS);
    const r = await runChecks(new GameFiles(t.files));
    expect(r.won).toBe(true);
    expect(r.runs).toHaveLength(1);
    expect(r.findings.some((f) => f.check === 'hazard-art')).toBe(true);
    expect(r.findings.some((f) => f.check === 'ending')).toBe(true);
  });
});
