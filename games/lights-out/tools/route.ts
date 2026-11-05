// The way through the game, as orders for the bot (kit/starter/bot.ts): the keys a person would press, level by level.
// What is shown is the lesson, so the bot checks it on the engine itself, reading which block the game shows in a cell:
//   level 1: every cell shows the shade it was laid in (rings round three lamps), and standing beside a lamp changes none
//   level 2: the dark air behind him turns lit as he walks, the air ahead stays dark, and a jump lights blocks higher up
//   level 3: the six bulbs glow 28 ticks apart and the whole hall lights on the tick the sixth does, not before
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { Result, StarterBot } from '../../kit/starter/bot';
import { ORIGIN } from '../../kit/starter/map';
import { BULBS, BULB_TICKS, LIGHTS_AT, buildLevels } from '../src/levels';

/** A person's look at what just happened, in ticks (about a second and a half). */
const LOOK = 40;
const { levels } = buildLevels();
const names = levels.map((l) => [...l.book.index.keys()]);

async function must(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out) throw new Error(`${what}: ${out}\n${bot.log.slice(-8).join('\n')}`);
}

/** The last order of a level: it must take the hero through the door (to the next level or the ending). */
async function leave(bot: StarterBot, r: Promise<Result>, what: string): Promise<void> {
  const out = await r;
  if (out !== 'link' && out !== 'end') throw new Error(`${what}: ${out ?? 'still here'}\n${bot.log.slice(-8).join('\n')}`);
}

/** The name of the block the engine shows now at level cell (x, y): the map's block, as the block clocks have turned it. */
export function shown(bot: StarterBot, level: number, x: number, y: number): string {
  const w = bot.sim.w;
  return names[level][w.blkmap[w.map[(y + ORIGIN) * MLEN + x + ORIGIN]]];
}

/** The shade (0 to 4) a block's name says it is drawn in, or -1 when it has none (a lantern, a sign, a door). */
const shadeOf = (name: string): number => {
  const m = /^(?:air|rock|floor|drip|post)\.(\d)/.exec(name);
  return m ? Number(m[1]) : -1;
};

/** Level 1: every cell of the level shows the shade it was laid in. */
function checkRings(bot: StarterBot, level: number, where: string): number {
  const l = levels[level];
  let cells = 0;
  l.cells.forEach((row, y) =>
    row.forEach((c, x) => {
      const s = shadeOf(shown(bot, level, x, y));
      if (s >= 0 && c.kind !== 'tunnel' && s !== c.shade) throw new Error(`${where}: cell ${x},${y} shows shade ${s}, not ${c.shade}`);
      if (s >= 0) cells++;
    }),
  );
  return cells;
}

/** 1. The Lantern Cave. */
export async function lanternCave(bot: StarterBot): Promise<void> {
  const l = levels[0];
  await must(bot, bot.wait(20), 'a beat');
  await must(bot, bot.walk(7, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(12, 'the first lamp'), 'to the first lamp');
  const cells = checkRings(bot, 0, 'beside the first lamp');
  // beside a lamp the cell under Kit is as bright as the lamp makes it: the lamp's own brightness, and still the same far away
  const here = shadeOf(shown(bot, 0, 12, 8));
  if (here < 3) throw new Error(`the floor beside a lamp should be shade 3 or 4, not ${here}`);
  bot.say(`${cells} cells show their laid shade; the floor beside the lamp is shade ${here}`);
  await must(bot, bot.walk(20, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(LOOK), 'reading');
  const far = shadeOf(shown(bot, 0, 20, 8));
  if (far !== 0) throw new Error(`the floor by the second sign should be dark (shade 0), not ${far}`);
  await must(bot, bot.walk(27, 'the second lamp'), 'to the second lamp');
  await must(bot, bot.walk(36, 'the third sign'), 'to the third sign');
  await must(bot, bot.wait(LOOK), 'reading');
  checkRings(bot, 0, 'after walking past two lamps');
  bot.say('Kit walked past two lamps and every cell still shows the shade it was laid in');
  await leave(bot, bot.walk(45, 'the door'), 'the door');
  void l;
}

/** 2. Light Your Way. */
export async function lightYourWay(bot: StarterBot): Promise<void> {
  const lit = (x: number, y: number) => shown(bot, 1, x, y).startsWith('tlit');
  const dark = (x: number, y: number) => shown(bot, 1, x, y).startsWith('tdark');
  await must(bot, bot.wait(20), 'a beat');
  for (const [x, y] of [
    [10, 6],
    [10, 7],
    [24, 7],
  ])
    if (!dark(x, y)) throw new Error(`the tunnel at ${x},${y} should start dark, not ${shown(bot, 1, x, y)}`);
  await must(bot, bot.walk(7, 'the first sign'), 'to the first sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(15, 'a walk in the dark'), 'to the dark');
  for (const [x, y] of [
    [12, 6],
    [12, 7],
    [14, 7],
  ])
    if (!lit(x, y)) throw new Error(`the tunnel at ${x},${y} should be lit behind him, not ${shown(bot, 1, x, y)}`);
  for (const [x, y] of [
    [17, 6],
    [17, 7],
    [24, 7],
  ])
    if (!dark(x, y)) throw new Error(`the tunnel at ${x},${y} should still be dark ahead of him, not ${shown(bot, 1, x, y)}`);
  if (!dark(12, 4)) throw new Error('the air above his head should not light while he only walks');
  bot.say('behind him the tunnel is lit, ahead it is dark, and above his head it is still dark');
  // a jump: the blocks he reaches higher up light too
  await must(bot, bot.jump(), 'a jump');
  const high = [3, 4, 5].filter((y) => [14, 15, 16].some((x) => lit(x, y)));
  if (!high.some((y) => y <= 5)) throw new Error('a jump should light blocks above where he walked');
  bot.say(`a jump lit blocks as high as row ${Math.min(...high)}`);
  await must(bot, bot.walk(21, 'the jump sign'), 'to the second sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await must(bot, bot.walk(34, 'the third sign'), 'to the third sign');
  await must(bot, bot.wait(LOOK), 'reading');
  if (!lit(30, 7)) throw new Error('the tunnel he walked through should stay lit');
  await leave(bot, bot.walk(41, 'the door'), 'the door');
}

/** 3. The Lights Come On. */
export async function lightsComeOn(bot: StarterBot): Promise<void> {
  const hallCell: [number, number] = [13, 8]; // the floor beside the first lamp: shade 3 once lit
  const isDark = () => shown(bot, 2, hallCell[0], hallCell[1]).endsWith('.dark');
  // the tick the scene started on: the first bulb's clock was set BULB_TICKS ahead of it
  const clock0 = bot.sim.w.nxtchg[levels[2].book.n('bulb.0.off')] - BULB_TICKS;
  const at: number[] = Array(BULBS).fill(-1);
  let hallAt = -1;
  const darkAtStart = isDark() && shown(bot, 2, 13, 6) === 'lantern.dark';
  if (!darkAtStart) throw new Error(`the hall should start dark with its lantern cold, not ${shown(bot, 2, 13, 8)} and ${shown(bot, 2, 13, 6)}`);
  // Kit waits at the door where he came in, as the sign says, until the lights are on
  for (let t = 0; t < LIGHTS_AT + 40; t++) {
    await must(bot, bot.tick(), 'waiting for the lights');
    const now = bot.sim.w.clock - clock0;
    for (let k = 0; k < BULBS; k++) if (at[k] < 0 && shown(bot, 2, 5 + k, 3) === `bulb.${k}`) at[k] = now;
    if (hallAt < 0 && !isDark()) hallAt = now;
  }
  at.forEach((t, k) => {
    if (t < 0) throw new Error(`bulb ${k} never glowed`);
    if (Math.abs(t - BULB_TICKS * (k + 1)) > 3) throw new Error(`bulb ${k} glowed at tick ${t}, not about ${BULB_TICKS * (k + 1)}`);
  });
  if (hallAt < 0 || Math.abs(hallAt - LIGHTS_AT) > 3) throw new Error(`the hall should light at about tick ${LIGHTS_AT}, not ${hallAt}`);
  if (Math.abs(hallAt - at[BULBS - 1]) > 2) throw new Error(`the hall should light when the sixth bulb does (${at[BULBS - 1]} against ${hallAt})`);
  // every cell lit in that one tick: nothing in the hall is still a dark twin
  const left = levels[2].cells.flatMap((row, y) => row.filter((_, x) => shown(bot, 2, x, y).endsWith('.dark')));
  if (left.length) throw new Error(`${left.length} cells of the hall are still dark twins after the lights came on`);
  const cells = checkRings(bot, 2, 'in the lit hall');
  bot.say(`bulbs at ticks ${at.join(', ')}; the hall lit at tick ${hallAt}, all ${cells} cells in the same tick`);
  await must(bot, bot.walk(7, 'the first sign'), 'to the first sign');
  await must(bot, bot.walk(20, 'the second sign'), 'to the second sign');
  await must(bot, bot.wait(LOOK), 'reading');
  await leave(bot, bot.walk(37, 'the door'), 'the door');
}
