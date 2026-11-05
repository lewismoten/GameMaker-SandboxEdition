// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press,
// level by level. The bot plays at Today speed (the engine's default), so the pads and the crowd cost it nothing.
//   level 1: read the signs, step on the short pad (a quarter-second sound), then the long pad
//   level 2: read the signs and walk through the 36 monsters (they are friendly)
//   level 3: read the signs and walk under the moving sky
import type { Result, StarterBot } from '../../kit/starter/bot';
import { CROWD } from '../src/timing';
import { CROWD_X, PAD_X } from '../src/levels';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** Counts the voice and speaker sounds the world starts while the bot plays. */
function listen(bot: StarterBot): { n: number } {
  const w = bot.sim.w as unknown as { sound: { play: (n: number) => boolean } };
  const heard = { n: 0 };
  const play = w.sound.play.bind(w.sound);
  w.sound.play = (n) => {
    heard.n++;
    bot.say(`sound ${n} at tick ${bot.sim.ticks}`);
    return play(n);
  };
  return heard;
}

/** Monsters alive (the crowd). */
const alive = (bot: StarterBot) => bot.sim.w.mm.filter((m) => m.monnum <= 2).length;

/** 1. Short and Long. */
export async function shortAndLong(bot: StarterBot): Promise<void> {
  const heard = listen(bot);
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(60), 'reading the sign');
  await must(bot, bot.walk(12, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(60), 'reading the sign');
  // each short pad plays its blip once, and a pad that has played does nothing more
  for (const x of PAD_X.short) {
    const before = heard.n;
    await must(bot, bot.walk(x, 'a short pad'), 'to a short pad');
    await must(bot, bot.wait(24), 'listening to the blip');
    if (heard.n !== before + 1) throw new Error(`a short pad should play one sound, not ${heard.n - before}`);
  }
  if (bot.sim.ci.score - score !== PAD_X.short.length) throw new Error('each short pad should add a point');
  await must(bot, bot.walk(27, 'the third sign'), 'to the third sign');
  await must(bot, bot.wait(60), 'reading the sign');
  for (const x of PAD_X.long) {
    const before = heard.n;
    await must(bot, bot.walk(x, 'a long pad'), 'to a long pad');
    await must(bot, bot.wait(40), 'listening to the long sound');
    if (heard.n !== before + 1) throw new Error(`a long pad should play one sound, not ${heard.n - before}`);
  }
  await must(bot, bot.walk(43, 'the last sign'), 'to the last sign');
  await must(bot, bot.wait(60), 'reading the sign');
  await leave(bot, bot.walk(51, 'the exit'), 'the exit');
}

/** 2. A Crowd. */
export async function aCrowd(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(70), 'reading the sign');
  if (alive(bot) !== CROWD) throw new Error(`there should be ${CROWD} monsters, not ${alive(bot)}`);
  const hp = bot.sim.ci.hitpts;
  await must(bot, bot.walk(CROWD_X[0] + 6, 'into the crowd'), 'into the crowd');
  await must(bot, bot.wait(60), 'looking at the crowd');
  await must(bot, bot.walk(29, 'the last sign'), 'to the last sign');
  await must(bot, bot.wait(70), 'reading the sign');
  if (bot.sim.ci.hitpts !== hp) throw new Error('the friendly crowd cost hit points');
  await leave(bot, bot.walk(33, 'the exit'), 'the exit');
}

/** 3. Busy Sky. */
export async function busySky(bot: StarterBot): Promise<void> {
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(80), 'reading the sign');
  await must(bot, bot.walk(13, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(80), 'reading the sign');
  await must(bot, bot.walk(21, 'the last sign'), 'to the last sign');
  await must(bot, bot.wait(70), 'reading the sign');
  await leave(bot, bot.walk(29, 'the exit'), 'the exit');
}
