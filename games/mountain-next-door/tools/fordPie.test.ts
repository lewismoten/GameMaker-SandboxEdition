// Replay the ford with the upper pie omitted from its map.
import { expect, it } from 'vitest';
import { parseGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { FORD_AT, GU } from '../src/levels/ford';
import { blocks } from './route';
import { theFord } from './routeNew';
import { GameSim } from './sim';

it.each([true, false])('checks the upper ford pie when removed = %s', async (removed) => {
  const files = new Map(new GameSim().files);
  const name = [...files.keys()].find((file) => file.endsWith('.gam'))!;
  const game = parseGame(files.get(name)!);
  const ford = game.scenes.findIndex((scene) => scene.files[1] === 'ford.map');
  expect(ford).toBeGreaterThan(0);
  game.scenes[0].links[0] = game.scenes[ford - 1].links[0];
  files.set(name, serializeGame(game));
  const sim = new GameSim(files);
  const tile = (ORIGIN + GU - 1) * MLEN + ORIGIN + FORD_AT.upper.pie;
  const book = blocks('ford');
  expect(sim.w.map[tile]).toBe(book.n('pie'));
  if (removed) sim.w.map[tile] = book.n('sky');
  const route = theFord(new StarterBot(sim));
  if (removed) await expect(route).rejects.toThrow('The upper ford pie is missing');
  else await expect(route).resolves.toBeUndefined();
});
