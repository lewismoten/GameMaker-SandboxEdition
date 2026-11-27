// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows the lesson
// once: Kit walks along the boards and into Pip, and Pip's talk scene opens.
//   cd web && npx vite-node ../games/say-something/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { showsLesson } from './demoLesson';
import { GameSim } from './sim';

const sim = new GameSim(undefined, 1);
const passed = await showsLesson(readFileSync(new URL('../disk/demo.rec', import.meta.url)), sim);
console.log(`demo scenes: ${sim.trail.join(', ')}`);
if (!passed) {
  console.error("demoCheck: expected Pip's talk (scene 4) to open once by Escape");
  process.exit(1);
}
console.log('demoCheck ok: the demo reads the boards and talks to Pip');
