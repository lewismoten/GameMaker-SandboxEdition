// The touch probe's push check, on the tiny game in testGame.ts with one solid pacer: walking
// right up against a wall shoves a hero standing in the gap inside it; a block short, it doesn't.
// And the sink's fix, which leaves out SOLTOP on a hazard's pictures.
import { describe, expect, it } from 'vitest';
import { MONBL, newBlockSet, parseBlocks, serializeBlocks } from '../../../formats/blocks';
import { serializeGame } from '../../../formats/game';
import { parseMap, serializeMap } from '../../../formats/map';
import { emptyMonster, serializeMonsters } from '../../../formats/monster';
import { GameFiles } from '../../../project/files';
import { Project } from '../../core/project';
import { fixFor } from '../generators/fixes';
import { scenesOf } from '../sceneData';
import { testGame } from '../testGame';
import { landings } from './landings';

// prettier-ignore
const ROWS = [
  '############',
  '#..........#',
  '#..........#',
  '#..........#',
  '#........#.#',
  '#S.......#E#',
  '############',
];

/** The test game with a solid, harmless monster pacing from (3, 5) `reach` blocks right and back. */
function withPacer(reach: number, hurt = 0) {
  const t = testGame(ROWS);
  const mon = Array.from({ length: 64 }, emptyMonster);
  mon[0].used = 1;
  mon[0].power = 100;
  mon[0].pic[0] = [0, 1];
  mon[0].march[0][0] = { x: reach, y: 0, pic: 2, orient: 0 };
  mon[0].march[0][1] = { x: 0, y: 0, pic: 2, orient: 0 };
  const mbl = newBlockSet('mbl');
  mbl[0].solid = 15;
  mbl[0].pixels.fill(9);
  mbl[0].chHitPt = hurt;
  const map = parseMap(t.files.get('test.map')!);
  map.monsters[0] = { monnum: 0, status: 0, xtra: 0, curx: 3, cury: 5, extra: 0 };
  map.mons[5 * 100 + 3] = 0;
  const level = t.game.scenes[2];
  level.files[3] = 'test.mon';
  level.files[4] = 'test.mbl';
  t.files.set('test.mon', serializeMonsters(mon));
  t.files.set('test.mbl', serializeBlocks(mbl));
  t.files.set('test.map', serializeMap(map));
  t.files.set('test.gam', serializeGame(t.game));
  return t;
}

const pushes = async (reach: number) => {
  const t = withPacer(reach);
  const d = scenesOf(t.game, t)[0];
  return (await landings(d, t.game, t)).filter((f) => f.title.includes('pushes the hero inside'));
};

describe('the touch probe’s pushes', () => {
  it('finds a pacer that walks right up against a wall', async () => {
    const f = await pushes(5);
    expect(f).toHaveLength(1);
    expect(f[0].where.monster?.n).toBe(0);
    expect(f[0].where.cell).toBe(5 * 100 + 9);
  });

  it('passes one that stops a block clear of it', async () => {
    expect(await pushes(4)).toHaveLength(0);
  });
});

describe('the sink’s fix', () => {
  it('leaves out SOLTOP on the hazard’s hurting pictures, keeping the bottom and sides', () => {
    const t = withPacer(4, -5);
    const project = Project.fromFiles(new GameFiles(t.files));
    const fix = fixFor(
      { check: 'hurt-lock', severity: 'warning', title: '', where: { scene: 2, monster: { file: 'test.mon', n: 0 } }, fix: 'no-soltop' },
      project,
    )!;
    expect(fix.apply()).toEqual(['test.mbl']);
    expect(parseBlocks(project.files.get('test.mbl')!, MONBL)[0].solid).toBe(14);
  });
});
