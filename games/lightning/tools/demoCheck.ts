// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows each lesson once:
// level 1 (a flash at each sign) and the start of level 2 (the drop into the ditch). The recording's keys play as one unbroken list, as the demo
// recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/lightning/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

import { ORIGIN } from '../../kit/starter/map';
import { GROUND } from '../src/levels';

let sawDitch = false;
const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'lightning',
  {
    version: 1,
    game: 'lightning',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  {
    maxMinutes: 3,
    onWorld({ chr }, scene) {
      const col = chr.x[0] - ORIGIN;
      if (scene === 3 && col >= 14 && col <= 27 && chr.y[0] - ORIGIN >= GROUND + 1) sawDitch = true;
    },
  },
);
const seen = r.scenes.join(' ');
if (r.error !== undefined) throw r.error instanceof Error ? r.error : new Error(String(r.error));
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed`);
if (seen !== '2 3' || r.keysLeft) {
  throw new Error(`demoCheck: expected scenes 2 3 (level 1, then the start of level 2) with every key played; got ${seen}`);
}
if (!sawDitch) throw new Error('demoCheck: the replay never reached the level 2 ditch');
console.log('demoCheck ok: a flash at each sign of level 1, out the door, then level 2 up to the ditch');
