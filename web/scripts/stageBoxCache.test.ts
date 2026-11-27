// Exercise the Stage Box cache without running the expensive sheet layout.
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';

vi.mock('../../games/sleuth/laser/stageBoxBuild', async () => {
  const { LaserSheet } = await import('@lewismoten/gamemaker-sandbox-tools/kit/laserSvg');
  return {
    buildStageBox: () => ({
      clearance: {},
      problems: [],
      sheets: [{ file: 'sheet-1', title: 'Sample', sheet: new LaserSheet(10, 10), placed: [] }],
      parts: {},
    }),
    fittingTable: () => [{ stock: '12x12', label: 'test', sheets: 0, materialIn2: 0, materialMm2: 0 }],
  };
});

it.each(['assembly.svg', 'README.md', 'sheet-1.svg', 'sheet-1.png'])('restores a missing %s with a matching manifest', async (file) => {
  const out = mkdtempSync(join(tmpdir(), 'stage-box-'));
  const argv = process.argv;
  try {
    process.argv = [...argv.slice(0, 2), '--out', out];
    vi.resetModules();
    await import('../../games/sleuth/laser/stageBox');
    const missing = join(out, file);
    rmSync(missing);
    vi.resetModules();
    await import('../../games/sleuth/laser/stageBox');
    expect(existsSync(missing)).toBe(true);
  } finally {
    process.argv = argv;
    rmSync(out, { recursive: true, force: true });
  }
});
