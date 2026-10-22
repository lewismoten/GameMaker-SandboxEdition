// Writes games/maximus/walkthrough.json: the bot (tools/route.ts) plays the whole game on the
// real engine (tools/live.ts) along the shortest winning route - the training deck, the ten
// star-shards sector by sector up the jump rings (and the Plasma Lance from Little Hollow for
// the Guardian), the Maelstrom, the Citadel and the Heart - and games/kit/walkthrough.ts plays
// the keys it pressed back from the start to check that they reach the ending.
//   cd web && npx vite-node ../games/maximus/tools/walkthrough.ts
import { SECTORS, SCENE } from '../src/universe';
import { writeWalkthrough } from '../../kit/walkthrough';
import type { Walkthrough } from '../../../web/src/walkthrough/format';
import { Live } from './live';
import { Route } from './route';

/** The worlds the route lands on, sector by sector: the shard worlds (and Little Hollow, for the lance). */
const PLAN: { sector: number; worlds: string[] }[] = [
  { sector: 0, worlds: ['Ambermoor', 'Little Hollow', 'Brightwater'] },
  { sector: 1, worlds: ['Cinderfall', 'Hot Springs'] },
  { sector: 2, worlds: ['Pearlbed', 'Mushroom Moon'] },
  { sector: 3, worlds: ['Prism', 'Glass Abyss'] },
  // Hollow Sun last: its healing spring fills the courier up for the Maelstrom, the Citadel and the Heart
  { sector: 4, worlds: ['Ghost Station', 'Hollow Sun'] },
];

const rand: Walkthrough['rand'] = { seed: 1, per: 'scene' };
const live = new Live({ version: 1, game: 'maximus', rand, segments: [], chapters: [], timeline: { fps: 60, frames: 0, chapters: [] } });
live.log = () => {};
let route!: Route;
const started = Date.now();
const r = await live.play(async (d) => {
  route = new Route(d);
  route.trace = !!process.env.TRACE;
  await route.home();
  await route.flyLink(SCENE.galaxy, 1);
  for (const { sector, worlds } of PLAN) {
    route.chapter(SCENE.sector(sector), SECTORS[sector].name);
    for (const name of worlds) {
      const info = route.b.scenes.find((s) => s.name === name)!;
      await route.world(sector, info.scene, name === 'Hollow Sun' ? { below: 1000, to: 450 } : undefined);
    }
    if (sector < PLAN.length - 1) {
      await route.jump(sector);
      route.status(`up the jump ring to ${SECTORS[sector + 1].name}`);
    }
  }
  await route.jump(4);
  await route.maelstrom();
  await route.citadel();
  await route.heart();
  route.status('the Heart is won');
});
console.log(`bot: ${r.won ? 'won' : 'did not win'} in ${((Date.now() - started) / 1000).toFixed(0)} s, ${live.deaths} lives lost`);
if (!r.won) throw new Error('the bot did not win');
// chapters: the scene names the route gave, as play first enters them
const chapters = route.chapters.map((c) => ({ scene: c.scene, title: c.title }));
await writeWalkthrough('maximus', { rand, segments: live.walkSegments(), chapters });
