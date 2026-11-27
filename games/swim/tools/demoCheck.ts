// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows each lesson once:
// levels 1, 2 and 3 entered, and no game over. The recording's keys play as one unbroken list, as the demo
// recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/swim/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'swim',
  {
    version: 1,
    game: 'swim',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 4 },
);
const seen = r.scenes.join(' ');
if (r.error !== undefined) {
  console.error(r.error);
  process.exit(1);
}
console.log(`demo: scenes entered ${seen}; ${r.keysLeft} keys unplayed`);
if (seen !== '2 3 4' || r.keysLeft) {
  console.error(`demoCheck: expected scenes 2 3 4 with every key played and no ending; got ${seen}`);
  process.exit(1);
}
console.log('demoCheck ok: the creek carried, the pool floated, the lift lifted, no game over');
