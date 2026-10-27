// The helpers every route uses: orders for the bot that must carry on (or must leave the scene),
// and carefully(), which plays a stretch again from a snapshot after a wait when moving things
// catch the poet out. Like a player, a route picks up the tips, mugs and plot it can see on the
// way when the detour is short, and goes round or hops over what it can't beat.
import { COFFEE, MONEY, PLOT } from '../src/ids';
import { SCENES } from '../src/scenes';
import { Bot } from './bot';

export type Route = (bot: Bot) => Promise<void>;

/** The scene number of a scene by name (title 0, ending 1, SCENES from 2). */
const sceneOf = (name: string) => SCENES.findIndex((d) => d.name === name) + 2;

export const expect = (bot: Bot, name: string) => {
  const n = sceneOf(name);
  if (bot.sim.scene !== n) throw new Error(`Expected ${name} (scene ${n}), in scene ${bot.sim.scene}\n${bot.log.slice(-8).join('\n')}`);
};

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
export async function must(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** Runs the last order of a scene: it must take the poet into the next scene (or the ending). */
export async function leave(bot: Bot, r: Promise<string | undefined>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/**
 * Plays a stretch where moving things can catch the poet out: if it costs a life or more than
 * `maxLoss` composure (or goes wrong), it is taken back and played again after a short wait, so
 * he sets out at a better moment.
 */
export async function carefully(bot: Bot, label: string, maxLoss: number, stretch: () => Promise<void>): Promise<void> {
  const start = bot.snapshot();
  const hp = bot.sim.ci.hitpts;
  const deaths = bot.sim.deaths;
  let why = '';
  for (let wait = 0; wait <= 300; wait += 6) {
    bot.restore(start);
    try {
      if (wait && (await bot.wait(wait))) throw new Error('a scene change while waiting');
      await stretch();
    } catch (e) {
      why = String(e).split('\n').slice(0, 3).join(' / ');
      continue;
    }
    const loss = hp - bot.sim.ci.hitpts;
    if (bot.sim.deaths === deaths && loss <= maxLoss) {
      bot.say(`${label}: waited ${wait} ticks, lost ${loss} composure`);
      return;
    }
    why = `lost ${loss} composure, ${bot.sim.deaths - deaths} lives`;
  }
  throw new Error(`${label}: no safe moment (${why})\n${bot.log.slice(-10).join('\n')}`);
}

export const tips = (bot: Bot) => bot.sim.meter(MONEY) - 1;
export const coffee = (bot: Bot) => bot.sim.meter(COFFEE) - 1;
export const plot = (bot: Bot) => bot.sim.meter(PLOT) - 1;

/** Declaims (Space) and waits for the word balloons to fly. */
export async function declaim(bot: Bot, what = 'declaimed'): Promise<void> {
  await must(bot, bot.hold('space', 3), what);
  await must(bot, bot.wait(12), what);
  bot.say(what);
}
