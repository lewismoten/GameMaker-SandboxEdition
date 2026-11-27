// Exercise the generator's file cache with a single wheel to keep packing quick.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it, vi } from 'vitest';

vi.mock('../../games/tuneup/laser/papercraftParts', async (importOriginal) => {
  const parts = await importOriginal<typeof import('../../games/tuneup/laser/papercraftParts')>();
  return { ...parts, allPieces: () => [{ ...parts.wheel(), qty: 1 }] };
});

// Sheet packing and rasterization have separate coverage. Keep the PDF writer real.
vi.mock('../../games/tuneup/laser/papercraftLaser', () => ({
  buildLaser: () => ({ sheets: [], problems: [] }),
  fittingTable: () => [{ stock: '12x12', materialIn2: 144, materialMm2: 92903 }],
}));

vi.mock('../../games/tuneup/laser/papercraftPrint', async (importOriginal) => {
  const print = await importOriginal<typeof import('../../games/tuneup/laser/papercraftPrint')>();
  return { ...print, pagePng: () => Buffer.alloc(0) };
});

it('restores a missing Letter PDF on a normal rebuild', async () => {
  const scratch = fileURLToPath(new URL('../../.tmp/', import.meta.url));
  mkdirSync(scratch, { recursive: true });
  const out = mkdtempSync(join(scratch, 'paper-chez-'));
  const argv = process.argv;
  try {
    process.argv = [...argv.slice(0, 2), '--out', out];
    await import('../../games/tuneup/laser/chezPapercraft');
    const letter = join(out, 'print-letter.pdf');
    const expected = readFileSync(letter);
    utimesSync(letter, 1, 1);
    vi.resetModules();
    await import('../../games/tuneup/laser/chezPapercraft');
    expect(statSync(letter).mtimeMs).toBe(1000);
    rmSync(letter);
    vi.resetModules();
    await import('../../games/tuneup/laser/chezPapercraft');
    expect(readFileSync(letter).equals(expected)).toBe(true);
  } finally {
    process.argv = argv;
    rmSync(out, { recursive: true, force: true });
  }
});
