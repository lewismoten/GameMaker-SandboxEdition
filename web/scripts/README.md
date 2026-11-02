# `web/scripts/`: build-time code

Part of the [source map](../src/README.md). A name with no folder is a file here, `../` is `web/`, and
the other folders named (`manual/`, `gfx/`…) are under `web/src/`.

`../../scripts/build-games.mjs` generates ignored `games/<id>/disk/` and `walkPaths.json` outputs. Root `npm ci` builds them after the workspace packages; the web development, build and test commands refresh them automatically. `npm run build:games -- --force` forces a clean rebuild. A per-game key (the files its `build.ts` imports, see `scripts/game-import-keys.mjs`) and an output hash in ignored `games/.build-cache.json` skip unchanged builds. Each game runs in its own process, with two builds at a time (`GM_BUILD_JOBS`; every core on CI), slowest first; `--timing` prints per-game seconds and `--game <id>` limits the run.

This folder holds the build's Vite plugins and the scripts run by hand (from
`web/`, `npx vite-node scripts/<name>.ts`).

- Vite plugins, imported by `../vite.config.ts` (which also emits the service worker and
  `player-files.json`):
  - `cdGames.ts` serves the CD's games and `../games` (and writes them into the build, with the
    catalogs and one DOS ZIP per game at a permanent URL; loose game payloads and GMPK copies are not emitted);
  - `gameShots.ts` draws each listed game's pictures into `games/shots/`;
  - `singlePageBuild.ts` builds `standalone.html`, and `hostedPlayerBuild.ts` the web player
    (`web-player.html`, `player/index.html` and `player/games.json`);
  - `downloadsList.ts` draws `downloads.html`'s game cards (each with its real level picture when the build made one) and their styles;
  - `seoBuild.ts` puts tags, JSON-LD and readable text into the pages and writes (and serves in dev)
    `robots.txt`, `sitemap.xml`, `llms.txt`, each game's `play-<id>.html` and its preview picture
    `og/<id>.png` (drawn by `ogImage.ts`), `downloads.html` (a plain page linking every listed Sandbox and Bizarre game's ZIP, for crawlers and the Internet Archive), each Guide section's page `help-<id>.html` (its text from
    `manual/guideSections.ts`, which `webManual.ts` shows), and The Sandbox Scoop's RSS feed `scoop.xml`
    (`scoopFeed.ts`: every game's `printables.json` news story, dated from `scoopDates.json`).
- `devLog.ts`: the dev server's `gamemaker-dev-log` plugin (`vite serve` only). It appends the page's opt-in interaction log (`src/devLog/interactionLog.ts`) to `../.for-lewis/debug/interaction-log/<local date>.jsonl`, taking only POSTs from this machine of at most 256 KB.
- `perfCheck.ts` (`npm run perf:check -- [--port 5196] [--url <url>] [--out dir]`): starts its own vite (never 5173), or measures `--url` (e.g. a `vite preview` of a scratch build: the dev server serves modules one by one, so first opens there are several seconds slower than in production) and clicks through the site in Playwright's bundled headless Chromium: each nav page, the editor's biggest song, map and blocks with their tabs, play and stop, leaving, the desk. It prints per step the time until quiet, LCP, INP, CLS, long tasks and playback frame times next to the last run, and writes `../.for-lewis/research/perf/perf-<time>.json`.
- `perfLib.ts`: what the perf scripts share (options, a server of their own, Playwright's bundled headless Chromium, the page observers for LCP, INP, CLS, long tasks, blob URLs, workers and audio contexts). The server is a dev server on `--port`, or a `vite preview` of `--dist <scratch build>` (`vite build --outDir <scratch>`: measure this, not the dev server); `--url` uses someone else's. None of them ever uses 5173.
- `perfTrace.ts` (`npm run perf:trace -- [--dist dir] [--port 5195] [--only desk,help] [--trace dir]`): opens each page fresh and prints requests and bytes, scripts fetched, time until quiet, LCP, CLS, long tasks, script / layout / style time, heap, and what the page allocated (blob URLs still alive and their bytes, workers, audio contexts, bitmaps). `--trace` also saves a Chrome trace per page (open it in DevTools Performance).
- `perfTasks.ts` (`npm run perf:tasks -- [--dist dir] [--throttle 4]`): does what a person does (home, the walkthrough player, the editor's song, map, blocks and character with every tab, play and stop, zoom, paint, the desk and its overlays) with real mouse clicks. Per step: INP, long tasks, time until quiet, heap, frames while playing, and the hottest functions of a CPU profile for every step that ran long. `--throttle 4` slows the CPU four times, which is closer to Lewis's laptop than this machine.
- `perfMemory.ts` (`npm run perf:memory -- [--dist dir] [--cycles 4] [--snapshot] [--only song,desk]`): repeats each task (open, use, leave) and records heap, DOM nodes, listeners, live blob bytes, workers and audio contexts after a forced collection. A figure that climbs every cycle is a leak. `--snapshot` takes a V8 heap snapshot after the first and last cycle and names the objects that grew and the detached DOM. It ends with a long session through every view.
- `domainsCheck.ts` (`npm run domains:check`): asks each registry's whois (and DNS) whether every
  made-up domain in `../src/manual/magazine/mockSites.json` is still unregistered, with a
  nonsense-name control per TLD; prints a table, exits 1 if one is taken, 2 if a lookup couldn't run.
  Needs the network, so it isn't in CI or vitest. `oldWebShots.ts` re-renders the article's pictures
  from the same JSON.
- `forceTheme.ts`: for headless checks. `forceTheme(ctx, 'light')` before `newPage()` stores the site's
  own theme (`gm-theme`), because the theme defaults to dark and Playwright's `colorScheme` doesn't
  change it; `pageTheme(page)` reads `data-theme` back so a check can confirm it (`dos.html` and the
  web player don't set one). Without it a "light" screenshot or axe run is probably dark.
- `tourCheck.ts` (`npm run tour:check -- <chapter>[,<chapter>]`, or `all`): starts its own vite on a
  free port from 5190 (never 5173) with a scratch cache, plays the tour chapters in headless Chrome
  (playwright-core) at 1440 and 390 wide, light and dark, stepping through paused, and prints a table
  of each step (`ok`, `skipped` for an optional step with no control, `MISSING`) plus the axe
  violations seen on every step (so on what a chapter opens too) and any horizontal scroll. It exits
  non-zero on a missing non-optional step and stops its server.
- `tourAudit.ts` (`npm run tour:audit -- [--chapter <id>[,<id>]] [--url <url>] [--sizes 1440x900,390x844] [--max 240]`):
  plays chapters in real time in headless Chrome (own vite when no `--url`, never 5173; run it alone,
  two Chromes at once give false voice cuts) and flags, per step, a bubble far from its speaker or over
  another host, a voice clip that did not play to the end (clips are matched to steps by file name; a
  clip still mid-play when the next starts or the tour ends is a cut; the pause `stopVoice` causes is
  ignored; a step with no clip file is not flagged), and a target under the caption bar. Local only,
  not in CI; exits 1 on any flag.
- Data files the site reads, written by hand-run scripts (their tests fail until they are rerun):
  - `credits.ts` writes the Credits page's `deps.json`;
  - `scoopDates.ts` the day each Sandbox Scoop story was first committed, `scoopDates.json` (the
    site's build checks out only the latest commit, so it can't ask git);
  - `levelSecrets.ts` (with `levelSecretsScan.ts`) the Level Maps' `levelSecrets.json`;
  - `levelViews.ts` (with `levelViewsScan.ts` and `levelViewsPlay.ts`; slow, so give it the game ids
    that changed) their `levelViews.json`;
  - `castHidden.ts` (with `castHiddenScan.ts`) the cast page's `hidden.json`;
  - `shotFrames.ts` (with `shotFramesDraw.ts`) the moments of play that box shots and manual
    shots ask for (`["clouds.map", 0, 0, { "tick": 840 }]`, `<shot … tick="840">`;
    `gfx/shotFrame.ts`), replayed from each game's walkthrough (`walkthrough/frames.ts`) into
    `../public/frames/`; give it the game ids that changed;
  - `gameMakerArchive.ts` the Shareware Shelf's `gameMakerArchive.json`;
  - `oldWebShots.ts` (with `oldWebPages.ts`) TURBO BUTTON's three made-up 1996 web pages in a made-up
    browser, `public/magazine/oldweb-*.webp`, 640 x 480, rendered with headless Chrome and `cwebp`
    (`npx vite-node scripts/oldWebShots.ts [dir for PNG copies]`). The pages are period HTML 3.2 (no CSS;
    the browser frame adds the bevels), and `oldWebArt.ts` draws their pixel-art banner, tile and buttons;
  - `videoTranscript.ts` a Library video's `public/videos/<id>.transcript.json`, from its YouTube
    automatic captions (`yt-dlp --skip-download --write-auto-subs --sub-langs en-orig <url>`, then
    `npx vite-node scripts/videoTranscript.ts <id>.en-orig.vtt`): the rolling repeats removed, about
    a minute a paragraph, and the names the captions mishear spelled right; everything Lewis said
    is kept as he said it.
  - `videoTranscribe.ts` (`npm run video:transcript -- <youtube-id>`) the same file from the video's
    own audio when its captions are poor: yt-dlp (audio only), ffmpeg (16 kHz mono wav), `whisper-cli`
    with the large-v3 model in `~/.cache/whisper-cpp` (`-mc 0` stops its repeat loops), then
    `videoTranscript.ts` on the .srt. Work files go in the git-ignored `web/.video-work/<id>/`.
    Its Library entry (`src/library/videos.ts`) says `transcript: 'audio'`, so the video's page
    says where its words came from. `videoTools.ts` holds the id and tool checks; a missing tool or model is named before anything runs.
    A long video takes hours. It is only for the maintainer's own YouTube videos (the Library's), to
    make their captions (.srt) and transcripts. It runs by hand: no build, test or GitHub Action runs
    it, and none of them needs yt-dlp, ffmpeg or whisper-cli (`test/videoTools.test.ts` uses a fake
    PATH). A missing tool is named along with how to install it (Homebrew lines, and the model's
    download URL).
- The guided tour's voice: `narrate.ts` (`npm run voice`; `npm run voice:all` records every
  line again) speaks each line of `tour/lines.ts` in its host's voice (cloned from one of Lewis's voice
  samples with Pocket TTS, or one of Kokoro's stock voices via `kokoro.ts`, which runs Kokoro in
  a child process from the git-ignored `/.narrate` folder that `npm run voice:setup` fills; then
  shifted in pitch and speed as `HOSTS` in `tour/steps.ts` says),
  locally, into `../public/tour/voice/<chapter>/<id>.ogg` (Opus, mono, about 10 kbps), and
  rewrites `index.json` (id → chapter, where, words, seconds and hashes, so unchanged lines are
  skipped) and the generated `README.md` there. Its parts are in `narrate/`: `pocketTts.ts` (the
  engine, ported from pocket-tts-js, MIT), `audio.ts` (ffmpeg in and out: the voice sample's
  clearest 10 s, the pitch and speed shift, even loudness, the Opus encoding), `spoken.ts`, `lineIndex.ts` and `voiceReadme.ts`. The
  model, the engine and the voice samples stay outside the repo (`--model`, `--engine`, or
  `POCKET_TTS_MODEL`, `POCKET_TTS_ENGINE`, and `NARRATE_SAMPLE_<NAME>` for a sample named in
  `SAMPLES`; `--sample <file>` puts every line in one recording, to compare); CI never runs it.
  `npm run voice -- --split sentences|clauses|stretch` (default `none`) voices each sentence, or each clause, alone and joins the trimmed pieces with fixed silences (`narrate/split.ts`: 0.45 s after a sentence end, 0.25 s after a comma), to give the cloned voices real pauses; `npm run voice -- --only <id>` records a retake (each take differs; `--seed <n>` repeats one),
  `--lines <file.json>` reads `[{ id, chapter, where, text, voice? }]` instead of the tour, `--out <dir>`
  writes elsewhere, `--wav` also keeps each take as .wav, and `--dry-run` lists what it would
  record. Each line is said in the spoken form `narrate/spoken.ts` gives it (numbers in words,
  BBS, DOS, PLAYGAME, THE CHEZ and the like spelled for the voice, straight quotes for Pocket TTS),
  or a step's own `spoken` where even that comes out wrong; the bubbles keep their written words,
  and the index's hash is of the spoken form. `npm run voice:check` (`narrate/verify.ts`) hears every
  clip with Whisper, locally (whisper.cpp's `whisper-cli` with `ggml-large-v3.bin` from
  `~/.cache/whisper-cpp`, or `--model <name>` for openai-whisper's `whisper`, e.g. `medium.en`), and
  lists the clips whose words came out wrong (`narrate/compare.ts` leaves out sound-alike spellings
  and little words) with a retake command, in the terminal and `/.narrate/voice-check.md`. It also
  lists clips that run straight through their commas and sentence ends (`narrate/pauses.ts`: the
  stops in the spoken text against the quiet stretches of 0.2 s or more inside the audio; one may be
  missing only in a line with four or more stops) and merges them into the same retake line;
  transcripts are cached by each clip's bytes in `/.narrate/voice-check.json`. Never put Lewis's
  voice samples in the repo, a download or a test fixture.
- Pictures made once by hand: `bbsGifs.ts` made the BBS gallery's pictures in `../public/bbs`;
  `castArt.ts` and `castSprites.ts` make the Cast page's pictures in `../public/cast` (the sprites
  also walk the guided tour, with a few hosts of its own), from the other `cast*.ts` drawings (`castEgg.ts`, `castLeoSide.ts`, `castNeedle.ts`, `castTinHeart.ts`).
- Downloads from the command line: `macDmg.ts`, `winExe.ts` and `linuxTar.ts` run the same code as
  the Download button (see [`export/`](../src/export/README.md)).
- [`mcp/`](mcp) (`npm run mcp`): the local MCP server for AI tools. It uses the
  assistant's tools (`assistant/tools`) on game folders, zips, this project's games and the CD's,
  writing only in the folders it is given, with its own vite-node settings (`mcp/vite.config.ts`).
  Its README has the setup for Claude Code, Claude Desktop and other clients.
- `badgeSimilar.ts` (`npm run badges:similar [-- --threshold 0.27] [--gray 0.03] [--top n] [--out dir] [--strict]`): advisory
  check that no two achievement badges (`../src/achievements/blockArt.json`) look too alike. A coarse 8x8 pass drops
  plainly different pairs, then a 40x40 comparison blends mean luminance difference with an edge-shape
  difference (so hue-only twins are caught), then repeats it under protanopia, deuteranopia, tritanopia and
  achromatopsia (Machado et al. 2009 matrices) for pairs that differ in color but not through the filter.
  Tiers of one achievement (`every-win-1`, `-3`) are skipped. It also lists badges whose art is nearly gray
  already, where only the unearned frame and lock tell earned from not. Hidden badges show their id, not their
  title. Writes `../../.for-lewis/research/badges-similar/index.html` (git-ignored; pairs at 4x, pixelated), prints a table, exits 0
  unless `--strict`. Parts: `badgeSimilarMetrics.ts` (+ test), `badgePng.ts`, `badgeSimilarPng.ts`, `badgeSimilarReport.ts`.
- `walkAuto.ts` (`npm run walk:auto -- <folder | .zip> [--budget ms] [--game NAME.GAM] [--out walkthrough.json]`) runs the
  editor's "Make a walkthrough…" bot (`autoWalk`, 60 s a scene by default) on a game folder or zip and prints each scene's
  style, tries, play time and outcome, and why it stopped (a door that stayed shut). `--out` writes the walkthrough; it
  exits 1 when the bot doesn't win. Arguments, `.gam` picking and the table line are in `walkAutoArgs.ts`. It skips the
  author's own plays and walking paths, which live in a project's companion file.
- `diskDiff.ts` (`npm run disk:diff -- <a> <b> [--json|--notes]`, or `-- <game-id> --since [rev]`) compares two disks, each a folder (such as `games/<id>/disk`) or a
  `.zip`: how many files changed, were added or removed, then for each changed file a plain-text summary by type, picked from
  the file's contents where it can (GIF, FLI, VOC) and else its extension: `.gam` scenes, `.pal` colors, `.bbl/.mbl/.cbl`
  block numbers, `.map` changed cells in clusters, `.chr` sequences, `.mon` monsters, text line counts, picture pixels,
  animation frames, sound length, and a byte count for anything else. Output is sorted with no dates, so the same inputs
  print the same text. `--notes` prints release-note text instead (`packages/tools/src/releaseNotes.ts`). The logic is `packages/tools/src/diskDiff.ts` (`@lewismoten/gamemaker-sandbox-tools/disk-diff`).
  `npm run disk:diff -- <game-id> --since [rev] [--json|--notes]` compares a game's current disk (rebuilt first if stale) with
  its disk at a Git revision, by default the last push to master (the same base `versionCheck.ts` uses); it needs a git
  history, and rebuilds that revision's sources when it tracked no disk (`games/kit/versionDisks.ts`, which can take a
  few minutes). Arguments are parsed in `diskDiffArgs.ts`.
- `dosbox.ts` (`npm run dosbox`) lays out `../../dosbox/` (git-ignored) to mount as drive C: in
  DOSBox, with Game-Maker installed and every Sandbox and Bard of Bizarre game's disk beside the
  samples; `npm run dosbox:open` starts DOSBox on it.

Package isolation verification lives in [`../../scripts/`](../../scripts/README.md); root `npm run verify:packages` builds each SDK outside the monorepo. The dependency credits generator reads the root workspace lockfile.

`gameArchive.ts` builds the catalog ZIPs with the archives SDK through `exportDos`, including the game files, customized XFERPLAY, sound driver, setup help and notices. A fixed timestamp makes them reproducible. ZIP filenames and native contents follow DOS 8.3 naming. URLs such as `games/originals/teddy/teddy.zip` remain stable across releases and serve the current version; service-worker group hashes handle cache updates. Vite serves the same permanent ZIPs and cached preview images, invalidating them when source files change. In dev the ZIPs are built off the server: `archiveQueue.ts` is a priority queue, `archiveWorker.ts` runs `gameArchiveWorker.ts` in a child process (vite-node), and the server starts queueing every archive after it is listening. A request for one not yet built gets 202 with `Retry-After: 2` (also for HEAD) and moves it to the front; a built one is served as before. `src/project/archiveWait.ts` is the browser side (retries, a polite "Preparing … (still building)" note). The worker keeps finished ZIPs by content hash in `node_modules/.cache/game-zips` (`archiveCache.ts`: the entry, its input bytes and a stamp of the files `gameArchive.ts` imports), so a restart or a changed game only re-zips what changed (`GAME_ZIP_CACHE=off` skips it), and it exits when its parent does. The production build still writes every ZIP in `generateBundle`. Resource-only CD folders receive data ZIPs. Walkthrough JSON and prebuilt catalog pictures remain separate browser metadata.

`../../scripts/game-build-inputs.mjs` fingerprints build inputs and ignores generated output.
`../../scripts/render-game-frames.mjs <0..7>` renders an independent eighth of Depth
Perception's animation frames. The reusable `game-frames.yml` workflow runs these in parallel,
with each job capped at five minutes, and passes the lossless frame artifacts to the Pages
and native-download builds. All disks and render caches remain untracked. Local builds
prepare missing frame shards with two processes at a time. `GM_SKIP_GAME_BUILD=1` defers game
output generation for these rendering jobs; normal installs and builds generate it.
SDK-only package checks and publication jobs set `GM_SKIP_GAME_BUILD=1` for all steps,
since their selected tests use synthetic format data and do not need the game disks.

`achievementArt.ts` extracts the explicitly selected public games’ original 20×20 blocks
into `src/achievements/blockArt.json`, with per-badge provenance and transparent pixels.
Run `npx vite-node scripts/achievementArt.ts` after changing those source sprites. It
rejects unknown achievement IDs, non-block dimensions and duplicate artwork. The browser
loads these small embedded images without fetching game ZIPs. Art gaps and proposals
are listed in `docs/achievement-art.md`. `achievementSets.ts` builds the games' block sets and the
picks that name a block by achievement id; `achievementTiers.ts` draws the nine every-game tier
badges from Teddy's poses (each with a sign: a down arrow, an X or a star); `achievementLevels.ts` puts a bronze,
silver or gold plate and one to three pips under a game block for the count-leveled badges (games played,
games finished, walkthroughs watched).

`libraryFacts.ts` supplies palette SHA-256 identities and VOC sound groups for catalog
metadata, cached by source path, size and modification time. Pickers can deduplicate
colors and show sound groups without downloading every source game to inspect it.
Invalid assets retain no invented metadata.

Palette facts include the canonical 768 VGA bytes in base64 for previews, so browsing
a palette list needs no game archive download. These library-only facts are omitted
from the slim home-page catalog. Copying a selected file still reads its original ZIP.
