// Prove an outside project can use each published SDK package: install it (packed tarballs or the
// npm registry), import every export in Node, typecheck every export (bundler and node16
// resolution) and Vite-build one import per package. Nothing from this repository is used but the
// packed tarballs. Usage: node scripts/verify-consumer.mjs [--source tarball|registry] [--keep]
// tarball packs web/packages/* (build them first: npm run build:packages); registry installs the
// published versions (needs network). Exits 1 on any failure; prints a table.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const source = args.includes('--source') ? args[args.indexOf('--source') + 1] : 'tarball';
const keep = args.includes('--keep');
const names = ['engine', 'archives', 'tools'];
const pkgName = (n) => `@lewismoten/gamemaker-sandbox-${n}`;
const scratch = mkdtempSync(join(tmpdir(), `gamemaker-consumer-${source}-`));
const sh = (cwd, cmd, a, opts = {}) => execFileSync(cmd, a, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts });
const rows = [];
const problems = [];
const note = (pkg, check, ok, detail = '') => {
  rows.push([pkg, check, ok ? 'pass' : 'FAIL', detail]);
  if (!ok) problems.push(`${pkg} ${check}: ${detail}`);
};

// Every subpath an installed package exports; a "*" pattern expands from the files it maps to.
function specifiers(dir, name) {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const out = [];
  for (const [key, cond] of Object.entries(pkg.exports)) {
    if (!key.includes('*')) {
      out.push(key === '.' ? name : `${name}/${key.slice(2)}`);
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
      out.push(`${name}/${key.slice(2).replace('*', stem.slice(base.length))}`);
    }
  }
  return out;
}

try {
  const project = join(scratch, 'consumer');
  mkdirSync(project);
  writeFileSync(join(project, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  let installs;
  if (source === 'registry') installs = names.map(pkgName);
  else {
    installs = names.map((n) => {
      const [p] = JSON.parse(sh(join(root, 'web/packages', n), 'npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', scratch]));
      return join(scratch, p.filename);
    });
  }
  // typescript and vite come from the registry; the tarballs go in one install so siblings resolve to them.
  sh(project, 'npm', ['install', '--no-audit', '--no-fund', '--ignore-scripts', ...installs, 'typescript@5', 'vite@6', '@types/node@22']);
  for (const n of names) {
    const v = JSON.parse(readFileSync(join(project, 'node_modules', pkgName(n), 'package.json'), 'utf8')).version;
    note(n, 'install', true, `${source} ${v}`);
  }
  const all = {};
  for (const n of names) all[n] = specifiers(join(project, 'node_modules', pkgName(n)), pkgName(n));

  // 1. import each export in Node ESM
  writeFileSync(
    join(project, 'imports.mjs'),
    `const fails=[];let ok=0;for(const s of JSON.parse(process.argv[2])){try{await import(s);ok++}catch(e){fails.push(s+': '+String(e.message).split('\\n')[0])}}console.log(JSON.stringify({ok,fails}))`,
  );
  for (const n of names) {
    const r = JSON.parse(sh(project, 'node', ['imports.mjs', JSON.stringify(all[n])]));
    note(n, 'node import', r.fails.length === 0, `${r.ok}/${all[n].length}` + (r.fails.length ? ` first failures: ${r.fails.slice(0, 4).join(' | ')}` : ''));
  }

  // 2. typecheck each export under bundler and node16 resolution
  for (const [mode, module] of [
    ['bundler', 'esnext'],
    ['node16', 'node16'],
  ]) {
    for (const n of names) {
      const dir = join(project, `ts-${mode}-${n}`);
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
            lib: ['es2022', 'dom'],
            types: ['node'],
            typeRoots: ['../node_modules/@types'],
          },
          files: ['a.ts'],
        }),
      );
      try {
        sh(dir, join(project, 'node_modules/.bin/tsc'), ['-p', '.']);
        note(n, `tsc ${mode}`, true, `${all[n].length} imports`);
      } catch (e) {
        const lines = String(e.stdout || e.message)
          .split('\n')
          .filter((l) => l.includes('error'));
        note(n, `tsc ${mode}`, false, `${lines.length} errors; first: ${lines.slice(0, 3).join(' | ')}`);
      }
    }
  }

  // 3. one Vite build per package (a browser-safe README import; tools' drawing is documented as Node-only)
  const first = { engine: ['GameFiles', pkgName('engine')], archives: ['createZip', pkgName('archives')], tools: ['encodePng', pkgName('tools') + '/images'] };
  for (const n of names) {
    const dir = join(project, `vite-${n}`);
    mkdirSync(dir);
    const [sym, spec] = first[n];
    writeFileSync(join(dir, 'main.js'), `import { ${sym} } from '${spec}';\nconsole.log(typeof ${sym});\n`);
    writeFileSync(join(dir, 'index.html'), '<!doctype html><script type="module" src="./main.js"></script>');
    try {
      sh(dir, join(project, 'node_modules/.bin/vite'), ['build', '--logLevel', 'error', '--outDir', 'out']);
      note(n, 'vite build', true, `${sym} from ${spec.replace(pkgName(n), n)}`);
    } catch (e) {
      note(
        n,
        'vite build',
        false,
        String(e.stderr || e.message)
          .split('\n')
          .slice(0, 3)
          .join(' '),
      );
    }
  }
  // documented: tools' drawing rejects browser builds ("browser": null), so a client build must fail
  const nd = join(project, 'vite-tools-node');
  mkdirSync(nd);
  writeFileSync(join(nd, 'main.js'), `import { Pixels } from '${pkgName('tools')}/drawing';\nconsole.log(typeof Pixels);\n`);
  writeFileSync(join(nd, 'index.html'), '<!doctype html><script type="module" src="./main.js"></script>');
  let rejected = false;
  try {
    sh(nd, join(project, 'node_modules/.bin/vite'), ['build', '--logLevel', 'error', '--outDir', 'out']);
  } catch {
    rejected = true;
  }
  note('tools', 'drawing browser', rejected, rejected ? 'rejected as documented' : 'a browser build accepted a Node-only entry');
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
  for (const r of rows) process.stdout.write(`${r[0].padEnd(9)}${r[1].padEnd(14)}${r[2].padEnd(6)}${r[3]}\n`);
  if (keep) process.stdout.write(`kept ${scratch}\n`);
  else rmSync(scratch, { recursive: true, force: true });
}
if (problems.length) process.exit(1);
