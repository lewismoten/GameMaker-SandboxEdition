// Writes games/sweats/walkthrough.json: the bot plays the whole evening on the built disk (one
// key segment a scene, each scene's monsters seeded afresh), and games/kit/walkthrough.ts checks
// the run on the real engine (title, story, every intermission and monologue, the curtain call).
//   cd web && npx vite-node ../games/sweats/tools/walkthrough.ts
import { encodeKeys, type WalkChapterMark, type WalkSegment } from '../../../web/src/walkthrough/format';
import { writeWalkthrough } from '../../kit/walkthrough';
import { SCENES } from '../src/scenes';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const title = (scene: number) => {
  const d = SCENES[scene - 2];
  if (!d) return undefined;
  if (d.monologue) return `${d.card}. ${d.monologue.title}`;
  return d.name === 'hive1' ? 'The Hive, Oakland' : d.next === 'won' ? 'The Curtain Call' : d.desc;
};
const segments: WalkSegment[] = sim.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(s.keys) }));
const chapters: WalkChapterMark[] = sim.segments.map((s) => ({ scene: s.scene, title: title(s.scene) }));
const r = await writeWalkthrough('sweats', { rand: { seed: SEED, per: 'scene' }, segments, chapters });
console.log(`engine: scenes ${r.scenes.join(' ')}, ${r.keysLeft} keys unplayed`);
