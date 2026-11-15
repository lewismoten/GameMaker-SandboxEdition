// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press,
// level by level. On the hill it picks every star (walking under the low ones, hopping with Space for the
// high ones). In town it shows the mistake once, as the signs teach: the first throw at a house too far
// away falls short. Moving houses and spam bots are popped when they are in range, never touched. Every
// level ends by checking the score: coins, stars picked and pops all add up, so nothing was missed.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { L0, L1, L2, L4 } from '../src/levels';
import { BIG1, BIG2, BIG3, BOT, BOT_SCORE, COTTAGE, POP_SCORE, SHED, STAR, TOWER } from '../src/monsters';
import { GATE_STARS, PICK_SCORE } from '../src/pickStar';
import { KEYS } from '../../kit/starter/blocks';
import { SCAN_JUMP, SCAN_THROW } from '../src/hero';
import { BAND, shiftY } from '../src/pack';

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** Where monsters number `n` stand, in level pixels. */
export function foes(bot: StarterBot, ...n: number[]): number[] {
  const w = bot.sim.w;
  const out: number[] = [];
  w.mm.forEach((m, i) => {
    if (n.includes(m.monnum) && Math.floor(w.mi[i].cury[0] / BAND) === band) out.push((w.mi[i].curx[0] - ORIGIN) * 20 + w.mi[i].curx[1]);
  });
  return out;
}

/** Ticks a star lives and the sparkle after it, so a throw has finished by then. */
const THROW_WATCH = 45;

/** Presses Enter like a person (a tap), then waits for the star to land or fizzle. */
async function throwStar(bot: StarterBot, what: string): Promise<void> {
  bot.sim.press(SCAN_THROW);
  await must(bot, bot.wait(3), 'throwing');
  bot.sim.release(SCAN_THROW);
  await must(bot, bot.wait(THROW_WATCH), 'watching the star');
  bot.say(`threw a star ${what}, score ${bot.sim.ci.score}`);
}

const countAll = (bot: StarterBot, kinds: number[]) => foes(bot, ...kinds).length;

/** Throws now (a still target): it must pop one of `kinds`, or (`miss`) nothing. */
async function throwAt(bot: StarterBot, kinds: number[], what: string, miss = false): Promise<void> {
  const before = countAll(bot, kinds);
  await throwStar(bot, what);
  const after = countAll(bot, kinds);
  if (miss ? after !== before : after !== before - 1) throw new Error(`${what}: houses ${before} -> ${after}${miss ? ' (it should have missed)' : ''}`);
  if (foes(bot, STAR).length) throw new Error(`${what}: a star is still flying`);
}

/** Waits (a few ticks at a time) until a target of `kinds` is `lo` to `hi` pixels ahead, throws, and tries again if the star missed. */
async function popWhenNear(bot: StarterBot, kinds: number[], what: string, lo = 30, hi = 80): Promise<void> {
  const before = countAll(bot, kinds);
  for (let tries = 0; tries < 400; tries++) {
    const x = bot.px.x;
    if (foes(bot, ...kinds).some((f) => f - x >= lo && f - x <= hi)) {
      await throwStar(bot, what);
      if (countAll(bot, kinds) < before) return;
    } else await must(bot, bot.wait(3), 'waiting for one to come by');
  }
  throw new Error(`${what}: never popped one`);
}

/** The score a level should add up to: its coins and the extras the route earned. */
/** The level whose band of the shared world the checks count in (set by coinCells). */
let band = 0;
function coinCells(bot: StarterBot, level: number): number {
  band = level;
  const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
  let n = 0;
  for (let y = band * BAND; y < (band + 1) * BAND; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) n++;
  return n;
}
/** Where coins are still lying, as "x,y" in level blocks. */
function coinsLeft(bot: StarterBot): string {
  const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
  const out: string[] = [];
  for (let y = band * BAND; y < (band + 1) * BAND; y++)
    for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) out.push(`${x - ORIGIN},${y - ORIGIN - shiftY(band)}`);
  return out.join(' ');
}
function totals(bot: StarterBot, from: number, coins: number, picks: number, pops: number, bots: number, what: string): void {
  const want = coins * 10 + picks * PICK_SCORE + pops * POP_SCORE + bots * BOT_SCORE;
  if (bot.sim.ci.score - from !== want)
    throw new Error(
      `${what}: score ${bot.sim.ci.score - from}, expected ${want} (${coins} coins, ${picks} stars picked, ${pops} pops, ${bots} bots; coins left at ${coinsLeft(bot)})`,
    );
}

/** A hop with Space, in place, waiting for the landing. */
async function hop(bot: StarterBot): Promise<void> {
  bot.sim.press(SCAN_JUMP);
  await must(bot, bot.wait(2), 'hopping');
  bot.sim.release(SCAN_JUMP);
  await must(bot, bot.land(), 'landing');
}

/** 1. Stargazing Hill: pick every star out of the night sky. */
export async function stargazingHill(bot: StarterBot): Promise<void> {
  band = 0;
  const start = bot.sim.ci.score;
  const stars = [...L0.walk.map((x) => [x, false] as const), ...L0.jump.map((x) => [x, true] as const)].sort((a, b) => a[0] - b[0]);
  for (const [x, high] of stars) {
    await must(bot, bot.walk(x, 'a star'), 'to a star');
    if (high) await hop(bot);
    bot.say(`picked at ${x}, score ${bot.sim.ci.score}`);
  }
  // the star counter holds one more than it shows: the kit's key counter, which the town gate spends
  if (bot.sim.ci.meter[KEYS] !== 1 + stars.length) throw new Error(`the star counter should hold ${1 + stars.length}, not ${bot.sim.ci.meter[KEYS]}`);
  totals(bot, start, coinCells(bot, 0), stars.length, 0, 0, 'the hill');
  await must(bot, bot.walk(L0.gate + 2, 'through the town gate'), 'through the town gate');
  if (bot.sim.ci.meter[KEYS] !== 1 + stars.length - GATE_STARS)
    throw new Error(`the gate should cost ${GATE_STARS} stars; the counter is ${bot.sim.ci.meter[KEYS]}`);
  await leave(bot, bot.walk(L0.exit + 1, 'the exit'), 'the exit');
}

/** 2. Main Street: pop a cottage; a throw from too far falls short, then closer; the shed lights; one more cottage. */
export async function mainStreet(bot: StarterBot): Promise<void> {
  band = 1;
  const start = bot.sim.ci.score;
  const coins = coinCells(bot, 1);
  const [a, b, c] = L1.cottages;
  await must(bot, bot.walk(a - 4, 'the first cottage'), 'to the first cottage');
  await throwAt(bot, [COTTAGE], 'at the near cottage');
  // the second sign says a star flies only so far: from 13 blocks away it falls short
  await must(bot, bot.walk(b - 13, 'too far'), 'to the second sign');
  await throwAt(bot, [COTTAGE], 'from too far', true);
  // the giant fork lies across the street: hop onto it and walk its length, taking the coins along it
  for (let i = 1; i <= 4; i++) await must(bot, bot.walk(L1.fork + i, 'the fork'), 'over the fork');
  await must(bot, bot.walk(b - 4, 'closer'), 'closer');
  await throwAt(bot, [COTTAGE], 'from close by');
  await must(bot, bot.walk(L1.tunnel[0] - 1, 'the shed'), 'to the shed');
  await throwAt(bot, [SHED], 'at the shed');
  await must(bot, bot.wait(30), 'the party');
  await must(bot, bot.walk(c - 4, 'the last cottage'), 'to the last cottage');
  await throwAt(bot, [COTTAGE], 'at the last cottage');
  await must(bot, bot.walk(L1.exit - 2, 'the door'), 'to the door');
  await must(bot, bot.walk(L1.bonus, 'the high star'), 'to the high star');
  await hop(bot);
  totals(bot, start, coins, 1, 4, 0, 'main street');
  await leave(bot, bot.walk(L1.exit + 1, 'the exit'), 'the exit');
}

/** 3. Shy Street: three towers wander; pop each when it comes by, then a cottage and the shed. */
export async function shyStreet(bot: StarterBot): Promise<void> {
  band = 2;
  const start = bot.sim.ci.score;
  const coins = coinCells(bot, 2);
  for (const t of L2.towers) {
    await must(bot, bot.walk(t - 3, 'a shy tower'), 'to a tower');
    await popWhenNear(bot, [TOWER], 'at a shy tower');
  }
  await must(bot, bot.walk(L2.bonus, 'the high star'), 'to the high star');
  await hop(bot);
  await must(bot, bot.walk(L2.cottage - 4, 'the cottage'), 'to the cottage');
  await throwAt(bot, [COTTAGE], 'at the cottage');
  await must(bot, bot.walk(L2.tunnel[0] - 1, 'the shed'), 'to the shed');
  await throwAt(bot, [SHED], 'at the shed');
  await must(bot, bot.wait(30), 'the party');
  await must(bot, bot.walk((L2.rest[0] + L2.rest[1]) / 2, 'the quiet garden'), 'to the quiet garden');
  const hp = bot.sim.ci.hitpts;
  const score = bot.sim.ci.score;
  await must(bot, bot.wait(45), 'a quiet moment before Spam Row');
  if (bot.sim.ci.hitpts !== hp || bot.sim.ci.score !== score) throw new Error('the rest pocket should be safe and ask for nothing');
  await must(bot, bot.walk(L2.exit - 2, 'the door'), 'to the door');
  totals(bot, start, coins, 1, 5, 0, 'shy street');
  await leave(bot, bot.walk(L2.exit + 1, 'the exit'), 'the exit');
}

/** 4. Spam Row: pop each bot before it reaches him, light the houses, then three stars for the Big Repo. */
export async function spamRow(bot: StarterBot): Promise<void> {
  band = 3;
  const start = bot.sim.ci.score;
  const coins = coinCells(bot, 3);
  await must(bot, bot.walk(L4.cottages[0] - 4, 'the first cottage'), 'to the first cottage');
  await throwAt(bot, [COTTAGE], 'at the cottage');
  await must(bot, bot.walk(L4.tower - 3, 'the tower'), 'to the tower');
  await popWhenNear(bot, [TOWER], 'at the shy tower');
  await must(bot, bot.walk(L4.bots[0] - 5, 'the first bot'), 'to the first bot');
  await popWhenNear(bot, [BOT], 'at the first bot', 40, 110);
  await must(bot, bot.walk(L4.cottages[1] - 4, 'the second cottage'), 'to the second cottage');
  await throwAt(bot, [COTTAGE], 'at the second cottage');
  await must(bot, bot.walk(L4.bots[1] - 5, 'the second bot'), 'to the second bot');
  await popWhenNear(bot, [BOT], 'at the second bot', 40, 110);
  await must(bot, bot.walk(L4.bonus, 'the high star'), 'to the high star');
  await hop(bot);
  await must(bot, bot.walk(L4.tunnel[0] - 2, 'the Big Repo'), 'to the Big Repo');
  for (const [n, now, next] of [
    [1, BIG3, BIG2],
    [2, BIG2, BIG1],
    [3, BIG1, -1],
  ] as const) {
    if (!foes(bot, now).length) throw new Error(`the Big Repo should be at stage ${now} before star ${n}`);
    await throwStar(bot, `at the Big Repo, star ${n}`);
    if (foes(bot, now).length || (next >= 0 && !foes(bot, next).length)) throw new Error(`star ${n} should take the Big Repo from stage ${now} to ${next}`);
  }
  await must(bot, bot.wait(30), 'the party');
  await must(bot, bot.walk(L4.exit - 2, 'the door'), 'to the door');
  totals(bot, start, coins, 1, 6, 2, 'spam row');
  await leave(bot, bot.walk(L4.exit + 1, 'the exit'), 'the exit');
}
