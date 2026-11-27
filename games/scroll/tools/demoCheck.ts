// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows each lesson once:
// level 1, then level 2 entered, and no game over. The recording's keys play as one unbroken list, as the demo
// recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/scroll/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'scroll',
  {
    version: 1,
    game: 'scroll',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 4 },
);
const seen = r.scenes.join(' ');
console.log(`demo: scenes entered ${seen}; ${r.keysLeft} keys unplayed`);
if (r.error !== undefined) throw new Error(`demoCheck: replay failed: ${String(r.error)}`);
if (seen !== '2 3' || r.keysLeft !== 0) {
  throw new Error(`demoCheck: expected scenes 2 3 with every key played; got ${seen} with ${r.keysLeft} keys unplayed`);
}
console.log('demoCheck ok: the room stayed, the view followed, no game over');
