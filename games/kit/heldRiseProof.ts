// Proof: why a held-rise jump lets a hero jump only once per flight, and the default momentum jump does not.
// Both are played headless on built disks: the hero jumps, waits until he is falling, taps Space again,
// and we measure how much higher he gets. first-steps has the held-rise hero; jump-boots (its first
// level) has the default momentum hero whose taps stack, on purpose.
import { existsSync } from 'node:fs';
import { diskSim } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { StarterBot } from './starter/bot';
import { SCAN } from './starter/ids';

const disk = (id: string) => new URL(`../${id}/disk`, import.meta.url);

/** Hold Space `hold` ticks, release, wait until falling, tap Space `tap` ticks; returns [peak before the tap, peak after it] (pixels above the floor). */
async function reJump(id: string, hold: number, tap: number): Promise<[number, number]> {
  const Sim = diskSim(disk(id));
  const bot = new StarterBot(new Sim(undefined, 1));
  await bot.land();
  const floor = bot.px.y;
  bot.sim.press(SCAN.space);
  await bot.wait(hold);
  bot.sim.release(SCAN.space);
  let peak = 0;
  let last = bot.px.y;
  // until he has started falling
  for (let i = 0; i < 80; i++) {
    await bot.tick();
    peak = Math.max(peak, floor - bot.px.y);
    if (bot.px.y > last + 3) break;
    last = bot.px.y;
  }
  bot.sim.press(SCAN.space);
  await bot.wait(tap);
  bot.sim.release(SCAN.space);
  let after = peak;
  for (let i = 0; i < 80; i++) {
    await bot.tick();
    after = Math.max(after, floor - bot.px.y);
  }
  return [peak, after];
}

if (!existsSync(disk('first-steps')) || !existsSync(disk('jump-boots'))) throw new Error('build first-steps and jump-boots first');
//   npx vite-node ../games/kit/heldRiseProof.ts   (exits 1 if the held-rise hero can lift again, or the default cannot)
const [hp, ha] = await reJump('first-steps', 6, 4);
const [mp, ma] = await reJump('jump-boots', 2, 2);
console.log(`held-rise hero: peak ${hp}px, after a tap while falling ${ha}px`);
console.log(`momentum hero:  peak ${mp}px, after a tap while falling ${ma}px`);
process.exit(hp > 20 && ha === hp && ma > mp + 10 ? 0 : 1);
