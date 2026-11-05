// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows each lesson once:
// the room, the roads (meadow, woods, meadow, pond, village, shop, village, shop) and then the ending. The
// recording's keys play as one unbroken list, as the demo recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/overhead/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'overhead',
  {
    version: 1,
    game: 'overhead',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 8 },
);
const WANT = '2 3 4 3 6 5 7 5 7 1';
const seen = r.scenes.slice(0, 10).join(' ');
if (r.error) console.log(r.error);
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed`);
if (seen !== WANT || r.keysLeft) {
  console.error(`demoCheck: expected scenes ${WANT} (the room, the roads, the ending) with every key played; got ${seen}`);
  process.exit(1);
}
console.log(
  'demoCheck ok: walked the room round a table, off the edge of the meadow into the woods and back, east to the pond, into the shop by the house door and out, reached the ending',
);
