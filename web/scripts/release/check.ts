// npm run release:check
// A package whose src changed since its last tag must list a change under Unreleased, and its changelog's
// newest version must not be newer than package.json's. The site only warns. Exits 1 on a failure.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractSection, hasNoChanges, latestVersion } from '../../../scripts/release/changelog.mjs';
import { TARGETS, commitsSince, lastTag, repoRoot } from './git';

const root = repoRoot();
let failed = false;
for (const t of Object.values(TARGETS)) {
  const file = join(root, t.changelog);
  const problems: string[] = [];
  if (!existsSync(file)) {
    console.log(`FAIL ${t.name}: ${t.changelog} is missing.`);
    failed ||= !!t.manifest;
    continue;
  }
  const text = readFileSync(file, 'utf8');
  const tag = lastTag(root, t);
  const src = commitsSince(root, t, tag).filter((c) => c.files.some((f) => t.path === '' || f.startsWith(`${t.path}/src/`)));
  if (src.length && hasNoChanges(extractSection(text, 'Unreleased')))
    problems.push(`${src.length} commits since ${tag || 'the start'}, but Unreleased lists nothing`);
  if (t.manifest) {
    const version = (JSON.parse(readFileSync(join(root, t.manifest), 'utf8')) as { version: string }).version;
    const latest = latestVersion(text);
    const cmp = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });
    if (!latest) {
      if (tag) problems.push(`${tag} exists but the changelog has no released version`);
    } else if (cmp(latest, version) > 0) problems.push(`the changelog's ${latest} is newer than package.json's ${version}`);
    else if (cmp(latest, version) < 0 && tag === `${t.prefix}-v${version}`) problems.push(`${version} is tagged but the changelog stops at ${latest}`);
  }
  const label = t.manifest ? 'FAIL' : 'WARN';
  if (!problems.length) console.log(`ok   ${t.name}`);
  for (const p of problems) console.log(`${label} ${t.name}: ${p}`);
  if (problems.length && t.manifest) failed = true;
}
process.exit(failed ? 1 : 0);
