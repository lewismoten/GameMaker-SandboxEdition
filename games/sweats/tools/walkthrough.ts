// Writes games/sweats/walkthrough.json: the bot plays the whole evening on the built disk (one
// key segment a scene, each scene's monsters seeded afresh), and games/kit/walkthrough.ts checks
// the run on the real engine (title, story, every intermission and monologue, the curtain call)
// and fails if a monologue's opening line or punch line is cut off (kit/clips.ts).
//   cd web && npx vite-node ../games/sweats/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SCENES } from '../src/scenes';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const title = (scene: number): string => {
  const d = SCENES[scene - 2];
  if (!d) return 'The Curtain Call';
  if (d.monologue) return `${d.card}. ${d.monologue.title}`;
  return d.name === 'hive1' ? 'The Hive, Oakland' : d.next === 'won' ? 'The Curtain Call' : d.desc;
};
await writeSimWalkthrough('sweats', sim, SEED, title);
