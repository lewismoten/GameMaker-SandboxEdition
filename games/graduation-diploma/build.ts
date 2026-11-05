// THE SANDBOX DIPLOMA (Sandbox Software, 1994): builds every file of the game into games/graduation-diploma/disk/.
//   cd web && npx vite-node ../games/graduation-diploma/build.ts
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGraduation } from '../kit/starter/graduationBuild';
import { cfg } from './src/config';
import { demoRecording } from './src/demo';
import { buildLevels } from './src/levels';

buildGraduation(dirname(fileURLToPath(import.meta.url)), cfg, buildLevels(), demoRecording());
