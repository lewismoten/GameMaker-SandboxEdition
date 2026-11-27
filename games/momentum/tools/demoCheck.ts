// Plays the built Momentum title demo and checks its lessons.
import { readFileSync } from 'node:fs';
import { checkRecording } from './checkRecording';

await checkRecording(readFileSync(new URL('../disk/demo.rec', import.meta.url)));
