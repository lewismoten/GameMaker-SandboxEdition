// Pure helpers for the Keep a Changelog files (CHANGELOG.md at the root and in each package).
// Plain JavaScript with a .d.mts beside it so a tag workflow can run it with bare node.
export const REPO = 'https://github.com/lewismoten/GameMaker-SandboxEdition';
const HEADING = /^## \[([^\]]+)\](?: - (\d{4}-\d{2}-\d{2}))?\s*$/;
const LINK_REF = /^\[[^\]]+\]: \S+/;

/** Lines of the section for `version` ("Unreleased" or "3.1.0") without its heading, or null. */
export function extractSection(text, version) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => HEADING.exec(l)?.[1] === version);
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (HEADING.test(lines[i]) || LINK_REF.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines
    .slice(start + 1, end)
    .join('\n')
    .trim();
}

/** The newest released version (first numbered heading), or null. */
export function latestVersion(text) {
  for (const l of text.split('\n')) {
    const m = HEADING.exec(l);
    if (m && /^\d+\.\d+\.\d+$/.test(m[1])) return m[1];
  }
  return null;
}

/** True when a section lists no change (a summary alone does not count). */
export function hasNoChanges(section) {
  return !section || !/^\s*[-*] /m.test(section);
}

/** The compare/tag links for a release target. */
function refFor(prefix, version, previous) {
  const tag = `${prefix}-v${version}`;
  return previous ? `${REPO}/compare/${prefix}-v${previous}...${tag}` : `${REPO}/releases/tag/${tag}`;
}

/** Move Unreleased into a dated version heading and fix the link references. Throws if there is nothing to cut. */
export function cutRelease(text, { version, date, prefix }) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`Not a version: ${version}`);
  if (extractSection(text, version) !== null) throw new Error(`${version} is already in the changelog.`);
  const body = extractSection(text, 'Unreleased');
  if (hasNoChanges(body)) throw new Error('Unreleased lists no changes to release.');
  const previous = latestVersion(text);
  const lines = text.split('\n');
  const at = lines.findIndex((l) => HEADING.exec(l)?.[1] === 'Unreleased');
  lines.splice(at + 1, 0, '', `## [${version}] - ${date}`);
  const out = lines.filter((l) => !l.startsWith('[Unreleased]: '));
  const firstRef = out.findIndex((l) => LINK_REF.test(l));
  const refs = [`[Unreleased]: ${REPO}/compare/${prefix}-v${version}...HEAD`, `[${version}]: ${refFor(prefix, version, previous)}`];
  if (firstRef < 0) out.push('', ...refs);
  else out.splice(firstRef, 0, ...refs);
  return out.join('\n');
}
