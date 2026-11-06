// Replays the built title recording through every rain lesson and the ending.
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';
const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2);
const r = await replay(
  'rain',
  {
    version: 1,
    game: 'rain',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 3 },
);
console.log(`rain demo: scenes ${r.scenes.join(' ')}, ${r.keysLeft} keys left, ${r.error ?? 'no replay error'}`);
if (r.error || r.scenes.join(' ') !== '2 3 4' || r.keysLeft) throw new Error('demo did not show every rain lesson');
