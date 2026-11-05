// Plays the built title demo (disk/demo.rec) on the headless engine and checks it shows level 1's lessons
// once each: Kit steps into the light and is seen (it costs hit points, no life), steps back, then drops
// into the first trench and waits there while the light walks over. It prints what happened.
//   cd web && npx vite-node ../games/searchlight/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { ORIGIN } from '../../kit/starter/map';
import { GROUND, LIGHTS } from '../src/levels';
import { SEEN, lampOf } from '../src/monsters';
import { GameSim } from './sim';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const sim = new GameSim(undefined, 1);
const hp0 = sim.ci.hitpts;
const lives0 = sim.ci.meter[1];
const lampX = () => {
  const i = sim.w.mm.findIndex((m) => m.monnum === lampOf(0));
  return (sim.w.mi[i].curx[0] - ORIGIN) * 20 + sim.w.mi[i].curx[1];
};
const kitX = () => (sim.pos.x - ORIGIN) * 20 + sim.pos.sx;
let seenAt = -1;
let lowest = hp0;
let inTrench = 0;
let overheadWhileHiding = false;
const step = async () => {
  await sim.tick();
  const hp = sim.ci.hitpts;
  if (seenAt < 0 && hp < hp0) seenAt = hp0 - hp;
  lowest = Math.min(lowest, hp);
  // Kit is in a trench when his feet are below the ground row (level row GROUND + 2 is the trench floor's dirt)
  const feet = sim.pos.y - ORIGIN + 1;
  const trench = LIGHTS[0].trenches.some((t) => kitX() > t * 20 + 6 && kitX() < t * 20 + 20);
  if (trench && feet >= GROUND + 2) {
    inTrench++;
    if (Math.abs(lampX() - kitX()) < 20) overheadWhileHiding = true;
  }
};
for (const k of keys) {
  for (let i = 0; i < k.delta; i++) await step();
  if (k.key & 0x80) sim.release(k.key & 0x7f);
  else sim.press(k.key & 0x7f);
}
for (let i = 0; i < 250; i++) await step(); // the demo waits in the trench (the wait before its Esc)
console.log(
  `demo: seen for ${seenAt} hit points (lowest ${lowest}); ${inTrench} ticks in a trench${overheadWhileHiding ? ', the light walked over him' : ''}; lives ${sim.ci.meter[1]}`,
);
const fail = (m: string) => {
  console.error(`demoCheck: ${m}`);
  process.exit(1);
};
if (seenAt < SEEN) fail('the demo should step into the light once and be seen');
if (sim.ci.meter[1] !== lives0 || lowest < 40) fail('being seen in the demo should cost hit points, not a life');
if (inTrench < 40) fail('the demo should end with Kit in the first trench');
if (!overheadWhileHiding) fail('the light should walk over Kit while he hides');
console.log('demoCheck ok: seen once, then hiding while the light passes');
