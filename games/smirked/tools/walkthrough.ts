// Writes games/smirked/walkthrough.json: the bot plays the whole game on the built disk (one key
// segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts checks the
// run on the real engine (title, story, all four levels, the ending, the credits).
//   cd web && npx vite-node ../games/smirked/tools/walkthrough.ts
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = { 2: 'Level 1: Mild Scares for All Ages', 3: 'Level 2: GET DOWN!', 4: 'Level 3: Strategic Repositioning', 5: 'Level 4: The Emergency Exit Sign' };
const segments: WalkSegment[] = sim.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(s.keys) }));
const chapters: WalkChapterMark[] = sim.segments.map((s) => ({ scene: s.scene, title: titles[s.scene] }));
const r = await writeWalkthrough('smirked', { rand: { seed: SEED, per: 'scene' }, segments, chapters }, { clips: true });
console.log(`engine: scenes ${r.scenes.join(' ')}, ${r.keysLeft} keys unplayed`);
