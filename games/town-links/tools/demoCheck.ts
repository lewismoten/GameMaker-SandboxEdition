// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows each lesson once: the world, the
// town, back out to the world, the town again, the house, out of it and in again, and then the ending. The
// recording's keys play as one unbroken list, as the demo recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/town-links/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'town-links',
  {
    version: 1,
    game: 'town-links',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 8 },
);
const WANT = '2 3 2 3 4 3 4 1';
const seen = r.scenes.slice(0, 8).join(' ');
if (r.error) console.log(r.error);
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed`);
if (seen !== WANT || r.keysLeft) {
  console.error(`demoCheck: expected scenes ${WANT} (the world, the town, the house, the ending) with every key played; got ${seen}`);
  process.exit(1);
}
console.log(
  'demoCheck ok: stepped onto the town block, bumped the locked gate, went back out to the world for the key, came in again, through the house door and out and in once more, reached the ending',
);
