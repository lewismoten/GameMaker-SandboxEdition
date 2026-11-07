// Replay the title demo on the actual player; it must show all three lessons and reach the ending.
import { readFileSync } from 'node:fs';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-engine/formats/recording';
import { encodeKeys } from '../../../web/src/walkthrough/format';
import { replay } from '../../kit/walkthrough';
const keys = parseRecording(new Uint8Array(readFileSync(new URL('../disk/demo.rec', import.meta.url)))).slice(0, -2);
if (!keys.some((k) => k.key === 57) || !keys.some((k) => k.key === 75) || !keys.some((k) => k.key === 72) || !keys.some((k) => k.key === 80))
  throw new Error('demo must hop, walk back, and walk up and down');
const r = await replay(
  'snow',
  {
    version: 1,
    game: 'snow',
    rand: { seed: 1, per: 'scene' },
    segments: [{ scene: 2, keys: encodeKeys(keys) }],
    chapters: [],
    timeline: { fps: 30, frames: 0, chapters: [] },
  },
  { maxMinutes: 3 },
);
if (r.error) throw r.error;
if (!r.won || r.scenes.slice(0, 4).join(' ') !== '2 3 4 1' || r.keysLeft)
  throw new Error(`demo must finish all three lessons: scenes ${r.scenes.join(' ')}, ${r.keysLeft} keys left`);
console.log('snow demo: all three lessons and ending, including the hop gap, the return walk and prints facing four ways; all keys played');
