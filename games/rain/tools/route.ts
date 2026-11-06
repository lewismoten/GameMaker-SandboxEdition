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
export async function puddles(bot: StarterBot) {
  await must(bot.walk(7, 'splashes'), 'first sign');
  await watch(bot, 3, 'splash.0');
  await must(bot.walk(12, 'rippling puddles'), 'puddles');
  await watch(bot, 3, 'pool1.0');
  await must(bot.walk(18, 'palette sign'), 'second sign');
  await must(bot.wait(48), 'read the palette sign');
  await leave(bot, 24);
}
export async function storm(bot: StarterBot) {
  await must(bot.walk(12, 'same puddles, darker colors'), 'storm puddles');
  await watch(bot, 4, 'pool1.0');
  await must(bot.wait(48), 'compare the colors');
  await leave(bot, 24);
}
