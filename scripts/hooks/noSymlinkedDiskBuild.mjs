// PreToolUse hook: blocks a game build (`build-games`, `build:games`, any `--force` build) while a
// games/*/disk under the cwd's repo root is a symlink. Those disks point into Lewis's checkout, so
// a build through them would overwrite his files.
import fs from 'node:fs';
import path from 'node:path';
import { isMain, repoRoot, runHook } from './lib.mjs';

const BUILD = /build-games|build:games|build[^;&|]*--force\b|--force\b[^;&|]*build/;

/** The ids of games under root whose disk is a symlink. */
export function symlinkedDisks(root) {
  const games = path.join(root, 'games');
  const out = [];
  let ids = [];
  try {
    ids = fs.readdirSync(games);
  } catch {
    return out;
  }
  for (const id of ids) {
    try {
      if (fs.lstatSync(path.join(games, id, 'disk')).isSymbolicLink()) out.push(id);
    } catch {
      /* no disk folder */
    }
  }
  return out;
}

export function decide({ command, cwd }) {
  if (!BUILD.test(command)) return null;
  const root = repoRoot(cwd);
  if (!root) return null;
  const bad = symlinkedDisks(root);
  if (!bad.length) return null;
  return `Blocked: ${bad.length} games/*/disk under ${root} are symlinks into Lewis's checkout (${bad.slice(0, 3).join(', ')}${bad.length > 3 ? ', ...' : ''}), so a build would write there. Replace the disk of the one game you changed with a real folder and build only that game with vite-node; never run build-games while any disk is symlinked.`;
}

if (isMain(import.meta.url)) await runHook(decide);
