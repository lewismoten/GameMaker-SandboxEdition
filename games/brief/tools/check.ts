// Proves the library can be finished: the bot plays the whole game (tools/play.ts), every
// wing and book, the Reserve Stacks' gates, the thirty-third book and the ending. Then it
// checks that a gate stays shut for a wing with only three stories back. The multi-block
// objects are checked first (tools/align.ts).
//   cd web && npx vite-node ../games/brief/tools/check.ts [wing id]
import { compileAll } from '../src/compile';
import { sceneIds } from '../src/game';
import { EGG_BLOCK, SCAN, wingCounter } from '../src/ids';
import { BACKBL } from '../../../web/src/formats/blocks';
import { Bot, hazardsOf, windowBox } from './bot';
import { playThrough } from './play';
import { align } from './align';

async function gateHolds(): Promise<void> {
  const { game, hub, chr, cb } = compileAll();
  const bot = new Bot(game, { library: { area: hub.area, names: hub.area.mons.names, hazards: hazardsOf(hub.area) } }, chr, cb.build());
  bot.enter(sceneIds().stacks, hub.stacks.entry);
  await bot.ticks(2);
  bot.ci.meter[wingCounter(0)] = 4; // three stories (counters read one more than they hold)
  const gate = hub.gates[0];
  const stuck = await bot
    .walk(
      () => [gate],
      windowBox(16, 0),
      () => false,
      false,
      300,
    )
    .then(
      () => false,
      () => true,
    );
  if (!stuck || bot.sim.pos.bx === gate.x || bot.ci.meter[wingCounter(0)] !== 4) throw new Error('A gate opened for three stories');
  console.log('ok   a stamp gate stays shut for a wing with three stories');
}

/** The felt egg: through the loose shelf, onto the shoebox, P, and out (still in the pocket). */
async function eggPocketed(): Promise<void> {
  const { game, hub, chr, cb } = compileAll();
  const id = sceneIds();
  const bot = new Bot(game, { library: { area: hub.area, names: hub.area.mons.names, hazards: hazardsOf(hub.area) } }, chr, cb.build());
  bot.enter(id.stacks, hub.stacks.entry);
  await bot.walk(
    () => [hub.looseShelf],
    windowBox(16, 0),
    () => false,
    false,
    3000,
  );
  if (bot.follow() !== id.lost) throw new Error('The loose shelf does not lead to the Lost and Found');
  await bot.walk(
    () => [hub.egg],
    windowBox(32, 0),
    () => false,
    false,
    3000,
  );
  if (bot.ci.inv.includes(EGG_BLOCK)) throw new Error('The egg was pocketed without Space');
  bot.sim.press(SCAN.space);
  await bot.ticks(2);
  bot.sim.release(SCAN.space);
  await bot.ticks(12);
  if (bot.ci.inv[0] !== EGG_BLOCK || bot.ci.inv.slice(1).some((b) => b !== BACKBL)) throw new Error(`Space did not pocket the egg: ${bot.ci.inv}`);
  await bot.walk(
    () => [hub.lostOut],
    windowBox(32, 0),
    () => false,
    false,
    3000,
  );
  if (bot.follow() !== id.stacks || bot.ci.inv[0] !== EGG_BLOCK) throw new Error('The egg did not come out of the Lost and Found');
  console.log(`ok   the felt egg: loose shelf, Space, block ${EGG_BLOCK} in the pocket, back in the Stacks`);
}

if (align()) throw new Error('brief: a multi-block object is out of line (above)');

await playThrough(process.argv[2])
  .then(() => (process.argv[2] ? undefined : gateHolds().then(eggPocketed)))
  .catch((e) => {
    console.error(`FAIL ${e.message}`);
    process.exitCode = 1;
  });
