// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows the lesson
// once: Kit walks level 1 along its boards to the door, which shows the picture after the level and
// goes on to level 2 (scene 3).
//   cd web && npx vite-node ../games/pictures-and-cartoons/tools/demoCheck.ts
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
if (!sim.trail.includes(3)) {
  console.error('demoCheck: expected the demo to read level 1 and go through its door into level 2 (scene 3)');
  process.exit(1);
}
console.log('demoCheck ok: the demo walks level 1 and leaves by the door');
