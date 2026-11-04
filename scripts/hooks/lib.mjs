// Shared helpers for the Claude Code PreToolUse hooks (Bash tool). A hook reads the call's JSON on
// stdin ({ tool_name, tool_input: { command }, cwd }) and exits 2 with a reason on stderr to block;
// exit 0 allows. Any parse problem allows: a hook must never block anything it can't read.
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MAIN_CHECKOUT = '/Users/lewismoten/dev/GameMaker';

/** Parses the hook JSON; returns { command, cwd } for a Bash call, else null. */
export function parseCall(text) {
  try {
    const j = JSON.parse(text);
    const command = j?.tool_input?.command;
    if (typeof command !== 'string' || (j.tool_name && j.tool_name !== 'Bash')) return null;
    return { command, cwd: typeof j.cwd === 'string' ? j.cwd : process.cwd() };
  } catch {
    return null;
  }
}

/** True when something accepts connections on 127.0.0.1 or ::1 at port (checked within ms). */
export function listening(port, timeoutMs = 40) {
  const probe = (host) =>
    new Promise((resolve) => {
      const s = net.connect({ port, host });
      const end = (v) => {
        s.destroy();
        resolve(v);
      };
      s.setTimeout(timeoutMs, () => end(false));
      s.on('connect', () => end(true));
      s.on('error', () => end(false));
    });
  return Promise.all([probe('127.0.0.1'), probe('::1')]).then(([a, b]) => a || b);
}

/** Walks up from dir to the folder holding .git (a directory in the main checkout, a file in a worktree). */
export function repoRoot(dir) {
  let d = path.resolve(dir);
  for (;;) {
    if (fs.existsSync(path.join(d, '.git'))) return d;
    const up = path.dirname(d);
    if (up === d) return null;
    d = up;
  }
}

/** Runs a hook: decide(call) returns a reason string to block, or null/undefined to allow. */
export async function runHook(decide) {
  let text = '';
  try {
    text = fs.readFileSync(0, 'utf8');
  } catch {
    process.exit(0);
  }
  const call = parseCall(text);
  let reason = null;
  try {
    reason = call ? await decide(call) : null;
  } catch {
    reason = null;
  }
  if (reason) {
    process.stderr.write(reason + '\n');
    process.exit(2);
  }
  process.exit(0);
}

export const isMain = (url) => !!process.argv[1] && fileURLToPath(url) === path.resolve(process.argv[1]);
