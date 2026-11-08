// Test support for the level check's regression tests: a game's built disk/ as it was at a
// commit, read with git (`git ls-tree` and `git cat-file`), so a test can show the check finds
// a bug in the version before its fix. Undefined when git or that commit isn't there (a
// shallow clone, as CI checks out), so the tests that use it skip.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = join(__dirname, '../../../..');

const cache = new Map<string, Map<string, Uint8Array> | undefined>();

/** games/<id>/disk at `rev`, by lower-case file name (read once per test file; one git call for every blob). */
export function diskAt(id: string, rev: string): Map<string, Uint8Array> | undefined {
  const key = `${id}@${rev}`;
  if (!cache.has(key)) cache.set(key, read(id, rev));
  const got = cache.get(key);
  return got && new Map(got);
}

function read(id: string, rev: string): Map<string, Uint8Array> | undefined {
  try {
    const list = execFileSync('git', ['ls-tree', '-z', `${rev}:games/${id}/disk`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const entries = list
      .split('\0')
      .filter(Boolean)
      .map((line) => {
        const [meta, name] = line.split('\t');
        return { name: name.toLowerCase(), sha: meta.split(' ')[2] };
      });
    if (!entries.length) return undefined;
    // `git cat-file --batch` answers each sha with "<sha> <type> <size>\n<bytes>\n"
    const out = execFileSync('git', ['cat-file', '--batch'], {
      cwd: root,
      input: entries.map((e) => e.sha).join('\n') + '\n',
      maxBuffer: 1 << 28,
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    const files = new Map<string, Uint8Array>();
    let at = 0;
    for (const e of entries) {
      const eol = out.indexOf(10, at);
      const size = Number(out.toString('latin1', at, eol).split(' ')[2]);
      if (!Number.isFinite(size)) return undefined;
      files.set(e.name, new Uint8Array(out.subarray(eol + 1, eol + 1 + size)));
      at = eol + 1 + size + 1;
    }
    return files;
  } catch {
    return undefined;
  }
}
