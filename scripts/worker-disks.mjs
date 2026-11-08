// Private game output copies only: reject symlinks before cloning or building disks.
import { existsSync, lstatSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { command } from './repo-command.mjs';

function noLinks(path) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) throw new Error(`Shared output symlink: ${path}`);
  if (stat.isDirectory()) for (const name of readdirSync(path)) noLinks(join(path, name));
}

export function assertPrivateDisks(root) {
  const games = join(root, 'games');
  if (!existsSync(games)) return;
  if (lstatSync(games).isSymbolicLink()) throw new Error(`Shared games symlink: ${games}`);
  for (const id of readdirSync(games)) {
    const game = join(games, id);
    if (lstatSync(game).isSymbolicLink()) throw new Error(`Shared game symlink: ${game}`);
    const disk = join(game, 'disk');
    if (existsSync(disk) || (lstatSync(game).isDirectory() && readdirSync(game).includes('disk'))) noLinks(disk);
  }
}

export function cloneDisks(source, target) {
  assertPrivateDisks(source);
  assertPrivateDisks(target);
  const copied = [];
  for (const id of readdirSync(join(source, 'games'))) {
    if (!existsSync(join(target, 'games', id))) continue;
    for (const name of ['disk', 'walkPaths.json']) {
      const from = join(source, 'games', id, name);
      const to = join(target, 'games', id, name);
      if (!existsSync(from)) continue;
      noLinks(from);
      if (existsSync(to)) throw new Error(`Output already exists: ${to}`);
      const flags = process.platform === 'darwin' ? ['-cR'] : ['--reflink=auto', '-R'];
      const result = command(source, ['cp', ...flags, from, to]);
      if (result.code !== 0) throw new Error(`Private copy failed: ${result.stderr}`);
      copied.push(`${id}/${name}`);
    }
  }
  assertPrivateDisks(target);
  return copied;
}
