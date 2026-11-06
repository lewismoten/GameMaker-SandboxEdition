// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows each lesson once:
// level 1 (the row of red and green plates, two stings), level 2 (the spikes jumped) and then the ending.
// The recording's keys play as one unbroken list, as the demo recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/colors/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'colors',
  {
    version: 1,
    game: 'colors',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 3 },
);
const seen = r.scenes.slice(0, 3).join(' ');
if (r.error) console.log(r.error);
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed`);
if (seen !== '2 3 1' || r.keysLeft) {
  console.error(`demoCheck: expected scenes 2 3 1 (two levels, the ending) with every key played; got ${seen}`);
  process.exit(1);
}
console.log('demoCheck ok: both levels played and the ending reached');
