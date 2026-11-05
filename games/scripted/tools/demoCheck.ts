// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's lessons once
// each: Kit comes to the stage after the play is over (it did not wait for him), goes back through the encore
// door (the level loads again), then stands at the front and the whole play happens. It prints what happened.
//   cd web && npx vite-node ../games/scripted/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { STAGE_ONE } from '../src/levels';
import { MON } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const names = Object.fromEntries(Object.entries(MON).map(([k, v]) => [v, k]));
const cast = () =>
  sim.w.mm
    .map((m) => m.monnum)
    .filter((n) => n in names)
    .map((n) => names[n]);
const kitX = () => (sim.pos.x - ORIGIN) * 20 + sim.pos.sx;
let goes = 1;
let lateAtStage: string[] | undefined;
const seen = new Set<string>();
let atFront = 0;
const step = async () => {
  await sim.tick();
  goes = sim.trail.filter((s) => s === 2).length; // entering the same scene again (the encore door) adds to the trail
  if (goes === 1 && lateAtStage === undefined && kitX() >= (STAGE_ONE.left - 1) * 20) lateAtStage = cast();
  if (goes >= 2) {
    for (const n of cast()) seen.add(n);
    if (kitX() > 6 * 20 && kitX() < STAGE_ONE.left * 20) atFront++;
  }
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 250; i++) await step(); // the demo waits (the wait before its Esc)
const play = ['pipIn', 'pipSays', 'pipListens', 'pipOut', 'bluIn', 'bluListens', 'bluSays', 'bluOut', 'pipBubble', 'bluBubble'];
console.log(
  `demo: level entered ${goes} times; on the stage when Kit first came: ${lateAtStage?.join(' ') || 'nobody'}; ${atFront} ticks at the front; acts seen on the second go: ${[...seen].length}`,
);
const fail = (m: string) => {
  console.error(`demoCheck: ${m}`);
  process.exit(1);
};
if (goes !== 2) fail('the demo should take the encore door once (level 1 entered twice)');
if (lateAtStage === undefined || lateAtStage.length) fail('the play should be over when Kit first comes to the stage');
for (const a of play) if (!seen.has(a)) fail(`the second go should show ${a}`);
if (atFront < 100) fail('Kit should stand in front of the stage for the play');
console.log('demoCheck ok: late once, then the encore door, then the whole play');
