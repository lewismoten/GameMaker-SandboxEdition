// Writes games/mustard/walkthrough.json: the bot plays the whole game on the built disk (one
// key segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts
// checks the run on the real engine (title, story, all four levels, the ending, the credits).
//   cd web && npx vite-node ../games/mustard/tools/walkthrough.ts
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = { 2: 'Level 1: The Mound', 3: 'Level 2: Deep Down in the Dust', 4: 'Level 3: The Mountain', 5: "Level 4: The Palm of God's Hand" };
const segments: WalkSegment[] = sim.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(s.keys) }));
const chapters: WalkChapterMark[] = sim.segments.map((s) => ({ scene: s.scene, title: titles[s.scene] }));
const r = await writeWalkthrough('mustard', { rand: { seed: SEED, per: 'scene' }, segments, chapters });
console.log(`engine: scenes ${r.scenes.join(' ')}, ${r.keysLeft} keys unplayed`);
