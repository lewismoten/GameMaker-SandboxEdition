// Exercise the ladder-top lock probe against the built First Steps character and map.
import { expect, it } from 'vitest';
import { BACKBL, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { GameSim } from '../first-steps/tools/sim';
import { ORIGIN } from './starter/map';
import { leapProblems } from './leapCheck';

it('finds a keyless jump from a ladder top when the hero starts on that ladder', async () => {
  const { files, game } = new GameSim();
  const scene = game.scenes.findIndex((s) => s.files[1] === 'climb.map');
  const entrance = game.scenes[0].links[0];
  entrance.toScene = scene;
  entrance.to = { x: ORIGIN + 14, y: ORIGIN + 14 };
  files.set('steps.gam', serializeGame(game));

  // Put a two-block gate on the island beside the top of the ladder.
  const map = parseMap(files.get('climb.map')!);
  const cell = (x: number, y: number) => (ORIGIN + y) * MLEN + ORIGIN + x;
  const blocks = parseBlocks(files.get('steps.bbl')!, BACKBL);
  const gate = BACKBL - 1;
  blocks[gate] = { ...blocks[map.blocks[cell(15, 8)]], nextBl: gate, touchBl: 0, effect: 20, eamt: -1 };
  map.blocks[cell(15, 7)] = gate;
  map.blocks[cell(15, 6)] = map.blocks[cell(15, 8)];
  files.set('climb.map', serializeMap(map));
  files.set('steps.bbl', serializeBlocks(blocks));

  const sim = new GameSim(files);
  expect(sim.shown(sim.pos.x, sim.pos.y).grav).toBe(0);
  expect((await leapProblems(files)).problems).toContain(`scene ${scene}: the lock at (15, 7) can be jumped over from (14, 7)`);
});
