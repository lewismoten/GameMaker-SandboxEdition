# Tour README destination checks

The test now checks all 24 chapter IDs in tour order and reads every backticked destination in each Page cell. It resolves sample filenames relative to the chapter route, applies query strings to the preceding route, and compares the DOS page with the chapter’s file. Each row is checked against the opening destination and as many following navigation steps as the row documents. Three regression cases cover the opening animation, the final slideshow file, and the player tab.

## Reproduction

On Tuesday, November 24, 2026, I ran the following command from `web/` for each substitution below. Each run changed only the indicated backticked value in `src/tour/README.md`. I restored the original bytes after every run.

```sh
npx vitest run src/manual/bookLinks.test.ts -t 'opens the documented tour chapter routes'
```

| Page cell substitution | Original test (UTC) | Updated test (UTC) |
| --- | --- | --- |
| `intro.fli` → `missing.fli` | 02:46:27 · exit 0 · 1 passed, 19 skipped | 02:46:46 · exit 1 · 1 failed, 22 skipped |
| `?tab=player` → `?tab=missing` | 02:46:29 · exit 0 · 1 passed, 19 skipped | 02:46:49 · exit 1 · 1 failed, 22 skipped |

Vitest reported these differences in the updated test:

```diff
 edit-animation
-   "#/p/look:logic/intro.fli",
+   "#/p/look:logic/missing.fli",

 edit-player
-   "#/p/look:logic?tab=player",
+   "#/p/look:logic?tab=missing",
```

## Verification with the README restored

Commands ran from `web/`, using paths relative to that directory. The full test file ran Tuesday at 02:46:58 UTC.

```text
$ npx vitest run src/manual/bookLinks.test.ts
 Test Files  1 passed (1)
      Tests  23 passed (23)

$ npx prettier --check src/manual/bookLinks.test.ts
Checking formatting...
All matched files use Prettier code style!
```

`npx eslint src/manual/bookLinks.test.ts` exited 0 with no output. The initial `npx tsc --noEmit -p .` exited 134 with “Allocation failed - JavaScript heap out of memory”. The retry, `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .`, exited 0 with no diagnostics.

Suggested commit message: `test: check filenames and tab routes in the tour chapter table`

Changes are uncommitted. No credits were added.
