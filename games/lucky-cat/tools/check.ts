// The play-testing bot plays the whole game on the built disk without losing a life, every level has its 13 charms in all,
// and no level has an invisible wall (a solid block drawn as sky).
//   cd web && npx vite-node ../games/lucky-cat/tools/check.ts   (BOT_LOG=1 prints every step)
import { invisibleWalls } from '../../kit/starter/invisibleWalls';
import { finishBlocks } from '../src/level';
import { buildLevels } from '../src/levels';
import { CHARM_COUNTER, CHARM_POINTS } from '../src/props';
import { play } from './play';

const { pal, levels } = buildLevels();
const problems = levels.flatMap((l) => invisibleWalls(l.book, finishBlocks(l), pal, [{ name: l.file, map: l.map.done() }]));
if (problems.length) throw new Error(`Invisible walls:\n${problems.join('\n')}`);
const charms = levels.reduce((n, l) => n + l.charms.length, 0);
if (charms !== 13) throw new Error(`The levels hold ${charms} charms, not 13`);
const { sim } = await play();
console.log(
  `lucky-cat: the bot played all ${levels.length} levels; score ${sim.ci.score} (${charms} charms of ${CHARM_POINTS} points, counter ${CHARM_COUNTER}), ${sim.trail.length} scenes entered`,
);
