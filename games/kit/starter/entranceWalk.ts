// Check that walking left from a raised entrance still leaves a simple way forward.
import type { StarterBot } from './bot';
import { SCAN } from './ids';

export async function checkEntranceWalk(bot: StarterBot, left: number, right: number): Promise<void> {
  for (const [dir, column] of [
    ['left', left],
    ['right', right],
  ] as const) {
    const goal = column * 20;
    bot.sim.press(SCAN[dir]);
    for (let t = 0; t < 90 && (dir === 'left' ? bot.px.x > goal : bot.px.x < goal); t++) {
      const result = await bot.tick();
      if (result) throw new Error(`Walking ${dir} from the entrance: ${result}`);
    }
    bot.sim.release(SCAN[dir]);
    const landed = await bot.land();
    if (landed || Math.abs(bot.px.x - goal) > 6) throw new Error(`Entrance walk ${dir} to column ${column} stopped at x=${bot.px.x}: ${landed ?? 'blocked'}`);
  }
}
