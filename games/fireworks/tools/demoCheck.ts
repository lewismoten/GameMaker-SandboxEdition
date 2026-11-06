// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows level 1's lessons once: both
// launchers going up, then Nova's own rocket (Enter), all within level 1. The recording's keys play as one unbroken
// list, as the demo recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/fireworks/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';
import { SCAN_ENTER } from '../src/hero';

const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2); // without the Esc
const enters = keys.filter((k) => k.key === SCAN_ENTER).length;
const r = await replay(
  'fireworks',
  {
    version: 1,
    game: 'fireworks',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 3 },
);
if (r.error) console.log(r.error);
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed; Enter pressed ${enters} time(s)`);
if (r.scenes[0] !== 2 || r.scenes.includes(3) || r.keysLeft || enters !== 1) {
  console.error('demoCheck: expected level 1 only, every key played and one press of Enter');
  process.exit(1);
}
console.log('demoCheck ok: walked past both launchers and launched a rocket with Enter');
