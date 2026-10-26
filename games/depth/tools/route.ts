// The way through the game, as orders for the bot: each level's lenses, the focus rings it
// pulls on the way, the RGB gate and the vanishing point. It keeps to the normal route: the
// Hall of Mirrors' two-way mirror (and what lies behind it) is left alone.
import { Bot } from './bot';
import { LEVELS, type Level } from '../src/levels/levels';
import { buildLevel } from '../src/levels/map';
import { TileBook } from '../src/tiles/book';
import { rulesFor } from '../src/tiles/rules';
import { farScene, nearScene } from '../src/game';
import { COUNT_FAR, COUNT_NEAR, CROWN, MON, lensCounters } from '../src/ids';

type D = 'up' | 'down' | 'left' | 'right';
type Step =
  [number, number, string] | ['pickup'] | ['wait', number] | ['face', D] | ['ride', D, number, number] | ['boss', 'near' | 'far'] | ['push', D, number];

/** The level's offset in the 100x100 world. */
function offset(level: Level): [number, number] {
  const b = buildLevel(new TileBook(level.theme, rulesFor({ level: level.n })), level);
  return [b.ox, b.oy];
}

/**
 * Where a detour for loot never goes: the two-way mirror, the felt egg and the room behind
 * the mirror (every cell reached from the egg without crossing a wall or the mirror), and the
 * tin heart and the Easter egg (levels/hidden.ts), which are for players to find.
 */
function eggRoom(level: Level): Set<string> {
  const b = buildLevel(new TileBook(level.theme, rulesFor({ level: level.n })), level);
  const out = new Set<string>();
  const at = (x: number, y: number) => b.kinds[y]?.[x] ?? 'void';
  const todo: [number, number][] = [];
  for (let y = 0; y < b.height; y++)
    for (let x = 0; x < b.width; x++) {
      if (at(x, y) === 'mirrordoor') out.add(`${b.ox + x},${b.oy + y}`);
      if (at(x, y) === 'egg') todo.push([x, y]);
      if (['tinHeart', 'easterEgg'].includes(at(x, y))) out.add(`${b.ox + x},${b.oy + y}`);
    }
  while (todo.length) {
    const [x, y] = todo.pop()!;
    const k = `${b.ox + x},${b.oy + y}`;
    if (out.has(k) || ['wall', 'void', 'mirrordoor'].includes(at(x, y).split(':')[0])) continue;
    out.add(k);
    todo.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return out;
}

/**
 * Plays a stretch where monsters can catch Ray out: if it costs a life or more than
 * `maxLoss` light, it is taken back and played again after a wait, so he rolls out at a
 * better moment.
 */
async function carefully(bot: Bot, label: string, maxLoss: number, stretch: () => Promise<void>): Promise<void> {
  const start = bot.snapshot();
  const hp = bot.sim.ci.hitpts;
  const deaths = bot.sim.deaths;
  let why = '';
  for (let wait = 0; wait <= 240; wait += 6) {
    bot.restore(start);
    try {
      if (wait && (await bot.wait(wait))) throw new Error('a scene change while waiting');
      await stretch();
    } catch (e) {
      why = String(e);
      if (process.env.DEBUG) console.log(`  ${label} (wait ${wait}): ${why}`);
      continue;
    }
    const loss = hp - bot.sim.ci.hitpts;
    if (bot.sim.deaths === deaths && loss <= maxLoss) {
      if (wait) bot.say(`${label}: waited ${wait} ticks, lost ${loss}`);
      return;
    }
    why = `lost ${loss} light, ${bot.sim.deaths - deaths} lives`;
  }
  throw new Error(`${label}: no safe moment (${why})\n${bot.log.slice(-10).join('\n')}`);
}

/** Follows steps; a step onto a ring or the vanishing point must change the scene. */
async function follow(bot: Bot, level: Level, steps: Step[]): Promise<void> {
  const [ox, oy] = offset(level);
  bot.forbid = eggRoom(level);
  for (const s of steps) {
    if (s[0] === 'pickup') {
      await bot.pickup();
      continue;
    }
    if (s[0] === 'wait') {
      await bot.wait(s[1] as number);
      continue;
    }
    if (s[0] === 'face') {
      await bot.face(s[1] as D);
      continue;
    }
    if (s[0] === 'ride') {
      const [, dir, x, y] = s as ['ride', D, number, number];
      const p = await bot.ride(dir);
      if (p.x !== ox + x || p.y !== oy + y) throw new Error(`${level.name}: the slope left Ray at ${p.x - ox},${p.y - oy}, not ${x},${y}`);
      bot.say(`rode the slope to ${x},${y}`);
      continue;
    }
    if (s[0] === 'push') {
      await bot.push(s[1] as D, s[2] as number);
      bot.say('charged up');
      continue;
    }
    if (s[0] === 'boss') {
      const half = s[1] as 'near' | 'far';
      await carefully(bot, `Count Polygon (${half})`, 80, () => countPolygon(bot, half));
      continue;
    }
    const [x, y, label] = s as [number, number, string];
    await carefully(bot, `${level.name}: light`, 30, () => bot.topUp());
    const changes = /^(ring|exit)/.test(label);
    await carefully(bot, `${level.name}: ${label}`, 30, async () => {
      const r = await bot.goto(ox + x, oy + y, label, { loot: true });
      if (changes && r !== 'link' && r !== 'end') throw new Error(`${label}: no scene change (${r})`);
      if (!changes && r) throw new Error(`${label}: ${r}`);
    });
  }
}

const expectScene = (bot: Bot, scene: number, what: string) => {
  if (bot.sim.scene !== scene) throw new Error(`Expected ${what} (scene ${scene}), in scene ${bot.sim.scene}\n${bot.log.slice(-8).join('\n')}`);
};

/**
 * Count Polygon swoops round Ray and dives at him, so the bot duels the way a player would:
 * it lines up with him across or down the arena, turns to face him and fires (shards that
 * come in line are fired at too), and backs off when he comes too close. In the near plane
 * six hits take him down to the blue lens he swallowed; in the far plane eight more take him
 * down to the last polygon. Then it rolls over to what he left.
 */
async function countPolygon(bot: Bot, half: 'near' | 'far'): Promise<void> {
  const counts = new Set<number>(half === 'near' ? COUNT_NEAR : COUNT_FAR);
  const drop = half === 'near' ? MON.stolen : MON.crown;
  const where = (mons: Set<number>) => {
    const w = bot.sim.w;
    const i = w.mm.findIndex((m) => mons.has(m.monnum));
    return i < 0
      ? undefined
      : { x: w.mi[i].curx[0], y: w.mi[i].cury[0], px: w.mi[i].curx[0] * 20 + w.mi[i].curx[1], py: w.mi[i].cury[0] * 20 + w.mi[i].cury[1] };
  };
  const c0 = where(counts);
  if (!c0) throw new Error(`no Count Polygon (${half})`);
  // in the near plane, roll into his reach first; in the far plane he is already close
  if (half === 'near') {
    const r0 = await bot.goto(c0.x - 5, c0.y, 'in reach');
    if (r0) throw new Error(`in reach: ${r0}`);
  }
  const t0 = bot.sim.ticks;
  await bot.duel(() => where(counts), 2400);
  if (where(counts)) throw new Error(`Count Polygon (${half}) is still there`);
  await bot.settle();
  bot.say(`${half === 'near' ? 'Count Polygon fled to the far plane' : 'Count Polygon is down to his last polygon'} after ${bot.sim.ticks - t0} ticks`);
  const c = where(new Set([drop]));
  if (!c) throw new Error(half === 'near' ? 'no blue lens' : 'no crown');
  const counter = half === 'near' ? lensCounters(6)[2] : CROWN;
  const before = bot.sim.meter(counter);
  const r = await bot.goto(c.x, c.y, half === 'near' ? 'the blue lens' : 'the crown');
  if (r) throw new Error(`${half} drop: ${r}`);
  await bot.wait(2);
  // it lies where he fell, maybe between cells: roll right over it, the way a player would
  if (bot.sim.meter(counter) === before)
    await bot.touch(
      () => where(new Set([drop])),
      () => bot.sim.meter(counter) !== before,
    );
  await bot.settle();
  await bot.wait(2);
  if (half === 'far' && bot.sim.meter(CROWN) < 2) {
    const now = where(new Set([drop]));
    throw new Error(
      `the crown did not count (crown ${c.px},${c.py} now ${now?.px},${now?.py}; ray ${bot.sim.pos.x * 20 + bot.sim.pos.sx},${bot.sim.pos.y * 20 + bot.sim.pos.sy})`,
    );
  }
}

export const ROUTES: Step[][] = [
  // 1. The Checkerboard
  [
    [8, 1, 'photons'],
    [15, 5, 'ring 1 to far'],
    [23, 3, 'red lens'],
    [23, 9, 'green lens'],
    [23, 6, 'ring 2 to near'],
    [30, 3, 'chasm edge'],
    [36, 3, 'ring 3 to far'],
    [41, 2, 'blue lens'],
    [41, 10, 'exit'],
  ],
  // 2. The Glass Garden
  [
    [8, 2, 'photons'],
    [13, 5, 'garden gate'],
    [21, 5, 'across the panels'],
    [32, 5, 'ring 1 to far'],
    [26, 4, 'red lens'],
    [30, 11, 'far bridge'],
    [36, 17, 'the stepping stones'],
    [31, 17, 'first island'],
    [26, 17, 'second island'],
    [21, 17, 'green lens'],
    [26, 17, 'second island again'],
    [31, 17, 'first island again'],
    [37, 17, 'back across'],
    [41, 13, 'ring 2 to near'],
    [52, 12, 'blue lens'],
    [51, 20, 'exit'],
  ],
  // 3. The Hall of Mirrors
  [
    [5, 10, 'room D'],
    [26, 12, 'blue lens'],
    [15, 12, 'ring 2 to far'],
    [14, 5, 'room B'],
    [26, 3, 'red lens'],
    [15, 18, 'room H'],
    [6, 18, 'ring 3 to near'],
    [4, 20, 'green lens'],
    [6, 18, 'ring 3 to far'],
    [25, 23, 'exit'],
  ],
  // 4. Fractal Peaks
  [
    [13, 4, 'the chute'],
    ['ride', 'right', 28, 4],
    [30, 7, 'ring 1 to far'],
    [35, 4, 'red lens'],
    [40, 9, 'the south chute'],
    ['ride', 'down', 40, 20],
    [30, 20, 'green lens'],
    [36, 22, 'ring 2 to near'],
    [20, 21, 'over the near bridge'],
    [8, 18, 'ring 3 to far'],
    [14, 18, 'blue lens'],
    [8, 18, 'ring 3 to near'],
    [5, 24, 'exit'],
  ],
  // 5. Teapot Temple
  [
    [7, 4, 'THE CHEZ'],
    ['push', 'up', 40],
    [13, 6, 'temple door'],
    [22, 6, 'ring 1 to far'],
    [29, 6, 'red lens'],
    [33, 12, 'ring 2 to near'],
    [39, 12, 'green lens'],
    [36, 22, 'blue lens'],
    [22, 13, 'exit'],
  ],
  // 6. The Vanishing Point
  [
    [6, 11, 'ring 1 to far'],
    [10, 7, 'red lens'],
    [12, 14, 'ring 2 to near'],
    [16, 15, 'green lens'],
    [17, 11, 'the edge'],
    [21, 11, 'across the panels'],
    [27, 11, 'the arena'],
    ['boss', 'near'],
    [34, 0, 'ring 3 to far'],
    ['boss', 'far'],
    [47, 11, 'exit'],
  ],
];

/** Plays the first steps of a level's route, from its card scene. */
export async function playSteps(bot: Bot, i: number, steps: Step[]): Promise<void> {
  const level = LEVELS[i];
  // the card scene links straight on
  for (let t = 0; t < 5 && bot.sim.scene !== nearScene(i); t++) await bot.wait(1);
  expectScene(bot, nearScene(i), `${level.name} (near)`);
  await follow(bot, level, steps);
}

export async function playLevel(bot: Bot, i: number): Promise<void> {
  await playSteps(bot, i, ROUTES[i]);
  bot.say(`${LEVELS[i].name} done`);
  void farScene;
}
