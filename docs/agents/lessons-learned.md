# Lessons learned from running AI coding agents

Principles from building Game-Maker: Sandbox Edition with several agents at once. Each one
points to something in the repository you can read: a commit, a script, a test or a document.
Commit hashes are from this repository's history (`git show <hash>`).

## 1. Write the rules down where every agent reads them

Agents start each task with no memory of the last one. Rules that live in a conversation are
lost; rules in the repository are followed. [`AGENTS.md`](../../AGENTS.md) holds working
rules (branches, commits, formatting, scope) and [`CLAUDE.md`](../../CLAUDE.md) holds the big
picture. When a mistake happens twice, add a line. Commit `b33408537` added a batch of rules
(scope, pull requests, claims, bots, previews, facts) after a round of such mistakes.

## 2. Commit small, push often, one branch per task

Work that sits uncommitted is lost when an agent stops, and another agent cannot take it
over. AGENTS.md asks for small commits (a few files at a time, committed by path), a pushed
branch every few minutes and a merge back with `--no-ff`. Several agents then work at once
without trampling each other. Merges such as `4b9e21179` and `4a93bf213` show the shape: one
feature branch, one merge commit.

## 3. Protect the person's running environment

An agent that restarts or reloads the maintainer's dev server makes the page unusable while
they work. AGENTS.md says to leave that server alone and to check changes in a separate
headless browser on another port. `npm run heavy`
([`scripts/heavy.mjs`](../../scripts/heavy.mjs), added in `ff7fa3da6`) goes further: heavy
jobs wait for one of two shared slots so a laptop stays usable with several agents running.

## 4. Do what was asked, and no more

Left alone, agents add features, games and settings nobody wanted, and drift (many branches,
runaway builds). The Scope rule in AGENTS.md says to do what was asked and, when told to wrap
up, to finish what is in hand and pick up nothing new. Write briefs with a narrow scope and
a named list of files, and have the agent stop and report when a job grows.

## 5. Make the check, not the claim, the evidence

A confident report is not a test. Reports should keep "checks passed" apart from "still needs
a live look". Checks here are scripts that rebuild, read back and replay:
`npm run check:games` runs them all, and `games/kit/` holds one file per check
(for example [`hiddenView.ts`](../../games/kit/hiddenView.ts),
[`clipCheck.ts`](../../games/kit/clipCheck.ts)). `npm run verify:changed`
([`scripts/verify-changed.mjs`](../../scripts/verify-changed.mjs)) is the quick pre-merge
version. Also look at the output yourself: art, screens, printables and sound.

## 6. A passing bot is not a playable game

A bot that reaches the end can still hide a game that is dull or unfair: it may skip visible
treasure, idle on menus, leave a boss half-fought, or press keys faster than a person can.
AGENTS.md's "Bots and checks" rule asks for human timing and for bots to collect and fight
as a player would. [`games/kit/keyAccess.ts`](../../games/kit/keyAccess.ts) (`npm run
check:keys`) measures how much of a walkthrough uses the arrows, Space and Enter alone.

## 7. Phrase automated findings as suggestions

A checker cannot see everything, and wording that treats taste as a rule makes authors
distrust it. The editor's Level check (`web/src/editor/check/`) and AGENTS.md both say a
finding is something the author can dismiss, and say what the tool cannot see.

## 8. Verify before trusting an input

Agents trust names and extensions unless told not to. An importer that decided a file's type
from its extension misread other programs' files; AGENTS.md's Imports rule ("look at a file's
contents before trusting its extension") records the fix.

## 9. Search before saying something exists

Agents will say code exists when it does not. Ask for the file and line. AGENTS.md's Claims
rule asks agents to search first and to label an inference as one ("appears to be").

## 10. Keep a reference implementation as the source of truth

The original DOS source in `code/` is the reference for engine behavior, and files stay in
their original formats so DOS can still read them. Editor-only data goes in a companion file
(`web/src/project/companion.ts`). Agents check the reference before changing behavior, and
leave the preserved originals untouched (AGENTS.md, "The original repository's files").

## 11. Preview means a real render

Placeholder previews (an emoji, a black box) hide whether a feature works. AGENTS.md's
"Previews and labels" rule says a preview is always a real render and that every label says
what the thing does. Labels that over-promise, or flows with no clear start and end, were
found and fixed by looking at the screen.

## 12. Look at generated art the way a stranger would

Generated art drifts from its reference and can read as something unintended. Compare it to
the reference at normal size and zoomed in, and ask what a child would point out. Shared
drawing code for recurring characters and props lives in [`games/kit/`](../../games/kit/) so
each is drawn the same way every time.

## 13. Text must hold wherever it is read

A README is read on GitHub and on npm; a credits page in a DOS export should not mention the
web. The "Where it's read" rule in AGENTS.md covers this. Background given to an agent is not
game text, and personal facts are used as given, never invented.

## 14. Credit honestly and at once

Third-party code, AI tools and source material are credited when first used, with the
tool named and what it made. [`NOTICE.md`](../../NOTICE.md) is the record; AGENTS.md's
Credits section is the rule. An inference is never promoted to a fact in a credit.

## 15. Guard against the dangerous defaults

Some mistakes cannot be undone: a pull request opened against the wrong repository stays
there. AGENTS.md spells out the exact flags for opening one. Hook scripts in
[`scripts/hooks/`](../../scripts/hooks/) (added in `ff7fa3da6`) can refuse some mistakes
outright, such as committing without the required trailer. Prefer a guard to a reminder.

## 16. Keep notes outside the chat

A long run can be cut off by a usage limit or a context reset. Keep the state of the work in
files: a short handoff, a list of open questions, a commit history that reads like a log. The
[task bank pattern](task-bank-pattern.md) describes one way to do this.

## 17. Size is not quality

More levels, more files or more lines are not progress by themselves. Ask whether each part
is worth using. The game quality bar (a walkthrough long enough to matter, a reason to keep
playing) is checked by playing, not by counting.
