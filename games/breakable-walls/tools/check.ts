// The play-testing bot plays the whole game on the built disk. It must win without losing a life;
// route.ts asserts what each sign teaches: a bump turns the crates touched to rubble (the ones above
// stay), a coin that becomes itself pays on every tick and stays, and every frame of a spinning gem goes.
//   cd web && npx vite-node ../games/breakable-walls/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
const { sim } = await play();
console.log(`smash it: the bot played all three levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, ${sim.trail.length} scenes entered`);
