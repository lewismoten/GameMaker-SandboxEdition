// VersionDisks.files reads a game's tracked disk at a revision straight from Git (a throwaway repo).
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { VersionDisks } from '../../games/kit/versionDisks';

it('returns the tracked disk at a revision, name to bytes', async () => {
  const root = mkdtempSync(join(tmpdir(), 'vd-'));
  try {
    const git = (...a: string[]) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: root, stdio: 'pipe' });
    git('init', '-q');
    mkdirSync(join(root, 'games/x/disk'), { recursive: true });
    writeFileSync(join(root, 'games/x/disk/A.TXT'), 'old');
    git('add', '.');
    git('commit', '-qm', 'a');
    writeFileSync(join(root, 'games/x/disk/A.TXT'), 'new');
    const disks = new VersionDisks(root, 'HEAD');
    const files = await disks.files('x');
    expect([...files.keys()]).toEqual(['A.TXT']);
    expect(new TextDecoder().decode(files.get('A.TXT'))).toBe('old');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
