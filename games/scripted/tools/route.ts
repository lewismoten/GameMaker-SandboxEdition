// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level
// by level, taking every coin on the way. Each sign's lesson is acted out, the mistake included, once: in level 1
// Kit stops to read the signs, comes to the stage after the play is over (it did not wait for him), steps into the
// encore door, which loads the level again, and then watches the whole play from the front. In level 2 he stands
// in front of the stage and watches the cameo say hello once and go. The checks fail if an act is missing or
// out of order, or if the cameo says hello twice.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { MON } from '../src/monsters';
import { CAMEO_SPOT, DOORWAY, STAGE_ONE, STAGE_TWO } from '../src/levels';

/** Runs an order; anything but carrying on (a scene change, getting stuck) is an error. */
async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

const NAMES = Object.fromEntries(Object.entries(MON).map(([k, v]) => [v, k]));

/** The show's monsters alive now, by name, in monster order. */
function cast(bot: StarterBot): string[] {
  return bot.sim.w.mm
    .map((m) => m.monnum)
    .filter((n) => n in NAMES)
    .sort((a, b) => a - b)
    .map((n) => NAMES[n]);
}

/** Waits (ticks go by, Kit holds still) until `done`, recording every act that was on stage; fails when it takes longer than `max` ticks. */
async function watch(bot: StarterBot, done: () => boolean, max: number, what: string): Promise<Set<string>> {
  const seen = new Set<string>(cast(bot));
  for (let t = 0; !done(); t++) {
    if (t > max) throw new Error(`${what}: not finished after ${max} ticks (${cast(bot).join(' ')})`);
    await must(bot, bot.wait(1), what);
    for (const n of cast(bot)) seen.add(n);
  }
  return seen;
}

/** A person reading a sign for a while (ticks). */
const READ = 150;

/** What each of the two actors is on stage as, in order, for the checks. */
const PLAY = ['pipPeek', 'pipIn', 'pipSays', 'pipListens', 'pipOut', 'bluPeek', 'bluIn', 'bluListens', 'bluSays', 'bluOut', 'pipBubble', 'bluBubble'];

/** Every coin is 10 points: a level that should give `n` coins must have. */
function coins(bot: StarterBot, from: number, n: number, what: string): void {
  const got = (bot.sim.ci.score - from) / 10;
  if (got !== n) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: ${got} of ${n} coins; left at ${left.join(' ')}`);
  }
}

/** 1. Curtain Up: read, come late to an empty stage, take the encore door, then watch the whole play. */
export async function curtainUp(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(READ), 'reading');
  await must(bot, bot.walk(11, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(READ), 'reading');
  // the mistake: the play began when the level did, and it is over before Kit gets to the stage
  await must(bot, bot.walk(STAGE_ONE.left - 1, 'the stage'), 'to the stage');
  const late = cast(bot);
  bot.say(`at the stage after ${bot.sim.ticks} ticks: ${late.join(' ') || 'nobody'} on it`);
  if (late.length) throw new Error(`the play should be over before Kit comes: ${late.join(' ')}`);
  await must(bot, bot.walk(35, 'the encore sign'), 'to the encore sign');
  await must(bot, bot.wait(60), 'reading');
  await leave(bot, bot.walk(1, 'the encore door'), 'the encore door');
  bot.say('the encore door loaded the level again');
  // the level starts again, and so does the play; this time Kit watches from the front
  await must(bot, bot.walk(STAGE_ONE.left - 2, 'the front of the stage'), 'to the front');
  const seen = await watch(bot, () => cast(bot).every((n) => n.endsWith('Bubble') === false && !PLAY.includes(n)), 600, 'the play');
  for (const a of PLAY) if (!seen.has(a)) throw new Error(`the play never showed ${a}; it showed ${[...seen].join(' ')}`);
  bot.say('watched every act');
  await must(bot, bot.walk(35, 'the encore sign'), 'to the second half');
  bot.say(`score ${bot.sim.ci.score}, x ${bot.px.x}`);
  await must(bot, bot.walk(48, 'the exit sign'), 'to the exit sign');
  bot.say(`score ${bot.sim.ci.score}, x ${bot.px.x}`);
  coins(bot, score, 5, 'level 1 before the exit');
  await leave(bot, bot.walk(50, 'the exit'), 'the exit');
}

/** 2. Say Hello: stand in front of the stage; the cameo walks in from its doorway, says hello once and is gone. */
export async function sayHello(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(60), 'reading');
  await must(bot, bot.walk(13, 'the second sign'), 'to the second sign');
  await must(bot, bot.walk(STAGE_TWO.left - 2, 'the front of the stage'), 'to the front');
  let said = 0;
  let was = false;
  const seen = await watch(
    bot,
    () => {
      const now = cast(bot).includes('camSays');
      if (now && !was) said++;
      was = now;
      return cast(bot).length === 0;
    },
    900,
    'the cameo',
  );
  for (const a of ['camIn', 'camSays', 'camBubble', 'camOut']) if (!seen.has(a)) throw new Error(`the cameo never showed ${a}`);
  if (said !== 1) throw new Error(`the cameo said hello ${said} times`);
  await must(bot, bot.wait(120), 'the empty stage');
  if (cast(bot).length) throw new Error(`the cameo came back: ${cast(bot).join(' ')}`);
  bot.say(`the cameo said hello once (at column ${CAMEO_SPOT} from the doorway at ${DOORWAY}) and did not come back`);
  await must(bot, bot.walk(55, 'the exit sign'), 'to the exit sign');
  coins(bot, score, 5, 'level 2 before the exit');
  await leave(bot, bot.walk(58, 'the exit'), 'the exit');
}
