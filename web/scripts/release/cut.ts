// npm run release:cut -- <pages|engine|archives|tools> <version> [YYYY-MM-DD]
// Moves Unreleased into a dated version heading, fixes the link references and (packages) sets package.json's version.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cutRelease } from '../../../scripts/release/changelog.mjs';
import { TARGETS, repoRoot } from './git';
import { consumeFragments, readFragments, withPendingNotes } from './fragments';

const [name, version, date] = process.argv.slice(2);
const target = TARGETS[name ?? ''];
if (!target || !version) {
  console.error('Usage: npm run release:cut -- <pages|engine|archives|tools> <version> [YYYY-MM-DD]');
  process.exit(1);
}
const root = repoRoot();
const file = join(root, target.changelog);
const fragments = readFragments(root, target.name);
// Prepare every output before writing, so invalid input cannot consume fragments or alter files.
const changelog = cutRelease(withPendingNotes(readFileSync(file, 'utf8'), fragments), {
  version,
  date: date ?? new Date().toISOString().slice(0, 10),
  prefix: target.prefix,
});
const manifest = target.manifest ? join(root, target.manifest) : undefined;
const json = manifest ? (JSON.parse(readFileSync(manifest, 'utf8')) as { version: string }) : undefined;
if (json) json.version = version;
writeFileSync(file, changelog);
if (manifest && json) writeFileSync(manifest, `${JSON.stringify(json, null, 2)}\n`);

consumeFragments(fragments);
console.log(
  `${target.changelog}: ${version} cut${target.manifest ? `, ${target.manifest} set to ${version}` : ''}. Review, commit, merge to master, then tag ${target.prefix}-v${version}.`,
);
