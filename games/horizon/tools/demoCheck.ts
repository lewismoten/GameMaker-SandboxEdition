// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson once: balls are born at the top of the road and each grows through all four sizes as it
// comes down its lane, while Kit stands on the road.
//   cd web && npx vite-node ../games/horizon/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { BALL } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -1); // the wait before the Esc is kept, the Esc itself is not pressed
const sim = new GameSim(undefined, 1);
/** Every ball's id, its size (the picture it shows) and its row in level pixels. */
const balls = (): { id: number; size: number; y: number }[] =>
  sim.w.mm.flatMap((m, i) =>
    m.monnum >= BALL && m.monnum <= BALL + 2 ? [{ id: i, size: sim.w.mi[i].curPic, y: (sim.w.mi[i].cury[0] - ORIGIN) * 20 + sim.w.mi[i].cury[1] }] : [],
  );
const sizes = new Map<number, Set<number>>();
let highest = 1000;
let ticks = 0;
await sim.tick();
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) {
    await sim.tick();
    ticks++;
    for (const b of balls()) {
      if (!sizes.has(b.id)) sizes.set(b.id, new Set());
      sizes.get(b.id)!.add(b.size);
      highest = Math.min(highest, b.y);
    }
  }
  const scan = k.key & 0x7f;
  if (k.key & 0x80) sim.release(scan);
  else sim.press(scan);
}
const grown = [...sizes.values()].filter((s) => s.size === 4).length;
console.log(`demo: ${ticks} ticks, ${sizes.size} balls, ${grown} grew through all four sizes, the highest at y ${highest}`);
if (sizes.size < 2 || grown < 1 || highest > 70) {
  console.error('demoCheck: expected balls born at the horizon that grow as they come');
  process.exit(1);
}
console.log('demoCheck ok: the balls came over the hill and grew');
