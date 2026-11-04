// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lessons once each: a star pops the near gumdrop, a star thrown from too far falls short, and a
// star from close by pops the far one. It prints what each throw did.
//   cd web && npx vite-node ../games/throw-it/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { TARGET } from '../src/monsters';
import { SCAN_ENTER } from '../src/hero';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const targets = () => sim.w.mm.filter((m) => m.monnum === TARGET).length;
const outcomes: string[] = [];
let pending: { before: number; score: number } | undefined;
let sinceThrow = 0;
const settle = () => {
  if (pending && sinceThrow > 55) {
    outcomes.push(targets() < pending.before ? 'pop' : 'miss');
    pending = undefined;
  }
};
const step = async () => {
  await sim.tick();
  sinceThrow++;
  settle();
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else {
    sim.press(scan);
    if (scan === SCAN_ENTER) {
      pending = { before: targets(), score: sim.ci.score };
      sinceThrow = 0;
    }
  }
}
for (let i = 0; i < 70; i++) await step();
console.log(`demo throws: ${outcomes.join(', ')}; score ${sim.ci.score}`);
if (outcomes.join(' ') !== 'pop miss pop') {
  console.error('demoCheck: expected the demo to throw pop, miss, pop');
  process.exit(1);
}
console.log('demoCheck ok: one pop, one star that falls short, one pop');
