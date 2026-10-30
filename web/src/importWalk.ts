// For tests that keep pages small: walks the imports a module can reach (up front only, or also
// on demand) by reading the source, so a test can say what a page must not load. Type-only
// imports are left out (they are gone once built). Not part of any page.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const SRC = resolve(__dirname);

/** import … from '…', export … from '…' and import '…', but not import type / export type. */
const STATIC = /(?:^|[;\s])(?:import|export)\s+(?!type\s)(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]/g;
/** import('…') */
const DYNAMIC = /import\(\s*['"]([^'"]+)['"]\s*\)/g;

function resolveImport(from: string, spec: string): string | undefined {
  let p: string;
  if (spec.startsWith('@lewismoten/gamemaker-sandbox-')) {
    const [scope, name, ...parts] = spec.split('/');
    const folder = resolve(SRC, '../packages', name.replace('gamemaker-sandbox-', ''));
    const manifest = JSON.parse(readFileSync(resolve(folder, 'package.json'), 'utf8')) as {
      name: string;
      exports: Record<string, { 'gamemaker-source'?: string }>;
    };
    if (manifest.name !== `${scope}/${name}`) throw new Error(`Unknown workspace: ${spec}`);
    const subpath = parts.length ? `./${parts.join('/')}` : '.';
    let target = manifest.exports[subpath]?.['gamemaker-source'];
    if (!target)
      for (const [pattern, entry] of Object.entries(manifest.exports)) {
        if (!pattern.endsWith('/*') || !subpath.startsWith(pattern.slice(0, -1))) continue;
        target = entry['gamemaker-source']?.replace('*', subpath.slice(pattern.length - 1));
        if (target) break;
      }
    if (!target) throw new Error(`Missing workspace source export: ${spec}`);
    p = resolve(folder, target);
  } else {
    if (!spec.startsWith('.')) return undefined;
    p = resolve(dirname(from), spec.replace(/\?.*$/, ''));
  }
  return [p, `${p}.ts`, `${p}/index.ts`].find((c) => existsSync(c) && statSync(c).isFile());
}

// Keep existing area rules meaningful after runtime modules move into their workspace.
function sourcePath(file: string): string {
  const p = relative(SRC, file);
  return p.replace(/^\.\.\/packages\/engine\/src\//, '');
}

/** Every file reachable from `entry` (a path under src/), each with the file that first imported it. */
export function reachable(entry: string, { dynamic }: { dynamic: boolean }): Map<string, string | undefined> {
  const start = resolve(SRC, entry);
  const seen = new Map<string, string | undefined>([[start, undefined]]);
  const queue = [start];
  while (queue.length) {
    const file = queue.shift()!;
    if (!file.endsWith('.ts')) continue;
    // comments can name modules too
    const code = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    const specs = [...code.matchAll(STATIC)].map((m) => m[1]);
    if (dynamic) specs.push(...[...code.matchAll(DYNAMIC)].map((m) => m[1]));
    for (const spec of specs) {
      const dep = resolveImport(file, spec);
      if (dep && !seen.has(dep)) {
        seen.set(dep, file);
        queue.push(dep);
      }
    }
  }
  return seen;
}

/** The files in `graph` whose path under src/ matches, each as the chain of imports that brings it in. */
export function chains(graph: Map<string, string | undefined>, match: RegExp): string[] {
  return [...graph.keys()]
    .filter((f) => match.test(sourcePath(f)))
    .map((file) => {
      const out: string[] = [];
      for (let f: string | undefined = file; f; f = graph.get(f)) out.unshift(relative(SRC, f));
      return out.join(' → ');
    });
}
