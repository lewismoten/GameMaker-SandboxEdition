// PreToolUse hook: blocks `git merge`, `git pull` and `git rebase` run in Lewis's main checkout
// (not a worktree) while something listens on port 5173, because they change files under his dev
// server and reload his open page. Worktrees and a stopped server are fine.
import { MAIN_CHECKOUT, isMain, listening, runHook } from './lib.mjs';

const GIT = /(^|[;&|(\s])git\s+(?:-[A-Za-z]\s+\S+\s+|--\S+\s+)*(merge|pull|rebase)\b/;

export async function decide({ command, cwd }, probe = listening) {
  if (cwd.replace(/\/+$/, '') !== MAIN_CHECKOUT) return null;
  const m = GIT.exec(command);
  if (!m) return null;
  if (!(await probe(5173))) return null;
  return `Blocked: git ${m[2]} in the main checkout (${MAIN_CHECKOUT}) while Lewis's dev server listens on 5173 would reload his page. Work in your own worktree and branch instead.`;
}

if (isMain(import.meta.url)) await runHook((c) => decide(c));
