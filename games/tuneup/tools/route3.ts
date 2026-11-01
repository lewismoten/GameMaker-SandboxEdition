// The way through levels 10-13 as orders for the bot: the windshield crossed between the wiper
// sweeps (each blade watched go by, then a person's reaction), every raindrop rung on the way.
// A person's timing throughout (bot.ts).
import { expectScene as expect } from '@lewismoten/gamemaker-sandbox-tools/kit/routeChecks';
import { buildPalette } from '../src/art/palette';
import { BLADE_FOOT, DROPS, RAIN, SECTIONS, bladeName, parkedFrames, rainBlocks } from '../src/levels/rain';
import { HORN_BEAT, HORN_REST, HORN_ROUNDS, HORN_ROW, hornSize, padX, stageX } from '../src/levels/horn';
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

/** 11. The Horn Section, one round: the call watched once through, then each stage's pad reached and climbed. */
export function hornSection(round: number) {
  const r = HORN_ROUNDS[round];
  const run = async (bot: Bot): Promise<void> => {
    expect(bot, 18 + round, `the horn section, round ${round + 1}`);
    await must(bot, bot.land(), 'onto the sidewalk');
    // listening to the clowns: the whole call, once through
    await must(bot, bot.wait((r.phrase.length + HORN_REST) * HORN_BEAT), 'listening to the call');
    const score = bot.sim.ci.score;
    for (const [k, note] of r.phrase.entries()) {
      const sx = stageX(k);
      await must(bot, bot.walk(padX(sx, note), `under pad ${note} of stage ${k + 1}`), 'into the stage');
      await must(bot, bot.react(), 'looking up');
      await must(bot, bot.tap('space', 4), `honking pad ${note}`);
      const y = bot.px.y;
      await must(bot, bot.hop('up', 12), 'up through the pad');
      if (bot.px.y !== (HORN_ROW.pads - 1) * 20) throw new Error(`not on pad ${note} of stage ${k + 1} (y ${bot.px.y} from ${y})`);
      await must(bot, bot.react(), 'on the pad');
      await must(bot, bot.hop('up', 12), 'up onto the walkway');
      if (bot.px.y !== (HORN_ROW.walk - 1) * 20) throw new Error(`not on the walkway of stage ${k + 1} (y ${bot.px.y})`);
      await must(bot, bot.walk(sx + 10, 'off the end of the walkway'), 'down');
    }
    // every note right: no raspberries
    if (bot.sim.ci.score < score + 50 * r.phrase.length) throw new Error(`a raspberry in round ${round + 1}`);
    await leave(bot, bot.walk(hornSize(r).exit, 'on along the curb'), 'out');
  };
  Object.defineProperty(run, 'name', { value: `hornSection${round + 1}` });
  return run;
}

export const LEVELS_10_13 = [rainDelay, hornSection(0), hornSection(1), hornSection(2)];
