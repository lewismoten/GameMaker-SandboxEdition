// Proves the game can be finished on the built disk: the bot plays it all the way through
// (tools/route.ts) and must win without losing a life, through every scene, carrying every
// keepsake, with every friend's thank-you counted.
//   cd web && npx vite-node ../games/lark/tools/check.ts
import { KEEPSAKE } from '../src/blocks/keepsakes';
import { CTR, LEG2_THANKS, SCENE } from '../src/ids';
import { play } from './play';

try {
  const { sim } = await play();
  if (sim.ended !== 'won') throw new Error(`the game ended ${sim.ended ?? 'not at all'}`);
  if (sim.deaths) throw new Error(`the bot lost ${sim.deaths} lives`);
  for (const [name, block] of Object.entries(KEEPSAKE)) if (!sim.ci.inv.includes(block)) throw new Error(`Joe is not carrying the ${name}`);
  for (const s of Object.values(SCENE)) if (s > SCENE.end && !sim.trail.includes(s)) throw new Error(`the bot never went through scene ${s}`);
  // the roads' gates took the thank-yous and gave them back
  if (sim.meter(CTR.thanks) - 1 !== LEG2_THANKS) throw new Error(`thank-yous: ${sim.meter(CTR.thanks) - 1}, not ${LEG2_THANKS}`);
  console.log(`WON  ${sim.trail.length} scenes, score ${sim.ci.score}, ${sim.deaths} lives lost`);
} catch (e) {
  console.error(`FAIL ${(e as Error).message}`, process.env.BOT_STACK ? (e as Error).stack : '');
  process.exitCode = 1;
}
