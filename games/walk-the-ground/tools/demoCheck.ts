// Plays the built title demo on the engine and checks Kit reaches the tunnel floor through the trapdoor.
//   cd web && npx vite-node ../games/walk-the-ground/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';
import { ORIGIN } from '../../kit/starter/map';
import { L2 } from '../src/levels';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -1); // Esc ends play before its release
let sank = false;
const r = await replay(
  'walk-the-ground',
  {
    version: 1,
    game: 'walk-the-ground',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  {
    maxMinutes: 4,
    onWorld: ({ chr }, scene) => {
      const col = chr.x[0] - ORIGIN;
      const row = chr.y[0] - ORIGIN;
      if (scene === 3 && col >= L2.shaft[0] && col <= L2.shaft[1] && row === L2.floor - 1) sank = true;
    },
  },
);
const seen = r.scenes.slice(0, 2).join(' ');
if (r.error) console.log(r.error);
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed`);
if (seen !== '2 3' || r.keysLeft || r.scenes.includes(1)) {
  console.error(`demoCheck: expected scenes 2 3 with every key played and no ending; got ${seen}`);
  process.exit(1);
}
if (!sank) {
  console.error('demoCheck: Kit never reached the tunnel floor inside the trapdoor shaft');
  process.exit(1);
}
console.log('demoCheck ok: the hill was dug, the trapdoor sank Kit, no game over');
