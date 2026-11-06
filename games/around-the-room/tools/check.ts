// The play-testing bot plays the whole game on the built disk and must win without losing a life; route.ts
// asserts what each room shows: Space lifts him off the surface and the pull brings him back, the first block
// stops him, and every block and trench is jumped with the arrow that points that way on the screen. It also checks
// the hero is never in the screen's left column or top row, where PLAYGAME does not draw him.
//   cd web && npx vite-node ../games/around-the-room/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';
import { GameSim } from './sim';

const built = buildLevels();
// each level against its own block set
for (const l of built.levels) assertNoInvisibleWalls({ book: l.book, pal: built.pal, levels: [l] });
// PLAYGAME does not draw the hero in the screen's left column or top row, so on every tick he must be on
// the screen's second column or lower, and second row or lower (the walls must not hide him)
const tick = GameSim.prototype.tick;
let hidden = 0;
GameSim.prototype.tick = async function (this: GameSim) {
  const r = await tick.call(this);
  const { scrx, scry } = this.ci;
  if (scrx > -100 && (scrx < 20 || scry < 20)) hidden++;
  return r;
} as typeof tick;
const { sim } = await play();
if (hidden) throw new Error(`the hero was in the screen's left column or top row on ${hidden} ticks, where PLAYGAME does not draw him`);
console.log(
  `around-the-room: the bot played all four levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`,
);
