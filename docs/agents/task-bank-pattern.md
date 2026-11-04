# The task bank pattern

How to keep a team of AI coding agents useful across long, interrupted runs. This page
describes the pattern with generic roles and made-up examples. The rules this project's
agents actually follow are in [`AGENTS.md`](../../AGENTS.md) and
[`CLAUDE.md`](../../CLAUDE.md); the project's own task records are not published.

## Roles

- **Maintainer:** sets direction, plays the results, answers questions.
- **Coordinator:** one long-running agent session the maintainer talks to. It chooses what
  to run, starts workers, and reports each result as it arrives.
- **Workers:** short-lived agents, each given one brief, one branch and a named set of files.

## 1. The task bank

A task bank is a plain Markdown file of recurring checks and improvements the coordinator
works through whenever assigned work is done and nobody is waiting. Its shape:

```markdown
## Docs
- [ ] Every command in the README still runs. last: 2026-03-02, 1 stale flag fixed
- [ ] Every internal link resolves. last: never
```

Rules that make it work:

- **Dated, not ticked.** Each item carries a `last:` date and a short note, so the next
  cycle starts with whatever is oldest or changed most since it was last done.
- **Small and reproducible.** An item names a command or a thing to look at, not a theme.
- **Sections by moment.** Group items by when they apply: start of a run, with each change,
  before a merge, after an engine change, before a release.
- **One writer.** If two agents may run items, only one edits the file; others log results
  in a file of their own, and the writer folds the dates in.
- **A progress file beside it** lists what was done this cycle and an "up next" queue.
  Each run starts by reading it and ends by updating it.

## 2. Questions and defaults

Keep a short list of open decisions, separate from status. Only questions that block work
belong in it. For everything reversible, choose a sensible default, continue, and write the
choice down. Move answered questions out so the list always shows what remains.

## 3. The brief

A worker only knows what the brief says. A good one is short and has:

1. **Goal:** one sentence, and what done looks like.
2. **Scope:** the files or folders it may touch, and what it must not.
3. **Context pointers:** documents to read, instead of retyped text.
4. **Already ruled out:** so it does not repeat dead ends.
5. **Branch and merge instructions:** its own branch, whether it may merge or only push.
6. **Report format:** what changed, the commits, what was checked, what was not, and what
   is left.

Example:

> Add a link check to `docs/`. Touch only `scripts/linkCheck.mjs` and `docs/README.md`.
> Read `docs/README.md` first. Branch `feature/link-check`; push, do not merge. Report
> which links were broken and what you could not check.

A brief should not hand the worker the answer it hopes for: say what to find out, not what
the result must be.

## 4. The handoff note

When a run may end (a usage limit, a context reset, the end of a day), the coordinator writes
a handoff so a fresh session can continue. A handoff holds only what the repository cannot
tell you:

- what is running or waiting, and where its output will be;
- branches in flight and whether each is pushed or merged;
- decisions made and why;
- open questions and the default being used;
- the next three things to do.

It does not repeat the rules (they are in `AGENTS.md`) or the history (it is in `git log`).
Example:

```markdown
## Handoff
- feature/link-check: pushed, awaiting merge, 2 broken links remain in docs/embed.md
- Decision: external links are skipped (flaky); revisit if CI gets network access
- Next: run the docs tests, then item "Every command in the README still runs"
```

## 5. Parallelism and load

- Give each worker its own branch and, where possible, its own working copy.
- Limit heavy jobs (full test runs, builds) to a few at a time; this project's
  [`scripts/heavy.mjs`](../../scripts/heavy.mjs) is one way.
- Cap how long any single job may run, and stop jobs that hang.
- When wrapping up, tell workers to finish what they have and pick up nothing new.

## 6. Reporting

Report each result when it arrives, not in one pile at the end. Keep what passed apart from
what still needs a person to look. Say how long things took, with weekday and time, if a
timeline helps. Credit the tools used.
