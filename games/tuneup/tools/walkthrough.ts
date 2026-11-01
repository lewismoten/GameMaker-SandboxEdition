// Writes games/tuneup/walkthrough.json: the bot plays the whole game on the built disk, and
// games/kit/walkthrough.ts checks the run on the real engine (the title, every level, the ending).
//   cd web && npx vite-node ../games/tuneup/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { LEVELS } from '../src/levels/levels';
import { SEED, play } from './play';

const { sim } = await play(SEED);
// scene 2 on are the levels' scenes in order; a level of several scenes names each part
const titles: Record<number, string> = Object.fromEntries(LEVELS.map((l, i) => [i + 2, `Level ${l.level}: ${l.desc}${l.part ? `, ${l.part}` : ''}`]));
await writeSimWalkthrough('tuneup', sim, SEED, titles);
