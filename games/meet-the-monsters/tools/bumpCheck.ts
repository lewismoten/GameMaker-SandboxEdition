// The gentle-hurt check: a scripted player walks into each monster that hurts and stays in it
// for 2 seconds (once pushing on, once standing still). He must live; prints his hit points
// before, after and the least he had, and how many bumps it took.
//   cd web && npx vite-node ../games/meet-the-monsters/tools/bumpCheck.ts
import { SCAN } from '../../kit/starter/ids';
import { TICKS_PER_SECOND } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import type { StarterBot } from '../../kit/starter/bot';
import { play } from './play';

const STAND = Math.round(2 * TICKS_PER_SECOND);
let failed = false;

/** Walks to column `at` (the monster's), then spends 2 seconds there: pushing right, or standing. */
async function bump(bot: StarterBot, at: number, what: string, push: boolean): Promise<void> {
  const snap = bot.snapshot();
  const sim = bot.sim;
  const before = sim.ci.hitpts;
  const deaths = sim.deaths;
  const out = await bot.walk(at, what);
  if (out) throw new Error(`${what}: ${out}`);
  let least = sim.ci.hitpts;
  if (push) sim.press(SCAN.right);
  for (let i = 0; i < STAND; i++) {
    await bot.tick();
    least = Math.min(least, sim.ci.hitpts);
  }
  sim.releaseAll();
  const after = sim.ci.hitpts;
  const ok = sim.deaths === deaths && after > 0;
  if (!ok) failed = true;
  console.log(
    `${ok ? 'ok  ' : 'DIED'} ${what} (${push ? 'pushing on' : 'standing'}): hit points ${before} -> ${after}, least ${least}, ${(before - after) / 10} bump(s)`,
  );
  bot.restore(snap);
}

const { bot } = await play(1, 0);
for (const push of [false, true]) {
  await bump(bot, 12, 'level 1 gumdrop (harmless)', push);
  await bump(bot, 34, 'level 1 snail', push);
}
const l1 = await play(1, 1);
for (const push of [false, true]) await bump(l1.bot, 26, 'level 2 gumdrop', push);
if (failed) process.exit(1);
