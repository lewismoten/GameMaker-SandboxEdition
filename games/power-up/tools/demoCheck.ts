// Plays disk/demo.rec on the real engine. The unpowered jump must land back under the ledge,
// and the attempt at the gap must land on the canyon floor before the replay wins.
//   cd web && npx vite-node ../games/power-up/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';
import { ORIGIN } from '../../kit/starter/map';
import { POWER } from '../src/hero';
import { CANYON_FLOOR, GAP_FROM, GAP_TO, GROUND, LEDGE_FROM, LEDGE_ROW, LEDGE_TO } from '../src/levels';

let jumpingUnderLedge = false;
let missedLedge = false;
let jumpingAtGap = false;
let fellIntoCanyon = false;

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'power-up',
  {
    version: 1,
    game: 'power-up',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  {
    maxMinutes: 2.5,
    onWorld: ({ chr, ci }, scene) => {
      const column = chr.x[0] - ORIGIN;
      const row = chr.y[0] - ORIGIN;
      if (scene === 2 && ci.meter[POWER.highJump] === 0 && column >= LEDGE_FROM && column <= LEDGE_TO && row >= LEDGE_ROW) {
        if (row < GROUND - 1) jumpingUnderLedge = true;
        else if (jumpingUnderLedge && row === GROUND - 1 && chr.y[1] === 0) missedLedge = true;
      } else jumpingUnderLedge = false;

      if (scene === 3 && ci.meter[POWER.fastRight] === 0 && column >= GAP_FROM - 1 && column <= GAP_TO) {
        if (row < GROUND - 1) jumpingAtGap = true;
        if (jumpingAtGap && column >= GAP_FROM && row === CANYON_FLOOR - 1 && chr.y[1] === 0) fellIntoCanyon = true;
        if (row === GROUND - 1 && chr.y[1] === 0 && column < GAP_FROM) jumpingAtGap = false;
      } else jumpingAtGap = false;
    },
  },
);
const seen = r.scenes.join(' ');
if (r.error !== undefined) console.error(r.error);
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed`);
if (r.error !== undefined || !r.won || seen !== '2 3 1' || r.keysLeft) {
  console.error(`demoCheck: expected a clean win through scenes 2 3 1 with every key played; got ${seen}`);
  process.exit(1);
}
if (!missedLedge || !fellIntoCanyon) {
  console.error(`demoCheck: missed ledge: ${missedLedge}; fell into canyon: ${fellIntoCanyon}`);
  process.exit(1);
}
console.log('demoCheck ok: missed the ledge, fell into the canyon and won');
