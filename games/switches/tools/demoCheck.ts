// Plays the title demo through level 1 and into level 2, where the player falls into the pool.
// The recording ends on the second try in level 2, before the exit.
//   cd web && npx vite-node ../games/switches/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'switches',
  {
    version: 1,
    game: 'switches',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 4 },
);
const seen = r.scenes.join(' ');
if (r.error !== undefined) console.error(r.error);
console.log(`demo: scenes entered ${seen}; ${r.keysLeft} keys unplayed`);
if (seen !== '2 3 3' || r.keysLeft || r.error !== undefined) {
  console.error(`demoCheck: expected scenes 2 3 3 with every key played and no ending; got ${seen}`);
  process.exit(1);
}
console.log('demoCheck ok: pulled the lever and crossed, fell in at the red planks with only the blue lever pulled, came back, no game over');
