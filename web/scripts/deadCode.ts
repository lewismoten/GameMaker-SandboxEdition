/**
 * Dead-code finder (`npm run dead:code`). Lists, for web/src and web/packages/<pkg>/src:
 *   1. exports no other file imports ("local" when the file still uses the name itself, so only
 *      the `export` keyword is extra; "dead" when nothing uses it at all),
 *   2. source modules unreachable from known entry points, and
 *   3. CSS classes without a reference in JavaScript, TypeScript or HTML.
 * Uses counted: static, dynamic and `export ... from` imports, `import.meta.glob`,
 * `new URL('./x', import.meta.url)`, HTML script tags, package `exports` entries (whole file is
 * public API) and test files. Namespace and dynamic imports count only the members they touch
 * when that is clear, else everything. Output is a list of suggestions: names built at run time
 * (`'tile-' + x`) are matched by prefix, but a class or export used some other way will show up.
 * `--json` prints the lists as JSON; `--only exports|files|css` limits the output.
 */
import ts from 'typescript';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, matchesGlob, relative, resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : '';
const asJson = args.includes('--json');

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.claude', '.for-lewis', 'public']);
const SRC_EXT = /\.(?:ts|tsx|mts|mjs|js)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith('.') || (name === 'disk' && dir.includes('/games/'))) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const all = [...walk(join(root, 'web')), ...walk(join(root, 'games')), ...walk(join(root, 'scripts'))];
const sources = all.filter((f) => SRC_EXT.test(f) && !f.endsWith('.d.ts'));
const htmls = [...all.filter((f) => f.endsWith('.html')), ...walk(join(root, 'web/public')).filter((f) => f.endsWith('.html'))];
const csses = all.filter((f) => f.endsWith('.css') && /\/web\/(?:src|packages\/[^/]+\/src)\//.test(f));
const isTest = (f: string): boolean => /\.test\.tsx?$/.test(f) || f.includes('/web/test/');
const isCandidate = (f: string): boolean => /\.tsx?$/.test(f) && !isTest(f) && (/\/web\/src\//.test(f) || /\/web\/packages\/[^/]+\/src\//.test(f));

const sourceSet = new Set(all);
const isPublic = (f: string): boolean =>
  publicFiles.has(f) || wildcards.some(([, , c, d]) => f.startsWith(c) && f.endsWith(d) && !f.slice(c.length, f.length - d.length).includes('..'));
const ALL = '*';
/** file -> exported names used by others (ALL when everything is). */
const used = new Map<string, Set<string>>();
const edges = new Map<string, Set<string>>();
const entries = new Set(sources.filter((f) => !isCandidate(f)));
// These player bundles have programmatic build entries rather than HTML script tags.
entries.add(join(root, 'web/src/export/standalonePlayer.ts'));
entries.add(join(root, 'web/src/hostedPlayer/main.ts'));
const useName = (file: string, name: string): void => {
  let s = used.get(file);
  if (!s) used.set(file, (s = new Set()));
  s.add(name);
};

// Package name -> subpath -> source file, from each package's `exports`.
const pkgMaps = new Map<string, Map<string, string>>();
/** `./kit/*` style entries: [specifier prefix, suffix, source prefix, source suffix]. */
const wildcards: [string, string, string, string][] = [];
const publicFiles = new Set<string>();
for (const pkg of readdirSync(join(root, 'web/packages'))) {
  const dir = join(root, 'web/packages', pkg);
  const json = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
    name: string;
    exports?: Record<string, unknown>;
  };
  const m = new Map<string, string>();
  for (const [sub, v] of Object.entries(json.exports ?? {})) {
    const src = (v as Record<string, string>)['gamemaker-source'];
    if (!src) continue;
    if (sub.includes('*')) {
      const [a, b] = `${json.name}/${sub.slice(2)}`.split('*');
      const [c, d] = resolve(dir, src).split('*');
      wildcards.push([a, b, c, d]);
      continue;
    }
    const f = resolve(dir, src);
    m.set(sub === '.' ? json.name : `${json.name}/${sub.slice(2)}`, f);
    publicFiles.add(f);
  }
  pkgMaps.set(json.name, m);
}

function resolveSpec(from: string, spec: string): string | undefined {
  for (const m of pkgMaps.values()) if (m.has(spec)) return m.get(spec);
  for (const [a, b, c, d] of wildcards) {
    if (spec.startsWith(a) && spec.endsWith(b) && spec.length > a.length + b.length) return `${c}${spec.slice(a.length, spec.length - b.length)}${d}`;
  }
  if (!spec.startsWith('.') && !spec.startsWith('/')) return undefined;
  const base = resolve(dirname(from), spec);
  const tries = [base, base.replace(/\.js$/, '.ts'), `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}.js`, `${base}.mjs`];
  return tries.find((t) => sourceSet.has(t) || (existsSync(t) && statSync(t).isFile()));
}

// Strings from every consumer, for CSS class matching.
const words = new Set<string>();
const literalCss = args.includes('--literal-css');
const prefixes = new Set<string>();
const addWords = (text: string): void => {
  for (const w of text.split(/[^\w-]+/)) {
    if (!w) continue;
    words.add(w);
    if (w.endsWith('-') || w.endsWith('_')) prefixes.add(w);
  }
};

/** Members of namespace identifier `id` used inside `scope`, or ALL if it escapes. */
function memberUses(id: string, scope: ts.Node): Set<string> | typeof ALL {
  const names = new Set<string>();
  let escapes = false;
  const visit = (n: ts.Node): void => {
    if (ts.isIdentifier(n) && n.text === id) {
      const p = n.parent;
      if (ts.isPropertyAccessExpression(p) && p.expression === n) names.add(p.name.text);
      else if (ts.isElementAccessExpression(p) && p.expression === n && ts.isStringLiteralLike(p.argumentExpression)) names.add(p.argumentExpression.text);
      else if (!(ts.isVariableDeclaration(p) && p.name === n) && !ts.isNamespaceImport(p) && !(ts.isParameter(p) && p.name === n)) escapes = true;
    }
    ts.forEachChild(n, visit);
  };
  visit(scope);
  return escapes ? ALL : names;
}

function bindingNames(b: ts.BindingName): string[] | typeof ALL {
  if (ts.isIdentifier(b)) return ALL;
  return b.elements.flatMap<string>((e) => {
    if (ts.isOmittedExpression(e) || e.dotDotDotToken) return [ALL];
    const key = e.propertyName ?? e.name;
    return ts.isIdentifier(key) || ts.isStringLiteralLike(key) ? [key.text] : [ALL];
  });
}

function addUses(target: string, what: Set<string> | string[] | typeof ALL): void {
  if (what === ALL) return useName(target, ALL);
  for (const n of what) useName(target, n);
}

function dynamicUse(target: string, call: ts.CallExpression): void {
  let n: ts.Node = call;
  while (ts.isParenthesizedExpression(n.parent) || ts.isAwaitExpression(n.parent)) n = n.parent;
  const p = n.parent;
  if (ts.isVariableDeclaration(p) && p.initializer === n) {
    const b = bindingNames(p.name);
    if (b !== ALL) return addUses(target, b);
    const scope = ts.findAncestor(p, (a) => ts.isBlock(a) || ts.isSourceFile(a)) ?? p;
    return addUses(target, memberUses(p.name.getText(), scope));
  }
  if (ts.isPropertyAccessExpression(p) && p.expression === n) {
    if (p.name.text === 'then' && ts.isCallExpression(p.parent)) {
      const cb = p.parent.arguments[0];
      if (cb && (ts.isArrowFunction(cb) || ts.isFunctionExpression(cb)) && cb.parameters[0]) {
        const b = bindingNames(cb.parameters[0].name);
        if (b !== ALL) return addUses(target, b);
        return addUses(target, memberUses(cb.parameters[0].name.getText(), cb.body));
      }
      return useName(target, ALL);
    }
    return useName(target, p.name.text);
  }
  useName(target, ALL);
}

for (const f of sources) {
  const dependencies = new Set<string>();
  edges.set(f, dependencies);
  const text = readFileSync(f, 'utf8');
  const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true);
  const visit = (n: ts.Node): void => {
    if (ts.isImportDeclaration(n) || (ts.isExportDeclaration(n) && n.moduleSpecifier)) {
      const spec = (n.moduleSpecifier as ts.StringLiteral).text;
      const t = resolveSpec(f, spec);
      if (t) {
        dependencies.add(t);
        if (ts.isImportDeclaration(n)) {
          const c = n.importClause;
          if (c) {
            if (c.name) useName(t, 'default');
            if (c.namedBindings && ts.isNamespaceImport(c.namedBindings)) {
              const scope = ts.findAncestor(n, ts.isSourceFile) ?? n;
              addUses(t, memberUses(c.namedBindings.name.text, scope));
            } else if (c.namedBindings) for (const e of c.namedBindings.elements) useName(t, (e.propertyName ?? e.name).text);
          }
        } else if (n.exportClause && ts.isNamedExports(n.exportClause)) {
          for (const e of n.exportClause.elements) useName(t, (e.propertyName ?? e.name).text);
        } else useName(t, ALL);
      }
    } else if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteralLike(n.arguments[0])) {
      const t = resolveSpec(f, n.arguments[0].text);
      if (t) {
        dependencies.add(t);
        dynamicUse(t, n);
      }
    } else if (ts.isImportTypeNode(n) && ts.isLiteralTypeNode(n.argument) && ts.isStringLiteral(n.argument.literal)) {
      const t = resolveSpec(f, n.argument.literal.text);
      if (t) {
        dependencies.add(t);
        useName(t, n.qualifier ? n.qualifier.getText().split('.')[0] : ALL);
      }
    } else if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      n.expression.name.text === 'glob' &&
      ts.isStringLiteralLike(n.arguments[0])
    ) {
      const pattern = resolve(dirname(f), n.arguments[0].text);
      for (const g of all)
        if (matchesGlob(g, pattern)) {
          dependencies.add(g);
          useName(g, ALL);
        }
    } else if (ts.isNewExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'URL' && n.arguments && ts.isStringLiteralLike(n.arguments[0])) {
      const t = resolveSpec(f, n.arguments[0].text);
      if (t) {
        dependencies.add(t);
        useName(t, ALL);
      }
    }
    if (ts.isStringLiteralLike(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n) || ts.isJsxText(n)) addWords(n.text);
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
for (const h of htmls) {
  const text = readFileSync(h, 'utf8');
  addWords(text);
  for (const m of text.matchAll(/<script\b[^>]*?\bsrc=["']([^"']+)["']/gi)) {
    const t = m[1].startsWith('/') ? resolve(root, 'web', m[1].slice(1)) : resolve(dirname(h), m[1]);
    if (sourceSet.has(t)) {
      entries.add(t);
      useName(t, ALL);
    }
  }
}

const reachable = new Set([...entries, ...sources.filter(isPublic)]);
for (const file of reachable) for (const dependency of edges.get(file) ?? []) reachable.add(dependency);

// Exports per candidate file.
type Item = { file: string; name: string; kind: 'dead' | 'local' };
const unusedExports: Item[] = [];
const publicExports: Item[] = [];
const unreferencedFiles: string[] = [];
function declaredNames(sf: ts.SourceFile): string[] {
  const declared: string[] = [];
  for (const st of sf.statements) {
    const exported = ts.canHaveModifiers(st) && ts.getModifiers(st)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    const isDefault = ts.canHaveModifiers(st) && ts.getModifiers(st)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
    if (ts.isVariableStatement(st) && exported) {
      for (const d of st.declarationList.declarations) {
        const walkB = (b: ts.BindingName): void => {
          if (ts.isIdentifier(b)) declared.push(b.text);
          else for (const e of b.elements) if (!ts.isOmittedExpression(e)) walkB(e.name);
        };
        walkB(d.name);
      }
    } else if (exported && isDefault) declared.push('default');
    else if (
      exported &&
      (ts.isFunctionDeclaration(st) ||
        ts.isClassDeclaration(st) ||
        ts.isInterfaceDeclaration(st) ||
        ts.isTypeAliasDeclaration(st) ||
        ts.isEnumDeclaration(st)) &&
      st.name
    )
      declared.push(st.name.text);
    else if (ts.isExportDeclaration(st) && st.exportClause && ts.isNamedExports(st.exportClause))
      for (const e of st.exportClause.elements) declared.push(e.name.text);
    else if (ts.isExportAssignment(st)) declared.push('default');
  }
  return declared;
}

// Resolve package entries with the same source condition used by the workspace.
const publicProgram = ts.createProgram(sources.filter(isPublic), {
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  customConditions: ['gamemaker-source'],
  types: [],
  allowJs: true,
});
const checker = publicProgram.getTypeChecker();
for (const f of sources.filter(isCandidate)) {
  const u = used.get(f);
  if (!reachable.has(f)) unreferencedFiles.push(f);
  if (u?.has(ALL)) continue;
  const publicEntry = isPublic(f) ? publicProgram.getSourceFile(f) : undefined;
  const sf = publicEntry ?? ts.createSourceFile(f, readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true);
  const idCount = new Map<string, number>();
  const count = (n: ts.Node): void => {
    if (ts.isIdentifier(n)) idCount.set(n.text, (idCount.get(n.text) ?? 0) + 1);
    ts.forEachChild(n, count);
  };
  count(sf);
  const moduleSymbol = publicEntry && checker.getSymbolAtLocation(publicEntry);
  const declared = moduleSymbol ? checker.getExportsOfModule(moduleSymbol).map((symbol) => symbol.getName()) : declaredNames(sf);
  for (const name of declared) {
    if (u?.has(name)) continue;
    const local = name !== 'default' && (idCount.get(name) ?? 0) > 1;
    (isPublic(f) ? publicExports : unusedExports).push({ file: f, name, kind: local ? 'local' : 'dead' });
  }
}

// CSS classes.
type Cls = { file: string; cls: string };
const unusedClasses: Cls[] = [];
for (const c of csses) {
  const text = readFileSync(c, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/url\([^)]*\)/g, '')
    .replace(/(["'])(?:\\.|(?!\1).)*\1/g, '""');
  const seen = new Set<string>();
  for (const m of text.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
    const cls = m[1];
    if (seen.has(cls) || /^\d/.test(cls)) continue;
    seen.add(cls);
    if (words.has(cls) || (!literalCss && [...prefixes].some((p) => cls.startsWith(p)))) continue;
    unusedClasses.push({ file: c, cls });
  }
}

const rel = (f: string): string => relative(root, f);
if (asJson) {
  console.log(
    JSON.stringify(
      {
        publicExports: publicExports.map((e) => ({ ...e, file: rel(e.file) })),
        unusedExports: unusedExports.map((e) => ({ ...e, file: rel(e.file) })),
        unreferencedFiles: unreferencedFiles.map(rel),
        unusedClasses: unusedClasses.map((c) => ({ ...c, file: rel(c.file) })),
      },
      null,
      1,
    ),
  );
} else {
  const byFile = <T extends { file: string }>(xs: T[]): Map<string, T[]> => {
    const m = new Map<string, T[]>();
    for (const x of xs) m.set(rel(x.file), [...(m.get(rel(x.file)) ?? []), x]);
    return m;
  };
  if (!only || only === 'exports') {
    console.log(`Public package exports without an observed importer: ${publicExports.length} (listed in --json)`);
    const dead = unusedExports.filter((e) => e.kind === 'dead');
    console.log(`Unused exports: ${unusedExports.length} (${dead.length} dead, ${unusedExports.length - dead.length} used only in their own file)`);
    for (const [f, xs] of byFile(unusedExports)) console.log(`  ${f}: ${xs.map((x) => (x.kind === 'dead' ? x.name : `${x.name}~`)).join(', ')}`);
    console.log('  (~ = still used inside its file; only the `export` is extra)\n');
  }
  if (!only || only === 'files') {
    console.log(`Unreachable source modules: ${unreferencedFiles.length}`);
    for (const f of unreferencedFiles) console.log(`  ${rel(f)}`);
    console.log('');
  }
  if (!only || only === 'css') {
    console.log(`CSS classes without a reference in JavaScript, TypeScript or HTML: ${unusedClasses.length}`);
    for (const [f, xs] of byFile(unusedClasses)) console.log(`  ${f}: ${xs.map((x) => x.cls).join(' ')}`);
  }
}
