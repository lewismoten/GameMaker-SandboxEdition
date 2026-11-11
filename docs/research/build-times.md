# Case study: build times against a 5-minute cap

Written by Claude (Sonnet 5.5). Measured 2026-11-04.

## Question

The release workflows run on GitHub with a 5-minute budget per run. Which steps are slow, and is anything close to the line?

## Method

- GitHub timings come from the logs of real runs. The API gives no per-step times, so each step's time is the gap between log timestamps.
- Local timings were taken on a development laptop that was busy with other jobs for most of the session, so only the packaging timings (taken at moderate load) mean much.
- Projected GitHub time was local time x 1.4, a rule of thumb from the maintainer. The data could neither confirm nor refute it: no quiet, from-scratch local games build was possible.

## Results

| Workflow | Step | GitHub (real run) | Margin to 5:00 |
| --- | --- | --- | --- |
| Pages (on a tag) | checkout and setup | 12 s | |
| | `npm ci` | 9 s | |
| | build games (every game, 4 workers) | 131 s (an earlier run: 79 s) | |
| | build site | 32 s (24 s) | |
| | upload and deploy | 15 s | |
| | **total** | **204 s** | 96 s |
| Package checks | job | 45 s | 255 s |
| Package publishing | job | 147 s (one run) | 153 s |
| Mac, Windows, Linux downloads | never run on GitHub | unmeasured | |

The games build reported 128.7 s wall and 388.8 s of summed build time across 4 workers. The floor is the larger of 388.8 / 4 = 97 s and the slowest single game (114 s), so scheduling is within about 15 s of ideal. Packaging every game locally took 13.0 s (Mac, dmg and zip), 11.2 s (Windows) and 7.5 s (Linux).

The download jobs had never run, so their cost is an estimate of about 3:00 to 3:50. They are the ones to watch. It is an estimate, not a measurement.

## Findings

- **Compression is not the problem.** A plain deflate of every file on every game disk (85 MB) takes about 1.3 s in total. The only already-compressed type on a disk is `.gif`; 76 of 666 files do not shrink and are stored. The zip writer already stores any file that does not shrink. No zip bytes changed.
- **The games build is the biggest share**, in Pages and again inside every download job.
- **The download jobs built things they never use.** `npm ci` runs the games build, which also makes site-only extras (plastic trinkets, pixel trinkets, laser nickels). The Mac, Windows and Linux builds need only the game disks.

## Fix

Commit `74ce5b40f` adds `GM_SKIP_FIELD_TRINKETS=1` beside two existing skips and sets all three in the three download workflows. Pages is unchanged. Game disk bytes cannot change, since the flags skip only side outputs. The saving per download job is not measured on GitHub.

## A second look: one game's build, profiled

The slowest game is a software ray-traced one. A clean build of that game alone took about 17 s wall but 104 s of CPU, and CPU is what a 4-core runner pays. Rendering 749 frames across 8 shards was about 80 s, and the shard plan was already balanced to within 0.8 s. Several changes gave nothing (reciprocal directions, a second grouping level, gzip level 1 for temporary frames, a larger V8 young generation). One helped (commit `5328997fa`): test groups of four shapes against a union box before their own boxes.

| | CPU, 3 clean builds each |
| --- | --- |
| Before | 104.2, 104.3, 103.8 s |
| After | 97.1, 98.0, 96.8 s (about 6.5% less) |

Every frame stayed byte for byte identical, and the disk was identical in 3 of 3 clean builds. On a 4-core runner that is about 2.5 s less wall time. A large cut would need fewer rays or fewer frames, which changes pixels, so it was not done.

## What these measurements cannot show

- Wall time on the laptop was swamped by waiting for a shared job slot, so CPU time was the measure.
- The 1.4 factor is untested, and the download-job estimates rest on it.
- The new skip flag was syntax-checked but not run live against a forced rebuild.

## Left undone

- Run the three download workflows once and compare their per-step times with the estimate.
- If they run long, build the games once, upload the disks as an artifact and let the packaging jobs download it. That adds a job (one more billed minute).
- Skipping known-compressed file types in the zip writer would save about 0.1 s in total. Not worth it.

## Reproduce

```sh
npm run build:games                 # all games, cached
npm run build:games -- --force      # clean rebuild
npm run check:games -- --game <id>  # two independent builds must match byte for byte
```

The skip flags are documented in [`scripts/README.md`](../../scripts/README.md).
