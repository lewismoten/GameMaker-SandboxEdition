// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's
// lesson: the hero steps on short pads, then one long pad.
//   cd web && npx vite-node ../games/slow-computers/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
// count the sounds the world plays (5: a short pad's point, 2: a long pad's coin)
const heard: number[] = [];
const w = sim.w as unknown as { sound: { play: (n: number) => boolean } };
const play = w.sound.play.bind(w.sound);
w.sound.play = (n) => (heard.push(n), play(n));
const step = async () => {
  await sim.tick();
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 40; i++) await step();
const shorts = heard.filter((n) => n === 5).length;
const longs = heard.filter((n) => n === 2).length;
console.log(`demo: ${shorts} short pad(s), ${longs} long pad(s); ${sim.trail.length} scenes entered`);
if (shorts < 1 || longs !== 1) {
  console.error('demoCheck: expected at least one short pad and exactly one long pad');
  process.exit(1);
}
console.log('demoCheck ok: a short pad, then a long one');
