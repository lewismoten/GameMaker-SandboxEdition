// Writes games/loofah/walkthrough.json: the bot plays the whole game on the built disk (one key
// segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts checks the
// run on the real engine (title, story, all four acts, the ending, the credits).
//   cd web && npx vite-node ../games/loofah/tools/walkthrough.ts
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = { 2: 'Act I: Cursed in the Shower', 3: 'Act II: The Forest-Dark Aisle', 4: 'Act III: You Crossed a Line', 5: 'Act IV: Scrubbus Maximus' };
const segments: WalkSegment[] = sim.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(s.keys) }));
const chapters: WalkChapterMark[] = sim.segments.map((s) => ({ scene: s.scene, title: titles[s.scene] }));
const r = await writeWalkthrough('loofah', { rand: { seed: SEED, per: 'scene' }, segments, chapters }, { clips: true });
console.log(`engine: scenes ${r.scenes.join(' ')}, ${r.keysLeft} keys unplayed`);
