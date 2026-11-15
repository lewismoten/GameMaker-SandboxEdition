// Where the maintainer's private notes live, without a hard-coded home folder: GM_MAIN_CHECKOUT, else the
// folder holding the .git directory this repository (or worktree) belongs to, else the repository itself.
// `forLewis` is GM_FOR_LEWIS, else `<main checkout>/.for-lewis` (git-ignored; may not exist on a fresh clone).
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function find(): string {
  if (process.env.GM_MAIN_CHECKOUT) return resolve(process.env.GM_MAIN_CHECKOUT);
  const dot = join(repo, '.git');
  try {
    if (statSync(dot).isDirectory()) return repo;
    const m = /^gitdir:\s*(.+)$/m.exec(readFileSync(dot, 'utf8'));
    if (m) return resolve(repo, m[1].trim(), '..', '..', '..');
  } catch {
    /* no .git: use the repository */
  }
  return repo;
}

export const mainCheckout = find();
export const forLewis = process.env.GM_FOR_LEWIS ? resolve(process.env.GM_FOR_LEWIS) : join(mainCheckout, '.for-lewis');
export const hasForLewis = existsSync(forLewis);
