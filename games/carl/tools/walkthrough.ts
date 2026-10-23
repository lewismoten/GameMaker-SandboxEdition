// Writes games/carl/walkthrough.json: the bot plays the whole game on the built disk (one key
// segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts checks the
// run on the real engine (title, story, all six levels, the ending, the credits).
//   cd web && npx vite-node ../games/carl/tools/walkthrough.ts
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = { 2: 'Level 1: The Couch', 3: 'Level 2: The Walls', 4: 'Level 3: Joins Me in Bed', 5: 'Level 4: The Open Window', 6: 'Level 5: Carl Has Seen Things', 7: 'Level 6: The Aux Cord' };
const segments: WalkSegment[] = sim.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(s.keys) }));
const chapters: WalkChapterMark[] = sim.segments.map((s) => ({ scene: s.scene, title: titles[s.scene] }));
const r = await writeWalkthrough('carl', { rand: { seed: SEED, per: 'scene' }, segments, chapters }, { clips: true });
console.log(`engine: scenes ${r.scenes.join(' ')}, ${r.keysLeft} keys unplayed`);
