# Q485–Q488 report (site worker range handling)

Saturday, 2026-11-28 (EST). Overwrites the earlier tracked Q484 report at this path (still in git history).

Earlier work: `git log --all --oneline | grep -i q485` found nothing. `.for-lewis/research` is absent in this worktree; I read the review from the main checkout.

## What changed

All in `web/src/siteWorker.ts` (`withRange`, and where it is called). Nothing is committed.

- **Q487 (network waits for whole body):** `withRange` no longer wraps the whole fetch handler. It runs only where a stored response is returned: the current snapshot hit, the older-snapshot fallback after a network failure, and the browsing-cache hit. Live network responses pass through untouched and stream.
- **Q485 (Content-Encoding):** the early return for `content-encoding` is gone. The cached body is the decoded one, so offsets and length come from its bytes. The 206 drops `Content-Encoding`, and a weak ETag (or any ETag when the encoding header was present) too. Live network responses are unchanged.
- **Q486 (If-Range):** a cache hit with `If-Range` is sliced only if it matches the stored strong ETag exactly, or the stored `Last-Modified` exactly. Otherwise the full 200 is returned. Weak validators never match.
- **Q488 (case):** the `bytes=` regex has the `i` flag.
- Release fragment: `changes/unreleased/pages/fix-q485-gzip-offline-range.md`.
- Tests added in `web/test/siteWorker.test.ts` (`range requests`): gzip + weak ETag cached body gives a 206 with the right Content-Range, no Content-Encoding and no ETag; `Bytes=0-1` gives 206; stale/weak/date `If-Range` gives a full 200 and matching ones give a 206; a network response that never finishes streaming, requested with `Range: bytes=0-0`, resolves without waiting.

## Verified

- `npx vitest run test/siteWorker.test.ts scripts/offlinePlayback.test.ts src/tour/tourSound.test.ts`: 3 files, 18 tests passed.
- `npx prettier --check` on the changed source, test and fragment: clean.
- `npx eslint src/siteWorker.ts test/siteWorker.test.ts`: no output (clean). It aborted with a Node out-of-memory crash at the default heap, then passed with `NODE_OPTIONS=--max-old-space-size=8192`.
- `npx tsc --noEmit -p .` (same heap setting): 16 errors, none in `siteWorker`. They are in `games/pass-the-pie`, `editor/...` and similar, and mention `damageTaken`, `looseErrors` and `selection`. They appear to come from stale `dist/types` in the packages I linked from the main checkout, because this worktree has no `node_modules`. I did not confirm this on a clean install.
- To run anything I temporarily symlinked the main checkout's `node_modules` and `web/node_modules` into this worktree, then removed them. `git status` shows only the three intended paths.

## Not tested

- No Playwright or real-Chromium run, and not the tour's `play()` path with a real gzip Ogg. The unit tests use a text body and the worker's range logic.
- I did not run the new streaming test against the pre-fix code to watch it fail.
- No `check:offline`. Production hosting headers were not sampled.
- Entries saved by earlier workers are covered, since the fix reads whatever is stored. Not tested separately.

## Suggested commit message

Fix Q485-Q488: range-slice only cached responses (decoded, no Content-Encoding), honor If-Range, stream network, match bytes= case-insensitively
