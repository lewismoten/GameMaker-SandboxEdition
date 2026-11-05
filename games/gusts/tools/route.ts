// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would
// press, level by level, taking every coin on the way. It acts out each lesson once, the mistake included:
//   level 1: read the signs, jump in the shaft while it is calm (the ledge is too high), then wait
//            through the flutter and ride the gust up to the ledge
//   level 2: read the signs, lean into a gust and get pushed back, then take each leg while it is calm
//            and wait out each gust in a shelter, with its coins
// Every tick is checked: the shaft, the tunnel and every windsock change on the tick their blocks say.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { GROUND_TWO, HUTS, HUT_W, LEDGE_ROW, SHAFT, SOCKS, TUNNEL, buildLevels, ringBlock, type Level } from '../src/levels';
import { CALM, FLUTTER, GUST } from '../src/timing';

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

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 28;
/** Every coin is 10 points. */
const COIN = 10;

const { levels } = buildLevels();

/** The mood a kind of ring is showing right now (calm, flutter, gust). */
function moodOf(bot: StarterBot, l: Level, kind: string): string {
  const shown = bot.sim.w.blkmap[l.book.n(ringBlock(kind, 'calm'))];
  for (const [n, i] of l.book.index) if (i === shown) return n.split('.').pop() as string;
  return '?';
}

/** Follows a ring: records each change of its mood after every tick: [mood, tick]. */
function watch(bot: StarterBot, look: () => string): [string, number][] {
  const seen: [string, number][] = [[look(), bot.sim.ticks]];
  const sim = bot.sim as unknown as { tick: () => Promise<unknown> };
  const orig = sim.tick.bind(sim);
  sim.tick = async () => {
    const r = await orig();
    const v = look();
    if (seen[seen.length - 1][0] !== v) seen.push([v, bot.sim.ticks]);
    return r;
  };
  return seen;
}

const CYCLE: [string, number][] = [
  ['calm', CALM],
  ['flutter', FLUTTER],
  ['gust', GUST],
];

/** The moods seen must come round in order, each as long as its block says (give or take 2 ticks); the first, calm, starts at tick 0. */
function inOrder(seen: [string, number][], what: string): void {
  if (seen.length < 4) throw new Error(`${what}: only ${seen.length} moods seen, the ring should have gone round`);
  seen.forEach(([m, t], i) => {
    if (i === 0) return;
    const [pm, pt] = seen[i - 1];
    const k = CYCLE.findIndex(([n]) => n === pm);
    const next = CYCLE[(k + 1) % CYCLE.length][0];
    if (m !== next) throw new Error(`${what}: ${pm} was followed by ${m}, wanted ${next}`);
    if (i > 1 && Math.abs(t - pt - CYCLE[k][1]) > 2) throw new Error(`${what}: ${pm} lasted ${t - pt} ticks, wanted ${CYCLE[k][1]}`);
  });
}

/** Ticks since the last change in `seen`. */
const since = (bot: StarterBot, seen: [string, number][]) => bot.sim.ticks - seen[seen.length - 1][1];

/** Waits (a tick at a time) until `done()`; fails after `max` ticks. */
async function until(bot: StarterBot, done: () => boolean, what: string, max = 500): Promise<void> {
  for (let i = 0; i < max && !done(); i++) await must(bot, bot.wait(1), what);
  if (!done()) throw new Error(`${what}: never happened`);
}

/** 1. Wait for the Gust. */
export async function waitForTheGust(bot: StarterBot): Promise<void> {
  const l = levels[0];
  const score = bot.sim.ci.score;
  const mood = () => moodOf(bot, l, 'up');
  const seen = watch(bot, mood);
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(45), 'reading the sign');
  await must(bot, bot.walk(11, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(45), 'reading the sign');
  await must(bot, bot.walk(16, 'the coins'), 'to the coins');
  const mid = SHAFT[0] + 1;
  await must(bot, bot.walk(mid, 'the shaft'), 'into the shaft');
  // what the signs teach, once: the ledge is too high to jump to, so he waits for the flutter and rides the gust
  await until(bot, () => mood() === 'calm', 'waiting for it to be calm', 300);
  const floor = bot.px.y;
  await must(bot, bot.jump(), 'a try at the jump');
  if (bot.px.y < floor - 4) throw new Error('he did not land back where he started');
  bot.say('he cannot jump that high, so he waits');
  await until(bot, () => mood() === 'flutter', 'waiting for the leaves');
  bot.say(`the leaves flutter at tick ${bot.sim.ticks}`);
  await until(bot, () => mood() === 'gust', 'waiting for the gust');
  bot.say(`the gust starts at tick ${bot.sim.ticks}`);
  const hp = bot.sim.ci.hitpts;
  await until(bot, () => bot.px.y <= (LEDGE_ROW - 1) * 20 + 8 || mood() !== 'gust', 'riding up', GUST + 4);
  await must(bot, bot.land(), 'landing on the ledge');
  if (bot.px.y > (LEDGE_ROW - 1) * 20 + 4) throw new Error(`the gust did not lift him to the ledge (y ${bot.px.y})`);
  bot.say(`on the ledge at tick ${bot.sim.ticks}`);
  await must(bot, bot.wait(LOOK), 'looking down');
  if (bot.sim.ci.hitpts !== hp) throw new Error('the ride cost hit points');
  await must(bot, bot.walk(26, 'the coins'), 'along the ledge');
  inOrder(seen, 'the shaft');
  if (bot.sim.ci.score - score !== 6 * COIN) throw new Error(`level 1 should give 6 coins, not ${(bot.sim.ci.score - score) / COIN}`);
  await leave(bot, bot.walk(30, 'the exit'), 'the exit');
}

/** 2. Windsocks and Shelter. */
export async function windsocksAndShelter(bot: StarterBot): Promise<void> {
  const l = levels[1];
  const score = bot.sim.ci.score;
  const hp = bot.sim.ci.hitpts;
  const mood = () => moodOf(bot, l, 'side');
  const sockMood = () => moodOf(bot, l, 'sock');
  const seen = watch(bot, mood);
  const socks = watch(bot, sockMood);
  const G = GROUND_TWO;
  const inTunnel = () => bot.px.x >= TUNNEL[0] * 20 - 2;
  await must(bot, bot.walk(6, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(45), 'reading the sign');
  await must(bot, bot.walk(10, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(45), 'reading the sign');
  // the socks and the wind agree on every tick
  void socks;
  // what the signs teach, once: go in anyway, and the gust pushes him back out
  await must(bot, bot.walk(TUNNEL[0] - 1, 'the tunnel mouth'), 'to the tunnel');
  await until(bot, () => mood() === 'flutter', 'watching the sock', 500);
  bot.say(`the sock twitches at tick ${bot.sim.ticks}`);
  await must(bot, bot.walk(HUTS[0] - 3, 'into the tunnel'), 'into the tunnel');
  await until(bot, () => mood() === 'gust', 'waiting for the gust', 100);
  bot.say(`the sock streams at tick ${bot.sim.ticks}`);
  let far = bot.px.x;
  bot.sim.press(SCAN.right);
  for (let i = 0; i < GUST - 4; i++) {
    await must(bot, bot.wait(1), 'leaning into the wind');
    far = Math.max(far, bot.px.x);
  }
  bot.sim.release(SCAN.right);
  const pushed = far - bot.px.x;
  bot.say(`the gust pushed him back ${pushed} pixels, to column ${(bot.px.x / 20).toFixed(1)}`);
  if (pushed < 20) throw new Error(`a gust should push him back, not ${pushed}`);
  await until(bot, () => mood() === 'calm', 'waiting for the wind to drop', 300);
  await must(bot, bot.wait(LOOK), 'catching his breath');
  // then do as the sign said: cross while it is calm, wait out each gust in a shelter
  const spots = [...HUTS.map((h) => h + 1), TUNNEL[1] + 2];
  for (let i = 0; i < spots.length; i++) {
    const from = bot.px.x / 20;
    const need = Math.ceil(Math.abs(spots[i] - from)) * 9 + 20;
    await until(bot, () => mood() === 'calm' && CALM + FLUTTER - since(bot, seen) >= need, `waiting for a calm stretch before leg ${i + 1}`, 600);
    const t0 = bot.sim.ticks;
    await must(bot, bot.walk(spots[i], `leg ${i + 1}`), `leg ${i + 1}`);
    bot.say(`leg ${i + 1} took ${bot.sim.ticks - t0} ticks, mood ${mood()}`);
    if (i < HUTS.length) {
      const h = HUTS[i];
      await must(bot, bot.walk(h, 'the first coin'), 'to the shelter coin');
      await must(bot, bot.walk(h + HUT_W - 1, 'the second coin'), 'to the other coin');
      await must(bot, bot.walk(h + 1, 'the middle of the shelter'), 'back to the middle');
      await until(bot, () => mood() === 'gust', 'waiting for the gust to blow', 400);
      const sx = bot.px.x;
      await until(bot, () => mood() === 'calm', 'waiting in the shelter', 200);
      if (Math.abs(bot.px.x - sx) > 12) throw new Error(`the shelter did not hold him (${sx} -> ${bot.px.x})`);
      bot.say(`waited out the gust in shelter ${i + 1}`);
      await must(bot, bot.wait(LOOK), 'a breath');
    }
  }
  inOrder(seen, 'the tunnel');
  inOrder(socks, 'the windsocks');
  if (seen.length !== socks.length || seen.some(([m, t], i) => socks[i][0] !== m || socks[i][1] !== t)) throw new Error('the windsocks were not in step with the wind');
  if (bot.sim.ci.hitpts !== hp) throw new Error('the wind cost hit points');
  if (bot.sim.ci.score - score !== 4 * COIN) throw new Error(`level 2 should give 4 coins, not ${(bot.sim.ci.score - score) / COIN}`);
  void inTunnel;
  void SOCKS;
  void G;
  await leave(bot, bot.walk(41, 'the exit'), 'the exit');
}
