// Writes games/reckoning/walkthrough.json: the bot plays the whole game on the built disk (one key
// segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts checks the
// run on the real engine (title, story, all four acts, the ending, the credits).
//   cd web && npx vite-node ../games/reckoning/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = { 2: 'Act I: 3:17 A.M.', 3: 'Act II: The Enemy-Lover', 4: 'Act III: Oh No No No', 5: 'Act IV: The Reckoning' };
await writeSimWalkthrough('reckoning', sim, SEED, titles);
