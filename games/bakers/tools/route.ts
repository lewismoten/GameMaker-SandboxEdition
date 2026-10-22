// The way through the kitchen, as orders for the bot: for each room, the things to fetch
// first (spoons for the latches, a float when it is cheap) and then the ingredient. The normal
// route takes every room in turn; the secret route takes the Cold Cellar's second vanilla
// bean down to the hidey-hole and skips the Tea Room.
import { ORIGIN } from '../src/levels/room';
import { Bot } from './bot';

/** A stop: a legend character (the nearest one not yet visited) or a room cell [x, y]. */
export type Stop = string | [number, number] | { pickup: [number, number] };

export const ROUTE: Record<number, Stop[]> = {
  1: ['k', 'I'],
  2: ['k', 'I'],
  3: [{ pickup: [8, 8] }, 'k', 'I'],
  4: ['k', 'I'],
  5: ['k', 'I'],
  6: ['k', 'I'],
  7: ['k', 'I'],
  8: ['k', 'I'],
  9: ['k', 'I'],
  10: ['k', 'I'],
};

/** The secret way out of the Cold Cellar, and the hidey-hole's own route. */
export const SECRET_ROUTE: Record<number, Stop[]> = {};

export async function playRoom(bot: Bot, stops: Stop[]): Promise<void> {
  const scene = bot.sim.scene;
  const name = bot.room().spec.name;
  const done = new Set<string>();
  for (const stop of stops) {
    let target: { x: number; y: number };
    let pick = false;
    if (typeof stop === 'string') {
      const p = bot.sim.pos;
      const all = bot.marks(stop).filter((m) => !done.has(`${m.x},${m.y}`));
      if (!all.length) throw new Error(`${name}: no ${stop} left`);
      all.sort((a, b) => Math.abs(a.x - p.x) + Math.abs(a.y - p.y) - (Math.abs(b.x - p.x) + Math.abs(b.y - p.y)));
      target = all[0];
    } else if (Array.isArray(stop)) target = { x: stop[0] + ORIGIN.x, y: stop[1] + ORIGIN.y };
    else {
      target = { x: stop.pickup[0] + ORIGIN.x, y: stop.pickup[1] + ORIGIN.y };
      pick = true;
    }
    done.add(`${target.x},${target.y}`);
    // a death is taken back and the stretch played again after a little wait, so Doc Leo
    // sets off at a better moment (the walkthrough should not die)
    const before = bot.snapshot();
    for (let attempt = 0; ; attempt++) {
      const r = await bot.goto(target.x, target.y, `${name} -> ${JSON.stringify(stop)}`);
      if (r === 'dead') {
        if (attempt > 40) throw new Error(`${name}: died ${attempt + 1} times`);
        bot.restore(before);
        await bot.wait(3 + attempt * 4);
        continue;
      }
      if (r === 'link' || r === 'end') {
        bot.say(`${name}: out`);
        return;
      }
      break;
    }
    if (pick) await bot.pickup();
    bot.say(`${name}: reached ${JSON.stringify(stop)}`);
  }
  if (bot.sim.scene === scene) throw new Error(`${name}: still here after the route`);
}
