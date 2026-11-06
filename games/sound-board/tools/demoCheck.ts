// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows each lesson once:
// level 1, level 1 again (the replay door), level 2 and then the ending. The recording's keys play as one unbroken list, as the demo
// recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/sound-board/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'sound-board',
  {
    version: 1,
    game: 'sound-board',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 3 },
);
const seen = r.scenes.slice(0, 4).join(' ');
if (r.error) console.log(r.error);
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed`);
if (seen !== '2 2 3 1' || r.keysLeft) {
  console.error(`demoCheck: expected scenes 2 2 3 1 (level 1, level 1 again by its replay door, level 2, the ending) with every key played; got ${seen}`);
  process.exit(1);
}
console.log('demoCheck ok: heard the pads, replayed the board, heard the feedback sounds, reached the ending');
