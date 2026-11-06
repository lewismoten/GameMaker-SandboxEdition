// The play-testing bot plays the whole game on the built disk with each hero in turn. It must win without losing a life;
// route.ts asserts what each sign says: Big Hops can skip a step and reach the high coins, Fast Feet takes every step, and the road (no character file) keeps whoever was picked.
//   cd web && npx vite-node ../games/choose-hero/tools/check.ts   (BOT_LOG=1 prints every step)
import { assertNoInvisibleWalls } from '../../kit/starter/invisibleWalls';
import { buildLevels } from '../src/levels';
import { play } from './play';

assertNoInvisibleWalls(buildLevels());
for (const hero of ['fast', 'big'] as const) {
  const { sim } = await play(1, hero);
  console.log(
    `who do you want to be (${hero}): the bot played all three levels; ${sim.deaths} lives lost, ${sim.ci.lives} left, score ${sim.ci.score}, scenes ${sim.trail.join(' ')}`,
  );
}
