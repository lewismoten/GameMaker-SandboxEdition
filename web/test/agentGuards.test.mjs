// Tests for scripts/heavy.mjs and the scripts/hooks/*.mjs PreToolUse hooks: fake commands, a
// stubbed load, sample hook JSON, and a timing check that each hook script finishes fast.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runHeavy, tryAcquire } from '../../scripts/heavy.mjs';
import { parseCall, MAIN_CHECKOUT } from '../../scripts/hooks/lib.mjs';
import { decide as mainMerge } from '../../scripts/hooks/noMainCheckoutMerge.mjs';
import { decide as diskBuild } from '../../scripts/hooks/noSymlinkedDiskBuild.mjs';
import { decide as trailer } from '../../scripts/hooks/commitTrailer.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'heavy-test-'));
const env = { HEAVY_SLOTS: '2', HEAVY_MAX_LOAD: '20', HEAVY_POLL_MS: '5' };
const hooksDir = path.resolve(__dirname, '../../scripts/hooks');

describe('heavy', () => {
  it('passes the exit code through, frees the slot and logs the run', async () => {
    const dir = tmp();
    const code = await runHeavy(['node', '-e', 'process.exit(7)'], { dir, env, loadavg: () => 1, noSignals: true });
    expect(code).toBe(7);
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.lock'))).toEqual([]);
    const log = fs.readFileSync(path.join(dir, 'log.tsv'), 'utf8');
    expect(log).toMatch(/wait_ms=\d+\trun_ms=\d+\texit=7\t.*\tnode -e process.exit\(7\)\n$/);
  });

  it('frees a dead holder slot and respects a live one', () => {
    const dir = tmp();
    fs.writeFileSync(path.join(dir, 'slot-0.lock'), '999999999'); // not a live pid
    fs.writeFileSync(path.join(dir, 'slot-1.lock'), String(process.pid)); // live
    expect(tryAcquire(dir, 2)).toBe(path.join(dir, 'slot-0.lock'));
    expect(tryAcquire(dir, 2)).toBeNull(); // both held by live pids now
  });

  it('waits while the load is over the limit', async () => {
    const dir = tmp();
    let calls = 0;
    const loadavg = () => (++calls < 4 ? 50 : 1);
    const code = await runHeavy(['node', '-e', '0'], { dir, env, loadavg, noSignals: true });
    expect(code).toBe(0);
    expect(calls).toBeGreaterThanOrEqual(4);
  });

  it('waits for a slot when both are held', async () => {
    const dir = tmp();
    fs.writeFileSync(path.join(dir, 'slot-0.lock'), String(process.pid));
    fs.writeFileSync(path.join(dir, 'slot-1.lock'), String(process.pid));
    setTimeout(() => fs.unlinkSync(path.join(dir, 'slot-1.lock')), 40);
    expect(await runHeavy(['node', '-e', '0'], { dir, env, loadavg: () => 1, noSignals: true })).toBe(0);
  });

  it('reports a missing command as 127', async () => {
    const code = await runHeavy(['no-such-command-xyz'], { dir: tmp(), env, loadavg: () => 1, noSignals: true });
    expect(code).toBe(127);
  });
});

describe('hooks', () => {
  it('parseCall reads Bash calls and ignores anything else or bad JSON', () => {
    expect(parseCall('{"tool_name":"Bash","tool_input":{"command":"ls"},"cwd":"/x"}')).toEqual({ command: 'ls', cwd: '/x' });
    expect(parseCall('{"tool_name":"Edit","tool_input":{"command":"ls"}}')).toBeNull();
    expect(parseCall('not json')).toBeNull();
    expect(parseCall('')).toBeNull();
  });

  it('noMainCheckoutMerge blocks only in the main checkout with 5173 up', async () => {
    const up = async () => true;
    const down = async () => false;
    const call = (command, cwd = MAIN_CHECKOUT) => ({ command, cwd });
    expect(await mainMerge(call('git merge feature/x'), up)).toMatch(/Blocked/);
    expect(await mainMerge(call('git pull --ff-only'), up)).toMatch(/Blocked/);
    expect(await mainMerge(call('cd a && git rebase develop'), up)).toMatch(/Blocked/);
    expect(await mainMerge(call('git merge feature/x'), down)).toBeNull();
    expect(await mainMerge(call('git status'), up)).toBeNull();
    expect(await mainMerge(call('git merge x', MAIN_CHECKOUT + '/.claude/worktrees/a'), up)).toBeNull();
    expect(await mainMerge(call('echo git-merge-base'), up)).toBeNull();
  });

  it('noSymlinkedDiskBuild blocks builds while a disk is a symlink', () => {
    const root = tmp();
    fs.mkdirSync(path.join(root, '.git'));
    fs.mkdirSync(path.join(root, 'games/a'), { recursive: true });
    fs.mkdirSync(path.join(root, 'games/b/disk'), { recursive: true });
    const target = tmp();
    const call = (command) => ({ command, cwd: path.join(root, 'games') });
    expect(diskBuild(call('npm run build:games -- --force'))).toBeNull(); // real folders only
    fs.symlinkSync(target, path.join(root, 'games/a/disk'));
    expect(diskBuild(call('npm run build:games -- --force'))).toMatch(/Blocked.*a/);
    expect(diskBuild(call('node scripts/build-games.mjs'))).toMatch(/Blocked/);
    expect(diskBuild(call('npx vite-node ../games/b/build.ts'))).toBeNull();
    expect(diskBuild(call('ls'))).toBeNull();
    expect(diskBuild({ command: 'npm run build:games', cwd: '/' })).toBeNull(); // no repo
  });

  it('commitTrailer requires the Claude trailer on git commit -m', () => {
    const c = (command) => ({ command, cwd: '/x' });
    expect(trailer(c('git commit -m "fix it"'))).toMatch(/Blocked/);
    expect(trailer(c('git commit -- a.ts -m "fix"'))).toMatch(/Blocked/);
    expect(trailer(c('git commit -m "fix\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"'))).toBeNull();
    expect(trailer(c('git commit -m "$(cat <<\'EOF\'\nfix\n\nCo-Authored-By: Claude Sonnet 5.5 <n>\nEOF\n)"'))).toBeNull();
    expect(trailer(c('git commit --amend --no-edit'))).toBeNull();
    expect(trailer(c('git commit -F msg.txt'))).toBeNull();
    expect(trailer(c('git log --grep commit -m'))).toBeNull();
  });

  const run = (script, json) => {
    const t = Date.now();
    const r = spawnSync('node', [path.join(hooksDir, script)], { input: json, encoding: 'utf8' });
    return { status: r.status, stderr: r.stderr, ms: Date.now() - t };
  };

  it('each script exits 2 with a reason to block, 0 otherwise and on bad input, and is quick', () => {
    const bad = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git commit -m "x"' }, cwd: '/x' });
    const blocked = run('commitTrailer.mjs', bad);
    expect(blocked.status).toBe(2);
    expect(blocked.stderr).toMatch(/Co-Authored-By/);
    for (const s of ['commitTrailer.mjs', 'noMainCheckoutMerge.mjs', 'noSymlinkedDiskBuild.mjs']) {
      for (const input of ['garbage', '', '{}', JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls' }, cwd: '/x' })]) {
        expect(run(s, input).status).toBe(0);
      }
    }
    // Node startup is most of the time; the budget is the hook's own work, with slack for a busy Mac.
    expect(run('noMainCheckoutMerge.mjs', JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls' }, cwd: '/x' })).ms).toBeLessThan(400);
  });
});
