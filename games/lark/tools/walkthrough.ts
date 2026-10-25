// Writes games/lark/walkthrough.json: the bot plays the whole game on the built disk (the route in
// tools/route.ts), one key segment each time play enters a scene, each scene's monsters seeded
// afresh, and games/kit/walkthrough.ts checks the run on the real engine (title, story, every
// scene, the ending, the credits) and that no clip is cut off.
//   cd web && npx vite-node ../games/lark/tools/walkthrough.ts
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { SCENE } from '../src/ids';
import { play } from './play';

const SEED = 1;
const { sim } = await play(SEED);
if (sim.ended !== 'won') throw new Error('The bot did not win');
if (sim.deaths) throw new Error(`The bot lost ${sim.deaths} lives`);
/** A chapter starts where each part of the story does. */
const TITLES = new Map<number, string>([
  [SCENE.library, 'Prologue: Closing Time'],
  [SCENE.road1, 'The Long Road'],
  [SCENE.card1, 'Chapter 1: The Clock Tower'],
  [SCENE.card2, 'Chapter 2: Valentines in the Park'],
  [SCENE.card3, 'Chapter 3: The Parade'],
  [SCENE.road2, 'The Shore Road'],
  [SCENE.card4, 'Chapter 4: The Music Box'],
  [SCENE.card5, 'Chapter 5: The Charging Run'],
  [SCENE.card6, 'Chapter 6: The Lighthouse'],
]);
const segments: WalkSegment[] = sim.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(s.keys) }));
const seen = new Set<number>();
const chapters: WalkChapterMark[] = sim.segments
  .filter((s) => TITLES.has(s.scene) && !seen.has(s.scene) && seen.add(s.scene))
  .map((s) => ({ scene: s.scene, title: TITLES.get(s.scene)! }));
const r = await writeWalkthrough('lark', { rand: { seed: SEED, per: 'scene' }, segments, chapters }, { clips: true });
const want = [...segments.map((s) => s.scene), 1].join(' ');
if (r.scenes.join(' ') !== want || r.keysLeft) throw new Error(`the engine went ${r.scenes.join(' ')} (the bot ${want}), ${r.keysLeft} keys unplayed`);
