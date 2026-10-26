// Test support for the level check's regression tests: a game's built disk/ as it was at a
// commit, read with git (`git ls-tree` and `git cat-file`), so a test can show the check finds
// a bug in the version before its fix. Undefined when git or that commit isn't there (a
// shallow clone, as CI checks out), so the tests that use it skip.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = join(__dirname, '../../../..');

/** games/<id>/disk at `rev`, by lower-case file name. */
export function diskAt(id: string, rev: string): Map<string, Uint8Array> | undefined {
  try {
    const list = execFileSync('git', ['ls-tree', '-z', `${rev}:games/${id}/disk`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const files = new Map<string, Uint8Array>();
    for (const line of list.split('\0').filter(Boolean)) {
      const [meta, name] = line.split('\t');
      const sha = meta.split(' ')[2];
      files.set(name.toLowerCase(), new Uint8Array(execFileSync('git', ['cat-file', 'blob', sha], { cwd: root, maxBuffer: 1 << 26 })));
    }
    return files.size ? files : undefined;
  } catch {
    return undefined;
  }
}
