// GRADUATION: BLOCKS AND SHOWCASE (Sandbox Software, 1994): builds every file of the game into games/graduation-blocks/disk/.
//   cd web && npx vite-node ../games/graduation-blocks/build.ts
// A graduation (games/kit/starter/graduationBuild.ts): the hall is GALLERY in graduationThemes.ts.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGraduation } from '../kit/starter/graduationBuild';
import { buildLevels } from '../kit/starter/graduationLevel';
import { cfg } from './src/config';
import { demoRecording } from './src/demo';

buildGraduation(dirname(fileURLToPath(import.meta.url)), cfg, buildLevels(cfg), demoRecording());
