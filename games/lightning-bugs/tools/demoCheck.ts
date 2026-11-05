// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows the lesson once: all of level 1 (the
// copies, then the six kinds) and out of its door into level 2.
//   cd web && npx vite-node ../games/lightning-bugs/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'lightning-bugs',
  {
    version: 1,
    game: 'lightning-bugs',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 3 },
);
const seen = r.scenes.slice(0, 2).join(' ');
if (r.error) console.log(r.error);
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed`);
if (seen !== '2 3' || r.keysLeft) {
  console.error(`demoCheck: expected scenes 2 3 (level 1, then the start of level 2) with every key played; got ${seen}`);
  process.exit(1);
}
console.log('demoCheck ok: walked past the copies and the six kinds and out the door, then started level 2');
