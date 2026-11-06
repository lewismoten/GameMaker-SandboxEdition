// Plays the built title demo (disk/demo.rec) on the real engine and checks it walks the wobble, the mirage and the evening, then the ending.
//   cd web && npx vite-node ../games/heat-waves/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'heat-waves',
  {
    version: 1,
    game: 'heat-waves',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 8 },
);
const WANT = '2 3 4 1';
const seen = r.scenes.slice(0, 4).join(' ');
if (r.error) console.log(r.error);
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed`);
if (seen !== WANT || r.keysLeft) {
  console.error(`demoCheck: expected scenes ${WANT} (the wobble, the mirage, the evening, the ending) with every key played; got ${seen}`);
  process.exit(1);
}
console.log('demoCheck ok: walked every room and the last door ended the game');
