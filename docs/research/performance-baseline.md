# Case study: a performance baseline and what the fixes changed

Written by Claude (Sonnet 5.5). Baseline 2026-11-02; later fixes and checks to 2026-11-04.

## Question

The maintainer's field numbers on 2026-11-01 were a largest contentful paint (LCP) of 2.9 s and an interaction to next paint (INP) of 6.9 s. Where does the time go?

## Method

- Every run used a scratch production build (`vite build`), previewed locally, in Playwright's bundled headless Chromium at 1440 x 900, with a fresh browser per page.
- "Full speed" is the laptop as it is. "4x" uses Chrome DevTools Protocol CPU throttling to stand in for a middling laptop.
- Tools: `perf:trace` (page loads, optional V8 CPU profile), `perf:tasks` (named user steps), `perf:memory` (open, use, leave, repeated, with forced garbage collection before each sample).
- Long tasks are main-thread tasks over 50 ms. INP here is the slowest click to the next paint.

The laptop could not reproduce an INP of 6.9 s at full speed: every ordinary click was under 200 ms. The slow things below all start work on a click that then runs for seconds, which is what INP records when the next click lands inside it.

## Baseline

Most pages were light (the editor views under 1.5 MB and under 400 ms of script, no long task over 160 ms). The exception was the desk, a 1994 desk scene with boxes of printed paper.

1. **Opening a game box** ran about 9 s of main-thread work in 48 long tasks at full speed; at 4x, ready took 25.3 s with one 21.2 s task. Two pieces made up almost all of it: the hint book's hidden-answer pictures (about 3,600 canvas-to-PNG conversions, 4.4 s) and the level maps (2.8 s). The list of pictures was rendering every page of every piece to draw a 60 px thumbnail of the first page.
2. **Memory.** The desk held 21.6 MB in 84 PNG blob URLs that were never released.
3. **Layout shift.** Home scored 0.154 at 1440 px (above 0.1 is poor) because a bar changed height by 3 to 4 px above a large grid; 0.31 at 390 px because a panel was hidden until its data arrived and then pushed the library down 312 px.
4. **dos.html LCP of 3.3 s** was the boot sequence of the emulated PC, not a defect.

## Fixes and results

| What | Before | After | Commit |
| --- | --- | --- | --- |
| Open a game box, full speed | 48 long tasks, 9,955 ms, longest 5,024 ms | 4 long tasks, 839 ms, longest 298 ms | `f9bc13d5a` |
| Open a game box, 4x | ready 25,319 ms, longest task 21,198 ms | ready 2,913 ms, longest 1,372 ms | `f9bc13d5a` |
| Level-map blobs after viewing twice | 26, 97, 168 (96 MB), none released | 26, 27, 26, 27, 26, released on close | `f9bc13d5a` |
| Home layout shift, 1440 px | 0.154 | 0 | `1d3f4ee9b` |
| Home layout shift, 390 px | 0.313 | 0.022 | `8c330767f` |
| Desk, blobs left after leaving | 128 after four visits | 0 | `fb582a9b1` |
| `dos.html` script time | 430 to 480 ms | 230 to 250 ms | `3b5f9fe31` |
| Open a game box at 4x, INP | 312 ms | 128 ms | `a1b0608a1` |

How they work: a piece's list picture builds only its first sheet (the printing and the viewer still build every page, so output is the same). The viewer releases its blobs when closed. The home bar keeps its tallest height. The text screen of the emulated PC redraws only cells that changed. The desk makes its audio context in idle time, 1.5 s after it opens, so the first box click no longer pays about 170 ms to build it.

A later round (2026-11-03) cut work from reading each game's zip repeatedly: the picture readers now peek at the few files they need (`5337fbb87`, `3ffe5c728`), disk label strips draw only when on screen, and each hint-book word draws in its own task. Its honest reading: the box-open and disk-box steps did not move, because other work dominated them. A follow-up (merged in `c63d5eecb`) draws thumbnails in slices after input goes quiet, so closing a box no longer waits 1.2 s.

## Regression check (2026-11-04)

Against the baseline, everything stayed within 10% except `dos.html` script time (looked worse, then traced to machine state and fixed above) and one regression: black-light pictures on the desk were never revoked (32 blobs per visit), fixed in `fb582a9b1`. A build made without the games' output has a short catalog and gives false numbers (home layout shift 0.17), so measure with the games built.

A budget now guards this: `npm run verify:perf` checks bytes, request counts and INP at 4x on a scratch production build (commits `8263de1f6`, `7ed227d63`).

## What these measurements cannot show

- One machine, one run per cell in most tables. A single run can swing by a few hundred milliseconds, so only big changes mean anything.
- Headless Chromium is not Safari on a phone. The audio-context change was checked in headless WebKit, which does not enforce the user-gesture rule, so a real phone is still needed to confirm the first tap makes sound.
- The lab did not reproduce the field INP; the box-open work is the best candidate, not a confirmed cause.
- 4x throttling approximates a slower CPU, not a slower disk, network or memory.

## Left undone

- The hint book's print-only pictures are still made on screen; moving them to just before printing risks blank prints and needs a print test.
- The sticker sheet draws every page for a list picture that needs one.
- First desk open is still about 14 s at 4x in a profile run, mostly shelf drawing.
- The Sandbox mug and the magazine open at 4x still show tasks over 500 ms.
- Heap climbs 0.1 to 0.3 MB per view visit and levels off near 25 MB after a long session. No detached DOM was found.

## Reproduce

```sh
cd web
npx vite build --outDir /tmp/gm-perf --emptyOutDir
npm run perf:trace  -- --dist /tmp/gm-perf --port 5195
npm run perf:tasks  -- --dist /tmp/gm-perf --port 5195 --throttle 4
npm run perf:memory -- --dist /tmp/gm-perf --port 5195 --cycles 5 --snapshot
npm run verify:perf
```

Script options are in [`web/scripts/README.md`](../../web/scripts/README.md).
