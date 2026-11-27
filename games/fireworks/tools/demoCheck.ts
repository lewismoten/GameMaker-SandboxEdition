// Plays the built title demo (disk/demo.rec) on the real engine and checks it shows level 1's lessons once: both
// launchers going up, then Lami's own rocket (Enter), all within level 1. The recording's keys play as one unbroken
// list, as the demo recorder counts game ticks across scene changes.
//   cd web && npx vite-node ../games/fireworks/tools/demoCheck.ts
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';
import { SCAN_ENTER } from '../src/hero';
import { ROCKET, ROCKET_TEAL } from '../src/monsters';

const seen = { pink: false, teal: false, player: false };
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
  {
    maxMinutes: 3,
    onWorld(w, scene) {
      if (scene !== 2) return;
      // In level 1 each launcher makes its own color. Enter makes a pink rocket marked fromchar.
      w.mm.forEach(({ monnum }, slot) => {
        if (w.mi[slot].fromchar > 0) {
          if (monnum === ROCKET) seen.player = true;
        } else if (monnum === ROCKET) seen.pink = true;
        else if (monnum === ROCKET_TEAL) seen.teal = true;
      });
    },
  },
);
if (r.error) console.log(r.error);
console.log(`demo: scenes entered ${r.scenes.join(' ')}; ${r.keysLeft} keys unplayed; Enter pressed ${enters} time(s)`);
console.log('rockets observed:', seen);
if (r.error || r.scenes.join(' ') !== '2' || r.keysLeft || enters !== 1 || !seen.pink || !seen.teal || !seen.player) {
  console.error('demoCheck: expected level 1 only, every key played and rockets from both launchers and one press of Enter');
  process.exit(1);
}
console.log('demoCheck ok: both launchers fired and Enter launched a player rocket');
