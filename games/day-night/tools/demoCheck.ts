// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: the hero walks the day room, reaches the door, and goes in, which loads the next
// scene: the same map in the night palette. It prints what it saw.
//   cd web && npx vite-node ../games/day-night/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { GameSim } from './sim';

const disk = new URL('../disk/', import.meta.url);
const game = parseGame(new Uint8Array(readFileSync(new URL('dayngt.gam', disk))));
const keys = parseRecording(new Uint8Array(readFileSync(new URL('demo.rec', disk)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await sim.tick();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await sim.tick();
const files = (n: number) => game.scenes[n].files;
const [first, second] = sim.trail;
console.log(`demo: scenes entered ${sim.trail.join(', ')}; score ${sim.ci.score}`);
if (sim.trail.length < 2) {
  console.error('demoCheck: expected the hero to go in the door');
  process.exit(1);
}
if (files(first)[0] !== 'day.pal' || files(second)[0] !== 'night.pal' || files(first)[1] !== files(second)[1] || files(first)[2] !== files(second)[2]) {
  console.error('demoCheck: the door should lead to the same map and blocks in the night palette');
  process.exit(1);
}
console.log('demoCheck ok: walked the day room, went in the door, and came out in the same room at night');
