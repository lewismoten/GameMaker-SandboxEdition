// Exercise ground and ladder-top lock probes against the built First Steps character and map.
import { expect, it, vi } from 'vitest';
import { BACKBL, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN, parseMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { GameSim as KitSim } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { GameSim } from '../first-steps/tools/sim';
import { ORIGIN } from './starter/map';
import { leapProblems } from './leapCheck';

it.each([
  { approach: 'ladder top', x: 15, y: 7 },
  { approach: 'ground', x: 4, y: 14 },
])('counts the gate and tries a jump from the $approach after a ladder-foot entrance', async ({ approach, x, y }) => {
  const { files, game } = new GameSim();
  const scene = game.scenes.findIndex((s) => s.files[1] === 'climb.map');
  const entrance = game.scenes[0].links[0];
  entrance.toScene = scene;
  entrance.to = { x: ORIGIN + 14, y: ORIGIN + 14 };
  files.set('steps.gam', serializeGame(game));

  const map = parseMap(files.get('climb.map')!);
  const cell = (x: number, y: number) => (ORIGIN + y) * MLEN + ORIGIN + x;
  const blocks = parseBlocks(files.get('steps.bbl')!, BACKBL);
  const gate = BACKBL - 1;
  blocks[gate] = { ...blocks[map.blocks[cell(15, 8)]], nextBl: gate, touchBl: 0, effect: 20, eamt: -1 };
  map.blocks[cell(x, y)] = gate;
  map.blocks[cell(x, 6)] = map.blocks[cell(15, 8)];
  files.set('climb.map', serializeMap(map));
  files.set('steps.bbl', serializeBlocks(blocks));

  const sim = new GameSim(files);
  expect(sim.shown(sim.pos.x, sim.pos.y).grav).toBe(0);
  using press = vi.spyOn(KitSim.prototype, 'press');
  const { locks, problems } = await leapProblems(files);
  expect(locks).toBe(1);
  expect(press).toHaveBeenCalledWith(57); // Space
  if (approach === 'ladder top') expect(problems).toContain(`scene ${scene}: the lock at (15, 7) can be jumped over from (14, 7)`);
});
