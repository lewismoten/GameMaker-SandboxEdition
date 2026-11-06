// How the bot plays each nod of a graduation's arrival (graduationNods.ts), and asserts the nod happened: the
// score it should add, the row it should reach, the gate it should open. arrivalRoute() walks the whole level.
// Positions are level columns; `f` is a nod's feature column (its sign's left edge + 5).
import { SCAN } from './ids';
import type { StarterBot } from './bot';
import { ARRIVE_FLOOR, arrivalLayout, type Placed } from './graduationArrive';
import { COUNT_TICKS } from './graduationNods';

type Route = (bot: StarterBot) => Promise<void>;
type Step = (bot: StarterBot, f: number) => Promise<void>;

const LOOK = 24;
const score = (bot: StarterBot): number => bot.sim.ci.score;
const col = (bot: StarterBot): number => bot.px.x / 20;
const row = (bot: StarterBot): number => bot.px.y / 20;

/** Throws when a bot step ended the scene or stopped early. */
async function must(bot: StarterBot, step: Promise<string | undefined>, what: string): Promise<void> {
  const out = await step;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}
const gained = (bot: StarterBot, before: number, atLeast: number, what: string): void => {
  if (score(bot) - before < atLeast) throw new Error(`${what}: score rose by ${score(bot) - before}, wanted at least ${atLeast}`);
};
const past = (bot: StarterBot, x: number, what: string): void => {
  if (col(bot) < x - 0.3) throw new Error(`${what}: stopped at column ${col(bot).toFixed(1)}, wanted ${x}`);
};
/** Walks on to column `x` and checks he is there (he may be jumping a low wall on the way). */
const go = async (bot: StarterBot, x: number, what: string): Promise<void> => {
  await must(bot, bot.walk(x, what), what);
  past(bot, x, what);
};

const STEPS: Record<string, Step> = {
  async ladder(bot, f) {
    const s = score(bot);
    await go(bot, f, 'to the ladder');
    await must(bot, bot.climb('up', ARRIVE_FLOOR - 5, 'up the ladder'), 'up the ladder');
    if (row(bot) > ARRIVE_FLOOR - 4.9) throw new Error(`the ladder should lift him to row 5, not ${row(bot).toFixed(2)}`);
    await go(bot, f + 4, 'across the top');
    await must(bot, bot.climb('down', 9, 'down the other ladder'), 'down the ladder');
    gained(bot, s, 30, 'the coins on the tower');
    await go(bot, f + 6, 'off the ladder');
  },
  async keyGate(bot, f) {
    await go(bot, f + 3, 'past the key');
    if (bot.sim.meter(20) < 2) throw new Error('the key should have been picked up');
    await go(bot, f + 6, 'through the gate');
    if (bot.sim.meter(20) !== 1) throw new Error('the gate should have taken the key');
  },
  async coins(bot, f) {
    const s = score(bot);
    await go(bot, f - 1, 'before the coins');
    await go(bot, f + 1.5, 'under the coins');
    await must(bot, bot.jump('right', f + 3.2), 'up for the high coin');
    await go(bot, f + 5, 'past the coins');
    gained(bot, s, 50, 'the five coins');
  },
  async crates(bot, f) {
    const s = score(bot);
    await go(bot, f + 4, 'through the crates');
    await go(bot, f + 6, 'past the coin');
    gained(bot, s, 10, 'the coin behind the crates');
  },
  async heart(bot, f) {
    const lives = bot.sim.ci.lives;
    await go(bot, f, 'to the heart');
    await must(bot, bot.jump('right', f + 2), 'up for the heart');
    if (bot.sim.ci.lives <= lives) throw new Error('the heart should add a life');
    await go(bot, f + 5, 'past the heart');
  },
  async ice(bot, f) {
    await go(bot, f - 1, 'to the ice');
    // onto the ice and let go: he slides on a little past where he meant to stop
    bot.sim.press(SCAN.right);
    await must(bot, bot.wait(10), 'onto the ice');
    bot.sim.release(SCAN.right);
    await must(bot, bot.wait(40), 'sliding');
    past(bot, f + 3, 'sliding across the ice');
    // and the way back is open: he can walk against the slide
    await must(bot, bot.jump('left', f - 0.5), 'back over the ice');
    past(bot, 0, 'back');
    if (col(bot) > f + 1) throw new Error(`the way back over the ice is shut (at column ${col(bot).toFixed(1)})`);
    await go(bot, f + 7, 'across the ice again');
  },
  async wind(bot, f) {
    const s = score(bot);
    await go(bot, f + 1, 'into the wind');
    await must(bot, bot.wait(80), 'riding the wind');
    if (row(bot) > 4) throw new Error(`the wind should leave him on the shelf (row 3), not ${row(bot).toFixed(2)}`);
    await go(bot, f + 3.5, 'along the shelf');
    gained(bot, s, 20, 'the coins on the shelf');
    await go(bot, f + 6, 'off the shelf');
  },
  async hop(bot, f) {
    await go(bot, f + 6, 'over the low walls');
  },
  async bug(bot, f) {
    await go(bot, f + 5, 'past the bug');
  },
  async flock(bot, f) {
    await go(bot, f + 5, 'under the birds');
  },
  async say(bot, f) {
    await go(bot, f + 5, 'past the friend');
  },
  async pads(bot, f) {
    const s = score(bot);
    await go(bot, f + 6, 'over the pads');
    gained(bot, s, 15, 'the three pads');
  },
  async countdown(bot, f) {
    await go(bot, f + 3, 'to the countdown');
    // the gate opens when the number reaches 0; wait for it if it has not
    for (let i = 0; i < 12 && col(bot) < f + 6; i++) {
      bot.say(`waiting for zero (${i})`);
      await must(bot, bot.wait(COUNT_TICKS), 'watching the number');
      await must(bot, bot.walk(f + 6, 'under the gate'), 'under the gate');
    }
    past(bot, f + 6, 'through the countdown gate');
  },
  async lever(bot, f) {
    await go(bot, f + 1, 'to the lever');
    if (bot.sim.meter(22) < 2) throw new Error('the lever should have been flipped');
    await go(bot, f + 6, 'through the gate');
  },
  async tokens(bot, f) {
    await go(bot, f + 3, 'past the tokens');
    if (bot.sim.meter(21) < 4) throw new Error('all three tokens should be picked up');
    await go(bot, f + 6, 'through the gate');
  },
  async fakeWall(bot, f) {
    await go(bot, f + 5, 'through the picture of a wall');
  },
  async shore(bot, f) {
    await go(bot, f + 7, 'across the footbridge');
    await go(bot, f + 9, 'off the bridge');
  },
  async stars(bot, f) {
    await go(bot, f + 5, 'under the stars');
  },
  async popups(bot, f) {
    const s = score(bot);
    await go(bot, f + 6, 'through the big coins');
    gained(bot, s, 300, 'the three big coins');
  },
};

/** The route of one arrival: each nod's sign read and the nod played, then the hall's door. */
export function arrivalRoute(ids: readonly string[]): Route {
  const { placed, hall } = arrivalLayout(ids);
  const arrival: Route = async (bot) => {
    const read = async (p: Placed): Promise<void> => {
      await go(bot, p.x + 4, `the sign of ${p.nod.id}`);
      await must(bot, bot.wait(LOOK), 'reading the sign');
    };
    for (const p of placed) {
      await read(p);
      await STEPS[p.nod.id](bot, p.x + 5);
    }
    await go(bot, hall + 3, 'the hall front');
    const out = await bot.walk(hall + 4, 'the hall doors');
    if (out !== 'link' && out !== 'end') throw new Error(`the hall doors: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
  };
  Object.defineProperty(arrival, 'name', { value: 'arrival' });
  return arrival;
}
