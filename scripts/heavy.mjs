// `npm run heavy -- <command...>`: runs a heavy job (build, full vitest, verify:perf, check:games,
// walkthrough recording) in one of 2 shared slots, so agents on one Mac don't all run one at once.
// Slots are lock files in ~/.cache/gamemaker-heavy/ (outside any worktree) holding the holder's
// pid; a dead holder's slot is freed. It waits while the 1-minute load average is over
// HEAVY_MAX_LOAD (default 20), runs the command, passes its exit code through, frees the slot on
// exit or signal, and appends start, wait, duration, exit code, cwd and command to log.tsv.
// Env: HEAVY_DIR (folder), HEAVY_SLOTS (2), HEAVY_MAX_LOAD (20), HEAVY_POLL_MS (2000).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

/** Tries each slot once; returns the lock file path taken, or null. Frees slots whose holder died. */
export function tryAcquire(dir, slots, pid = process.pid) {
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < slots; i++) {
    const file = path.join(dir, `slot-${i}.lock`);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        fs.writeFileSync(file, String(pid), { flag: 'wx' });
        return file;
      } catch (e) {
        if (e.code !== 'EEXIST') throw e;
        let holder = NaN;
        try {
          holder = parseInt(fs.readFileSync(file, 'utf8'), 10);
        } catch {
          continue; // vanished between the write and the read: try again
        }
        if (Number.isFinite(holder) && alive(holder)) break; // taken: next slot
        try {
          fs.unlinkSync(file); // dead (or unreadable) holder: free it, then retry
        } catch {
          /* someone else freed it */
        }
      }
    }
  }
  return null;
}

/** Runs argv in a slot. Options are for tests; defaults come from the environment. */
export async function runHeavy(argv, opts = {}) {
  const env = opts.env ?? process.env;
  const dir = opts.dir ?? env.HEAVY_DIR ?? path.join(os.homedir(), '.cache', 'gamemaker-heavy');
  const slots = Number(env.HEAVY_SLOTS ?? 2);
  const maxLoad = Number(env.HEAVY_MAX_LOAD ?? 20);
  const pollMs = Number(env.HEAVY_POLL_MS ?? 2000);
  const loadavg = opts.loadavg ?? (() => os.loadavg()[0]);
  const cwd = opts.cwd ?? process.cwd();
  if (!argv.length) {
    process.stderr.write('usage: npm run heavy -- <command...>\n');
    return 2;
  }
  const t0 = Date.now();
  let lock = null;
  let announced = false;
  for (;;) {
    const load = loadavg();
    if (load <= maxLoad) {
      lock = tryAcquire(dir, slots);
      if (lock) break;
    }
    if (!announced) {
      process.stderr.write(`heavy: waiting for a slot (load ${load.toFixed(1)}, limit ${maxLoad}, ${slots} slots)\n`);
      announced = true;
    }
    await sleep(pollMs);
  }
  const t1 = Date.now();
  const release = () => {
    try {
      fs.unlinkSync(lock);
    } catch {
      /* already gone */
    }
  };
  const code = await new Promise((resolve) => {
    const child = spawn(argv[0], argv.slice(1), { stdio: 'inherit', cwd });
    const handlers = ['SIGINT', 'SIGTERM', 'SIGHUP'].map((s) => [s, () => child.kill(s)]);
    if (!opts.noSignals) for (const [s, h] of handlers) process.on(s, h);
    const done = (c) => {
      for (const [s, h] of handlers) process.off(s, h);
      release();
      resolve(c);
    };
    child.on('error', (e) => {
      process.stderr.write(`heavy: ${e.message}\n`);
      done(127);
    });
    child.on('exit', (c, sig) => done(c ?? (sig ? 128 + (os.constants.signals[sig] ?? 0) : 1)));
  });
  const t2 = Date.now();
  try {
    const row = [new Date(t0).toISOString(), 'wait_ms=' + (t1 - t0), 'run_ms=' + (t2 - t1), 'exit=' + code, cwd, argv.join(' ')];
    fs.appendFileSync(path.join(dir, 'log.tsv'), row.join('\t') + '\n');
  } catch {
    /* logging is best effort */
  }
  return code;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(await runHeavy(process.argv.slice(2)));
}
