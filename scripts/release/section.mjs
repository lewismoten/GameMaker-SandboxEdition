// Prints one version's section of a CHANGELOG.md, for `gh release create --notes-file`.
// Usage: node scripts/release/section.mjs <CHANGELOG.md> <version>   (exits 1 if the version has no section)
import { readFileSync } from 'node:fs';
import { extractSection } from './changelog.mjs';

const [file, version] = process.argv.slice(2);
const section = file && version ? extractSection(readFileSync(file, 'utf8'), version) : null;
if (!section) {
  console.error(`No section for ${version} in ${file}.`);
  process.exit(1);
}
console.log(section);
