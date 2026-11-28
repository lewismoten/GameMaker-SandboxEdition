// Each flower placed by the shop builder should survive the facade pass.
import { expect, it, vi } from 'vitest';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { ORIGIN, StarterMap } from '../../kit/starter/map';
import { buildLevels } from './levels';

it('keeps every planted flower visible in the finished map', () => {
  const writes = vi.spyOn(StarterMap.prototype, 'set');
  try {
    const { book, levels } = buildLevels();
    const flowers = writes.mock.calls.filter(([, , name]) => name === 'flower');
    expect(flowers.length).toBeGreaterThan(0);
    for (const [x, y] of flowers) {
      expect(levels[0].map.map.blocks[(y + ORIGIN) * MLEN + x + ORIGIN], `flower at ${x},${y}`).toBe(book.n('flower'));
    }
  } finally {
    writes.mockRestore();
  }
});
