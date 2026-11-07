// Resolve only ordinary text conflicts in the four approved documentation/data extensions.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { command, git } from './repo-command.mjs';

export function unionConflicts(root) {
  const files = git(root, 'diff', '--name-only', '--diff-filter=U', '-z').split('\0').filter(Boolean);
  // Inspect every path before changing any resolution. Modify/delete and binary conflicts abort.
  const inputs = files.map((file) => {
    if (!['.md', '.json', '.csv', '.txt'].includes(extname(file))) throw new Error(`Code conflict: ${file}`);
    const modes = git(root, 'ls-files', '--stage', '--', file)
      .split('\n')
      .map((entry) => entry.split(' ')[0]);
    if (modes.some((mode) => !['100644', '100755'].includes(mode))) throw new Error(`Non-file conflict: ${file}`);
    const stages = [1, 2, 3].map((stage) => {
      const result = command(root, ['git', 'show', `:${stage}:${file}`]);
      if (result.code !== 0) throw new Error(`Missing merge stage for ${file}`);
      return result.stdout;
    });
    if (stages.some((s) => s.includes('\0'))) throw new Error(`Binary conflict: ${file}`);
    return { file, stages };
  });
  const scratch = mkdtempSync(join(tmpdir(), 'merge-union-'));
  try {
    for (const { file, stages } of inputs) {
      const paths = stages.map((s, i) => {
        const p = join(scratch, String(i));
        writeFileSync(p, s);
        return p;
      });
      const result = command(root, ['git', 'merge-file', '--union', '-p', paths[1], paths[0], paths[2]]);
      if (result.code !== 0 || /^(<<<<<<<|=======|>>>>>>>)/m.test(result.stdout)) throw new Error(`Unresolved union: ${file}`);
      if (extname(file) === '.json') JSON.parse(result.stdout); // Text union is not a schema-aware merge.
      writeFileSync(join(root, file), result.stdout);
      git(root, 'add', '--', file);
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  return files;
}
