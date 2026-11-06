// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows each lesson once:
// levels 1 and 2 entered, the pack's keys, and no game over. The recording's keys play as one unbroken list, as the demo
// recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/inventory/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const r = await replay(
  'inventory',
  {
    version: 1,
    game: 'inventory',
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
if (seen !== '2 3' || r.keysLeft || r.scenes.includes(1)) {
  console.error(`demoCheck: expected scenes 2 3 with every key played and no ending; got ${seen}`);
  process.exit(1);
}
const count = (scan: number) => keys.filter((k) => k.key === scan).length;
console.log(`demo: ${count(25)} P presses, ${count(32)} D presses, ${count(28)} Enter presses`);
// P and D each press once to take or put down a thing; Enter also picks the pack's place after a D
if (count(25) < 6 || count(32) < 4) {
  console.error('demoCheck: expected the demo to pick up the crates, the flame and the star, and put down the crates and the flame');
  process.exit(1);
}
console.log('demoCheck ok: the pack, the stair, the flame and the star played, no game over');
