// GRADUATION: FIRST STEPS (Sandbox Software, 1994): builds every file of the game into games/graduation-basics/disk/.
//   cd web && npx vite-node ../games/graduation-basics/build.ts
// The first graduation: a Starter that comes after The Basics and ends with honors (games/kit/starter).
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGraduation } from '../kit/starter/graduationBuild';
import { buildLevels } from '../kit/starter/graduationLevel';
import { cfg } from './src/config';
import { demoRecording } from './src/demo';

buildGraduation(dirname(fileURLToPath(import.meta.url)), cfg, buildLevels(cfg), demoRecording());
