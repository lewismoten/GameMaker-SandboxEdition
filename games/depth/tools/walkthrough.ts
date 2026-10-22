// Writes games/depth/walkthrough.json: the bot plays the whole game on the built disk (the
// route in tools/route.ts: every scene's lenses, focus rings, gates and vanishing point, and
// Count Polygon; never through the two-way mirror), one key segment each time play enters a
// scene, with each scene's monsters seeded afresh, and games/kit/walkthrough.ts checks the
// run on the real engine (title, story, all six scenes, the ending, the credits).
//   cd web && npx vite-node ../games/depth/tools/walkthrough.ts
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { LEVELS } from '../src/levels/levels';
import { cardScene } from '../src/game';
import { Bot } from './bot';
import { ROUTES, playLevel } from './route';
import { GameSim } from './sim';

const SEED = 1;
const sim = new GameSim(undefined, SEED);
const bot = new Bot(sim);
for (let i = 0; i < ROUTES.length; i++) {
  await playLevel(bot, i);
  console.log(bot.log[bot.log.length - 1]);
}
if (sim.ended !== 'won') throw new Error('The bot did not win');
if (sim.deaths) throw new Error(`The bot lost ${sim.deaths} lives`);
const titles = new Map(LEVELS.map((l, i) => [cardScene(i), `Scene ${l.n}: ${l.name}`]));
const segments: WalkSegment[] = sim.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(s.keys) }));
const chapters: WalkChapterMark[] = sim.segments.filter((s) => titles.has(s.scene)).map((s) => ({ scene: s.scene, title: titles.get(s.scene)! }));
const r = await writeWalkthrough('depth', { rand: { seed: SEED, per: 'scene' }, segments, chapters });
console.log(`engine: scenes ${r.scenes.join(' ')}, ${r.keysLeft} keys unplayed; the bot fired ${bot.shots} rays`);
