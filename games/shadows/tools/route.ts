// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press.
//   the yard with solid shadows: a look at the sign, along the three grounds past a pip on each, to the door;
//   the same yard with dithered shadows: the same walk, then the door;
//   the hop: a pause at each of the three hoppers, one jump of Kit's own (his shadow is part of his standing and walking pictures, so the jump has its own pictures with none), the door;
//   the hover: a pause under each bee, the door, which ends the game.
// The checks fail if a door leads to the wrong scene, a scene loads the wrong pictures, or the yard's two scenes do not share one map file.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { HOP, HOVER, YARD } from '../src/levels';

async function through(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'no link fired'}\n${bot.log.slice(-8).join('\n')}`);
}
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** A person's look at what just happened, in ticks (about two seconds). */
const LOOK = 40;
/** The scene files the bot is in: palette, map, blocks, monsters, monster blocks, character, character blocks. */
const files = (bot: StarterBot): string[] => bot.sim.game.scenes[bot.sim.scene].files;

export async function journey(bot: StarterBot): Promise<void> {
  const maps: string[] = [];
  await must(bot, bot.wait(LOOK), 'reading the first sign');
  // the yard, twice: past each pip, to the door
  for (const [scene, bbl, cbl, mbl] of [
    [2, 'solid.bbl', 'solid.cbl', 'solid.mbl'],
    [3, 'dither.bbl', 'dither.cbl', 'dither.mbl'],
  ] as const) {
    if (bot.sim.scene !== scene) throw new Error(`the bot should be in scene ${scene}, not ${bot.sim.scene}`);
    const f = files(bot);
    if (f[2] !== bbl || f[4] !== mbl || f[6] !== cbl) throw new Error(`scene ${scene} should load ${bbl}, ${mbl}, ${cbl}; it loads ${f[2]}, ${f[4]}, ${f[6]}`);
    maps.push(f[1]);
    for (const x of YARD.pips) {
      await must(bot, bot.walk(x - 1, 'to a pip', 2000), `walking to the pip at ${x}`);
      await must(bot, bot.wait(LOOK), 'a look at its shadow');
    }
    await through(bot, bot.walk(YARD.exit, `the yard's door`, 3000), `yard door ${scene}`);
    await must(bot, bot.wait(LOOK / 2), 'a breath');
  }
  if (new Set(maps).size !== 1) throw new Error(`the yard's two scenes should use one map file; they use ${maps.join(' and ')}`);
  // the hop
  if (bot.sim.scene !== 4) throw new Error(`the yard's second door should lead to the hop (4), not ${bot.sim.scene}`);
  for (const x of HOP.hoppers) {
    await must(bot, bot.walk(x - 1, 'to a hopper', 2000), `walking to the hopper at ${x}`);
    await must(bot, bot.wait(LOOK * 2), 'watching a hop');
  }
  await must(bot, bot.jump('right', HOP.hoppers[2] + 3), 'a jump of his own');
  await through(bot, bot.walk(HOP.exit, `the hop's door`, 3000), 'hop door');
  // the hover
  if ((bot.sim.scene as number) !== 5) throw new Error(`the hop's door should lead to the hover (5), not ${bot.sim.scene}`);
  for (const x of [HOVER.low, HOVER.high]) {
    await must(bot, bot.walk(x - 1, 'under a bee', 2000), `walking under the bee at ${x}`);
    await must(bot, bot.wait(LOOK * 2), 'watching it hover');
  }
  await through(bot, bot.walk(HOVER.exit, 'the last door', 3000), 'last door');
}
