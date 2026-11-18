// Pin every patch entry and its order before splitting the DOS player metadata by family.
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { PATCHES } from '@lewismoten/gamemaker-sandbox-engine/player/patchTable';

it('preserves the complete DOS player patch table', () => {
  expect(PATCHES).toHaveLength(139);
  expect(createHash('sha256').update(JSON.stringify(PATCHES)).digest('hex')).toBe('83bdc016d33c710d3d0ef997623d366bc3f969ab6062c3f34ee440d178e88d0d');
});
