// Reads package-lock.json for the Credits page: every package, its version and license, and
// which of web/package.json's own packages pull it in. Pure, so scripts/credits.ts writes
// deps.json with it and deps.test.ts checks deps.json against the lockfile with it.

export interface LockPackage {
  version?: string;
  license?: string;
  dev?: boolean;
  optional?: boolean;
  os?: string[];
  cpu?: string[];
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface Lockfile {
  packages: Record<string, LockPackage>;
}

/** One package on the page. */
export interface Dep {
  name: string;
  version: string;
  license: string;
  /** Shipped in the site or the downloads (web/package.json "dependencies"), or only used to build and test. */
  runtime: boolean;
  /** One of web/package.json's own packages. */
  direct: boolean;
  /** The direct packages that pull it in (empty for a direct one). */
  usedBy: string[];
  author?: string;
  repo?: string;
}

export interface DepsFile {
  note: string;
  deps: Dep[];
  /** Prebuilt binaries for one OS and CPU each (esbuild, Rollup…): npm installs only the one that fits. */
  platformBuilds: { name: string; version: string; license: string }[];
}

export const nameOf = (path: string) => path.slice(path.lastIndexOf('node_modules/') + 'node_modules/'.length);

/** Where Node would find `dep` required from the package at `from` (a lockfile path). */
function resolveIn(lock: Lockfile, from: string, dep: string): string | undefined {
  let base = from;
  for (;;) {
    const at = `${base ? `${base}/` : ''}node_modules/${dep}`;
    if (lock.packages[at]) return at;
    if (!base) return undefined;
    const cut = base.lastIndexOf('/node_modules/');
    base = cut < 0 ? '' : base.slice(0, cut);
  }
}

const isPlatformBuild = (p: LockPackage) => !!p.optional && !!(p.os || p.cpu);

/** The package list from the lockfile alone: names, versions, licenses and who uses what. */
export function depsFromLock(lock: Lockfile): { deps: Dep[]; platformBuilds: DepsFile['platformBuilds'] } {
  const root = lock.packages[''] as LockPackage & { devDependencies?: Record<string, string> };
  const runtimeDirect = Object.keys(root.dependencies ?? {});
  const direct = [...runtimeDirect, ...Object.keys(root.devDependencies ?? {})];
  const usedBy = new Map<string, Set<string>>();
  for (const top of direct) {
    const start = resolveIn(lock, '', top);
    const queue = start ? [start] : [];
    const seen = new Set(queue);
    while (queue.length) {
      const path = queue.shift()!;
      const p = lock.packages[path];
      for (const d of Object.keys({ ...p.dependencies, ...p.optionalDependencies })) {
        const at = resolveIn(lock, path, d);
        if (!at || seen.has(at)) continue;
        seen.add(at);
        queue.push(at);
        if (!usedBy.has(at)) usedBy.set(at, new Set());
        usedBy.get(at)!.add(top);
      }
    }
  }
  const deps: Dep[] = [];
  const platformBuilds: DepsFile['platformBuilds'] = [];
  for (const [path, p] of Object.entries(lock.packages)) {
    if (!path) continue;
    const name = nameOf(path);
    const license = p.license ?? 'not stated';
    if (isPlatformBuild(p)) {
      platformBuilds.push({ name, version: p.version ?? '', license });
      continue;
    }
    const isDirect = path === `node_modules/${name}` && direct.includes(name);
    deps.push({
      name,
      version: p.version ?? '',
      license,
      runtime: !p.dev,
      direct: isDirect,
      usedBy: isDirect ? [] : [...(usedBy.get(path) ?? [])].sort(),
    });
  }
  const order = (a: { name: string; version: string }, b: { name: string; version: string }) =>
    a.name.localeCompare(b.name) || a.version.localeCompare(b.version);
  return { deps: deps.sort(order), platformBuilds: platformBuilds.sort(order) };
}
