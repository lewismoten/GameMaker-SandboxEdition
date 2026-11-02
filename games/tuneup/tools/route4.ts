// The way through levels 14-15 as orders for the bot, driving THE CHEZ as a person does: up to
// speed, a look at each signal as it comes into view, through on a green with time to spare,
// otherwise let go, coast and inch up to the stop line, wait for green (or a stop sign's GO),
// a person's reaction, and away. No tickets: running a red is a failure.
import { expectScene as expect } from '@lewismoten/gamemaker-sandbox-tools/kit/routeChecks';
import { buildPalette } from '../src/art/palette';
import { EXIT_X, ROUTES, driveBlocks, footName, phaseOf, stopFootName, type Signal } from '../src/levels/drive';
import { LIGHT } from '../src/levels/drive';
import type { Bot } from './bot';
import { leave, must } from './route';

const book = driveBlocks(buildPalette('noon')).book;
/** A shown foot block's light phase, by block number ('go' for a stop sign's GO, 'count' while it counts). */
const PHASE = new Map<number, { phase: string; bars: number }>();
LIGHT.forEach((_, m) => PHASE.set(book.n(footName(m)), { phase: phaseOf(m)[0], bars: phaseOf(m)[1] }));
[1, 2, 3, 0].forEach((dots, m) => PHASE.set(book.n(stopFootName(m)), { phase: dots ? 'count' : 'go', bars: dots }));

/** How far the car coasts from momentum `gx` once let go (PLAYGAME: 5/6 twice a tick, at most 11 pixels a move). */
function coast(gx: number): number {
  let v = Math.abs(gx);
  let d = 0;
  while (v > 0) {
    v = Math.trunc((Math.trunc((v * 5) / 6) * 5) / 6);
    d += Math.min(11, v);
  }
  return d;
}

/** Drives left until the car's back... its front (left edge) would coast to a stop at `goal` pixels, then lets go and waits for it to stop. */
async function coastTo(bot: Bot, goal: number, label: string): Promise<void> {
  const gx = () => bot.sim.ci.gravx;
  // a person's lead: they let go a few ticks before the spot, seeing the car's speed
  const lead = () => coast(gx() - 3) + 3 * Math.min(11, Math.abs(gx()) + 3) + 6;
  await must(
    bot,
    bot.until('left', () => bot.px.x - goal <= lead(), `let go before ${label}`, 900),
    `driving to ${label}`,
  );
  await must(
    bot,
    bot.until(undefined, () => gx() === 0, `stopped before ${label}`, 120),
    'coasting',
  );
  // inching up: a short press, then still again, until near the line
  for (let n = 0; n < 20 && bot.px.x - goal > 12; n++) {
    await must(bot, bot.react(), 'looking');
    const left = bot.px.x - goal;
    let k = 1;
    while (k < 8 && ((k + 1) * (k + 2)) / 2 + coast(k + 1) < left - 4) k++;
    await must(bot, bot.hold('left', k), 'inching up');
    await must(
      bot,
      bot.until(undefined, () => gx() === 0, 'stopped', 120),
      'inching',
    );
  }
  if (bot.px.x < goal) throw new Error(`over the stop line at ${label}: ${bot.px.x} < ${goal}`);
}

/** A signal's state as the car sees it. */
const stateOf = (bot: Bot, s: Signal) => PHASE.get(bot.shownNum(s.x, 8)) ?? { phase: '?', bars: 0 };

/** One signal: through on a good green, else stop at the line, wait, and go. */
async function signal(bot: Bot, s: Signal): Promise<void> {
  const line = (s.x + 1) * 20;
  const label = `the ${s.kind === 'light' ? 'light' : 'stop sign'} at ${s.x}`;
  // up to where the signal is in plain view (six blocks out), at speed
  await must(
    bot,
    bot.until('left', () => bot.px.x <= line + 120 + coast(bot.sim.ci.gravx), `saw ${label}`, 900),
    `driving to ${label}`,
  );
  const now = stateOf(bot, s);
  if (s.kind === 'light' && now.phase === 'g' && now.bars >= 3) {
    bot.say(`${label} is green (${now.bars}): through`);
    await must(
      bot,
      bot.until('left', () => bot.px.x < s.x * 20 - 10, `through ${label}`, 200),
      'through',
    );
    return;
  }
  await coastTo(bot, line, label);
  const ready = s.kind === 'light' ? (st: { phase: string }) => st.phase === 'g' : (st: { phase: string }) => st.phase === 'go';
  // a stop sign: wait for the count to start over, so its GO is seen as it lights
  if (s.kind === 'stop')
    await must(
      bot,
      bot.until(undefined, () => stateOf(bot, s).phase === 'count', `${label} counting`, 120),
      'counting',
    );
  await must(
    bot,
    bot.until(undefined, () => ready(stateOf(bot, s)), `${label} says go`, 400),
    'waiting',
  );
  await must(bot, bot.react(), 'reacting');
  await must(
    bot,
    bot.until('left', () => bot.px.x < s.x * 20 - 10, `away from ${label}`, 200),
    'away',
  );
}

/** 14. The Test Drive, part `part`: every signal obeyed, out at the far end of the street. */
export function testDrive(part: number) {
  const r = ROUTES[part];
  const run = async (bot: Bot): Promise<void> => {
    expect(bot, 27 + part, `the test drive, ${r.file}`);
    await must(bot, bot.land(), 'onto the street');
    const score = bot.sim.ci.score;
    let passes = 0;
    for (const s of [...r.signals].sort((a, b) => b.x - a.x)) {
      const before = bot.sim.ci.score;
      await signal(bot, s);
      if (bot.sim.ci.score < before) throw new Error(`ticketed at ${s.kind} ${s.x}`);
      if (bot.sim.ci.score > before) passes++;
    }
    bot.say(`${passes} polite passes, score +${bot.sim.ci.score - score}`);
    await leave(bot, bot.dig('left', EXIT_X, 'to the end of the street'), 'out');
  };
  Object.defineProperty(run, 'name', { value: `testDrive${part + 1}` });
  return run;
}

export const LEVELS_14_15 = [testDrive(0), testDrive(1)];
