// A normal cryptex rebuild restores a lost cutting sheet.
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it, vi } from 'vitest';

// Keep the file generation and cache real while skipping the expensive geometry checks.
vi.mock('./laser/cryptexBuild', () => ({
  buildCryptex: () => ({
    sheets: [{ file: 'sheet-1', title: 'Test sheet', sheet: { w: 10, h: 10, items: [], svg: () => '<svg/>' }, placed: [] }],
    parts: {},
    problems: [],
    clearance: {},
    lock: { opens: ['2000'], pocketFits: true, wrongDigitBlocked: true, windowDeg: 5 },
    area: { wood: 0, occupied: 0 },
  }),
  fittingTable: () => [{ stock: '12x12', sheets: 1, label: 'one sheet', materialIn2: 0, materialMm2: 0 }],
}));

vi.mock('./laser/cryptexSteps', () => ({ assemblySvg: () => '<svg/>', legend: () => [] }));

it('restores a missing sheet when the manifest source still matches', async () => {
  const scratch = fileURLToPath(new URL('../../.tmp/', import.meta.url));
  mkdirSync(scratch, { recursive: true });
  const out = mkdtempSync(join(scratch, 'cryptex-'));
  const argv = process.argv;
  try {
    process.argv = [...argv.slice(0, 2), '--out', out];
    await import('./laser/cryptex');
    const manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8')) as { sheets: { svg: string }[] };
    const sheet = join(out, manifest.sheets[0].svg);
    const original = readFileSync(sheet, 'utf8');
    rmSync(sheet);
    vi.resetModules();
    await import('./laser/cryptex');
    expect(readFileSync(sheet, 'utf8')).toBe(original);
  } finally {
    process.argv = argv;
    rmSync(out, { recursive: true, force: true });
  }
});
