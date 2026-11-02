// The way through level 14, The Beltway, as orders for the bot, driving as a person does: it
// watches the rear-view mirror, and a moment after a glint shows there (a person's reaction) it
// moves to a lane no car is coming up in, one tap a lane with its hands still a few ticks between
// taps. Then it rides out the exit when the strip tips it there. No honks: a honk is a failure.
import { expectScene as expect } from '@lewismoten/gamemaker-sandbox-tools/kit/routeChecks';
import { BELTMON } from '../src/beltMonsters';
import { LEVELS } from '../src/levels/levels';
import { MIRROR } from '../src/levels/beltwayPlan';
import { ORIGIN } from '../src/levels/maps';
import type { Bot } from './bot';
import { must } from './route';

/** The scene the Beltway is. */
const SCENE = LEVELS.findIndex((l) => l.file === 'belt') + 2;
/** Every mirror glint's monster, by its lane. */
const GLINTS = new Map<number, number>();
for (const lane of [-1, 0, 1]) for (const kind of [0, 1]) GLINTS.set(BELTMON.mirror(lane, kind), lane);

/** The lanes with a car showing in the mirror now. */
function coming(bot: Bot): Set<number> {
  const lanes = new Set<number>();
  bot.sim.w.mm.forEach((m, i) => {
    const lane = GLINTS.get(m.monnum);
    if (lane !== undefined && bot.sim.w.mi[i].cury[0] - ORIGIN === MIRROR.row) lanes.add(lane);
  });
  return lanes;
}

/** 14. The Beltway: out of every car's way, then out at the exit. */
export async function beltway(bot: Bot): Promise<void> {
  expect(bot, SCENE, 'the beltway');
  const score = bot.sim.ci.score;
  let seen = '';
  let moves = 0;
  for (;;) {
    const lane = Math.round(bot.px.x / 20) - 8;
    const cars = coming(bot);
    const key = [...cars].sort().join();
    if (key !== seen && cars.size) {
      // a new glint: a look, then over to the nearest clear lane
      await must(bot, bot.react(), 'seeing the mirror');
      const clear = [-1, 0, 1].filter((l) => !cars.has(l)).sort((a, b) => Math.abs(a - lane) - Math.abs(b - lane))[0];
      for (let at = lane; at !== clear; at += Math.sign(clear - at)) {
        await must(bot, bot.tap(clear < at ? 'left' : 'right', 6), 'changing lanes');
        moves++;
      }
    }
    seen = key;
    if (bot.sim.ci.score < score) throw new Error(`honked at in lane ${lane} (tick ${bot.sim.ticks})`);
    // riding along (at the end the strip tips the driver out through the exit's link)
    const r = await bot.wait(1);
    if (r === 'link') break;
    if (r) throw new Error(`the beltway: ${r}\n${bot.log.slice(-8).join('\n')}`);
  }
  bot.say(`${moves} lane changes, no honks`);
}
