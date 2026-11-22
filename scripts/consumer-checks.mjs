// Checks shared by the outside-project verifier and its regression fixtures.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
const exec = promisify(execFile);
export function runCommand(cwd, cmd, args, { signal, timeout = 300_000 } = {}) {
  return exec(cmd, args, { cwd, encoding: 'utf8', timeout, signal, killSignal: 'SIGKILL' });
}

// Every subpath an installed package exports; a "*" pattern expands from the files it maps to.
export function exportedEntries(dir, name) {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const out = new Map();
  for (const [key, cond] of Object.entries(pkg.exports).sort(([a], [b]) => b.indexOf('*') - a.indexOf('*') || b.length - a.length)) {
    if (!key.includes('*')) {
      out.set(key === '.' ? name : name + key.slice(1), cond.browser === null);
      continue;
    }
    const target = cond.import ?? cond.default;
    const [pre, post] = target.split('*');
    const folder = join(dir, dirname(pre));
    if (!existsSync(folder)) continue;
    const walk = (d, rel) =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(d, e.name), `${rel}${e.name}/`) : e.name.endsWith(post) ? [rel + e.name.slice(0, -post.length)] : [],
      );
    const base = pre.slice(dirname(pre).length + 1);
    for (const stem of walk(folder, '').filter((s) => s.startsWith(base))) {
      const spec = name + key.slice(1).replace('*', stem.slice(base.length));
      if (!out.has(spec)) out.set(spec, cond.browser === null);
    }
  }
  return out;
}

export function verifyTarballs(project, packages, tarballs) {
  const { packages: entries } = JSON.parse(readFileSync(join(project, 'package-lock.json'), 'utf8'));
  for (const [i, name] of packages.entries()) {
    const key = 'node_modules/' + name;
    const entry = entries[key];
    if (!entry?.resolved?.startsWith('file:') || resolve(project, entry.resolved.slice(5)) !== tarballs[i])
      throw new Error(name + ' did not resolve to the packed tarball');
    for (const [path, nested] of Object.entries(entries)) {
      if (path.endsWith('/' + key)) throw new Error(path + ' resolved to nested ' + nested.version + ' from ' + nested.resolved);
    }
  }
}

// Baseline for the Node-only compiler pass, keyed by the installed declaration.
const domTypes = {
  'audio/context': ['AudioContext'],
  'audio/engine': ['AudioContext', 'AudioNode'],
  'audio/output': ['BaseAudioContext', 'AudioNode'],
  'engine/machine': ['HTMLCanvasElement'],
  'gfx/screen': ['HTMLCanvasElement'],
};
export function expectedDomErrors(pkg, output) {
  if (!['engine', 'tools'].includes(pkg)) return false;
  return output
    .trim()
    .split(/\r?\n/)
    .every((line) => {
      const match = line
        .replaceAll('\\', '/')
        .match(/(?:^|\/)node_modules\/@lewismoten\/gamemaker-sandbox-engine\/dist\/types\/(.+)\.d\.ts\(\d+,\d+\): error TS2304: Cannot find name '([^']+)'\.$/);
      return match && domTypes[match[1]]?.includes(match[2]);
    });
}

export function browserSpecs(name, example, exports, allBrowser) {
  const specs = new Set([example]);
  if (name === '@lewismoten/gamemaker-sandbox-tools') specs.add(name + '/drawing');
  if (allBrowser) for (const spec of exports.keys()) specs.add(spec);
  return specs;
}

export function browserResult(name, spec, blocked, imported, error, warnings = '') {
  if (!imported) return [false, spec + ' failed or was missing in Node'];
  if (blocked && error?.includes(`No known conditions for "${'.' + spec.slice(name.length)}" specifier in "${name}" package`))
    return [true, 'rejected as documented'];
  if (error) return [false, error.trim().split('\n').slice(0, 4).join(' ')];
  if (blocked) return [false, 'a browser build accepted a Node-only entry'];
  if (warnings.includes('externalized for browser compatibility')) return [false, warnings.trim()];
  return [true, 'built'];
}

export function formatRows(rows) {
  const width = Math.max(...rows.map((row) => row[1].length)) + 2;
  return rows.map(([pkg, check, status, detail]) => pkg.padEnd(9) + check.padEnd(width) + status.padEnd(6) + detail).join('\n');
}
