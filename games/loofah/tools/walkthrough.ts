// Writes games/loofah/walkthrough.json: the bot plays the whole game on the built disk (one key
// segment a level, each level's monsters seeded afresh), and games/kit/walkthrough.ts checks the
// run on the real engine (title, story, all four acts, the ending, the credits).
//   cd web && npx vite-node ../games/loofah/tools/walkthrough.ts
import { writeSimWalkthrough } from '../../kit/walkthrough';
import { SEED, play } from './play';

const { sim } = await play(SEED);
const titles: Record<number, string> = {
  2: 'Act I: Cursed in the Shower',
  3: 'Act II: The Forest-Dark Aisle',
  4: 'Act III: You Crossed a Line',
  5: 'Act IV: Scrubbus Maximus',
};
await writeSimWalkthrough('loofah', sim, SEED, titles);
