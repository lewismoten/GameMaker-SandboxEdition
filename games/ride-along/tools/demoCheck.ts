// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: Kit walks up to the bird in the road and jumps over it (the bird is still sitting there).
//   cd web && npx vite-node ../games/ride-along/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { L1_BIRD } from '../src/levels';
import { BIRD } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const birds = () => sim.w.mm.filter((m) => m.monnum === BIRD).length;
const px = () => (sim.pos.x - ORIGIN) * 20 + sim.pos.sx;
let furthest = 0;
let jumped = false;
let wasBehind = false;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    const x = px();
    furthest = Math.max(furthest, x);
    wasBehind ||= x < L1_BIRD * 20 - 10;
    jumped ||= sim.pos.sy < 0 || sim.pos.y < 9 + ORIGIN;
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
for (let i = 0; i < 70; i++) {
  await sim.tick();
  furthest = Math.max(furthest, px());
}
console.log(`demo: furthest x ${(furthest / 20).toFixed(1)} (the bird is at ${L1_BIRD}), jumped ${jumped}, ${birds()} bird(s) still sitting`);
if (!wasBehind || !jumped || furthest < (L1_BIRD + 1) * 20 || birds() !== 1) {
  console.error('demoCheck: expected Kit to jump over the bird and land past it, the bird still there');
  process.exit(1);
}
console.log('demoCheck ok: Kit jumped the bird');
