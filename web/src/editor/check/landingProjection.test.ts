// Unavailable background references must not interrupt walkthrough guidance.
import { expect, it } from 'vitest';
import { BACKBL, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { GameFiles } from '../../project/files';
import { platformGoals } from './platformGoals';
import { SceneSim, startCharInfo } from './sim';
import { RIGHT, testGame } from './testGame';
import { autoWalk } from './walk/autoWalk';
import { verifyWalk } from './walk/verify';

it('keeps planning past an unavailable animation target below a falling route', async () => {
  const t = testGame(['S']);
  const start = { x: 1, y: 1 };
  t.game.scenes[0].links[0].to = start;
  t.game.scenes[2].links[0].from = { x: 2, y: 3 };
  t.files.set('test.gam', serializeGame(t.game));
  const map = parseMap(t.get('test.map')!);
  map.blocks.fill(0);
  for (let x = 0; x < MLEN; x++) map.blocks[50 * MLEN + x] = 4;
  t.files.set('test.map', serializeMap(map));
  const blocks = parseBlocks(t.get('test.bbl')!, BACKBL);
  Object.assign(blocks[4], { grav: 4, nextBl: BACKBL + 1, ntime: 3 });
  t.files.set('test.bbl', serializeBlocks(blocks));

  // Ordinary held steering wins without ever touching the far-away animated row.
  const oracle = new SceneSim(t.game, 2, t, start, startCharInfo(), 1);
  oracle.hold([RIGHT]);
  let oracleExit: number | undefined;
  let oracleTicks = 0;
  for (; oracleTicks < 30; oracleTicks++) {
    const end = await oracle.tick();
    expect(end).not.toBe('dead');
    if (end && typeof end === 'object') {
      oracleExit = end.link;
      break;
    }
  }
  expect(oracleExit).toBe(0);
  expect(oracleTicks + 1).toBeGreaterThanOrEqual(4);

  const result = await autoWalk(t.game, t, 'test', { budgetMs: 1000 });
  expect(result.won).toBe(true);
  const replay = await verifyWalk(new GameFiles(t.files), 'test.gam', result.walk!, { maxMinutes: 2 });
  expect(replay.error).toBeUndefined();
  expect(replay.won).toBe(true);
  expect(replay.keysLeft).toBe(0);
});

it('keeps a reachable route when a touch changes terrain into an unavailable block', async () => {
  const t = testGame(['S']);
  const start = { x: 1, y: 1 };
  t.game.scenes[0].links[0].to = start;
  t.game.scenes[2].links[0].from = { x: 4, y: 1 };
  t.files.set('test.gam', serializeGame(t.game));
  const map = parseMap(t.get('test.map')!);
  map.blocks.fill(0);
  map.blocks[MLEN + 2] = 4;
  for (let x = 0; x < MLEN; x++) map.blocks[50 * MLEN + x] = BACKBL + 1;
  t.files.set('test.map', serializeMap(map));
  const blocks = parseBlocks(t.get('test.bbl')!, BACKBL);
  blocks[0].grav = 15; // Opposing pulls cancel; a player can walk straight across.
  Object.assign(blocks[4], { grav: 15, touchBl: BACKBL + 1 });
  t.files.set('test.bbl', serializeBlocks(blocks));

  const oracle = new SceneSim(t.game, 2, t, start, startCharInfo(), 1);
  oracle.hold([RIGHT]);
  let oracleExit: number | undefined;
  let oracleTicks = 0;
  for (; oracleTicks < 30; oracleTicks++) {
    const end = await oracle.tick();
    expect(end).not.toBe('dead');
    if (end && typeof end === 'object') {
      oracleExit = end.link;
      break;
    }
  }
  expect(oracleExit).toBe(0);
  expect(oracleTicks + 1).toBeGreaterThanOrEqual(4);
  expect(oracle.w.map[MLEN + 2]).toBe(BACKBL + 1);
  expect(platformGoals(oracle.w, [MLEN + 4])).toBeUndefined();

  const result = await autoWalk(t.game, t, 'test', { budgetMs: 1000 });
  expect(result.won).toBe(true);
  const replay = await verifyWalk(new GameFiles(t.files), 'test.gam', result.walk!, { maxMinutes: 2 });
  expect(replay.error).toBeUndefined();
  expect(replay.won).toBe(true);
  expect(replay.keysLeft).toBe(0);
});
