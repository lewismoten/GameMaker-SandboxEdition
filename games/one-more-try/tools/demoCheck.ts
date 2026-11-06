// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows the lesson once:
// level 1 entered, then entered again from the post, and no game over. The recording's keys play as one unbroken list, as the demo
// recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/one-more-try/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'one-more-try',
  {
    version: 1,
    game: 'one-more-try',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 4 },
);
const seen = r.scenes.slice(0, 2).join(' ');
if (r.error) console.log(r.error);
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed`);
if (seen !== '2 2' || r.keysLeft || r.scenes.includes(1)) {
  console.error(`demoCheck: expected scenes 2 2 with every key played and no ending; got ${seen}`);
  process.exit(1);
}
console.log('demoCheck ok: fell in the pit, touched the post, started the level over, no game over');
