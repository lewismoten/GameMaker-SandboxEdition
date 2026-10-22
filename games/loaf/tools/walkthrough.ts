// Writes games/loaf/walkthrough.json: the bot plays the whole game on the built disk (one key
// segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts checks the
// run on the real engine (title, story, all four levels, the ending, the credits).
//   cd web && npx vite-node ../games/loaf/tools/walkthrough.ts
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = { 2: 'Level 1: The Hungry Crowd', 3: 'Level 2: The Wicker Wasteland', 4: 'Level 3: Twelve Baskets Full', 5: 'Level 4: The Way Home' };
const segments: WalkSegment[] = sim.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(s.keys) }));
const chapters: WalkChapterMark[] = sim.segments.map((s) => ({ scene: s.scene, title: titles[s.scene] }));
const r = await writeWalkthrough('loaf', { rand: { seed: SEED, per: 'scene' }, segments, chapters });
console.log(`engine: scenes ${r.scenes.join(' ')}, ${r.keysLeft} keys unplayed`);
