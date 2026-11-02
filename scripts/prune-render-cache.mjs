// Keep only the current source's Depth animation frames in games/.render-cache (CI caches that folder).
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { gameSourceHash, root } from './game-build-inputs.mjs';
const dir = join(root, 'games/.render-cache');
const keep = gameSourceHash(true);
for (const name of existsSync(dir) ? readdirSync(dir) : []) if (name !== keep) rmSync(join(dir, name), { recursive: true, force: true });
