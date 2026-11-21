// npm run release:sbom -- <pages|engine|archives|tools> [version] [--out file]
// Writes a CycloneDX SBOM of the target's runtime dependencies with npm's own `npm sbom` (no new dependency).
// Default file: release-out/<target>-<version>.sbom.cdx.json at the repository root (git-ignored); attach it to the GitHub Release.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { repoRoot } from './git';
import { sbomTarget } from './sbomTargets';

function usage(): number {
  console.error('Usage: npm run release:sbom -- <pages|engine|archives|tools> [version] [--out file]');
  return 1;
}

function main(argv: string[]): number {
  let parsed;
  try {
    parsed = parseArgs({ args: argv, options: { out: { type: 'string' } }, allowPositionals: true });
  } catch {
    return usage();
  }
  const { positionals, values } = parsed;
  const [name, version] = positionals;
  const root = repoRoot();
  const target = sbomTarget(name ?? '', root);
  if (!target || positionals.length > 2 || values.out === '') {
    return usage();
  }
  if (version !== undefined && version !== target.component.version) {
    console.warn(
      `Warning: requested version ${version} differs from ${name} manifest version ${target.component.version}. The SBOM uses the manifest version.`,
    );
  }
  const file =
    values.out === undefined
      ? join(root, 'release-out', `${name}-${version ?? target.fileVersion}.sbom.cdx.json`)
      : resolve(process.env.INIT_CWD ?? process.cwd(), values.out);
  const json = execFileSync('npm', target.args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
  const bom = JSON.parse(json) as { metadata: { component: { 'bom-ref': string } }; components?: unknown[] };
  // npm's dependency graph refers to this opaque ID.
  bom.metadata.component = { 'bom-ref': bom.metadata.component['bom-ref'], ...target.component };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(bom, null, 2) + '\n');
  const components = bom.components?.length ?? 0;
  console.log(`${file}: ${components} components. Attach it with: gh release create <tag> ... ${file}`);
  return 0;
}

process.exit(main(process.argv.slice(2)));
