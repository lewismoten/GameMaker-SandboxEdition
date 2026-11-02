// The way through the dream's end and the real tune-up, as orders for the bot: the swim watched
// to its end, every fan reached on both verses (riding the warm air up when it pushes), every
// brake lamp freed with its own trick and collected, the ball's cap followed through each
// shuffle and lifted, a balloon dog ridden up to each awning and the tire pumped full, and
// Gwinn's toys hopped on the way to the tapes. A person's timing throughout (bot.ts).
import { expectScene as expect } from '@lewismoten/gamemaker-sandbox-tools/kit/routeChecks';
import { CTR, MON } from '../src/ids';
import { TRICK_KEYS } from '../src/heroes';
import { BRAKE, HOUSINGS } from '../src/levels/brake';
import { CUPS } from '../src/levels/cups';
import { FAN_ROW, FAN_VERSES } from '../src/levels/fan';
import { ORIGIN } from '../src/levels/maps';
import { MUFFLED, TOYS, TUCKS } from '../src/levels/muffled';
import { AWNINGS, AWNING_ROW, POODLE, PUMP, TWISTS } from '../src/levels/pump';
import type { Bot } from './bot';
import { leave, must } from './route';

/** The swim: nobody steers; the scene ends by itself. */
export async function theSwim(bot: Bot): Promise<void> {
  expect(bot, 8, 'the swim');
  for (let t = 0; t < 400; t++) {
    const r = await bot.tick();
    if (r) return leave(bot, Promise.resolve(r), 'the swim');
  }
  throw new Error('the swim never ended');
}

/** Reaches up under the block over Doc Leo's hat (Space, one press), a reaction first. */
async function reach(bot: Bot, what: string): Promise<void> {
  await must(bot, bot.react(), 'looking up');
  await must(bot, bot.tap('space', 4), what);
}

/** 5. The Fan Band, one verse: each fan reached, the columns ridden up when they push. */
export function fanBand(verse: number) {
  const v = FAN_VERSES[verse];
  const run = async (bot: Bot): Promise<void> => {
    expect(bot, 9 + verse, `the fan band, verse ${verse + 1}`);
    await must(bot, bot.land(), 'into the vent');
    const fans = [...v.fans].sort((a, b) => a[0] - b[0]);
    const before = bot.count(CTR.fans);
    const ledgeOf = (x: number) => v.ledges.find(([a, b]) => x >= a && x <= b);
    const columnBefore = (x: number) => [...v.columns].reverse().find((c) => c.x < x);
    let high = false;
    for (const [x, y] of fans) {
      if (y === FAN_ROW.high) {
        const ledge = ledgeOf(x)!;
        if (!high || bot.px.x < ledge[0] * 20 || bot.px.x > ledge[1] * 20) {
          // down to the floor if need be, into the column before the ledge, up it
          const col = columnBefore(ledge[0])!;
          if (high) await must(bot, bot.walk(ledge[0] - 1 >= col.x + 1 ? col.x + 1 : col.x, 'toward the column'), 'column');
          await must(bot, bot.walk(col.x, `into the warm air at ${col.x}`), 'column');
          await must(
            bot,
            bot.until(undefined, () => bot.px.y <= (FAN_ROW.ledge - 2) * 20, `rode the warm air up at ${col.x}`, 200),
            'riding up',
          );
          await must(bot, bot.react(), 'at the top');
          high = true;
        }
        await must(bot, bot.walk(x, `under the fan at ${x}`), 'along the ledge');
      } else {
        await must(bot, bot.walk(x, `under the fan at ${x}`), 'along the floor');
        high = false;
      }
      const n = bot.count(CTR.fans);
      await reach(bot, `the fan at ${x}`);
      if (bot.count(CTR.fans) !== n + 1) throw new Error(`the fan at ${x} didn't join the band`);
      // a ledge's end: step off to the floor if the next fan is low
      const next = fans[fans.findIndex(([fx]) => fx === x) + 1];
      if (high && (!next || next[1] !== FAN_ROW.high || ledgeOf(next[0]) !== ledgeOf(x))) {
        const ledge = ledgeOf(x)!;
        await must(bot, bot.walk(ledge[1] + 1, 'off the end of the ledge'), 'off the ledge');
        high = false;
      }
    }
    if (bot.count(CTR.fans) - before !== v.fans.length) throw new Error(`only ${bot.count(CTR.fans) - before} fans`);
    await leave(bot, bot.walk(v.exit + 1, 'through the flap'), 'out');
  };
  Object.defineProperty(run, 'name', { value: `fanBand${verse + 1}` });
  return run;
}

/** 6. Brake Dance: at each housing, its trick; the lamp floats out to Teddy; over the housing. */
export async function brakeDance(bot: Bot): Promise<void> {
  expect(bot, 11, 'brake dance');
  await must(bot, bot.land(), 'into the pit');
  for (const [i, h] of HOUSINGS.entries()) {
    await must(bot, bot.walk(h.x - 1, `before the ${h.key} lamp`), 'to the housing');
    await must(bot, bot.react(), 'reading the sign');
    const lit = bot.count(CTR.lamps);
    await must(bot, bot.tap(TRICK_KEYS[i], 30), `the ${h.key} trick`);
    // the freed lamp slides out of its housing toward Teddy, beside it, and he takes it
    await must(
      bot,
      bot.until(undefined, () => bot.count(CTR.lamps) === lit + 1, `caught lamp ${i + 1}`, 120),
      'the lamp',
    );
    await must(bot, bot.walk(h.x + 1, 'over the housing'), 'over');
  }
  await leave(bot, bot.walk(BRAKE.exit + 1, 'out the door'), 'out');
}

/** The monsters on the map of `kinds` and their level columns. */
const monsters = (bot: Bot, kinds: number[]) =>
  bot.sim.w.mi.map((mi, i) => ({ kind: bot.sim.w.mm[i].monnum, x: mi.curx[0] - ORIGIN })).filter((m) => kinds.includes(m.kind));

/** 7. Hubcaps and Balls, one round: the ball's cap followed until the caps settle, then lifted. */
export function hubcaps(round: number) {
  const run = async (bot: Bot): Promise<void> => {
    expect(bot, 12 + round, `hubcaps and balls, round ${round + 1}`);
    await must(bot, bot.land(), 'onto the stage');
    const shuffling = [MON.cap0, MON.cap0 + 1, MON.cap0 + 2];
    await must(
      bot,
      bot.until(undefined, () => monsters(bot, shuffling).length === 0, 'watched the caps settle', 400),
      'shuffle',
    );
    const [ball] = monsters(bot, [MON.capRestBall]);
    if (!ball) throw new Error('no cap over the ball');
    await must(bot, bot.walk(ball.x, `under the cap at ${ball.x}`), 'to the cap');
    await reach(bot, 'lifting the cap');
    if (bot.count(CTR.ball) !== 1) throw new Error(`round ${round + 1}: no ball`);
    await leave(bot, bot.walk(CUPS.exit, 'through the door'), 'out');
  };
  Object.defineProperty(run, 'name', { value: `hubcaps${round + 1}` });
  return run;
}

/** Twists a balloon dog under Doc Leo's shoes (B), rides it up to the awning's height. */
async function balloonUp(bot: Bot, x: number): Promise<void> {
  await must(bot, bot.walk(x, `to the awning's left at ${x}`), 'to the twist');
  await must(bot, bot.react(), 'looking up');
  await must(bot, bot.tap('b', 4), 'twisting a balloon dog');
  await must(
    bot,
    bot.until(undefined, () => bot.px.y <= (AWNING_ROW - 1) * 20 - 10, `rode the balloon dog up over the awning at ${x}`, 200),
    'riding up',
  );
  await must(bot, bot.react(), 'at the top');
}

/** 8. Pump Up the Volume: a balloon dog ridden up to each awning (its poodle taken), the tire, the pump. */
export async function pumpUp(bot: Bot): Promise<void> {
  expect(bot, 15, 'pump up the volume');
  await must(bot, bot.land(), 'onto the curb');
  for (const [i, [a, b]] of AWNINGS.entries()) {
    await balloonUp(bot, TWISTS[i]);
    const score = bot.sim.ci.score;
    await must(bot, bot.walk(b, 'along the awning, past its balloon poodle'), 'across');
    if (bot.sim.ci.score < score + POODLE) throw new Error(`missed the balloon poodle on the awning at ${a}`);
    if (i < AWNINGS.length - 1) await must(bot, bot.walk(b + 1, 'off the end of the awning'), 'down');
  }
  await must(bot, bot.walk(PUMP.handle, 'under the pump handle'), 'handle');
  await must(
    bot,
    bot.until('space', () => bot.count(CTR.psi) === 1, 'pumped to 32', 200),
    'pumping',
  );
  await must(bot, bot.wait(6), 'hands down');
  await must(bot, bot.walk(PUMP.tire[1] + 1, "down the tire's far side"), 'sliding down');
  if (bot.sim.clip?.name !== 'slide') throw new Error(`no slide whistle down the tire (${bot.sim.clip?.name})`);
  await must(bot, bot.sim.waitForClip(), 'the slide whistle');
  await leave(bot, bot.walk(PUMP.exit, 'through the gate'), 'out');
}

/** Hops a toy at level column `x` from a block back (clear of its cell), landing past it. */
async function hopToy(bot: Bot, x: number): Promise<void> {
  // (never back: stepping back onto a toy just hopped would squeak it)
  if (bot.px.x < (x - 2) * 20) await must(bot, bot.walk(x - 2, `before the toy at ${x}`), 'to the toy');
  // a little closer, but not touching its block: a hop carries Teddy about two and a half blocks
  await must(
    bot,
    bot.until('right', () => bot.px.x >= (x - 1) * 20 - 10, `up to the toy at ${x}`, 20),
    'closer',
  );
  await must(bot, bot.react(), 'eyeing the toy');
  await must(bot, bot.hop('right', 8, 'right', x + 1), `over the toy at ${x}`);
}

/** 9. Muffled: over the toys, onto the bench and the shelf over Gwinn, the tapes, out. */
export async function muffled(bot: Bot): Promise<void> {
  expect(bot, 16, 'muffled');
  await must(bot, bot.land(), 'into the garage');
  const hp = bot.sim.ci.hitpts;
  for (const x of TOYS.filter((t) => t < MUFFLED.bed[0])) await hopToy(bot, x);
  await must(bot, bot.walk(TUCKS[0], 'tucking a blanket corner'), 'tuck');
  await must(bot, bot.walk(MUFFLED.bench[0] - 1, 'by the bench'), 'bench');
  await must(bot, bot.hop('right', 6, 'right', MUFFLED.bench[0] + 1), 'onto the bench');
  await must(bot, bot.walk(MUFFLED.bench[1], 'along the bench'), 'bench');
  await must(bot, bot.hop('right', 8, 'right', MUFFLED.shelf[0] + 1), 'onto the shelf');
  await must(bot, bot.walk(MUFFLED.shelf[1], 'along the shelf over Gwinn'), 'shelf');
  await must(bot, bot.walk(MUFFLED.shelf[1] + 1, 'off the shelf'), 'down');
  for (const x of TOYS.filter((t) => t > MUFFLED.bed[1] && t < MUFFLED.crate)) await hopToy(bot, x);
  await must(bot, bot.walk(MUFFLED.crate - 1, 'by the crate'), 'crate');
  await must(bot, bot.hop('right', 8, 'right', MUFFLED.crate), 'up onto the crate, to the tapes');
  if (bot.count(CTR.tapes) !== 1) throw new Error('no tapes');
  await must(bot, bot.walk(TUCKS[1], 'tucking a blanket corner'), 'tuck');
  for (const x of TOYS.filter((t) => t > MUFFLED.crate)) await hopToy(bot, x);
  if (bot.sim.ci.hitpts < hp) throw new Error(`woke Gwinn a little: ${hp} -> ${bot.sim.ci.hitpts}`);
  await leave(bot, bot.walk(MUFFLED.exit, 'out the door'), 'out');
}

export const REAL_LEVELS = [theSwim, fanBand(0), fanBand(1), brakeDance, hubcaps(0), hubcaps(1), hubcaps(2), pumpUp, muffled];
