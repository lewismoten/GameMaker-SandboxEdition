// npm run release:sbom -- <pages|engine|archives|tools> [version] [--out file]
// Writes a CycloneDX SBOM of the target's runtime dependencies with npm's own `npm sbom` (no new dependency).
// Default file: release-out/<target>-<version>.sbom.cdx.json at the repository root (git-ignored); attach it to the GitHub Release.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { repoRoot } from './git';
import { sbomArgs, sbomVersion } from './sbomTargets';

function main(argv: string[]): number {
  const outAt = argv.indexOf('--out');
  const out = outAt >= 0 ? argv[outAt + 1] : undefined;
  const rest = argv.filter((_, i) => outAt < 0 || (i !== outAt && i !== outAt + 1));
  const [name, version] = rest;
  const root = repoRoot();
  const args = sbomArgs(name ?? '', root);
  if (!args) {
    console.error('Usage: npm run release:sbom -- <pages|engine|archives|tools> [version] [--out file]');
    return 1;
  }
  const file = resolve(out ?? join(root, 'release-out', `${name}-${sbomVersion(name, root, version)}.sbom.cdx.json`));
  const json = execFileSync('npm', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, json);
  const components = (JSON.parse(json) as { components?: unknown[] }).components?.length ?? 0;
  console.log(`${file}: ${components} components. Attach it with: gh release create <tag> ... ${file}`);
  return 0;
}

process.exit(main(process.argv.slice(2)));
