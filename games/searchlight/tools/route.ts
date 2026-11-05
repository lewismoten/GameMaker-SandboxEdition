// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level
// by level, taking every coin on the way. Each sign's lesson is acted out, the mistake included, once: in level 1
// Kit steps into the light first and is seen (it costs hit points and nothing else), then waits in a trench
// until the light has walked over, then goes on. A hop between safe places only starts when the light cannot
// reach Kit in the time he needs (a person watches the lamp and goes when it is far enough away); every
// hop must cost no hit points. The checks fail if it does.
import type { Result, StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { LIGHTS } from '../src/levels';
import { SEEN, SWEEP, lampOf } from '../src/monsters';

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

/** Pixels Kit walks a tick (measured: 72 in 18 ticks) and a little over what he needs to jump out of a trench, in ticks. */
const KIT_SPEED = 4;
const JUMP_OUT = 24;
/** How close (pixels, centers) the light may come to Kit's path before a hop must wait. */
const SAFE_GAP = 32;

/** A light as the bot sees it: where its lamp is now (pixels in the level), and how far it walks. */
class Light {
  private last = 0;
  dir = 1;
  readonly min: number;
  readonly max: number;
  readonly speed: number;

  constructor(
    private readonly bot: StarterBot,
    private readonly sweep: number,
  ) {
    const l = LIGHTS[sweep];
    this.min = l.x * 20;
    this.max = (l.x + SWEEP[sweep].run) * 20;
    this.speed = SWEEP[sweep].speed;
    this.last = this.x;
  }

  /** The lamp's left edge, in level pixels. */
  get x(): number {
    const mm = this.bot.sim.w.mm;
    const i = mm.findIndex((m) => m.monnum === lampOf(this.sweep));
    if (i < 0) throw new Error('the lamp is gone');
    const mi = this.bot.sim.w.mi[i];
    return (mi.curx[0] - ORIGIN) * 20 + mi.curx[1];
  }

  /** Looks at the lamp once (call every tick) so its direction is known. */
  watch(): void {
    const x = this.x;
    if (x !== this.last) this.dir = Math.sign(x - this.last);
    this.last = x;
  }

  /** Where the lamp will be after `t` ticks, bouncing between its two ends. */
  at(t: number): number {
    const span = this.max - this.min;
    let off = this.x - this.min + (this.dir > 0 ? t * this.speed : -t * this.speed);
    off = ((off % (2 * span)) + 2 * span) % (2 * span);
    return this.min + (off > span ? 2 * span - off : off);
  }
}

/** The light a person would watch for the stretch of ground from `a` to `b` (pixels): the one whose walk covers it. */
const lightsOf = (bot: StarterBot, level: number): Light[] => LIGHTS.map((l, sweep) => ({ l, sweep })).filter((x) => x.l.level === level).map((x) => new Light(bot, x.sweep));

/** Whether a hop from `from` to `to` (pixels, to the right) is safe to start now against every light: Kit is never within SAFE_GAP of a lamp on the way. */
function safeNow(lights: Light[], from: number, to: number, fromTrench: boolean): boolean {
  const ticks = (to - from) / KIT_SPEED + (fromTrench ? JUMP_OUT : 0) + 22;
  for (const lt of lights)
    for (let t = 0; t <= ticks; t += 2) {
      const kitX = fromTrench && t < JUMP_OUT ? from : Math.min(to, from + Math.max(0, t - (fromTrench ? JUMP_OUT : 0)) * KIT_SPEED);
      // the light only reaches Kit while he is above ground (not once he is down in the trench he is going to)
      const reached = Math.abs(lt.at(t) - kitX) < SAFE_GAP;
      const hidden = t > ticks - 22; // fallen into the trench by the end
      if (reached && !hidden) return false;
      // in a trench, the light overhead is not a danger
    }
  return true;
}

/** Waits (ticks go by, Kit holds still) until the hop is safe, then walks to `toBlock` (jumping out of a trench first when `fromTrench`). */
async function hop(bot: StarterBot, lights: Light[], toBlock: number, fromTrench: boolean, what: string): Promise<void> {
  const to = toBlock * 20;
  for (let waited = 0; ; waited += 2) {
    if (waited > 1600) throw new Error(`${what}: the hop never became safe`);
    for (const l of lights) l.watch();
    if (safeNow(lights, bot.px.x, to, fromTrench)) break;
    await must(bot, bot.wait(2), 'waiting for the light');
    for (const l of lights) l.watch();
  }
  const hp = bot.sim.ci.hitpts;
  if (fromTrench) await must(bot, bot.jump('right', Math.floor(bot.px.x / 20) + 2), 'out of the trench');
  await must(bot, bot.walk(toBlock, what), what);
  if (bot.sim.ci.hitpts < hp) throw new Error(`${what}: the light saw Kit (hit points ${hp} -> ${bot.sim.ci.hitpts})`);
}

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

/** 1. Wait and Go: step into the light once (it costs hit points, not a life), then trench, trench, and out the far side. */
export async function waitAndGo(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const [light] = lightsOf(bot, 0);
  await must(bot, bot.walk(10, 'the signs'), 'to the signs');
  await must(bot, bot.walk(16, 'the edge of the light'), 'to the edge of the light');
  // the sign says being seen costs hit points: let the lamp come to Kit and walk into its light for a moment
  for (let t = 0; t < 900 && !(light.dir < 0 && light.x < 16 * 20 + 70); t += 2) {
    await must(bot, bot.wait(2), 'waiting for the lamp');
    light.watch();
  }
  const hp = bot.sim.ci.hitpts;
  bot.sim.press(SCAN.right);
  for (let t = 0; t < 40 && hp - bot.sim.ci.hitpts < 6; t++) await must(bot, bot.wait(1), 'walking into the light');
  bot.sim.release(SCAN.right);
  const lost = hp - bot.sim.ci.hitpts;
  bot.say(`walked into the light: hit points ${hp} -> ${bot.sim.ci.hitpts}`);
  if (lost < SEEN) throw new Error(`walking into the light should cost hit points (at least ${SEEN}); ${hp} -> ${bot.sim.ci.hitpts}`);
  await must(bot, bot.walk(15, 'a step back'), 'a step back');
  await hop(bot, [light], 21.5, false, 'into the first trench');
  await hop(bot, [light], 26.5, true, 'into the second trench');
  await hop(bot, [light], 30, true, 'out of the light');
  await must(bot, bot.walk(42, 'the exit sign'), 'to the exit sign');
  coins(bot, score, 5, 'level 1 before the exit');
  await leave(bot, bot.walk(47, 'the exit'), 'the exit');
}

/** 2. Two Lights: two lamps at two speeds; a trench pair under each, and grass between. */
export async function twoLights(bot: StarterBot): Promise<void> {
  const score = bot.sim.ci.score;
  const lights = lightsOf(bot, 1);
  await must(bot, bot.walk(10, 'the signs'), 'to the signs');
  await must(bot, bot.walk(18, 'the edge of the first light'), 'to the first light');
  await hop(bot, lights, 23.5, false, 'into the first trench');
  await hop(bot, lights, 27.5, true, 'into the second trench');
  await hop(bot, lights, 31, true, 'onto the grass between');
  await hop(bot, lights, 37.5, false, 'into the third trench');
  await hop(bot, lights, 41.5, true, 'into the fourth trench');
  await hop(bot, lights, 46, true, 'out of the light');
  await must(bot, bot.walk(49, 'the exit sign'), 'to the exit sign');
  coins(bot, score, 5, 'level 2 before the exit');
  await leave(bot, bot.walk(55, 'the exit'), 'the exit');
}
