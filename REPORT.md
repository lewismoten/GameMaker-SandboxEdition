# Q110 game checks

The leap checker now applies the entrance gravity filter only to ground run-ups. It checks a reachable ladder top when the ladder tile has zero gravity, the air above pulls down, and the character has a direct-rise jump. The regression places a gate on the First Steps island, starts Kit on the ladder below it, and checks the reported takeoff and lock coordinates. The fixture uses an in-memory copy of the built disk.

The First Steps demo test now reads scene 0, slot 11 from the built game, asserts that it names `demo.rec`, and plays that assigned recording through the wall crossing. Added the OpenAI Codex credit to NOTICE.md.

## Verification on Saturday, November 21, 2026 (UTC)

- 09:59 — Checked the last ten commits and inspected the original change in `b3669b5f9`. The requested review file was absent from the worktree and the main checkout, so the supplied finding text was used. Git reported the current branch as `feature/fix-q110-games-a`, tracking `origin/develop`.
- 09:59 — Baseline Prettier passed on the two existing source files. The focused Vitest command passed both First Steps tests. There was no leapCheck test file yet. Web ESLint and TypeScript exhausted the default Node heap. The TypeScript retry with a 6 GiB heap passed.
- 10:00 — Ran the new ladder regression against the original gravity filter. It failed as expected because the checker reported no bypass. After the fix, both focused test files passed (three tests).
- 10:01 — Ran Prettier on the changed TypeScript and NOTICE.md, then verified formatting and ran `git diff --check`. Both passed. Rebuilt First Steps (45 files), ran its `tools/check.ts` (both levels completed, score 300), and reran the focused Vitest files (three passed).
- 10:02–10:03 — Web TypeScript passed with a 6 GiB heap. Web ESLint passed with an 8 GiB heap. The all-Starter leap checker passed. First Steps passed the reproducibility build and all applicable per-game checks. The runner skipped its player check.
- 10:03 — The full First Steps check finished successfully. Save signs, level secrets and box hours, and versions passed. Tin hearts were skipped. The runner listed one advisory for an accepted finding without a reason.
- 10:03 — Checked the report with Prettier and ran the final Git whitespace check. Both passed.

## Suggested commit message

`Fix ladder-start lock coverage and verify the First Steps title demo assignment`
