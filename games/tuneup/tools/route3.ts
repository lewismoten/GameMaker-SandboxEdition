// The way through levels 10-13 as orders for the bot: the windshield crossed between the wiper
// sweeps (each blade watched go by, then a person's reaction), every raindrop rung on the way.
// A person's timing throughout (bot.ts).
import { expectScene as expect } from '@lewismoten/gamemaker-sandbox-tools/kit/routeChecks';
import { buildPalette } from '../src/art/palette';
import { BLADE_FOOT, DROPS, RAIN, SECTIONS, bladeName, parkedFrames, rainBlocks } from '../src/levels/rain';
import type { Bot } from './bot';
import { leave, must } from './route';

const rainBook = rainBlocks(buildPalette('rain')).book;
/** The raindrops' blocks. */
const drops = new Set([0, 1, 2, 3].map((i) => rainBook.n(`drop${i}`)));
/** Each wiper's blocks, at Doc Leo's feet, that show its blade has just gone by. */
const parked = SECTIONS.map((s) => new Set(parkedFrames(s).map((f) => rainBook.n(bladeName(s, BLADE_FOOT, f)))));

/** 10. The Rain Delay: up to each wiper, its blade watched go by, then across before the next sweep. */
export async function rainDelay(bot: Bot): Promise<void> {
  expect(bot, 17, 'the rain delay');
  await must(bot, bot.land(), 'onto the cowl');
  const hp = bot.sim.ci.hitpts;
  for (const [i, s] of SECTIONS.entries()) {
    for (const x of s.wipers) {
      await must(bot, bot.walk(x - 1, `before the wiper at ${x}`), 'to the wiper');
      const isParked = () => parked[i].has(bot.shownNum(x, BLADE_FOOT));
      // a sweep starting, then gone by: cross right behind it
      await must(
        bot,
        bot.until(undefined, () => !isParked(), `saw the blade at ${x} come`, 200),
        'waiting for the sweep',
      );
      await must(bot, bot.until(undefined, isParked, `saw the blade at ${x} go by`, 40), 'the sweep');
      await must(bot, bot.react(), 'reacting');
      await must(bot, bot.walk(x + 1, `past the wiper at ${x}`), 'across');
    }
  }
  if (bot.sim.ci.hitpts < hp) throw new Error(`slapped by a wiper: ${hp} -> ${bot.sim.ci.hitpts}`);
  const left = DROPS.filter((x) => drops.has(bot.shownNum(x, RAIN.floor - 1)));
  if (left.length) throw new Error(`raindrops left at ${left.join(', ')}`);
  await leave(bot, bot.walk(RAIN.exit, 'to the far pillar'), 'out');
}

export const LEVELS_10_13 = [rainDelay];
