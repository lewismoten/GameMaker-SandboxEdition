// Checks the title demonstration from the built game disk.
import { readFileSync } from 'node:fs';
import { checkRecording } from './checkRecording';

await checkRecording(readFileSync(new URL('../disk/demo.rec', import.meta.url)));
console.log('demoCheck ok: bumped the crates, stood in the stuck coin, no game over');
