// Render one independent animation shard for a short CI job; cache identity covers its source inputs.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { gameSourceHash, root } from './game-build-inputs.mjs';
const shard = process.argv[2];
if (!/^[0-7]$/.test(shard ?? '')) throw new Error('Give an animation shard from 0 through 7.');
execFileSync(process.execPath, [join(root, 'node_modules/vite-node/vite-node.mjs'), '../games/depth/tools/renderFrames.ts', `${shard}/8`], {
  cwd: join(root, 'web'),
  env: { ...process.env, DEPTH_FRAME_CACHE: join(root, 'games/.render-cache', gameSourceHash(true)) },
  stdio: 'inherit',
  timeout: 240_000,
  killSignal: 'SIGKILL',
});
