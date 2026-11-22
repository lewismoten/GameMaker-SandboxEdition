// Regression fixtures for the SDK verifier's installed project and command lifecycle.
import { afterEach, expect, it } from 'vitest';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { browserResult, browserSpecs, expectedDomErrors, exportedEntries, formatRows, runCommand, verifyTarballs } from '../../scripts/consumer-checks.mjs';

const scripts = resolve(import.meta.dirname, '../../scripts');
const dirs = [];
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'consumer-test-'));
  dirs.push(dir);
  return dir;
}
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

it('requires each exact packed file and rejects a nested SDK anywhere in the lock', () => {
  const dir = fixture();
  const engine = '@lewismoten/gamemaker-sandbox-engine';
  const key = 'node_modules/' + engine;
  const packed = { resolved: 'file:../engine.tgz', version: '4.0.0' };
  const run = (entries) => {
    writeFileSync(join(dir, 'package-lock.json'), JSON.stringify({ packages: entries }));
    verifyTarballs(dir, [engine], [resolve(dir, '../engine.tgz')]);
  };
  expect(() => run({ [key]: packed })).not.toThrow();
  for (const resolved of ['https://registry.example/engine.tgz', 'file:../old.tgz']) {
    expect(() => run({ [key]: { ...packed, resolved } })).toThrow(/packed tarball/);
  }
  expect(() => run({ [key]: packed, ['node_modules/archives/' + key]: { version: '3.3.3', resolved: 'https://registry.example/engine.tgz' } })).toThrow(
    /nested 3.3.3/,
  );
});

it('counts overlapping exports once and checks their effective browser conditions in exhaustive mode', () => {
  const dir = fixture();
  const name = '@lewismoten/gamemaker-sandbox-tools';
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({
      exports: {
        './kit/*': { import: './dist/*.js', browser: null },
        './kit/safe': { import: './dist/safe.js' },
      },
    }),
  );
  mkdirSync(join(dir, 'dist'));
  for (const file of ['safe', 'unsafe']) writeFileSync(join(dir, 'dist', file + '.js'), '');
  const entries = exportedEntries(dir, name);
  expect(Object.fromEntries(entries)).toEqual({ [name + '/kit/safe']: false, [name + '/kit/unsafe']: true });
  const safe = name + '/kit/safe';
  expect([...browserSpecs(name, safe, entries, false)]).toEqual([safe, name + '/drawing']);
  expect([...browserSpecs(name, safe, entries, true)]).toEqual([safe, name + '/drawing', name + '/kit/unsafe']);
});

it('requires both a working Node import and the specific browser refusal', () => {
  const error = 'No known conditions for "./drawing" specifier in "tools" package';
  const result = (message, imported = true, blocked = true, warnings = '') => browserResult('tools', 'tools/drawing', blocked, imported, message, warnings)[0];
  expect(result(error)).toBe(true);
  for (const failure of [undefined, 'Missing "./drawing" specifier', error.replace('drawing', 'broken'), error.replace('tools', 'other')])
    expect(result(failure)).toBe(false);
  expect(result(error, false)).toBe(false);
  expect(result(error, true, false)).toBe(false);
  expect(result(undefined, true, false)).toBe(true);
  expect(result(undefined, true, false, 'module externalized for browser compatibility')).toBe(false);
});

it('aligns the status column after the longest check', () => {
  const [short, long] = formatRows([
    ['engine', 'install', 'pass', 'local'],
    ['tools', 'drawing browser', 'FAIL', 'broken'],
  ]).split('\n');
  expect(long).toContain('drawing browser  FAIL');
  expect(short.indexOf('pass')).toBe(long.indexOf('FAIL'));
});

it('accepts only known DOM declarations for packages that expose them', () => {
  const diagnostic = "../node_modules/@lewismoten/gamemaker-sandbox-engine/dist/types/audio/engine.d.ts(43,20): error TS2304: Cannot find name 'AudioContext'.";
  for (const pkg of ['engine', 'tools']) expect(expectedDomErrors(pkg, diagnostic)).toBe(true);
  expect(expectedDomErrors('archives', diagnostic)).toBe(false);
  expect(expectedDomErrors('tools', diagnostic + '\n' + diagnostic.replace('AudioContext', 'Document'))).toBe(false);
  expect(expectedDomErrors('engine', diagnostic.replace('audio/engine', 'other'))).toBe(false);
});

it('stops before packing when the declaration preflight detects missing output', () => {
  const root = fixture();
  mkdirSync(join(root, 'scripts'));
  for (const file of ['verify-consumer.mjs', 'consumer-checks.mjs', 'decl-preflight.mjs']) copyFileSync(join(scripts, file), join(root, 'scripts', file));
  const result = spawnSync(process.execPath, [join(root, 'scripts/verify-consumer.mjs')], { encoding: 'utf8' });
  expect(result.status).toBe(1);
  expect(result.stdout).toContain('dist/types is missing');
  expect(result.stdout).toContain('npm run build:packages');
});

it('terminates a stalled command at its deadline', async () => {
  await expect(runCommand(fixture(), process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeout: 100 })).rejects.toMatchObject({ killed: true });
});

it('removes the scratch project when interrupted during installation', async () => {
  const dir = fixture();
  writeFileSync(join(dir, 'npm'), '#!/bin/sh\ntouch "$TMPDIR/started"\nexec sleep 60\n', { mode: 0o755 });
  const child = spawn(process.execPath, [join(scripts, 'verify-consumer.mjs'), '--source', 'registry'], {
    env: { ...process.env, TMPDIR: dir, PATH: dir + ':' + process.env.PATH },
  });
  const exit = once(child, 'exit');
  try {
    for (let i = 0; i < 100 && !readdirSync(dir).includes('started'); i++) await delay(20);
    expect(readdirSync(dir)).toContain('started');
    child.kill('SIGINT');
    expect(await exit).toEqual([130, null]);
    expect(readdirSync(dir).filter((name) => name.startsWith('gamemaker-consumer-'))).toEqual([]);
  } finally {
    child.kill('SIGKILL');
  }
});
