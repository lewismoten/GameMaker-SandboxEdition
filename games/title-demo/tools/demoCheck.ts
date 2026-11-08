// Plays the built title demo (disk/demo.rec) on the headless engine and checks it walks Kit along the
// first hall to the third sign, without going through the door, and that it has no more than the
// 1,000 key changes a recording can hold (RECLEN in code/GM/PLAYGAME.C). It prints what it saw.
//   cd web && npx vite-node ../games/title-demo/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { SIGNS_ONE } from '../src/levels';
import { GameSim } from './sim';

const all = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url))));
if (all.length > 1000) {
  console.error(`demoCheck: ${all.length} key changes; a recording holds 1,000`);
  process.exit(1);
}
const keys = all.slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const heroX = () => (sim.pos.x - ORIGIN) * 20 + sim.pos.sx;
let farthest = 0;
const step = async () => {
  await sim.tick();
  farthest = Math.max(farthest, heroX());
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 20; i++) await step();
console.log(`demo: ${all.length} key changes; the hero got to x ${farthest} (the third sign is at ${SIGNS_ONE[2] * 20}); ${sim.trail.length} scenes entered`);
if (farthest < SIGNS_ONE[2] * 20 || sim.trail.length !== 1) {
  console.error('demoCheck: expected the demo to walk to the third sign and stay in the first hall');
  process.exit(1);
}
console.log('demoCheck ok: walked along the hall to the third sign');
