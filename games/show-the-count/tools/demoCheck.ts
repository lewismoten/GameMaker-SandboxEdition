// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lessons once: Kit is stopped by the gate with nothing lit, then walks the ledge and lights bulbs
// (the count goes up as each lights).
// Stopped means pressing Right against the shut gate, still shut, for a moment without moving on;
// lit means a bulb's cell turned into a lit bulb: on every tick the count goes up by exactly as many
// bulbs as lit (only the gate takes count away, and the lit bulbs stay).
//   cd web && npx vite-node ../games/show-the-count/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { SCAN } from '../../kit/starter/ids';
import { buildLevels } from '../src/levels';
import { COUNT } from '../src/meterBlocks';
import { GameSim } from './sim';

/** Ticks of pushing on the shut gate without moving that count as being stopped by it. */
const PUSH = 8;

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const { book } = buildLevels();
const sim = new GameSim(undefined, 1);
const fail = (m: string): never => {
  console.error(`demoCheck: ${m}`);
  process.exit(1);
};
// the level's own cells, found on the map as it starts: the gate and the dark bulbs
const cells = (name: string) => [...sim.w.map.keys()].filter((i) => sim.w.map[i] === book.n(name));
const [gate] = cells('gateFive');
const bulbs = cells('bulbOff');
if (gate === undefined || bulbs.length !== 5)
  fail(`level 1 should have a five-slot gate and five dark bulbs; found ${gate === undefined ? 'no gate' : 'a gate'} and ${bulbs.length}`);
const gateCol = gate % 100;
const count = () => sim.ci.meter[COUNT] - 1;
const litNow = () => bulbs.filter((i) => sim.w.map[i] === book.n('bulbOn')).length;
let right = false;
let pushing = 0;
let lastX = -1;
let stoppedAt = -1;
let litAfterStop = 0;
let ticks = 0;
let lastLit = 0;
let lastCount = count();
const step = async () => {
  await sim.tick();
  ticks++;
  if (sim.trail.length !== 1) return;
  const lit = litNow();
  const up = Math.max(0, count() - lastCount);
  if (up !== lit - lastLit) fail(`tick ${ticks}: the count went up ${up} but ${lit - lastLit} bulbs lit`);
  lastLit = lit;
  lastCount = count();
  const p = sim.pos;
  // right up against the gate's cell: his block is the one before it, with no pixels past it
  const atGate = p.y * 100 + p.x + 1 === gate && p.sx === 0;
  const shut = sim.w.map[gate] === book.n('gateFive');
  pushing = right && atGate && shut && p.x === lastX && count() === 0 ? pushing + 1 : 0;
  if (pushing >= PUSH && stoppedAt < 0) stoppedAt = ticks;
  if (stoppedAt >= 0) litAfterStop = Math.max(litAfterStop, lit);
  lastX = p.x;
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  const scan = k.key & 0x7f;
  if (scan === SCAN.right) right = !(k.key & 0x80);
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
console.log(
  `demo: stopped at the gate (column ${gateCol - 10}) with nothing lit: ${stoppedAt >= 0 ? `at tick ${stoppedAt}` : 'never'}; bulbs lit after that: ${litAfterStop}`,
);
if (stoppedAt < 0) fail(`expected Kit to push Right against the shut gate with nothing lit for ${PUSH} ticks without getting through`);
if (litAfterStop < 2) fail('expected at least two bulbs lit after the gate stopped him');
console.log('demoCheck ok: the gate stayed shut with nothing lit and bulbs lit along the ledge');
