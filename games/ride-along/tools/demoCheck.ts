// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's lesson once:
// the hero walks to the ledge, jumps up onto it and picks up its coins (Space jumps on foot).
//   cd web && npx vite-node ../games/ride-along/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
let ledge = false;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    ledge ||= sim.pos.y - ORIGIN <= 6 && sim.pos.x - ORIGIN >= 16;
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
for (let i = 0; i < 40; i++) await sim.tick();
console.log(`demo: reached the ledge ${ledge}, score ${sim.ci.score}`);
if (!ledge || sim.ci.score < 20) {
  console.error('demoCheck: expected the hero to jump onto the ledge and take coins');
  process.exit(1);
}
console.log('demoCheck ok: the hero jumped up to the ledge for its coins');
