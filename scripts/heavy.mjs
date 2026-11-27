// `npm run heavy -- <command...>`: runs a heavy job (build, full vitest, verify:perf, check:games,
// walkthrough recording) in one of 2 shared slots, so agents on one Mac don't all run one at once.
// Slots are owner-marked directories in ~/.cache/gamemaker-heavy/ (outside any worktree) identifying the holder's
// pid; a dead holder's slot is freed. It waits while the 1-minute load average is over
// HEAVY_MAX_LOAD (default 20), runs the command, passes its exit code through, frees the slot on
// exit or signal, and appends start, wait, duration, exit code, cwd and command to log.tsv.
// Env: HEAVY_DIR (folder), HEAVY_SLOTS (2), HEAVY_MAX_LOAD (20), HEAVY_POLL_MS (2000).
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
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

// Each published directory already contains its unique owner marker. Only that marker
// may be unlinked. rmdir cannot remove a replacement with a new marker inside it.
function clearOwner(slot, marker) {
  try {
    fs.unlinkSync(path.join(slot, marker));
    fs.rmdirSync(slot);
  } catch (e) {
    if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(e.code)) throw e;
  }
}

function recover(slot) {
  try {
    const [marker] = fs.readdirSync(slot);
    if (!marker) fs.rmdirSync(slot);
    else if (/^\d+-/.test(marker) && !alive(Number(marker.split('-')[0]))) clearOwner(slot, marker);
  } catch (e) {
    if (e.code === 'ENOTDIR') {
      // A previous runner may still be publishing a legacy PID file.
      try {
        const pid = Number(fs.readFileSync(slot, 'utf8'));
        if (pid > 0 && !alive(pid)) fs.unlinkSync(slot);
      } catch (legacyError) {
        if (!['ENOENT', 'EISDIR', 'EPERM'].includes(legacyError.code)) throw legacyError;
      }
    } else if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(e.code)) throw e;
  }
}

/** Atomically publishes a nonempty slot directory and returns its owner's release function. */
export function tryAcquire(dir, slots) {
  fs.mkdirSync(dir, { recursive: true });
  const marker = process.pid + '-' + randomUUID();
  const staging = fs.mkdtempSync(path.join(dir, '.claim-'));
  try {
    fs.writeFileSync(path.join(staging, marker), '');
    for (let i = 0; i < slots; i++) {
      const slot = path.join(dir, `slot-${i}.lock`);
      recover(slot);
      try {
        fs.renameSync(staging, slot);
        return () => clearOwner(slot, marker);
      } catch (e) {
        if (!['ENOTEMPTY', 'EEXIST', 'ENOTDIR', 'EPERM'].includes(e.code)) throw e;
      }
    }
    return null;
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
  }
}

/** Runs argv in a slot. Options are for tests; defaults come from the environment. */
export async function runHeavy(argv, opts = {}) {
  const env = opts.env ?? process.env;
  const dir = opts.dir ?? env.HEAVY_DIR ?? path.join(os.homedir(), '.cache', 'gamemaker-heavy');
  const slots = Number(env.HEAVY_SLOTS ?? 2);
  if (!Number.isSafeInteger(slots) || slots < 1) {
    process.stderr.write('heavy: HEAVY_SLOTS must be a positive integer\n');
    return 2;
  }
  const maxLoad = Number(env.HEAVY_MAX_LOAD ?? 20);
  const pollMs = Number(env.HEAVY_POLL_MS ?? 2000);
  const loadavg = opts.loadavg ?? (() => os.loadavg()[0]);
  const cwd = opts.cwd ?? process.cwd();
  if (!argv.length) {
    process.stderr.write('usage: npm run heavy -- <command...>\n');
    return 2;
  }
  const t0 = Date.now();
  let release = null;
  let announced = false;
  for (;;) {
    const load = loadavg();
    if (load <= maxLoad) {
      release = tryAcquire(dir, slots);
      if (release) break;
    }
    if (!announced) {
      process.stderr.write(`heavy: waiting for a slot (load ${load.toFixed(1)}, limit ${maxLoad}, ${slots} slots)\n`);
      announced = true;
    }
    await sleep(pollMs);
  }
  const t1 = Date.now();
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
