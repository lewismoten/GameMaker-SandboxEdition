// npm run release:draft -- <pages|engine|archives|tools>
// Prints fragments with legacy Unreleased notes, then commit suggestions since the last tag.
// Review suggestions for overlap with authored notes. Never writes files.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pendingNotes, readFragments } from './fragments';
import { TARGETS, commitsSince, filtersFor, lastTag, repoRoot } from './git';
import { groupCommits, renderDraft, skipReason } from './classify';

const target = TARGETS[process.argv[2] ?? ''];
if (!target) {
  console.error('Usage: npm run release:draft -- <pages|engine|archives|tools>');
  process.exit(1);
}
const root = repoRoot();
const tag = lastTag(root, target);
const filters = filtersFor(root);
const all = commitsSince(root, target, tag);
const kept = all.filter((c) => !skipReason(c, filters));
console.error(
  `${target.name}: ${all.length} commits since ${tag || 'the start'}, ${kept.length} kept (merges, formatting, tests, docs, agent notes and secret games left out).`,
);
const pending = pendingNotes(readFileSync(join(root, target.changelog), 'utf8'), readFragments(root, target.name));
console.log(pending);
console.log('\n<!-- Commit suggestions below may overlap the notes above; review before using. -->\n');
console.log(renderDraft(groupCommits(kept)));
