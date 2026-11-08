// The supervised-release guard shared by the release scripts. The maintainer's .for-lewis/release/SUPERVISED
// lives in the main checkout, which is ignored by version control, so a script run from a worktree (an agent's,
// say) must look there, not in its own checkout: the main checkout is the parent of the repository's common
// directory. The file must name the tag. Agents never create it.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function mainCheckout(cwd) {
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd, encoding: 'utf8' }).trim();
  return dirname(common);
}

/** The guard file's path, and whether it exists and names `tag`. */
export function supervisedFor(tag, cwd) {
  const file = join(mainCheckout(cwd), '.for-lewis/release/SUPERVISED');
  return { file, named: existsSync(file) && readFileSync(file, 'utf8').split(/\s+/).includes(tag) };
}
