// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows each lesson once:
// level 1, level 2 entered, level 2 entered again (the one life lost to the pool), then level 3 (so the
// second try got across) and no game over. The recording's keys play as one unbroken list, as the demo
// recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/health-and-hearts/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'health-and-hearts',
  {
    version: 1,
    game: 'health-and-hearts',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 1.4 },
);
const seen = r.scenes.slice(0, 4).join(' ');
if (r.error) console.log(r.error);
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed`);
if (seen !== '2 3 3 4' || r.keysLeft || r.scenes.includes(1)) {
  console.error(`demoCheck: expected scenes 2 3 3 4 with every key played and no ending; got ${seen}`);
  process.exit(1);
}
console.log('demoCheck ok: hurt once by the spike, fell in the pool once and came back, crossed, no game over');
