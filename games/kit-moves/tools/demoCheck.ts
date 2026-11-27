// Replay the built Kit's Moves demo and check the final dash crossing.
import { readFileSync } from 'node:fs';
import { checkRecording } from './checkRecording';

await checkRecording(readFileSync(new URL('../disk/demo.rec', import.meta.url)));
console.log('demoCheck ok: Kit dashed twice across the widest gap and landed on the far side');
