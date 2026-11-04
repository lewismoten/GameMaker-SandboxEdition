// npm run release:draft -- <pages|engine|archives|tools>
// Prints a draft "Unreleased" body from the commits since the target's last tag, for a person to edit
// into its CHANGELOG.md. It never writes a file, so hand-written text is safe.
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
console.log(renderDraft(groupCommits(kept)));
