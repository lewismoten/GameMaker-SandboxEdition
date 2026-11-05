// Plays the built title demo (disk/demo.rec) on the real engine and checks it tries every door once: the hall, each of the five
// rooms in turn with the way back to the hall between, and then the ending. The recording's keys play as one unbroken list,
// as the demo recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/color-doors/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'color-doors',
  {
    version: 1,
    game: 'color-doors',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 8 },
);
const WANT = '2 3 2 4 2 5 2 6 2 7 2 1';
const seen = r.scenes.slice(0, 12).join(' ');
if (r.error) console.log(r.error);
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed`);
if (seen !== WANT || r.keysLeft) {
  console.error(`demoCheck: expected scenes ${WANT} (the hall, five rooms with the hall between, the ending) with every key played; got ${seen}`);
  process.exit(1);
}
console.log('demoCheck ok: tried all five doors and came back each time, then the last door of the hall ended the game');
