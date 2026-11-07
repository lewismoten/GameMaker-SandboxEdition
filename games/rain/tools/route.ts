// The bot stops beside each visible effect; it checks the real engine's remapped block pictures.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { buildLevels } from '../src/levels';
const { levels } = buildLevels();
async function must(r: Promise<Result>, label: string) {
  const result = await r;
  if (result) throw new Error(`${label}: ${result}`);
}
async function leave(bot: StarterBot, x: number) {
  const result = await bot.walk(x, 'the door');
  if (result !== 'link' && result !== 'end') throw new Error(`door: ${result ?? 'still here'}`);
}
/** Observe every frame of an actual block-number clock, not a prediction of the animation. */
async function watch(bot: StarterBot, scene: number, name: string) {
  const book = levels[scene - 2].book;
  const seen = new Set<number>();
  for (let i = 0; i < 32; i++) {
    seen.add(bot.sim.w.blkmap[book.n(name)]);
    await must(bot.tick(), name);
  }
  if (seen.size !== 4) throw new Error(`${name}: ${seen.size} frames instead of four`);
  bot.say(`${name}: saw four frames on the engine`);
}
export async function falling(bot: StarterBot) {
  await must(bot.walk(7, 'rain in rows'), 'first sign');
  await watch(bot, 2, 'rain.0');
  await must(bot.wait(32), 'read the sign');
  await must(bot.walk(24, 'scattered rain'), 'second sign');
  const book = levels[0].book;
  for (let t = 0; t < 16; t++) {
    const frames = [0, 1, 2, 3].map((f) => bot.sim.w.blkmap[book.n(`rain.${f}`)]);
    if (new Set(frames).size !== 4) throw new Error('offset rain fell into lockstep');
    await must(bot.tick(), 'phase offsets');
  }
  await must(bot.wait(48), 'read the offset sign');
  await leave(bot, 34);
}
/** Walks through a puddle and checks the real engine swapped in splash blocks: one point per column stepped in. */
async function splashThrough(bot: StarterBot, x: number, label: string) {
  const before = bot.sim.ci.score;
  await must(bot.walk(x, label), label);
  const splashes = bot.sim.ci.score - before;
  if (splashes !== 3) throw new Error(`${label}: ${splashes} splashes instead of one for each of the three cells`);
  bot.say(`${label}: three splashes`);
}
export async function puddles(bot: StarterBot) {
  await must(bot.walk(7, 'splashes'), 'first sign');
  await watch(bot, 3, 'splash.0');
  await splashThrough(bot, 12, 'first puddle');
  await watch(bot, 3, 'pool1.0');
  await must(bot.walk(16, 'the house'), 'house');
  await watch(bot, 3, 'house.10.0');
  await watch(bot, 3, 'house.52.0');
  await must(bot.wait(24), 'watch the spout');
  await splashThrough(bot, 25, 'second puddle');
  await must(bot.wait(48), 'read the splash sign');
  await splashThrough(bot, 34, 'third puddle');
  await must(bot.wait(48), 'read the palette sign');
  await leave(bot, 38);
}
export async function storm(bot: StarterBot) {
  await splashThrough(bot, 12, 'storm puddle');
  await watch(bot, 4, 'pool1.0');
  await must(bot.walk(17, 'the house in the storm'), 'storm house');
  await must(bot.wait(48), 'compare the colors');
  await leave(bot, 38);
}
