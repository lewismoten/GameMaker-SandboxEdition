// A regression check: nobody gets past a locked door by jumping over its wall (the wall once stopped at
// the top of the level, and the sky rows above it were open). On the built disk the hero tries, without
// opening the door, to leap over it: from level 2's key ledge and from the ground by its door, and in
// level 3 from the top of the low wall and from the ground by its door; and to leap over the side hedges.
// Crossing a door's column overhead (above its arch, row 8) fails the check.
//   cd web && npx vite-node ../games/your-first-game/tools/wallCheck.ts   (check.ts runs it too)
import { StarterBot } from '../../kit/starter/bot';
import { SCAN } from '../../kit/starter/ids';
import { ORIGIN } from '../../kit/starter/map';
import { AT, buildLevels, GROUND } from '../src/levels';
import { keyAndDoor as level2Route, walkAndJump } from './route';
import { GameSim } from './sim';

type Leap = { over: boolean; top: number };

/** Leaps (Space, holding the arrow) over and over; reports the highest point and whether he went over column `col` above row 8. */
async function leaps(bot: StarterBot, dir: 'left' | 'right', col: number, n = 8): Promise<Leap> {
  let over = false;
  let top = 99;
  for (let k = 0; k < n; k++) {
    bot.sim.press(SCAN[dir]);
    bot.sim.press(SCAN.space);
    for (let t = 0; t < 36; t++) {
      if (await bot.tick()) break;
      const { x, y } = bot.px;
      top = Math.min(top, y / 20);
      const beyond = dir === 'right' ? x >= (col + 0.5) * 20 : x <= (col - 0.5) * 20;
      if (beyond && y / 20 < 8) over = true;
    }
    bot.sim.releaseAll();
    await bot.land().catch(() => undefined);
  }
  return { over, top };
}

function expectStopped(what: string, r: Leap): void {
  if (r.over) throw new Error(`${what}: the hero got over the wall (highest point row ${r.top.toFixed(1)})`);
  console.log(`  ${what}: stopped (highest point row ${r.top.toFixed(1)})`);
}

/** Level 2: onto the ledge by the ladder (the key is in hand on the way), then leaps. */
async function level2(): Promise<void> {
  const bot = new StarterBot(new GameSim(undefined, 1));
  await walkAndJump(bot);
  await bot.walk(AT.two.spikes - 2);
  await bot.jump('right', AT.two.spikes + 3);
  await bot.walk(AT.two.door - 1);
  expectStopped('level 2, leaping from the ground at the door, no key', await leaps(bot, 'right', AT.two.door));
  await bot.walk(AT.two.ladder);
  await bot.climb('up', 2);
  await bot.walk(AT.two.key + 1);
  expectStopped('level 2, leaping from the key ledge', await leaps(bot, 'right', AT.two.door));
}

/** Level 3: leaps from the top of the low wall and from the ground at the door, then at the left hedge. */
async function level3(): Promise<void> {
  const bot = new StarterBot(new GameSim(undefined, 1));
  await walkAndJump(bot);
  await level2Route(bot);
  await bot.walk(AT.three.wall - 1);
  expectStopped('level 3, leaping from the low wall', await leaps(bot, 'right', AT.three.door, 1));
  await bot.walk(1);
  expectStopped('level 3, leaping at the left hedge', await leaps(bot, 'left', 0));
}

/** The map itself: each locked wall is brick from the top of the world down to its arch. */
function wallsReachTheTop(): void {
  const { book, levels } = buildLevels();
  const brick = book.n('brick');
  for (const [i, col] of [
    [1, AT.two.door],
    [2, AT.three.door],
  ]) {
    const map = levels[i].map.done();
    for (let y = 0; y < ORIGIN + GROUND - 2; y++) {
      if (map.blocks[y * 100 + col + ORIGIN] !== brick) throw new Error(`level ${i + 1}: the wall at column ${col} has no brick at world row ${y}`);
    }
  }
  console.log('  both locked walls are brick from world row 0');
}

console.log('your-first-game: locked walls');
wallsReachTheTop();
await level2();
await level3();
console.log('your-first-game: no wall can be jumped');
