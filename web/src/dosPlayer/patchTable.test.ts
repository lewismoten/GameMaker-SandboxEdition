// Pin every patch entry and its order before splitting the DOS player metadata by family.
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { PATCHES } from '@lewismoten/gamemaker-sandbox-engine/player/patchTable';

it('preserves the complete DOS player patch table', () => {
  expect(PATCHES).toHaveLength(139);
  expect(createHash('sha256').update(JSON.stringify(PATCHES)).digest('hex')).toBe('d5813332e71784bec6d99e0e33e7b0cb871db9b296e2728798c0bb428d2e19ca');
});
