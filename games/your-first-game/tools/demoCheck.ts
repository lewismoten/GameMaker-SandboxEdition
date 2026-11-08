// Plays the built title demo (disk/demo.rec) on the headless engine and checks it plays level 1
// through: every coin, the gumdrop popped, and the exit door taken. It prints what it saw.
//   cd web && npx vite-node ../games/your-first-game/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await sim.tick();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await sim.tick();
console.log(`demo: ${sim.trail.length} scenes entered; score ${sim.ci.score}`);
if (sim.ci.score !== 130 || sim.trail.length < 2) {
  console.error('demoCheck: expected 8 coins and a popped gumdrop (130 points), then the exit door');
  process.exit(1);
}
console.log('demoCheck ok: the demo plays level 1 through');
