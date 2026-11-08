// The hurt-lock check: a scripted player walks into the spikes and stays there for 2 seconds (once
// pushing on, once standing still). He must live, and each spike must cost him no more than its 10
// hit points: the spikes turn flat when touched, so nothing holds him in a hurt that never ends.
// Prints hit points before and after.
//   cd web && npx vite-node ../games/watch-your-step/tools/bumpCheck.ts
import { SCAN } from '../../kit/starter/ids';
import { TICKS_PER_SECOND } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import type { StarterBot } from '../../kit/starter/bot';
import { play } from './play';

const STAND = Math.round(2 * TICKS_PER_SECOND);
let failed = false;

/** Walks to column `at`, then spends 2 seconds there: pushing right, or standing. `spikes` is how many spike blocks he may touch. */
async function bump(bot: StarterBot, at: number, what: string, push: boolean, spikes: number): Promise<void> {
  const snap = bot.snapshot();
  const sim = bot.sim;
  const before = sim.ci.hitpts;
  const deaths = sim.deaths;
  const out = await bot.walk(at, what);
  if (out) throw new Error(`${what}: ${out}`);
  if (push) sim.press(SCAN.right);
  for (let i = 0; i < STAND; i++) await bot.tick();
  sim.releaseAll();
  const after = sim.ci.hitpts;
  const ok = sim.deaths === deaths && after > 0 && before - after <= spikes * 10;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what} (${push ? 'pushing on' : 'standing'}): hit points ${before} -> ${after}, ${(before - after) / 10} sting(s)`);
  bot.restore(snap);
}

const { bot } = await play(1, 0);
for (const push of [false, true]) {
  await bump(bot, 14, 'level 1 lone spike', push, 1);
  await bump(bot, 27, 'level 1 two spikes (after the lone one)', push, 3);
}
if (failed) process.exit(1);
