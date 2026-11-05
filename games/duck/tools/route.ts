// The way through KIT DUCKS, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level.
// It acts out each lesson once, the mistake included, and the checks here fail unless the game does what its signs say:
//   level 1: walk straight into the first bird (it hurts), then duck under every bird: Down held as it comes, let go once it is past
//   level 2: duck under the high bird; stand and hop (Space) over the rolling ball; duck under a ball ... no: a duck under the ball hurts
//            (acted out once), then hop it; then a bird and a ball one after the other.
// The bot reads where the fliers are (as a person watches them) and gives itself about a second's warning, 70 pixels.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { KIND, L1, L2 } from '../src/levels';
import { patrol } from '../src/monsters';

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

function score(bot: StarterBot, from: number, want: number, what: string): void {
  const got = bot.sim.ci.score - from;
  if (got !== want) {
    const left: string[] = [];
    const coin = bot.sim.w.bg.findIndex((b) => b.scorePts === 10);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) if (bot.sim.w.map[y * 100 + x] === coin) left.push(`${x - ORIGIN},${y - ORIGIN}`);
    throw new Error(`${what}: scored ${got}, expected ${want}; coins left at ${left.join(' ')}`);
  }
  bot.say(`${what}: scored ${got}`);
}

const LOOK = 40;
const WARN = 70;
const hp = (bot: StarterBot) => bot.sim.ci.hitpts;

/** A flier, in level pixels: where it is and which way it is going (-1 left, 1 right, 0 not yet known). */
interface Flier {
  id: number;
  x: number;
  y: number;
  vx: number;
}

/** What a person sees: every flier on the level, with its direction (from where it was a tick ago). */
function watcher(bot: StarterBot) {
  const last = new Map<number, number>();
  return (): Flier[] => {
    const out: Flier[] = [];
    bot.sim.w.mi.forEach((m, id) => {
      const x = (m.curx[0] - ORIGIN) * 20 + m.curx[1];
      const y = (m.cury[0] - ORIGIN) * 20 + m.cury[1];
      if (x < 0 || y < 0) return;
      const was = last.get(id);
      last.set(id, x);
      const vx = was === undefined || was === x ? 0 : Math.sign(x - was);
      out.push({ id, x, y, vx });
    });
    return out;
  };
}

type Act = 'go' | 'duck' | 'hop' | 'wait';

/**
 * Walks right to level pixel `goalX`. `ducks` and `hops` say what the person does about a flier at head height and one at
 * foot height; `mistake` is the number of the first flier he walks straight into on purpose (once).
 */
export async function cross(bot: StarterBot, goalX: number, o: { ground: number; mistake?: 'head' | 'foot'; ducksOnBall?: boolean }): Promise<number> {
  const look = watcher(bot);
  const headY = (o.ground - 2) * 20;
  const footY = (o.ground - 1) * 20;
  let mistakes = 0;
  let held: number[] = [];
  const keys = (...want: number[]) => {
    for (const k of held) if (!want.includes(k)) bot.sim.release(k);
    for (const k of want) if (!held.includes(k)) bot.sim.press(k);
    held = want;
  };
  let hopping = 0;
  for (let t = 0; t < 1500 && bot.px.x < goalX; t++) {
    const fl = look();
    const me = bot.px.x;
    let act: Act = 'go';
    const grounded = bot.px.y >= (o.ground - 2) * 20 - 0.5;
    for (const m of fl) {
      const d = m.x - me;
      const high = m.y === headY;
      const low = m.y === footY;
      if (!high && !low) continue;
      if (m.vx < 0 && d > -24 && d < WARN) {
        const stupid = o.mistake === (high ? 'head' : 'foot') && mistakes === 0 && d > 10;
        if (stupid) continue; // walks right on into it
        act = high ? 'duck' : o.ducksOnBall ? 'duck' : 'hop';
      } else if (m.vx > 0 && d > 0 && d < WARN && act === 'go') act = 'wait';
    }
    if (hopping > 0) {
      hopping--;
      act = 'go';
    } else if (act === 'hop' && !grounded) act = 'go';
    if (act === 'hop') {
      if (process.env.DUCK_DEBUG) console.log(`hop at ${me}: ${fl.map((m) => `${m.id}@${m.x},${m.y}v${m.vx}`).join(' ')}`);
      keys(SCAN.space, SCAN.right);
      hopping = 26;
      await must(bot, bot.wait(2), 'hop');
      keys(SCAN.right);
      continue;
    }
    keys(...(act === 'duck' ? [SCAN.down] : act === 'go' ? [SCAN.right] : []));
    const before = hp(bot);
    const r = await bot.tick();
    if (r) throw new Error(`crossing: ${r}`);
    if (hp(bot) < before && o.mistake && mistakes === 0) mistakes = 1;
    if (process.env.DUCK_DEBUG && hp(bot) < before)
      console.log(
        `t${t} hit: kit ${bot.px.x},${bot.px.y} act ${act} ${fl
          .filter((m) => m.x > me - 60 && m.x < me + 90)
          .map((m) => `${m.id}@${m.x},${m.y}v${m.vx}`)
          .join(' ')}`,
      );
  }
  keys();
  await must(bot, bot.land(), 'landing');
  return mistakes;
}

/** A patrol to get past: its ends, and the row it flies in (`high` is head height, else the ground). */
interface Zone {
  x0: number;
  x1: number;
  high: boolean;
}
const zone = (f: readonly [number, number], high: boolean): Zone => ({ ...patrol(KIND[f[1]], f[0]), high });

/**
 * Gets past each zone as a person would: stands just before it, watches until its flier is at the far end and coming this
 * way, then walks on and ducks (or hops) as it arrives, so the two meet well inside the patrol.
 */
async function pastZones(bot: StarterBot, zones: Zone[], ground: number, o: { mistake?: 'head' | 'foot'; ducksOnBall?: boolean } = {}): Promise<number> {
  let hits = 0;
  for (const [i, z] of zones.entries()) {
    await must(bot, bot.walk((z.x0 - 30) / 20, 'before the patrol'), 'to the patrol');
    const look = watcher(bot);
    const y = (z.high ? ground - 2 : ground - 1) * 20;
    for (let t = 0; t < 600; t++) {
      const f = look().find((m) => m.y === y && m.x >= z.x0 && m.x <= z.x1);
      if (f && f.vx < 0 && f.x >= z.x1 - 8) break;
      await must(bot, bot.wait(1), 'watching');
    }
    hits += await cross(bot, z.x1 + 30, { ground, ...(i === 0 ? o : {}) });
  }
  return hits;
}

/** 1. Head Height: three birds under one low awning. */
export async function headHeight(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  const hp0 = hp(bot);
  await must(bot, bot.walk(6, 'the duck sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await must(bot, bot.walk(10, 'the roof sign'), 'to the second sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  const zones = L1.birds.map((b) => zone(b, true));
  // the mistake, once: walk straight into the first bird and see what it costs
  const hit = await pastZones(bot, zones.slice(0, 1), L1.ground, { mistake: 'head' });
  bot.say(`walked into the bird: ${hp0} to ${hp(bot)} hit points`);
  if (!hit || hp(bot) >= hp0) throw new Error('walking into a bird at head height should cost hit points');
  const hp1 = hp(bot);
  // then the lesson: Down as each bird comes, up and on once it has passed
  await pastZones(bot, zones.slice(1), L1.ground);
  if (hp(bot) < hp1) throw new Error(`ducking should have taken no hit points; lost ${hp1 - hp(bot)}`);
  bot.say(`ducked under the other birds: hit points still ${hp(bot)}`);
  await must(bot, bot.walk(L1.roof[1] + 3, 'the last sign'), 'to the sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  score(bot, from, 10 * L1.coins.length, 'level 1');
  await leave(bot, bot.walk(L1.exit, 'the exit'), 'the exit');
}

/** 2. High or Low: a bird (duck), a ball (a duck does not help; hop), then a bird and a ball. */
export async function highOrLow(bot: StarterBot): Promise<void> {
  const from = bot.sim.ci.score;
  await must(bot, bot.walk(7, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  const G = L2.ground;
  const bird = L2.birds.map((b) => zone(b, true));
  const ball = L2.balls.map((b) => zone(b, false));
  await pastZones(bot, bird, G);
  const hp0 = hp(bot);
  await must(bot, bot.walk(30, 'the ball sign'), 'to the sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  // the mistake, once: duck under the ball (the duck is still on the ground, so it hurts)
  await pastZones(bot, ball, G, { mistake: 'foot', ducksOnBall: true });
  if (hp(bot) >= hp0) throw new Error('ducking under a rolling ball should still cost hit points');
  bot.say(`ducked under a ball: ${hp0} to ${hp(bot)} hit points`);
  const hp1 = hp(bot);
  await must(bot, bot.walk(L2.both.roof[0] - 4, 'the last sign'), 'to the sign');
  await must(bot, bot.wait(LOOK), 'reading the sign');
  await pastZones(bot, [zone(L2.both.bird, true), zone(L2.both.ball, false)], G);
  if (hp(bot) < hp1) throw new Error(`a duck for the bird and a hop for the ball should have taken no hit points; lost ${hp1 - hp(bot)}`);
  score(bot, from, 10 * L2.coins.length, 'level 2');
  await leave(bot, bot.walk(L2.exit, 'the exit'), 'the exit');
}
