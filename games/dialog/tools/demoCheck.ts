// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows the lesson
// once: Kit walks along the boards and into Pip, and Pip's talk scene opens.
//   cd web && npx vite-node ../games/dialog/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await sim.tick();
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
for (let i = 0; i < 150; i++) await sim.tick();
console.log(`demo scenes: ${sim.trail.join(', ')}`);
if (!sim.trail.includes(4)) {
  console.error("demoCheck: expected the demo to walk into Pip (scene 4, Pip's talk)");
  process.exit(1);
}
console.log('demoCheck ok: the demo reads the boards and talks to Pip');
