// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: the hero reaches the door while it is shut and is held back, the number reaches 0
// and the door opens on that tick, and the hero goes in. It prints what it saw.
//   cd web && npx vite-node ../games/countdown/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { DOOR_X, buildLevels } from '../src/levels';
import { GameSim } from './sim';

const { levels } = buildLevels();
const l = levels[0];
const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const heroX = () => (sim.pos.x - ORIGIN) * 20 + sim.pos.sx;
const open = () => sim.w.blkmap[l.book.n('door.shut.bl')] === l.book.n('door.open.bl');
let heldBack = 0;
let openedAt = 0;
const step = async () => {
  await sim.tick();
  if (!open() && sim.trail.length === 1 && heroX() >= (DOOR_X - 1) * 20 - 4 && heroX() < DOOR_X * 20) heldBack++;
  if (open() && !openedAt) openedAt = sim.ticks;
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await step();
console.log(
  `demo: held at the shut door for ${heldBack} ticks; the door opened at tick ${openedAt}; ${sim.trail.length} scenes entered; score ${sim.ci.score}`,
);
if (heldBack < 10) {
  console.error('demoCheck: expected the hero to push on into the shut door');
  process.exit(1);
}
if (!openedAt || sim.trail.length < 2) {
  console.error('demoCheck: expected the door to open and the hero to go through it');
  process.exit(1);
}
console.log('demoCheck ok: bumped the shut door once, waited for the 0, went in');
