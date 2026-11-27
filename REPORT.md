# Q293: already.mjs double-counted lines

## Found
Not fixed on develop. `scripts/already.mjs` summed per-word `git grep -c` counts, so a line with two matching words counted twice. Commit e2395d071 had only relabeled the number "word-line matches" and a test locked that in.

## Changed
- `fileCounts` is now `fileHits`: `git grep -n` per word, keeps line numbers per file.
- `rankFiles` takes `{word: {file: [lineNumbers]}}` and counts the union of line numbers per file (a line hit by two words counts once). Output label is now "N line(s)".
- `web/test/already.test.mjs`: rankFiles test uses line arrays and asserts dedupe; the fixture test now expects `both.txt [2/2, 1 line]`.

## Verification
- Fixture (a repo with `both.txt` = "cat dog"), `node scripts/already.mjs cat dog`:
  before: `both.txt [2/2, 2 word-line matches]`; after: `both.txt [2/2, 1 line]`.
- Real repo, `node scripts/already.mjs rankcommits rankfiles`:
  before: `web/test/already.test.mjs [2/2, 4 word-line matches]`; after: `[2/2, 3 lines]`
  (`scripts/already.mjs` stays 4 lines).
- `npx prettier --check scripts/already.mjs web/test/already.test.mjs`: passes.
- NOT run: vitest. The worktree has no node_modules (`ERR_MODULE_NOT_FOUND: vitest`). The test file was only checked by prettier, and its fixture scenario was reproduced by hand above.

## Suggested commit message
Count a line once in already.mjs when several search words match it (Q293)
