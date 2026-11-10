// The DOS page lists its disks from the lean game list (no catalog-files.json, about 45 kB);
// the desk's disk box still asks for the full one, whose file lists its boxes read. The manual's
// game shots (opened at the DOS page's start) use the lean list too.
import { describe, expect, it, vi } from 'vitest';

const lean = vi.fn(async () => []);
const full = vi.fn(async () => []);
vi.mock('../../project/files', async (orig) => ({
  ...(await orig<typeof import('../../project/files')>()),
  loadLeanGameList: lean,
  loadGameList: full,
}));

describe('loadDisks', () => {
  it('lean asks for the list without file lists', async () => {
    const { loadDisks } = await import('./disks');
    await loadDisks(true);
    expect(lean).toHaveBeenCalledTimes(1);
    expect(full).not.toHaveBeenCalled();
  });
  it('by default asks for the full list', async () => {
    const { loadDisks } = await import('./disks');
    await loadDisks();
    expect(full).toHaveBeenCalledTimes(1);
  });
});

describe('sandboxShots', () => {
  it('asks for the list without file lists', async () => {
    lean.mockClear();
    const { sandboxShots } = await import('../../gfx/sandboxShots');
    await sandboxShots();
    expect(lean).toHaveBeenCalledTimes(1);
  });
});
