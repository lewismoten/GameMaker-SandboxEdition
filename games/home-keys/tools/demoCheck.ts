// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows each lesson once:
// levels 1 to 3 entered, and no game over. The recording's keys play as one unbroken list, as the demo
// recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/home-keys/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'home-keys',
  {
    version: 1,
    game: 'home-keys',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 4 },
);
if (r.error) throw r.error instanceof Error ? r.error : new Error(String(r.error));
const seen = r.scenes.join(' ');
console.log(`demo: scenes entered ${seen}; ${r.keysLeft} keys unplayed`);
if (seen !== '2 3 4' || r.keysLeft) {
  throw new Error(`demoCheck: expected scenes 2 3 4 with every key played and no ending; got ${seen}`);
}
console.log('demoCheck ok: the walk, the stars, the jumps and the leaps played, no game over');
