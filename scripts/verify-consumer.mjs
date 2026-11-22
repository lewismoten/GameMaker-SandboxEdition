// Verify SDK exports from a fresh consumer project outside the workspaces.
import { parseArgs } from 'node:util';
import { runCommand, exportedEntries, verifyTarballs, browserSpecs, browserResult, expectedDomErrors, formatRows } from './consumer-checks.mjs';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let options;
try {
  options = parseArgs({ options: { source: { type: 'string', multiple: true }, keep: { type: 'boolean' }, 'all-browser': { type: 'boolean' } } }).values;
  if (options.source?.some((s) => !['tarball', 'registry'].includes(s)) || options.source?.length > 1) throw new Error('invalid source');
} catch (error) {
  console.error(
    error.message + '\n--source must be tarball or registry\nUsage: node scripts/verify-consumer.mjs [--source tarball|registry] [--keep] [--all-browser]',
  );
  process.exit(2);
}
const source = options.source?.[0] ?? 'tarball';
const keep = options.keep;
const names = ['engine', 'archives', 'tools'];
const pkgName = (n) => `@lewismoten/gamemaker-sandbox-${n}`;
const scratch = mkdtempSync(join(tmpdir(), `gamemaker-consumer-${source}-`));
const controller = new AbortController();
const cleanup = () => {
  if (!keep) rmSync(scratch, { recursive: true, force: true });
};
process.once('SIGINT', () => {
  controller.abort();
  cleanup();
  process.exit(130);
});
const sh = (cwd, cmd, args) => runCommand(cwd, cmd, args, { signal: controller.signal });
const rows = [];
const problems = [];
const note = (pkg, check, ok, detail = '') => {
  rows.push([pkg, check, ok ? 'pass' : 'FAIL', detail]);
  if (!ok) problems.push(`${pkg} ${check}: ${detail}`);
};

try {
  const project = join(scratch, 'consumer');
  mkdirSync(project);
  writeFileSync(join(project, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  let installs;
  if (source === 'registry') installs = names.map(pkgName);
  else {
    await sh(root, process.execPath, [join(root, 'scripts/decl-preflight.mjs')]);
    installs = [];
    for (const n of names) {
      const [p] = JSON.parse((await sh(join(root, 'web/packages', n), 'npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', scratch])).stdout);
      installs.push(join(scratch, p.filename));
    }
  }
  // Check npm’s actual resolution before exercising any installed export.
  await sh(project, 'npm', [
    'install',
    '--package-lock',
    '--no-audit',
    '--no-fund',
    '--ignore-scripts',
    ...installs,
    'typescript@5',
    'vite@6',
    '@types/node@22',
  ]);
  if (source === 'tarball') verifyTarballs(project, names.map(pkgName), installs);
  const manifests = Object.fromEntries(names.map((n) => [n, JSON.parse(readFileSync(join(project, 'node_modules', pkgName(n), 'package.json'), 'utf8'))]));
  for (const n of names) {
    const manifest = manifests[n];
    const detail = [source, manifest.version];
    if (source === 'tarball') {
      for (const sibling of names) {
        if (Object.hasOwn(manifest.dependencies ?? {}, pkgName(sibling))) detail.push(sibling + '@' + manifests[sibling].version);
      }
    }
    note(n, 'install', true, detail.join(' '));
  }
  const all = {};
  const entries = {};
  const imported = {};
  for (const n of names) {
    entries[n] = exportedEntries(join(project, 'node_modules', pkgName(n)), pkgName(n));
    all[n] = [...entries[n].keys()];
  }

  // 1. import each export in Node ESM
  writeFileSync(
    join(project, 'imports.mjs'),
    `const fails=[];const ok=[];for(const s of JSON.parse(process.argv[2])){try{await import(s);ok.push(s)}catch(e){fails.push(s+': '+String(e.message).split('\\n')[0])}}console.log(JSON.stringify({ok,fails}))`,
  );
  for (const n of names) {
    const r = JSON.parse((await sh(project, 'node', ['imports.mjs', JSON.stringify(all[n])])).stdout);
    imported[n] = new Set(r.ok);
    note(
      n,
      'node import',
      r.fails.length === 0,
      `${r.ok.length}/${all[n].length}` + (r.fails.length ? ` first failures: ${r.fails.slice(0, 4).join(' | ')}` : ''),
    );
  }

  // 2. typecheck each export under bundler and node16 resolution
  for (const [mode, module, noDom] of [
    ['bundler', 'esnext'],
    ['node16', 'node16'],
    ['node16', 'node16', true],
  ]) {
    for (const n of names) {
      const label = noDom ? 'no DOM' : mode;
      const dir = join(project, `ts-${label}-${n}`);
      mkdirSync(dir);
      writeFileSync(join(dir, 'a.ts'), all[n].map((s, i) => `import * as m${i} from '${s}';\nvoid m${i};`).join('\n') + '\nexport {};\n');
      writeFileSync(
        join(dir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            target: 'es2022',
            module,
            moduleResolution: mode,
            strict: true,
            noEmit: true,
            skipLibCheck: false,
            lib: noDom ? ['es2022'] : ['es2022', 'dom'],
            types: ['node'],
            typeRoots: ['../node_modules/@types'],
          },
          files: ['a.ts'],
        }),
      );
      try {
        await sh(dir, join(project, 'node_modules/.bin/tsc'), ['-p', '.']);
        note(n, `tsc ${label}`, true, `${all[n].length} imports`);
      } catch (e) {
        if (noDom && e.code === 2 && !e.stderr && expectedDomErrors(n, e.stdout)) {
          note(n, 'tsc no DOM', true, 'engine browser declarations require the DOM library');
          continue;
        }
        const lines = String(e.stdout || e.message)
          .split('\n')
          .filter((l) => l.includes('error'));
        note(n, `tsc ${label}`, false, `${lines.length} errors; first: ${lines.slice(0, 3).join(' | ')}`);
      }
    }
  }

  // 3. one Vite build per package (a browser-safe README import; tools' drawing is documented as Node-only)
  const first = { engine: ['GameFiles', pkgName('engine')], archives: ['createZip', pkgName('archives')], tools: ['encodePng', pkgName('tools') + '/images'] };
  for (const n of names) {
    const name = pkgName(n);
    const dir = join(project, 'vite-' + n);
    mkdirSync(dir);
    writeFileSync(join(dir, 'index.html'), '<!doctype html><script type="module" src="./main.js"></script>');
    const [symbol, example] = first[n];
    const drawing = pkgName('tools') + '/drawing';
    for (const spec of browserSpecs(name, example, entries[n], options['all-browser'])) {
      const blocked = entries[n].get(spec);
      if ((spec === drawing && !blocked) || (spec === example && blocked)) {
        note(n, spec === drawing ? 'drawing browser' : 'vite build', false, spec + ' has an unexpected browser export condition');
        continue;
      }
      const binding = spec === example ? `{ ${symbol} as entry }` : '* as entry';
      writeFileSync(join(dir, 'main.js'), `import ${binding} from ${JSON.stringify(spec)}; console.log(entry);`);
      let error, warnings;
      try {
        ({ stderr: warnings } = await sh(dir, join(project, 'node_modules/.bin/vite'), ['build', '--logLevel', 'warn', '--outDir', 'out']));
      } catch (e) {
        error = e.stderr || e.message;
      }
      const [ok, detail] = browserResult(name, spec, blocked, imported[n].has(spec), error, warnings);
      note(n, spec === drawing ? 'drawing browser' : 'vite build', ok, spec + ': ' + detail);
    }
  }
} catch (e) {
  note(
    'setup',
    'consumer',
    false,
    String(e.stderr || e.message)
      .split('\n')
      .slice(0, 6)
      .join(' '),
  );
} finally {
  console.log(formatRows(rows));
  if (keep) console.log('kept ' + scratch);
  cleanup();
}
if (problems.length) process.exitCode = 1;
