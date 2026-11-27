// Exercise the Stage Box builder's manifest retry without packing or rendering cut sheets.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, it, vi } from 'vitest';

vi.mock('../../games/sleuth/laser/stageBoxBuild', () => ({
  buildStageBox: () => ({ sheets: [], parts: {}, clearance: {}, problems: [] }),
  fittingTable: () => [{ stock: '12x12', sheets: 0, materialIn2: 0, materialMm2: 0 }],
}));

it('recovers a truncated manifest on a forced Stage Box rebuild', async () => {
  const scratch = resolve('../.tmp');
  mkdirSync(scratch, { recursive: true });
  const out = mkdtempSync(join(scratch, 'stage-box-'));
  const manifest = join(out, 'manifest.json');
  const unlisted = join(out, 'sheet-99.svg');
  const argv = process.argv;
  try {
    writeFileSync(manifest, '{');
    writeFileSync(unlisted, 'keep');
    process.argv = ['node', 'stageBox', '--force', '--out', out];
    await import('../../games/sleuth/laser/stageBox');
    expect(JSON.parse(readFileSync(manifest, 'utf8'))).toMatchObject({ id: 'stage-box', source: expect.any(String) });
    expect(readFileSync(unlisted, 'utf8')).toBe('keep');
  } finally {
    process.argv = argv;
    rmSync(out, { recursive: true, force: true });
  }
});
