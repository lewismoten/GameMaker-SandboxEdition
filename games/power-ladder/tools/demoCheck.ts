// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once, the mistake included: the hero bumps the silver door with only the bronze key (it
// stays shut), gets the silver key, and the door then opens, with the hero still alive.
//   cd web && npx vite-node ../games/power-ladder/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { KEYS } from '../../kit/starter/blocks';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, buildLevels } from '../src/levels';
import { GameSim } from './sim';

const DOOR_X = 27;
const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const { book } = buildLevels();
const gate = book.n('gate_silver');
let bumpedShut = false;
let openedAfterKey = false;
const step = async () => {
  await sim.tick();
  if (sim.trail.length !== 1) return;
  const closed = sim.blockAt(ORIGIN + DOOR_X, ORIGIN + GROUND - 1) === gate;
  const p = sim.pos;
  const atDoor = (p.x - ORIGIN) * 20 + p.sx >= (DOOR_X - 1) * 20;
  if (closed && atDoor && sim.meter(KEYS) === 2) bumpedShut = true; // carrying only the bronze key
  if (!closed && bumpedShut) openedAfterKey = true;
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await step();
console.log(`demo: bumped the shut door ${bumpedShut}, opened it later ${openedAfterKey}; ${sim.trail.length} scenes entered; deaths ${sim.deaths}`);
if (!bumpedShut || !openedAfterKey || sim.deaths) {
  console.error('demoCheck: expected the hero to bump the shut silver door, fetch the silver key and open it, without dying');
  process.exit(1);
}
console.log('demoCheck ok: the demo shows the shut door and then the open one');
