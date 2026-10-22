// Records the title screen's demo: the bot walks out of Nowish, up the road and into the
// slimes, and swings at whatever comes. Writes src/demo.ts (the keys as numbers).
//   cd web && npx vite-node ../games/realm/tools/gendemo.ts
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameSim } from './sim';
import { Bot } from './bot';

const sim = new GameSim(undefined, 7);
const bot = new Bot(sim);
// every press and release at the game tick it happens on (play's clock runs on across scenes)
const events: [number, number][] = [];
let tick = 0;
const tickFn = sim.tick.bind(sim);
sim.tick = async () => {
  tick++;
  return tickFn();
};
const press = sim.press.bind(sim);
const release = sim.release.bind(sim);
sim.press = (k: number) => {
  if (!sim.isHeld(k)) events.push([tick + 1, k]);
  press(k);
};
sim.release = (k: number) => {
  if (sim.isHeld(k)) events.push([tick + 1, k | 0x80]);
  release(k);
};
const LIMIT = 1100;
try {
  await bot.goto(18, 22, 'by the pond');
  await bot.goto(19, 24, 'the green');
  await bot.enter(22, 39, 'out of Nowish');
  await bot.goto(24, 64, 'up the road');
  await bot.goto(25, 54, 'the meadow');
  await bot.goto(20, 46, 'toward the harbor road');
  await bot.goto(28, 49, 'back along the road');
  await bot.goto(36, 48, 'to the bridge');
} catch (e) {
  if (!String(e).includes('limit')) throw e;
}
sim.releaseAll();
const keep = events.filter(([t]) => t <= LIMIT);
let last = 0;
const flat: number[] = [];
for (const [t, k] of keep) {
  flat.push(t - last, k);
  last = t;
}
const here = dirname(fileURLToPath(import.meta.url));
const src = `// DEMO.REC: what plays on the title screen when nobody touches the keyboard. Recorded from
// the bot (tools/gendemo.ts) walking out of Nowish and up the road, swinging at slimes:
// pairs of [game ticks since the last key, PC scan code; +128 = released], ending with Esc.
import { serializeRecording, type RecordedKey } from '../../../web/src/formats/recording';

const RECORDED = [${flat.join(', ')}];

export function demoRecording(): Uint8Array {
  const keys: RecordedKey[] = [];
  for (let i = 0; i < RECORDED.length; i += 2) keys.push({ delta: RECORDED[i], key: RECORDED[i + 1] });
  keys.push({ delta: 20, key: 0x01 }, { delta: 2, key: 0x81 });
  return serializeRecording(keys);
}
`;
writeFileSync(join(here, '../src/demo.ts'), src);
console.log(`${keep.length} key events over ${last} ticks; the bot swung ${bot.swings} times; ${bot.log.slice(-1)}`);
// a demo can't talk to anyone: a conversation would wait for a key nobody presses
if (sim.trail.some((s) => sim.game.scenes[s].files[1] === 'pass.map')) throw new Error('The demo walked into a conversation');
