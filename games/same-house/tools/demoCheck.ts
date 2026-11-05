// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows the lesson
// once: the hero walks the street and goes in door 1, comes back out and goes in door 2. The two
// house scenes name the same map and blocks and different palette files. It prints what it saw.
//   cd web && npx vite-node ../games/same-house/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { GameSim } from './sim';

const disk = new URL('../disk/', import.meta.url);
const game = parseGame(new Uint8Array(readFileSync(new URL('samehs.gam', disk))));
const keys = parseRecording(new Uint8Array(readFileSync(new URL('demo.rec', disk)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await sim.tick();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await sim.tick();
const files = (n: number) => game.scenes[n].files;
console.log(`demo: scenes entered ${sim.trail.join(', ')}; score ${sim.ci.score}`);
const houses = sim.trail.filter((n) => files(n)[1] === 'house.map');
if (houses.length < 2) {
  console.error('demoCheck: expected the hero to go in two doors');
  process.exit(1);
}
const [a, b] = houses;
if (files(a)[0] === files(b)[0] || files(a)[1] !== files(b)[1] || files(a)[2] !== files(b)[2]) {
  console.error('demoCheck: the two doors should lead to the same map and blocks in different palettes');
  process.exit(1);
}
console.log(`demoCheck ok: went in two doors, which load ${files(a)[0]} and ${files(b)[0]} on ${files(a)[1]}`);
