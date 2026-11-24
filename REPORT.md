# Batch import of ZIPs with the same filename

On Tuesday, November 24, 2026 at 02:46 UTC, the regression reproduced the defect described in the adversarial review of `71c171cf2`. It creates two distinct `ScanFile` objects named `good.zip` with `createZip`. Each contains a `main.gam` serialized from `newGame` and a single-byte `hero.cel`. The first game's title is First and its byte is 1. The second game's title is Second and its byte is 2. Two loose files, `a/hero.cel` and `b/HERO.CEL`, contain 3 and 4.

The test passes all four files to `scanImport`, verifies that it finds First and Second in order, then reads both sequentially through one `GameReader`. Before the fix, both reads returned the first archive's hero byte, yielding 1 and 1. After the fix they returned 1 and 2, and both extracted game files matched their respective serialized inputs.

The reader keeps one archive in its cache. A hit requires the same outer file object and the same JSON-encoded array of inner archive names, preserving the boundaries between names.

## Verification

From `web/`, the command `npx vitest run src/project/importScan.test.ts` produced the following summaries before and after the change.

Before, Tuesday 02:46 UTC

```text
Test Files  1 failed (1)
     Tests  1 failed | 26 passed (27)
```

After, Tuesday 02:47 UTC

```text
Test Files  1 passed (1)
     Tests  27 passed (27)
```

The regression exercises the bytes returned to the batch importer. Browser selection and persistence were outside the test.

Suggested commit message: `Fix GameReader cache collisions between same-named ZIP files`

Prettier passed on the changed files. ESLint passed on both changed TypeScript files. The project typecheck exhausted Node's default heap and passed on retry with `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit -p .`.
