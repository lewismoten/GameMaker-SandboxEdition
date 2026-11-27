// Exercise the save command with a temporary checklist and an offline response.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';

it('tries each unsaved URL once per run after permanent failures', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'wayback-'));
  const list = join(dir, 'list.md');
  const log = join(dir, 'log.tsv');
  const urls = ['https://one.test/a', 'https://two.test/b'];
  try {
    writeFileSync(list, urls.map((url) => `- [ ] <${url}>`).join('\n'));
    vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'save', list, log, '--gap', '0', '--limit', '3']);
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
    await import('./waybackSave');
    expect(
      readFileSync(log, 'utf8')
        .trimEnd()
        .split('\n')
        .slice(1)
        .map((line) => line.split('\t')[1]),
    ).toEqual(urls);
  } finally {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    rmSync(dir, { recursive: true, force: true });
  }
});
