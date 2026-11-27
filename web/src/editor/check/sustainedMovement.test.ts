// A held movement key can be necessary when letting go starts autonomous motion.
import { expect, it } from 'vitest';
import { BACKBL, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { emptyFrame, parseCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { GameFiles } from '../../project/files';
import { continuousFlight, directionalGravity } from './platformGoals';
import { SceneSim, startCharInfo } from './sim';
import { RIGHT, testGame } from './testGame';
import { autoWalk } from './walk/autoWalk';
import { verifyWalk } from './walk/verify';

it.each([true, false])('keeps held steering while idle drifts (short sequence: %s)', async (short) => {
  const t = testGame(['S']);
  const start = { x: 1, y: 10 };
  t.game.scenes[0].links[0].to = start;
  t.game.scenes[2].links[0].from = { x: 4, y: 9 };
  t.files.set('test.gam', serializeGame(t.game));
  const map = parseMap(t.get('test.map')!);
  map.blocks.fill(0);
  for (let x = 0; x < MLEN; x++) map.blocks[5 * MLEN + x] = 3;
  t.files.set('test.map', serializeMap(map));
  const blocks = parseBlocks(t.get('test.bbl')!, BACKBL);
  blocks[0].grav = 0;
  Object.assign(blocks[3], { grav: 0, chHitPt: -100 });
  t.files.set('test.bbl', serializeBlocks(blocks));
  const chr = parseCharacter(t.get('test.chr')!);
  for (const [q, dx, dy] of [
    [0, 0, -20],
    [5, 4, -1],
    [6, -4, -1],
  ]) {
    chr.sequences[q].frames = Array.from({ length: 10 }, () => emptyFrame(true));
    for (const frame of q === 0 || short ? chr.sequences[q].frames.slice(0, 1) : chr.sequences[q].frames)
      Object.assign(frame, { pic1: 0, pic2: 1, x: dx, y: dy });
    if (short && q !== 0) Object.assign(chr.sequences[q].frames[2], { pic2: 1, y: 20 });
  }
  t.files.set('test.chr', serializeCharacter(chr));

  const oracle = new SceneSim(t.game, 2, t, start, startCharInfo(), 1);
  expect(directionalGravity(oracle.w)).toBe(false);
  const flying = continuousFlight(oracle.w);
  oracle.hold([RIGHT]);
  let exit: number | undefined;
  let ticks = 0;
  for (; ticks < 90; ticks++) {
    const end = await oracle.tick();
    expect(end).not.toBe('dead');
    if (end && typeof end === 'object') {
      exit = end.link;
      break;
    }
  }
  expect(exit).toBe(0);
  expect(ticks + 1).toBeGreaterThan(3);

  expect(flying).toBe(true);

  const result = await autoWalk(t.game, t, 'test', { budgetMs: 1000 });
  expect(result.won).toBe(true);
  const replay = await verifyWalk(new GameFiles(t.files), 'test.gam', result.walk!, { maxMinutes: 2 });
  expect(replay.error).toBeUndefined();
  expect(replay.won).toBe(true);
  expect(replay.keysLeft).toBe(0);
});
