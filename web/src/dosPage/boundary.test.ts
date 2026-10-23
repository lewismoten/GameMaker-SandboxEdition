// The DOS page (dos.html) loads none of the desk: walks every import it can reach, up front or
// on demand, from its entry (and from the PC's core, retro/computer.ts), and fails if anything
// under src/desk/ is among them. Type-only imports are left out (they are gone once built).
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const SRC = resolve(__dirname, '..');

/** import … from '…', export … from '…', import '…' and import('…'), but not import type / export type. */
const IMPORT = /(?:^|[;\s])(?:import|export)\s+(?!type\s)(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

function resolveImport(from: string, spec: string): string | undefined {
  if (!spec.startsWith('.')) return undefined; // packages
  const p = resolve(dirname(from), spec.replace(/\?.*$/, ''));
  return [p, `${p}.ts`, `${p}/index.ts`].find((c) => existsSync(c) && statSync(c).isFile());
}

/** Every file reachable from `entry`, each with the file that first imported it. */
function reachable(entry: string): Map<string, string | undefined> {
  const seen = new Map<string, string | undefined>([[entry, undefined]]);
  const queue = [entry];
  while (queue.length) {
    const file = queue.shift()!;
    if (!file.endsWith('.ts')) continue;
    // comments can name modules too
    const code = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    for (const m of code.matchAll(IMPORT)) {
      const dep = resolveImport(file, m[1] ?? m[2]);
      if (dep && !seen.has(dep)) {
        seen.set(dep, file);
        queue.push(dep);
      }
    }
  }
  return seen;
}

/** The chain of imports that brings `file` in, for the failure message. */
function chain(graph: Map<string, string | undefined>, file: string): string {
  const out: string[] = [];
  for (let f: string | undefined = file; f; f = graph.get(f)) out.unshift(relative(SRC, f));
  return out.join(' → ');
}

describe('the DOS page and the PC core', () => {
  for (const entry of ['dosPage/dosPage.ts', 'retro/computer.ts']) {
    it(`${entry} reaches nothing under desk/`, () => {
      const graph = reachable(resolve(SRC, entry));
      expect(graph.size).toBeGreaterThan(50); // the walk did find the PC
      const desk = [...graph.keys()].filter((f) => relative(SRC, f).startsWith('desk/'));
      expect(desk.map((f) => chain(graph, f))).toEqual([]);
    });
  }
});
