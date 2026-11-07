// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by
// level, with a look at each sign and a stop to watch whatever is happening. The checks here fail if a treasure is
// missed, a bump hurts when it should not, or a scene moves on before it has been watched.
import type { StarterBot } from '../../kit/starter/bot';
import { NEXT_AT } from '../src/levels/next';
import { GROUND } from '../src/level';
import { PROLOGUE } from '../src/monsters';
import { READ, leave, must, readAt, solidNow, watchFor } from './routeKit';

/** Ticks since the scene began. */
const since = (bot: StarterBot, t0: number) => bot.sim.w.clock - t0;

/** 1. Next Door: read along the street while the fog lifts, watch the mountain wake and lift its toe, then go. */
export async function nextDoor(bot: StarterBot): Promise<void> {
  const t0 = bot.sim.w.clock;
  const at = NEXT_AT.signs;
  await readAt(bot, at.up + 1, 'the first sign');
  await readAt(bot, at.fog + 1, 'the fog sign');
  await must(bot, bot.walk(at.not - 1, 'the mountain'), 'to the mountain');
  await watchFor(bot, () => since(bot, t0) > 560, 'the fog lifting', 900);
  await readAt(bot, at.not + 1, 'the not-fog sign');
  await readAt(bot, at.gates + 1, 'the gates sign');
  await must(bot, bot.walk(NEXT_AT.toe - 2, 'the toe'), 'to the toe');
  if (since(bot, t0) > PROLOGUE.wake) throw new Error('the mountain woke before Tess got to watch');
  await watchFor(bot, () => !solidNow(bot, NEXT_AT.toe, GROUND - 1), 'the mountain lifting its toe', 900);
  await must(bot, bot.wait(READ / 2), 'a look up at the mountain');
  await readAt(bot, at.polite + 1, 'the polite sign');
  await leave(bot, bot.walk(NEXT_AT.exit + 1, 'the exit'), 'the exit');
}
