// Exercise the floor checks with a misplaced exit and mistimed blocks on an in-memory disk.
import { fileURLToPath } from 'node:url';
import { expect, it, vi } from 'vitest';
import { BACKBL, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { StarterBot } from '../../kit/starter/bot';
import { buildLevels } from '../src/levels';
import { aMenuRoom, sceneThatMovesOn } from './route';
import { GameSim } from './sim';

it('rejects a link reached on tick 260 while the trap still shows its warning', async () => {
  const sim = new GameSim();
  const tick = sim.tick.bind(sim);
  vi.spyOn(sim, 'tick').mockImplementation(() => {
    if (sim.ticks === 259) sim.game.scenes[sim.scene].links[0].from = sim.pos;
    return tick();
  });
  await expect(sceneThatMovesOn(new StarterBot(sim))).rejects.toThrow(/floor.*link/);
});

it.each([
  ['trap', -1, 305],
  ['quick', 1, 90],
] as const)('rejects a %s floor with its opening shifted by %i tick at tick %i', async (kind, offset, firstWrongTick) => {
  const files = readDisk(fileURLToPath(new URL('../disk/', import.meta.url)));
  const blocks = parseBlocks(files.get('cuts.bbl')!, BACKBL);
  blocks[buildLevels().book.n(`${kind}.warn`)].ntime += offset;
  files.set('cuts.bbl', serializeBlocks(blocks));
  const bot = new StarterBot(new GameSim(files));
  bot.jumpHold = 8;
  if (kind === 'quick') await sceneThatMovesOn(bot);
  await expect(kind === 'trap' ? sceneThatMovesOn(bot) : aMenuRoom(bot)).rejects.toThrow(`tick ${firstWrongTick}`);
});
