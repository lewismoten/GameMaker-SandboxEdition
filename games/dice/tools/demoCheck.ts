// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows the level's
// lesson once: the hero walks into the rolling die, it stops on a face, and he is still alive.
//   cd web && npx vite-node ../games/dice/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { DIE_X, FACES, GROUND, buildLevels, stopped } from '../src/levels';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const { levels } = buildLevels();
const book = levels[0].book;
let stoppedOn = 0;
const step = async () => {
  await sim.tick();
  if (sim.trail.length === 1 && !stoppedOn) {
    const cell = sim.blockAt(ORIGIN + DIE_X, ORIGIN + GROUND - 1);
    stoppedOn = FACES.find((n) => cell === book.n(stopped(n))) ?? 0;
  }
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await step();
console.log(`demo: the die stopped on ${stoppedOn || 'nothing'}; ${sim.trail.length} scenes entered; deaths ${sim.deaths}`);
if (!stoppedOn || sim.deaths) {
  console.error('demoCheck: expected the hero to touch the die and stop it, without dying');
  process.exit(1);
}
console.log('demoCheck ok: the demo stops the die on a face');
