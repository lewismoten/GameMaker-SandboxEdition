// Exercise the round-trip command with a small checkout and isolated report files.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

let root: string;
beforeEach(() => {
  vi.resetModules();
  const scratch = resolve('../.tmp');
  mkdirSync(scratch, { recursive: true });
  root = mkdtempSync(join(scratch, 'roundtrip-'));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  rmSync(root, { recursive: true, force: true });
});

it('scans the CD without private archives and dates the default reports', async () => {
  const cd = join(root, 'cd');
  mkdirSync(cd);
  writeFileSync(join(cd, 'sample.txt'), 'sample');
  const notes = join(root, '.for-lewis');
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2031-03-04T05:06:07Z'));
  vi.stubEnv('GM_MAIN_CHECKOUT', root);
  vi.stubEnv('GM_FOR_LEWIS', notes);
  vi.stubGlobal('process', Object.create(process, { argv: { value: ['node', 'roundTrip.ts'] } }));
  await import('./roundTrip');
  const today = '2031-03-04';
  const base = join(notes, 'research/roundtrip', today);
  const report = readFileSync(base + '.md', 'utf8');
  expect(report).toContain('(' + today + ')');
  expect(report).toContain('txt 1');
  expect(readFileSync(base + '.tsv', 'utf8')).toContain('type\tfile');
});

it('reports an unreadable ZIP and continues scanning the next ZIP', async () => {
  const failed = join(root, 'bad.zip');
  const valid = join(root, 'good.zip');
  const base = join(root, 'report');
  for (const path of [failed, valid]) writeFileSync(path, new Uint8Array([0x50, 0x4b, 3, 4]));
  const zip = await import('@lewismoten/gamemaker-sandbox-archives/project/zip');
  vi.spyOn(zip, 'readZip')
    .mockRejectedValueOnce(new Error('invalid directory'))
    .mockResolvedValueOnce([{ name: 'sample.txt', data: new Uint8Array() }]);
  vi.stubGlobal('process', Object.create(process, { argv: { value: ['node', 'roundTrip.ts', failed, valid, '--out', base] } }));
  await import('./roundTrip');
  const md = readFileSync(base + '.md', 'utf8');
  expect(md).toContain('1 zip read in memory');
  expect(md).toContain('txt 1');
  expect(md).toContain(failed + ' | unreadable | invalid directory');
  expect(readFileSync(base + '.tsv', 'utf8')).toContain(['zip', failed, 'unreadable', 'invalid directory'].join('\t'));
});
