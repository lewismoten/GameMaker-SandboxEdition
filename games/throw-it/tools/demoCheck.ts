// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lessons once each: a star pops the near gumdrop, a star thrown from too far falls short, and a
// star from close by pops the far one. It prints what each throw did.
//   cd web && npx vite-node ../games/throw-it/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { STAR, TARGET } from '../src/monsters';
import { SCAN_ENTER } from '../src/hero';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const targets = () => sim.w.mm.filter((m) => m.monnum === TARGET).length;
const outcomes: string[] = [];
const x = (slot: number) => sim.w.mi[slot].curx[0] * BLEN + sim.w.mi[slot].curx[1];
let pending: { before: number; target: number; startX?: number; furthestX?: number } | undefined;
let sinceThrow = 0;
const settle = () => {
  if (!pending) return;
  const star = sim.w.mm.findIndex((m) => m.monnum === STAR);
  if (star >= 0) {
    const starX = x(star);
    pending.startX ??= starX;
    pending.furthestX = Math.max(pending.furthestX ?? starX, starX);
  }
  if (sinceThrow > 55) {
    if (targets() < pending.before) outcomes.push('pop');
    else if (
      star < 0 &&
      sim.w.mm[pending.target]?.monnum === TARGET &&
      pending.startX !== undefined &&
      pending.furthestX !== undefined &&
      pending.furthestX > pending.startX &&
      pending.furthestX + BLEN <= x(pending.target)
    )
      outcomes.push('miss');
    else outcomes.push('no observed short throw');
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
      pending = { before: targets(), target: sim.w.mm.findIndex((m) => m.monnum === TARGET) };
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
