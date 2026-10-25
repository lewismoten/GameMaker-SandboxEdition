// Proves the game can be finished on the built disk: the bot plays it all the way through
// (tools/route.ts) and must win without losing a life, with every gear turned, the winding key
// carried and Doc Leo's thank-you counted.
//   cd web && npx vite-node ../games/lark/tools/check.ts
import { KEEPSAKE } from '../src/blocks/keepsakes';
import { CTR, SCENE } from '../src/ids';
import { play } from './play';

try {
  const { sim } = await play();
  if (sim.ended !== 'won') throw new Error(`the game ended ${sim.ended ?? 'not at all'}`);
  if (sim.deaths) throw new Error(`the bot lost ${sim.deaths} lives`);
  if (!sim.ci.inv.includes(KEEPSAKE.windKey)) throw new Error('Joe is not carrying the winding key');
  for (const s of [SCENE.talkBook, SCENE.talkBench, SCENE.talkLeo, SCENE.talkLeo7, SCENE.bell, SCENE.belfry])
    if (!sim.trail.includes(s)) throw new Error(`the bot never went through scene ${s}`);
  // the road's gate took Doc Leo's thank-you and gave it back
  if (sim.meter(CTR.thanks) - 1 !== 1) throw new Error(`thank-yous: ${sim.meter(CTR.thanks) - 1}, not 1`);
  console.log(`WON  ${sim.trail.length} scenes, score ${sim.ci.score}, ${sim.deaths} lives lost`);
} catch (e) {
  console.error(`FAIL ${(e as Error).message}`, process.env.BOT_STACK ? (e as Error).stack : '');
  process.exitCode = 1;
}
