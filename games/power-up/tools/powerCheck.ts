// What a power does as it runs out, on the built disk: a star's four high jumps each rise about six
// blocks and the fifth is the ordinary three; the sneakers walk twice as fast until their strides are
// used up, then the ordinary walk comes back (the key must be pressed again), and standing still
// uses nothing (there is no clock). Exits 1 if any of that is not so.
//   cd web && npx vite-node ../games/power-up/tools/powerCheck.ts
import { SCAN } from '../../kit/starter/ids';
import { StarterBot } from '../../kit/starter/bot';
import { POWER, STAR_JUMPS } from '../src/hero';
import { GameSim } from './sim';

let failed = false;
const say = (ok: boolean, what: string) => {
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
};

/** One jump in place: how many pixels the hero rose. */
async function rise(bot: StarterBot): Promise<number> {
  const y0 = bot.px.y;
  let top = y0;
  bot.sim.press(SCAN.space);
  for (let i = 0; i < 50; i++) {
    await bot.tick();
    if (i === 2) bot.sim.release(SCAN.space);
    top = Math.min(top, bot.px.y);
  }
  return y0 - top;
}

const bot = new StarterBot(new GameSim(undefined, 1));
await bot.walk(8, 'clear ground');
bot.sim.ci.meter[POWER.highJump] = STAR_JUMPS;
const rises: number[] = [];
for (let i = 0; i < STAR_JUMPS + 1; i++) rises.push(await rise(bot));
say(
  rises.slice(0, STAR_JUMPS).every((r) => r > 110),
  `${STAR_JUMPS} high jumps rise ${rises.slice(0, STAR_JUMPS).join(', ')} px`,
);
say(rises[STAR_JUMPS] > 60 && rises[STAR_JUMPS] < 70, `the next jump is the ordinary one: ${rises[STAR_JUMPS]} px`);
say(bot.sim.ci.meter[POWER.highJump] === 0, `the counter is at ${bot.sim.ci.meter[POWER.highJump]}`);

// the sneakers: standing still costs nothing, running costs strides, and at 0 the ordinary walk is back
const before = (bot.sim.ci.meter[POWER.fastRight] = 12);
await bot.wait(120);
say(bot.sim.ci.meter[POWER.fastRight] === before, 'standing still for 6 seconds used no strides');
const speed = async (): Promise<number> => {
  const x0 = bot.px.x;
  bot.sim.press(SCAN.right);
  await bot.wait(20);
  bot.sim.release(SCAN.right);
  await bot.wait(8);
  return bot.px.x - x0;
};
const fast = await speed();
say(fast > 110, `with the sneakers 20 ticks cover ${fast} px`);
bot.sim.ci.meter[POWER.fastRight] = 0;
await bot.walk(8, 'back to clear ground');
const slow = await speed();
say(slow > 50 && slow < fast * 0.65, `with none left they cover ${slow} px`);
if (failed) process.exit(1);
