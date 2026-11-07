// Real build-games orchestration with tiny payloads: readiness-gated, test-owned OS children.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 20_000 });

const runner = fs.readFileSync(new URL('../../scripts/build-games.mjs', import.meta.url));
const payload = `
import fs from 'node:fs';
import path from 'node:path';
const root = process.env.FIXTURE_ROOT;
let name = path.basename(process.argv[1], '.mjs');
if (name === 'vite-node') {
  const file = process.argv[4];
  name = file.includes('game-build-entry') ? process.argv[5] : file.includes('stageBox') ? 'laser-stage-box' : file.includes('trinkets.ts') ? file.split('/')[2] + '-trinkets' : 'fallback';
}
const log = event => fs.appendFileSync(path.join(root, 'events'), JSON.stringify({event, name, pid: process.pid, ppid: process.ppid, args: process.argv.slice(2)}) + '\\n');
log('ready');
const deadline = setTimeout(() => { log('deadline'); process.exit(99); }, 8000);
const timer = setInterval(() => {
  const file = path.join(root, 'action-' + process.pid);
  const action = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (action === 'fail') { log('failed'); process.exit(7); }
  if (action !== 'release') return;
  if (fs.existsSync(path.join(root, 'games', name))) {
    fs.mkdirSync(path.join(root, 'games', name, 'disk'), {recursive: true});
    fs.writeFileSync(path.join(root, 'games', name, 'disk/TEST.GAM'), 'stable fixture bytes');
  }
  log('done'); clearTimeout(deadline); clearInterval(timer);
}, 5);
`;

async function waitFor(check, message) {
  const until = Date.now() + 5000;
  while (Date.now() < until) {
    const result = check();
    if (result) return result;
    await delay(5);
  }
  throw new Error(`Fixture deadline: ${message}`);
}

async function fixture({ extra, vite = false, secret = false, args = ['--force'], skip = false, cached = false } = {}, exercise) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'build-games-test-'));
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  };
  write('scripts/build-games.mjs', runner);
  write('scripts/child-signal-retry.mjs', fs.readFileSync(new URL('../../scripts/child-signal-retry.mjs', import.meta.url)));
  write('scripts/game-build-inputs.mjs', `export const root = ${JSON.stringify(root)}; export const gameSourceHash = () => 'fixture';`);
  write(
    'scripts/game-import-keys.mjs',
    `export const logoUsers = new Set(); export const gameKeys = async ids => Object.fromEntries(ids.map(id => [id, 'key']));`,
  );
  write(
    'scripts/game-bundle.mjs',
    `import fs from 'node:fs'; import {root} from './game-build-inputs.mjs'; export async function bundleEntry(name) { const out = root + '/scripts/' + name + '.mjs'; fs.copyFileSync(root + '/child.mjs', out); return out; }`,
  );
  write('child.mjs', payload);
  write('node_modules/vite-node/vite-node.mjs', payload);
  fs.mkdirSync(path.join(root, 'web'));
  const ids = ['alpha', 'beta', 'gamma', ...(extra === 'field' ? ['year2000'] : extra === 'stage' ? ['sleuth'] : [])];
  for (const id of ids) {
    write(`games/${id}/build.ts`, '// fixture');
    write(`games/${id}/about.json`, JSON.stringify({ secret: secret && id === 'alpha' }));
  }
  // A nested, fully populated diagnostic is not a catalog game or an automatic build target.
  write('games/kit/testdisks/sound-stress/build.ts', 'throw new Error("nested diagnostic must not run");');
  write('games/kit/testdisks/sound-stress/about.json', JSON.stringify({ title: 'Sound stress TEST' }));
  write('games/kit/testdisks/sound-stress/disk/SOUNDTST.GAM', 'nested fixture bytes');
  if (cached) {
    for (const id of ids) write(`games/${id}/disk/TEST.GAM`, 'stable fixture bytes');
    const hash = createHash('sha256').update('TEST.GAM\0stable fixture bytes\0').digest('hex');
    write(
      'games/.build-cache.json',
      JSON.stringify({ keys: Object.fromEntries(ids.map((id) => [id, 'key'])), outputs: Object.fromEntries(ids.map((id) => [id, hash])) }),
    );
  }
  let stdout = '',
    stderr = '';
  const proc = spawn(process.execPath, [path.join(root, 'scripts/build-games.mjs'), ...args], {
    env: {
      ...process.env,
      FIXTURE_ROOT: root,
      GM_BUILD_PROGRESS: '1',
      GM_BUILD_JOBS: '2',
      GM_VITE_NODE: vite ? '1' : '0',
      GM_SKIP_GAME_BUILD: skip ? '1' : '0',
      GM_SKIP_FIELD_TRINKETS: extra === 'field' ? '' : '1',
      GM_SKIP_PIXEL_TRINKETS: '1',
      GM_SKIP_LASER_NICKELS: extra === 'stage' ? '' : '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  proc.stdout.on('data', (data) => {
    stdout += data;
  });
  proc.stderr.on('data', (data) => {
    stderr += data;
  });
  const closed = once(proc, 'close');
  const events = () =>
    fs.existsSync(path.join(root, 'events'))
      ? fs
          .readFileSync(path.join(root, 'events'), 'utf8')
          .trim()
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line))
      : [];
  const ready = (name) => events().filter((e) => e.event === 'ready' && (!name || e.name === name));
  const act = (child, action) => {
    expect(child.ppid).toBe(proc.pid);
    write(`action-${child.pid}`, action);
  };
  const killed = new Set();
  const kill = (child) => {
    expect(child.ppid).toBe(proc.pid);
    // An actual external OS signal, only to a ready child of this fixture's runner.
    process.kill(child.pid, 'SIGTERM');
    killed.add(child.pid);
    fs.appendFileSync(path.join(root, 'events'), JSON.stringify({ ...child, event: 'killed' }) + '\n');
  };
  const release = () => {
    for (const child of ready()) if (!killed.has(child.pid)) act(child, 'release');
  };
  const finish = async () => {
    await waitFor(() => proc.exitCode !== null || proc.signalCode !== null, 'parent exit');
    await closed;
    const history = events();
    for (const child of ready()) expect(history.filter((e) => e.pid === child.pid && ['done', 'failed', 'killed'].includes(e.event))).toHaveLength(1);
    return {
      code: proc.exitCode,
      stdout,
      stderr,
      events: events(),
      cache: fs.existsSync(path.join(root, 'games/.build-cache.json')) ? JSON.parse(fs.readFileSync(path.join(root, 'games/.build-cache.json'))) : undefined,
    };
  };
  try {
    return await exercise({
      proc,
      ready,
      act,
      kill,
      release,
      finish,
      events,
      ids,
      wait: (check, label) =>
        waitFor(() => {
          const result = check();
          if (!result && (proc.exitCode !== null || proc.signalCode !== null)) throw new Error(`Parent exited before ${label}: ${stderr}`);
          return result;
        }, label),
      logs: () => stdout + stderr,
    });
  } finally {
    // Gracefully release only fixture children, including on assertion failure. No global pkill.
    release();
    if (proc.exitCode === null && proc.signalCode === null) {
      try {
        await finish();
      } catch {
        proc.kill('SIGKILL');
        await closed;
      }
    }
    for (const child of ready()) {
      await waitFor(() => {
        try {
          process.kill(child.pid, 0);
          return false;
        } catch (error) {
          if (error.code === 'ESRCH') return true;
          throw error;
        }
      }, `child ${child.name} reaped`);
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
}

async function drain(f) {
  // Release each newly queued child as it becomes ready, until the runner has exited.
  await f.wait(() => {
    f.release();
    return f.proc.exitCode !== null;
  }, 'drain work');
  return f.finish();
}
function success(result, ids) {
  expect(result.code).toBe(0);
  expect(result.stdout).toContain('Game build outputs are ready.');
  expect(result.stderr).toContain('Building beta;');
  expect(result.stderr).toContain('Game build outputs are ready.');
  expect(Object.keys(result.cache.keys).sort()).toEqual([...ids].sort());
  expect(Object.values(result.cache.keys)).toEqual(ids.map(() => 'key'));
  expect(Object.values(result.cache.outputs).every(Boolean)).toBe(true);
  expect(result.events.some((e) => e.event === 'deadline')).toBe(false);
  const active = new Set();
  for (const event of result.events) {
    if (!ids.includes(event.name)) continue;
    if (event.event === 'ready') active.add(event.pid);
    else active.delete(event.pid);
    expect(active.size).toBeLessThanOrEqual(2);
  }
  expect(active.size).toBe(0);
  expect(
    result.events
      .filter((e) => e.event === 'done' && ids.includes(e.name))
      .map((e) => e.name)
      .sort(),
  ).toEqual([...ids].sort());
}

it('completes normal bounded concurrent and queued work', async () => {
  await fixture({}, async (f) => {
    await f.wait(() => f.ready('alpha').length && f.ready('beta').length, 'two concurrent children');
    expect(f.ready('gamma')).toHaveLength(0);
    const result = await drain(f);
    success(result, f.ids);
    expect(result.events.filter((e) => e.event === 'ready')).toHaveLength(3);
    expect(result.stderr).not.toContain('retry');
  });
});

it.each(['game', 'field', 'stage'])('recovers once from a real SIGTERM in %s work', async (kind) => {
  await fixture({ extra: kind }, async (f) => {
    const target = kind === 'field' ? 'year2000-trinkets' : kind === 'stage' ? 'laser-stage-box' : 'alpha';
    if (kind === 'stage') {
      await f.wait(() => {
        for (const c of f.ready()) if (c.name !== target) f.act(c, 'release');
        return f.ready(target)[0];
      }, 'stage ready');
    } else {
      await f.wait(() => f.ready(target).length && f.ready('alpha').length && f.ready('beta').length, 'concurrent readiness');
      expect(f.ready('gamma')).toHaveLength(0);
    }
    f.kill(f.ready(target)[0]);
    await f.wait(() => f.ready(target).length === 2, 'retry readiness');
    const result = await drain(f);
    success(result, f.ids);
    expect(result.events.filter((e) => e.event === 'ready' && e.name === target)).toHaveLength(2);
    expect(result.stderr).toMatch(/Retrying .*signal SIGTERM.*attempt 2\/2/);
    expect(result.stderr.match(/Retrying /g)).toHaveLength(1);
    expect(result.stderr).toContain('killed false');
    expect(result.stdout).not.toContain('Ran under vite-node');
  });
});

it.each(['game', 'field', 'stage'])('fails after a second SIGTERM in %s work and joins active children', async (kind) => {
  await fixture({ extra: kind }, async (f) => {
    const target = kind === 'field' ? 'year2000-trinkets' : kind === 'stage' ? 'laser-stage-box' : 'alpha';
    if (kind === 'stage') {
      await f.wait(() => {
        for (const c of f.ready()) if (c.name !== target) f.act(c, 'release');
        return f.ready(target)[0];
      }, 'stage ready');
    } else await f.wait(() => f.ready(target).length && f.ready('alpha').length && f.ready('beta').length, 'concurrent readiness');
    f.kill(f.ready(target)[0]);
    await f.wait(() => f.ready(target).length === 2, 'retry ready');
    f.kill(f.ready(target)[1]);
    if (kind !== 'stage') {
      await f.wait(() => f.logs().includes('draining active work'), 'failure observed');
      expect(f.proc.exitCode).toBeNull(); // Parent must join held siblings, not orphan them.
    }
    const result = await drain(f);
    expect(result.code).not.toBe(0);
    expect(result.stdout).not.toContain('Game build outputs are ready.');
    expect(f.ready(target)).toHaveLength(2);
    expect(result.stderr).toContain('SIGTERM');
    expect(result.stderr.match(/Retrying /g)).toHaveLength(1);
    if (kind !== 'stage') expect(f.ready('gamma')).toHaveLength(0);
    if (kind === 'game') expect(result.cache?.keys.alpha).toBeUndefined();
    const completed = kind === 'game' ? ['beta'] : kind === 'field' ? ['alpha', 'beta'] : f.ids;
    expect(
      result.events
        .filter((e) => e.event === 'done' && f.ids.includes(e.name))
        .map((e) => e.name)
        .sort(),
    ).toEqual([...completed].sort());
    expect(Object.keys(result.cache.keys).sort()).toEqual([...completed].sort());
    expect(Object.keys(result.cache.outputs).sort()).toEqual([...completed].sort());
    expect(result.events.filter((e) => e.event === 'done').every((e) => e.ppid === f.proc.pid)).toBe(true);
  });
});

it('keeps numeric failure and bundle fallback distinct from signal retry', async () => {
  await fixture({}, async (f) => {
    await f.wait(() => f.ready('alpha').length && f.ready('beta').length, 'concurrent readiness');
    f.act(f.ready('alpha')[0], 'fail');
    await f.wait(() => f.ready('alpha').length === 2, 'vite fallback ready');
    f.act(f.ready('alpha')[1], 'fail');
    await f.wait(() => f.logs().includes('draining active work'), 'failure observed');
    const result = await drain(f);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('code 7');
    expect(result.stderr).not.toContain('Retrying');
    expect(result.stdout).not.toContain('Game build outputs are ready.');
    expect(f.ready('alpha')).toHaveLength(2);
    expect(f.ready('gamma')).toHaveLength(0);
    expect(result.cache?.keys.alpha).toBeUndefined();
  });
});

it('retries in vite-node mode without revealing a secret game label', async () => {
  await fixture({ vite: true, secret: true }, async (f) => {
    await f.wait(() => f.ready('alpha').length && f.ready('beta').length, 'concurrent readiness');
    f.kill(f.ready('alpha')[0]);
    await f.wait(() => f.ready('alpha').length === 2, 'retry ready');
    const result = await drain(f);
    success(result, f.ids);
    expect(result.stderr).toContain('Retrying a game');
    expect(result.stderr + result.stdout).not.toContain('alpha');
    expect(result.stdout).toMatch(/Building beta; \d+ public games still queued/);
    expect(result.stdout).toContain('Built beta');
    expect(result.stdout).toContain('Game build outputs are ready.');
    expect(result.stderr).toContain('Building beta;');
    expect(result.stderr).toContain('Game build outputs are ready.');
  });
});

it('reuses unchanged disk caches without child launches', async () => {
  await fixture({ cached: true, args: [] }, async (f) => {
    const result = await f.finish();
    expect(result.code).toBe(0);
    expect(result.events).toEqual([]);
    expect(Object.keys(result.cache.keys).sort()).toEqual(f.ids);
  });
});

it.each(['--force', '--force-all'])('rebuilds cached disks with %s and preserves extra force semantics', async (flag) => {
  await fixture({ cached: true, extra: 'field', args: [flag] }, async (f) => {
    const result = await drain(f);
    success(result, f.ids);
    const trinket = f.ready('year2000-trinkets')[0];
    expect(trinket.args).toContain('2');
    expect(trinket.args.includes('--force')).toBe(flag === '--force-all');
  });
});

it('limits selected work without marking unbuilt games fresh', async () => {
  await fixture({ args: ['--game', 'beta'] }, async (f) => {
    const result = await drain(f);
    expect(result.code).toBe(0);
    expect(f.ready().map((e) => e.name)).toEqual(['beta']);
    expect(result.cache.keys).toEqual({ beta: 'key' });
    expect(result.cache.outputs.beta).toBeTruthy();
  });
});

it('retains a successful vite-node fallback for numeric bundle failure', async () => {
  await fixture({}, async (f) => {
    await f.wait(() => f.ready('alpha').length && f.ready('beta').length, 'concurrent readiness');
    f.act(f.ready('alpha')[0], 'fail');
    await f.wait(() => f.ready('alpha').length === 2, 'fallback readiness');
    const result = await drain(f);
    success(result, f.ids);
    expect(result.stdout).toContain('Ran under vite-node (bundle failed): alpha');
    expect(result.stderr).not.toContain('Retrying');
  });
});

it('honors the global skip without launching children', async () => {
  await fixture({ skip: true }, async (f) => {
    const result = await f.finish();
    expect(result.code).toBe(0);
    expect(result.events).toEqual([]);
    expect(result.cache).toBeUndefined();
  });
});

it('announces the active public game and queue before any child finishes', async () => {
  await fixture({}, async (f) => {
    await f.wait(() => f.ready('alpha').length && f.ready('beta').length, 'concurrent readiness');
    expect(f.events().filter((e) => e.event === 'done')).toEqual([]);
    expect(f.logs()).toContain('Building alpha; 2 public games still queued.');
    expect(f.logs()).toContain('Building beta; 1 public games still queued.');
    success(await drain(f), f.ids);
  });
});
