// The play-testing bot plays the whole game on the built disk without losing a life, and no level has an invisible
// wall (a solid block drawn as sky). Prints how long each level took the bot.
//   cd web && npx vite-node ../games/noodle-observatory/tools/check.ts   (BOT_LOG=1 prints every step)
import { invisibleWalls } from '../../kit/starter/invisibleWalls';
import { finishBlocks } from '../src/level';
import { buildLevels } from '../src/levels';
import { LEVEL_TICKS, play } from './play';

const { pal, levels } = buildLevels();
const problems = levels.flatMap((l) => invisibleWalls(l.book, finishBlocks(l), pal, [{ name: l.file, map: l.map.done() }]));
if (problems.length) throw new Error(`Invisible walls:\n${problems.join('\n')}`);
const { sim } = await play();
const ticks = LEVEL_TICKS;
const mmss = (t: number) => `${Math.floor(t / 18.2 / 60)}:${String(Math.round(t / 18.2) % 60).padStart(2, '0')}`;
console.log(levels.map((l, i) => `  ${i + 1}. ${l.title}: ${mmss(ticks[i] ?? 0)}`).join('\n'));
console.log(
  `noodle-observatory: the bot played all ${levels.length} levels; score ${sim.ci.score}, ${sim.trail.length} scenes entered, ${mmss(ticks.reduce((a, b) => a + b, 0))} of play`,
);
