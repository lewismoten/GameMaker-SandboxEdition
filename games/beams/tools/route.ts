// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press.
//   the beams: a look at the start sign, then a pause in each of the three beams (solid, checkerboard, soft), the door;
//   the fog: a look at the solid fog half, a walk into the dithered half, a pause under each bank of fog, the door;
//   the glow: a pause under each of the three lanterns, the last door, which ends the game.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { BEAMS, FOG_ROOM, GLOW } from '../src/levels';

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

export async function journey(bot: StarterBot): Promise<void> {
  await must(bot, bot.wait(LOOK), 'reading the first sign');
  // the beams: stand in each one, a look at it
  for (const x of BEAMS.lamps) {
    await must(bot, bot.walk(x, 'into a beam', 2500), `walking into the beam at ${x}`);
    await must(bot, bot.wait(LOOK * 2), 'a look at the beam');
  }
  await through(bot, bot.walk(BEAMS.exit, 'the beams door', 3000), 'beams door');
  // the fog
  if ((bot.sim.scene as number) !== 3) throw new Error(`the first door should lead to the fog (3), not ${bot.sim.scene}`);
  await must(bot, bot.wait(LOOK), 'reading the first sign');
  await must(bot, bot.walk(FOG_ROOM.zoneB - 4, 'to the edge of the solid fog', 2500), 'walking to the solid fog');
  await must(bot, bot.wait(LOOK * 2), 'a look at the flat fog');
  await must(bot, bot.walk(FOG_ROOM.zoneB + 4, 'into the dithered fog', 2500), 'walking into the dithered fog');
  await must(bot, bot.wait(LOOK * 3), 'a look at the checker fog');
  await must(bot, bot.walk(FOG_ROOM.zoneB + 16, 'under the drifting fog', 2500), 'walking under the drifting fog');
  await must(bot, bot.wait(LOOK * 3), 'watching the fog drift');
  await through(bot, bot.walk(FOG_ROOM.exit, 'the fog door', 3000), 'fog door');
  // the glow
  if ((bot.sim.scene as number) !== 4) throw new Error(`the fog's door should lead to the glow (4), not ${bot.sim.scene}`);
  for (const x of GLOW.lamps) {
    await must(bot, bot.walk(x + 2, 'under a lantern', 2500), `walking under the lantern at ${x}`);
    await must(bot, bot.wait(LOOK * 2), 'watching a lantern');
  }
  await through(bot, bot.walk(GLOW.exit, 'the last door', 3000), 'last door');
}
