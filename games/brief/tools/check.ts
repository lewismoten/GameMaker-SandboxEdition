// Proves the library can be finished: the bot plays the whole game (tools/play.ts), every
// wing and book, the Reserve Stacks' gates, the thirty-third book and the ending. Then it
// checks that a gate stays shut for a wing with only three stories back.
//   cd web && npx vite-node ../games/brief/tools/check.ts [wing id]
import { compileAll } from '../src/compile';
import { sceneIds } from '../src/game';
import { wingCounter } from '../src/ids';
import { Bot, hazardsOf, windowBox } from './bot';
import { playThrough } from './play';

async function gateHolds(): Promise<void> {
  const { game, hub, chr, cb } = compileAll();
  const bot = new Bot(game, { library: { area: hub.area, names: hub.area.mons.names, hazards: hazardsOf(hub.area) } }, chr, cb.build());
  bot.enter(sceneIds().stacks, hub.stacks.entry);
  await bot.ticks(2);
  bot.ci.meter[wingCounter(0)] = 4; // three stories (counters read one more than they hold)
  const gate = hub.gates[0];
  const stuck = await bot.walk(() => [gate], windowBox(16, 0), () => false, false, 300).then(
    () => false,
    () => true,
  );
  if (!stuck || bot.sim.pos.bx === gate.x || bot.ci.meter[wingCounter(0)] !== 4) throw new Error('A gate opened for three stories');
  console.log('ok   a stamp gate stays shut for a wing with three stories');
}

await playThrough(process.argv[2])
  .then(() => (process.argv[2] ? undefined : gateHolds()))
  .catch((e) => {
    console.error(`FAIL ${e.message}`);
    process.exitCode = 1;
  });
