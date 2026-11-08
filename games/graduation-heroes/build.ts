// GRADUATION: HEROES AND FOES (Sandbox Software, 1994): builds every file of the game into games/graduation-heroes/disk/.
//   cd web && npx vite-node ../games/graduation-heroes/build.ts
// A graduation (games/kit/starter/graduationBuild.ts): the hall is CASTLE in graduationThemes.ts.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGraduation } from '../kit/starter/graduationBuild';
import { buildLevels } from '../kit/starter/graduationLevel';
import { cfg } from './src/config';
import { demoRecording } from './src/demo';

buildGraduation(dirname(fileURLToPath(import.meta.url)), cfg, buildLevels(cfg), demoRecording());
