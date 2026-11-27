// Plays the built title demo (disk/demo.rec) on the headless engine and checks it plays level 1
// through: the gap jumped, the coin in it taken, and the exit door. It prints what it saw.
//   cd web && npx vite-node ../games/teach-test-twist/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { GameSim } from './sim';
import { StarterBot } from '../../kit/starter/bot';
import { AT, GROUND } from '../src/levels';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url))));
const sim = new GameSim(undefined, 1);
const bot = new StarterBot(sim);
let crossing = false;
let crossed = false;
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    const { x, y } = bot.px;
    if (sim.scene !== 2) continue;
    if (x < (AT.one.gap - 1) * 20) crossing = true;
    if (y > (GROUND - 1) * 20 + 6) crossing = false;
    if (crossing && x >= (AT.one.gap + AT.one.width) * 20) crossed = true;
  }
  if (k.key === 1) break;
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
console.log(`demo: ${sim.trail.length} scenes entered; score ${sim.ci.score}`);
if (sim.ci.score !== 50 || sim.trail.length < 2 || !crossed) {
  console.error('demoCheck: expected a jump across the gap, 5 coins (50 points), then the exit door');
  process.exit(1);
}
console.log('demoCheck ok: the demo plays level 1 through');
