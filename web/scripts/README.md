# `web/scripts/`: build-time code

Part of the [source map](../src/README.md). A name with no folder is a file here, `../` is `web/`, and
the other folders named (`manual/`, `gfx/`…) are under `web/src/`.

`../../scripts/build-games.mjs` generates ignored `games/<id>/disk/` and `walkPaths.json` outputs. Root `npm ci` builds them after the workspace packages; the web development, build and test commands refresh them automatically. `npm run build:games -- --force` forces a clean rebuild. A per-game key (the files its `build.ts` imports, see `scripts/game-import-keys.mjs`) and an output hash in ignored `games/.build-cache.json` skip unchanged builds. Each game runs in its own process, with two builds at a time (`GM_BUILD_JOBS`; every core on CI), slowest first; `--timing` prints per-game seconds and `--game <id>` limits the run. Depth's 3D-print trinkets (`games/depth/tools/trinkets.ts`, into git-ignored `web/public/trinkets/depth/`, about 5 MB, skipped while their sources are unchanged) are made beside the games by worker threads of one bundle, about 15 s of CPU; the offline copy leaves them out (`web/vite.config.ts` `offlineFiles`).

This folder holds the build's Vite plugins and the scripts run by hand (from
`web/`, `npx vite-node scripts/<name>.ts`).

- `dosFloppies.ts game.zip NEW-OUTPUT-DIRECTORY`: optionally lays out a standalone
  DOS export as `DISK1/`, `DISK2/`, etc. Copy each folder's contents to its own
  formatted 1.44 MB floppy. Whole files only, FAT12 space/entry accounting,
  runtime and main game on disk 1, `DISKn.ID` markers and identical swap-safe
  installers on all disks. Refuses existing output directories and oversized
  files; never formats disks or treats a ZIP as an image. See
  [`export/README.md`](../src/export/README.md#installing-the-dos-download).

- Vite plugins, imported by `../vite.config.ts` (which also emits the service worker and
  `player-files.json`):
  - `cdGames.ts` serves the CD's games and `../games` (and writes them into the build, with the
    catalogs and one DOS ZIP per game at a permanent URL; loose game payloads and GMPK copies are not emitted);
  - `gameShots.ts` draws each listed game's pictures into `games/shots/`;
  - `singlePageBuild.ts` builds `standalone.html`, and `hostedPlayerBuild.ts` the web player
    (`web-player.html`, `player/index.html` and `player/games.json`);
  - `downloadsList.ts` draws `downloads.html`'s game cards (each with its real title screen and a level picture when the build drew them; only public games are listed) and their styles;
  - `seoBuild.ts` puts tags, JSON-LD and readable text into the pages and writes (and serves in dev)
    `robots.txt`, `sitemap.xml`, `llms.txt`, each game's `play-<id>.html` and its preview picture
    `og/<id>.png` (drawn by `ogImage.ts`), `downloads.html` (a plain page linking every listed Sandbox and Bizarre game's ZIP, for crawlers and the Internet Archive), each Guide section's page `help-<id>.html` (its text from
    `manual/guideSections.ts`, which `webManual.ts` shows), and The Sandbox Scoop's RSS feed `scoop.xml`
    (`scoopFeed.ts`: every game's `printables.json` news story, dated from `scoopDates.json`).
- `artCourseFigures.ts` (`npx vite-node scripts/artCourseFigures.ts`): redraws course 1’s pixel-art figures (`../src/artCourses/figures/*.png`) from real 20x20 blocks drawn in code. `artCourseFigures6.ts` draws course 6's word monsters; `artCourseFigures7.ts` course 7's, from the built disks of three Starters (`GM_GAMES` sets another games folder).
- `playChunks.test.ts`: checks `../vite.config.ts`'s production chunk ownership with a small module graph: Home remains a separate route root, so its shared data does not fall into the play-only runtime after removing its static re-export. Production network captures remain necessary to check the complete emitted graph.
- `leakSweep.sh` (`npm run check:leaks -- [built-folder] [since-rev]`): a leak sweep over the tracked files, recent commit messages and a production build: secret games' ids and titles outside their folders, "Dowden", local paths, `.for-lewis`, token shapes. It prints counts and paths only, never a secret name; exits 1 if the build has a hit.
- `seoStaticPages.ts`: the text of `cast.html`, `library.html` and `magazine.html` (TURBO BUTTON's words, read from `src/seo/magazineText.json`), static pages for the parts of the app that live only at a `#/…` address (title, description, canonical, h1, and plain text linking to the games' play pages, from the public catalog only, so no secret game); `seoBuild.ts` wraps and emits them like the Guide's `help-<id>.html` and lists them in the sitemap.
- `magazineText.ts` (`npx vite-node scripts/magazineText.ts`): rewrites `src/seo/magazineText.json`, the magazine's words as plain text (`manual/magazine/plainText.ts`, `staticText.ts`), for `magazine.html`; `magazineText.test.ts` fails when the file is out of date or a page holds a sentence the text lacks.
- `ogAudit.mjs <built-folder> [secret-ids...]`: checks a build's `og/*.png` link previews: each is 1200 x 630, under 300 KB, shows a real picture of the game (not the plain text-only card) and none belongs to a secret game; exits 1 on a finding.
- `seoAudit.mjs <built-folder> [starter-ids-file]`: checks a built site folder's pages for titles, descriptions, canonical and Open Graph tags, English language, one h1, matching Open Graph/Twitter tags and images, valid JSON-LD, unique 50–160 character descriptions, broken internal links, images without alt, crawler-file coverage, secret-game leaks, and that downloads.html names no Starter. Search tags are optional for noindex utility pages; the verification token is exempt. Exits 1 on a finding (`node` only, no build step of its own).
- `release/` (`npm run release:draft -- <pages|engine|archives|tools>`, `release:cut -- <target> <version> [date]`, `release:check`): release notes. `release/fragments.ts` reads and validates target-specific `changes/unreleased/<target>/*.md` files; `release/draft.ts` prints them with legacy Unreleased notes, followed by separately labeled suggestions from the commits since the target's last tag (`release/classify.ts` sorts them into Added/Changed/Fixed/Removed, groups an "Area:" prefix into one line and leaves out merges, formatting, tests-only, docs-only, agent notes and anything touching a secret game; `release/git.ts` reads git); `release/cut.ts` combines fragments with Unreleased into a dated version, sets a package's version and removes only that target's consumed fragments; `release/check.ts` fails when a package changed since its tag with no fragment or Unreleased entry. The changelog parsing is `../../scripts/release/changelog.mjs`, which the tag workflows run with bare node (`section.mjs` prints one version's section for the GitHub Release). See `../../docs/package-releases.md`.
- `devLog.ts`: the dev server's `gamemaker-dev-log` plugin (`vite serve` only). It appends the page's opt-in interaction log (`src/devLog/interactionLog.ts`) to `../.for-lewis/debug/interaction-log/<local date>.jsonl`, taking only POSTs from this machine of at most 256 KB.
- `waybackInventory.ts`, `waybackCheck.ts`, `waybackSave.ts` (`npm run wayback:inventory -- <out.json> <file-or-folder>... [--skip-hosts regex]`, `wayback:check -- <urls.json> <out.json> [--gap ms]`, `wayback:save -- <checklist.md> <log.tsv> [--gap seconds] [--limit n]`; shared code in `waybackLib.ts`): list the outside URLs a set of text files cite, ask the Wayback availability API which have a snapshot, and ask Save Page Now to archive the unticked `- [ ] <url>` items of a checklist. They send a generic user agent with no contact details, make one request per gap (1.1 s to look up, 60 s to save) and stop after three refusals. Tests use a fake fetch.
- `agentUsage.ts` (`npm run agent:usage -- <log-dir> [--since YYYY-MM-DD] [--out file.csv]`, counting in `agentUsageLib.ts`): one CSV row per sub-agent, with its start, end, a plain-words `title` (right after `agent`: the task description with whitespace folded to single spaces, else `<agent type> task (<id>)`, else `Untitled task (<id>)`; never empty; `task` still holds the raw description), model, task and input, cache and output tokens, from session logs laid out as `<log-dir>/<session>/subagents/agent-<id>.jsonl`. Each streamed message counts once; the directory is always an argument.
- `docEditorShots.ts` (`npm run docs:editor-shots -- --url <preview url> [--only id,id] [--out dir]`): retakes the screenshots of `docs/editor.md` and the README (`web-home-sandbox`, `web-editor-snowbound`, editor tour shots 07, 09, 10, 12, 13, 14 and 23) from a running preview of a scratch production build; it builds nothing and never touches 5173. Each run opens a fresh dark 1440x900 Chromium with no eggs found, makes a Snowbound copy with Look inside, and writes lossless WebP for the editor shots (needs `cwebp`) and PNG for the two `web-*` shots, into `docs/screenshots/` unless `--out`. The Assistant shot (23) uses a scripted stand-in model: its chat endpoint is intercepted, so no AI provider is needed. Look at every shot before committing it; to add one, add a block to the script.
- `editorTouch.ts` (`npm run editor:touch -- <route> [--out dir] [--tag name] [--wait selector] [--port 5291] [--dist dir]`): the touch audit of one editor route (for example `/#/p/look:nebula/planet1.map`, using the tracked CD fixture without a generated game disk) at iPad 1024x768 and 1366x1024 and iPhone 390x844, 375x812 (an iPhone X, XS or 11 Pro) and 844x390 and Android 360x740 with touch emulation. Light runs at all six sizes; dark runs at 1024x768, 390x844 and 375x812, forced with `forceTheme`. It saves a screenshot per case and `<tag>.json` with readiness, controls below 44px (advice), controls below 24px, sideways overflow, and axe violations with selectors and failure details. `editorTouchAudit.ts` checks actual pointer hits for grips whose CSS extends their hit area. Missing `--wait` selectors (default `main.editor`), controls below 24px, positive page overflow (`scrollWidth` minus the configured width, not mobile `innerWidth`), or any axe violation exit 1. Pass an editor-specific `--wait` selector to prove that its actual controls loaded; a missing game must never count as editor coverage. The output defaults to `.for-lewis/research/editor-modern/touch/`. It starts its own Vite (never 5173) through `perfLib.ts`, or uses `--dist` / `--url`.
- `dialogsFit.ts` and `dialogsFitScenes.ts` (`npm run check:dialogs [-- --only id,id] [--quick] [--webkit] [--block dialogsPhone.css] [--out dir] [--port 5193] [--no-axe]`): do the pop-up dialogs fit a phone? It opens each dialog listed in `dialogsFitScenes.ts` (how to reach it on today's web, with a starter game where it needs one) at 375x812, 390x844 and 360x740 (failures) and 844x390 (landscape, advice only; `--landscape-fails` to fail it too), light and dark (forced with `forceTheme`), and measures the box against the visual viewport, any scroll inside it (one list area marked `data-list-area` is allowed, with the title and actions fixed), sideways page scroll, and whether the close and primary buttons are visible and uncovered. Axe runs on each at 375x812. Prints a table and exits 1 on a failure. `--quick` is one size, light; `--block` drops one stylesheet to take a before shot; `--webkit` uses WebKit. To add a dialog, add a scene to the list.
- `editorTouch.ts` (`npm run editor:touch -- <route> [--out dir] [--tag name] [--wait selector] [--port 5291] [--dist dir]`): the touch audit of one editor route (for example `/#/p/look:blaster/bus2.map`) at iPad 1024x768 and 1366x1024 and iPhone 390x844, 375x812 (an iPhone X, XS or 11 Pro) and 844x390 and Android 360x740 with touch emulation. It lists visible controls under 44 px, page overflow past the device width (`scrollWidth` minus the configured width, because Chromium's mobile emulation widens `innerWidth` to fit overflowing content, which hid a 625 px header on a 390 px phone; any size over 0 prints FAIL and exits 1; home is `/#/`) and axe violations, and saves a screenshot per size (light; dark at 1024x768, 390x844 and 375x812; the theme is forced with `forceTheme`) in `--out` (default `.for-lewis/research/editor-modern/touch/`). It starts its own Vite (never 5173) through `perfLib.ts`, or uses `--dist` / `--url`.
- `dialogsFit.ts`, `dialogsFitScenes.ts`, and `dialogsExtraScenes.ts` (`npm run check:dialogs [-- --only id,id] [--quick] [--theme light|dark] [--size 375x812|390x844|360x740|844x390] [--webkit] [--block dialogsPhone.css] [--out dir] [--port 5193] [--no-axe]`): opens each listed dialog at all four phone sizes in both themes. The extra scenes invoke real exported dialog views with bounded sample data or a persisted Ready-to-play project, and load their owning styles. Each case gets a fresh browser context so a previous project's route cannot leak into another dialog. Measures the viewport box, allowed list areas, page overflow, visible close and primary actions, accessible dialog name, and 24 px controls (associated checkbox/radio labels count as hit targets). Axe runs on **every** open case and violations fail that case. Landscape remains advisory unless `--landscape-fails` is supplied; with that flag an unreachable landscape opener fails too. `--out` saves screenshots and incrementally checkpoints every case, including blocked openers, in `cases.json`; the final log includes numeric expected/executed/passed/failed/blocked counts. `--theme` and `--size` allow bounded matrix shards; invalid selectors fail instead of silently testing zero dialogs. Add a scene to either inventory to cover another dialog. This explicit scene inventory is not exhaustive source discovery; state-dependent dialogs still require their own fixtures.
- `checkOffline.ts` (`npm run check:offline -- --dist <scratch production build> [--port 5193]`, or `-- --url <server>`): does the offline copy work? It needs a production build (the service worker is not in the dev server): build to a scratch folder with `npm run heavy -- npx vite build --outDir <tmp>/dist`, then run it. In a headless browser it presses ⚙ Settings › Play offline › Download, turns the network off, and checks the web home, a Starter (its play page opens with a canvas), the desk, the wall phone (recorded clips, no call of the browser's speech) and the guided tour (its voice clips), and that no request failed. PASS/FAIL per check; exits 1 on a FAIL, 2 without `--dist`/`--url`. It downloads about 75 MB and takes 3 to 6 minutes, so run it after big merges, not on every change.
- `dialogsSweep.ts` and `dialogsFitMeasure.ts` (`npm run check:dialogs:sweep [-- --theme light|dark] [--width 375 --height 812] [--axe] [--out dir] [--only substring]`): finds dialogs by clicking instead of a list. In a new game it clicks every visible button on each tab, in each file category and in the first two files of each, and on the home, a game's page, the library, achievements, the cast, the Guide and credits; any dialog that opens is measured as in `dialogsFit.ts` (`dialogsFitMeasure.ts`), optionally with axe, then closed. Prints a line per dialog (FAIL when it needs scrolling outside a `data-list-area`). Click-only: a dialog that needs a file, a dropped folder or a state is not reached; the full-window box viewer is not a pop-up and is reported as a FAIL by design.
- `touchGestures.ts` (`npm run check:gestures -- [--route r] [--out dir] [--port 5292] [--dist dir]`): the map editor driven with real touch events (CDP `Input.dispatchTouchEvent`) at iPad 1024x768 and iPhone 390x844: pinch zoom, two-finger pan, paint, a stray stroke a second finger must not leave behind, long-press for the block menu and a long-press that moved. Prints zoom, scroll, a canvas hash and the menu state per step with PASS or FAIL; exits 1 on any FAIL.
- `audioUnlock.ts` (`npm run check:audio-unlock -- [--engines webkit,chromium] [--page desk,home] [--port 5293] [--dist dir]`): hooks AudioContext and logs each context's state and creation time before and after the first tap or click. Passes when the desk makes no context inside an input handler and every context is running after the tap. Headless WebKit does not enforce iOS's gesture rule, so a pass is not proof for a real iPhone.
- `deskDastShots.ts` (`npm run desk:dast -- --base <url> --out <dir> [--theme dark|light]`): the DAST look at the desk (housekeeping 15b): with every felt egg and the clock heart unlocked in localStorage, shots of the room at 1440x900 and 390x844 (pans, plus shelf, eggs and door close-ups when on screen). Needs a server you started; it starts none.
- `slowPcMeasure.ts` (`npx vite-node scripts/slowPcMeasure.ts [port] [speeds] [seconds]`): plays Slow Computers in the web player on a dev server you started (headless, holding Right) at each "Run like a" speed and prints, per level, game ticks run per second (with and without 10+ monsters on screen), the longest stretch with no tick and, for each voice, how long after the game asked for it the audio started. For checking that a slow-PC preset really shows.
- `deskDrive.ts` (`npm run desk:drive -- --base <url> [--out dir] [--step "D:\\" --step shot:root ...]`): drives the 1994 desk headless on a server you started (it starts none): powers the PC on, opens the Game-Maker box, puts the CD in, answers the registration word (read from the page each run), then runs each `--step` in order (plain text is typed as a DOS command; `key:Escape`; `shot:name` saves the PC screen, `shotfull:name` the page; `wait:ms`) and saves PNGs in `--out`. It waits on page state and on the screen settling, not fixed sleeps.
- `errorNoticeCheck.ts` (`npm run check:error-notice -- --base <url> [--out dir]`): throws an error on purpose on the site, play.html and dos.html at 1440, 390 and 375 px in light (`forceTheme`) and dark; checks the notice for axe violations, page overflow, buttons under 24 px and that Copy puts the details on the clipboard. Exits 1 on a FAIL. Starts nothing; pass your own server.
- `../test/announcements.mjs` (`node web/test/announcements.mjs <own-vite-url>` from the repository root): browser regressions for modal notice exposure, bursts and deliberate retries, saves, pending downloads, check/walkthrough/MP4 terminal outcomes, offline errors/cancellation, transcript loading, and archive progress. Applies the manual Reload handshake only to the supplied server; never point it at the maintainer's server. Uses private project, transport, worker and encoder fixtures with real source modules; checks Chromium DOM/AX, not native screen-reader speech or real MP4 encoding.
- `smokeEngines.ts` (`npm run smoke:engines -- [--engines webkit,firefox,chromium] [--profiles desktop,iphone,ipad] [--flows home,editor,play,desk,dos,export] [--port 5280] [--dist dir] [--out dir]`): the cross-engine smoke pass. In each engine at desktop, iPhone and iPad (touch) sizes it opens the home page, the editor (map canvas, paint, undo, blocks, music), the web player (keys change the picture), the desk, `dos.html` and the export dialog (web page and DOS downloads), and prints one table of checks with console errors below it. It exits 1 when a check fails in WebKit or Firefox that passed in Chromium. An engine that isn't installed is skipped with a note (`npx playwright-core install firefox webkit`); Firefox gets the size and touch but no mobile emulation. Shots and downloads go to `--out` (default `.for-lewis/research/engines/smoke-shots/`). The engines run side by side, and the iPad size skips the play, desk and `dos.html` flows (the iPhone covers them), so the full pass is one long job, about 4 minutes; use `--dist <scratch build>` or `--url` for a server of your own. The canvas and `dos.html` checks compare canvas pixels, not screenshots, because a phone's palette and toasts overlay the canvas.
- `editorShots.ts` (`npm run editor:shots -- --out <dir> [--compare <earlier dir>] [--only map,music] [--port 5281] [--dist dir]`): 1440x900 mouse screenshots of every editor route (integrator, backdrop, animation, music, monsters, recording, sample, palette, sounds, picture, text screen, slide show, map, blocks, character), light and dark. With `--compare` it counts the differing pixels against an earlier folder, writes a red diff image for each pair that differs to `<out>/diff/`, and exits 1 if any differ: the proof that a touch or refactor change left desktop alone. Run it on the old build and the new one with the same `--dist`-style setup. Each shot is taken after reduced motion, animations and the caret are switched off, fonts are loaded, focus is blurred and two screenshots in a row match, and a pixel counts as differing only when a channel is off by more than 8 of 255 (edge anti-aliasing varies by a level or two between runs), so two runs of the same build give 0 differing pixels.
- `perfCheck.ts` (`npm run perf:check -- [--port 5196] [--url <url>] [--out dir]`): starts its own vite (never 5173), or measures `--url` (e.g. a `vite preview` of a scratch build: the dev server serves modules one by one, so first opens there are several seconds slower than in production) and clicks through the site in Playwright's bundled headless Chromium: each nav page, the editor's biggest song, map and blocks with their tabs, play and stop, leaving, the desk. It prints per step the time until quiet, LCP, INP, CLS, long tasks and playback frame times next to the last run, and writes `../.for-lewis/research/perf/perf-<time>.json`.
- `perfLib.ts`: what `perfTrace.ts`, `perfTasks.ts` and `perfMemory.ts` share (options, a server of their own, Playwright's bundled headless Chromium, the page observers for LCP, INP, CLS, long tasks, blob URLs, workers and audio contexts). The server is a dev server on `--port`, or a `vite preview` of `--dist <scratch build>` (`vite build --outDir <scratch>`: measure this, not the dev server); `--url` uses someone else's. None of them ever uses 5173. `perfCheck.ts` doesn't use it: it starts its own vite and takes no `--dist`.
- `perfTrace.ts` (`npm run perf:trace -- [--dist dir] [--port 5195] [--only desk,help] [--trace dir] [--profile dir]`): opens each page fresh and prints requests and bytes, scripts fetched, time until quiet, LCP, CLS, long tasks, script / layout / style time, heap, and what the page allocated (blob URLs still alive and their bytes, workers, audio contexts, bitmaps). `--trace` also saves a Chrome trace per page (open it in DevTools Performance). `--throttle N` slows the CPU N times and `--network 4g|slow-4g` limits the connection to DevTools' 4G or Slow 4G figures, so the time until quiet and LCP show a phone on mobile data (`perfTasks.ts` takes both too). `--profile` saves a V8 CPU profile of the load (`.cpuprofile`, opens in DevTools) and prints its 15 functions with the most self time.
- `perfTasks.ts` (`npm run perf:tasks -- [--dist dir] [--throttle 4]`): does what a person does (home, the walkthrough player, the editor's song, map, blocks and character with every tab, play and stop, zoom, paint, the desk and its overlays) with real mouse clicks. Per step: INP, long tasks, time until quiet, heap, frames while playing, and the hottest functions of a CPU profile for every step that ran long. `--throttle 4` slows the CPU four times, which is closer to Lewis's laptop than this machine. `--repeat N` opens and closes each desk overlay N times (waiting 0 to 6 s after each open); `--profiles <folder>` keeps the whole CPU profile of every step with an INP over 120 ms.
- `perfBoxClose.ts` (`vite-node scripts/perfBoxClose.ts -- --dist dir [--runs 12] [--hold 3000] [--profile 1] [--out dir]`): the Virus Blaster box opened and closed with Escape from a fresh page each run at 4x CPU slowdown; prints each close's INP and longest task, then the sorted spread. A trace (or with `--profile 1` a CPU profile) of each close is kept. `--watch ms [--nobox 1]` instead lists the long tasks (start+length) over that time with the box open or not: this is how the 1.1 s tasks behind the 2026-11-04 close spike were found.
- `perfMemory.ts` (`npm run perf:memory -- [--dist dir] [--cycles 4] [--snapshot] [--only song,desk]`; `--only kit,die,video` are the Snowbound box's 3D kit, the Year 2000 box's die fold and the Library TV's video dialog): repeats each task (open, use, leave) and records heap, DOM nodes, listeners, live blob bytes, workers and audio contexts after a forced collection. A figure that climbs every cycle is a leak. `--snapshot` takes a V8 heap snapshot after the first and last cycle and names the objects that grew and the detached DOM. It ends with a long session through every view. It returns status 0 after successful measurement, report writing and cleanup; failures print their phase and error and return status 1. It lets vite-node finish shutting down instead of forcing an immediate exit.
- `verifyPerf.ts` (`npm run verify:perf [-- --update] [--port 5190] [--dist dir] [--runs N]`, root or `web/`): the performance budgets. It builds a scratch production bundle (`NODE_ENV=production`; vite-node sets development, which builds a bundle twice the size), previews it on the first free port of 5190-5196 (another agent's preview must not be measured by mistake), runs `perfTrace.ts` (bytes and requests: home, editor map, desk, library, dos.html) and `perfTasks.ts --budget 1 --throttle 4` (INP at 4x CPU slowdown for the map editor's tabs and the Virus Blaster box on the desk), and prints budget, measured and delta per item. It exits 1 when anything is over; when anything is over it is all measured once more and the lower figure counts (home's idle prefetch sometimes makes 76 requests instead of 59, and an INP can spike to 1.5 s). The budgets are in `perfBudgets.json`. `--update` measures 3 times and rewrites them: bytes and requests are the median plus 10% (they were identical or within 5% between runs), INP is the median plus 50% or 80 ms, whichever is more (the spread between runs was 0 to 290 ms, and twice 1.3 to 1.5 s for closing a box, which the second measurement drops). Commit the changed JSON on purpose, so a deliberate change is a reviewed diff. A check takes about 70 seconds, `--update` about 2.5 minutes; it is a separate step before a push, not part of `npm run verify`.
- `slowTests.ts` (`npm run test:slow-list`): runs the whole suite once and writes the tests over 50 ms to `test/slowTests.json`, which `npm run test:fast` and CI leave out. Run it after adding or speeding up tests.
- `domainsCheck.ts` (`npm run domains:check`): asks each registry's whois (and DNS) whether every
  made-up domain in `../src/manual/magazine/mockSites.json` is still unregistered, with a
  nonsense-name control per TLD; prints a table, exits 1 if one is taken, 2 if a lookup couldn't run.
  Needs the network, so it isn't in CI or vitest. `oldWebShots.ts` re-renders the article's pictures
  from the same JSON.
- `deadCode.ts` (`npm run dead:code [-- --only exports|files|css] [--json]`): lists exports no other file imports (marked `~` when the file still uses the name itself, so only `export` is extra), files nothing imports, and CSS classes no TS or HTML names. Static and dynamic imports, `import.meta.glob`, `new URL(..., import.meta.url)`, HTML script tags, package `exports` entries (public API) and tests count as uses. Suggestions only: classes built at run time (`` `ug-b${i}` ``) and files named from build scripts by path show up as false positives.
- `themeRecheck.ts` (`npm run theme:recheck -- [--url u|--port p] [--out dir] [--only a,b] [--themes light,dark] [--widths 1440,390,375]`): opens a list of screens (Privacy, breadcrumb, recording keys, integrator lists, feelies note, update notice, Settings, Starters, map zoom, compact assets) in the really-forced light and dark themes at each width, runs axe and measures sideways overflow, saves a screenshot each; exits 1 on a finding. Add a screen to its `screens` list.
- `pagesA11y.ts` (`npx vite-node scripts/pagesA11y.ts --out <private-dir> [--url <own-server>|--port 5316]`): scans the loaded home, desk, explicitly selected Starters tab, Library, Cast and Guide at 1440×900 and 390×844 in both stored themes (24 cases). Requires the built games; Starters blocks if its rendered tile count differs from the nonsecret source catalog. Each case saves a full-page PNG and raw axe results, including incomplete contrast checks, labels, selected state, overflow and target geometry. Inert and disabled controls are excluded. Inline links are recorded separately; existing invisible hardware hit areas count only if a 24px square actually hits the control at nine sampled points. Exits 1 on any failed or blocked case; a clean automated scan is not a manual accessibility certification.
- `themeCheck.ts` (`npm run theme:check -- [--url u|--port p] [--out report.json]`): browser regressions against the real app. Checks missing, invalid, light, dark and auto storage under both media schemes, parser initialization and reload, plus deliberately wrong rendered colors and missing theme metadata. Needs bundled Chromium; starts its own server unless `--url` is supplied.
- `forceTheme.ts` and `renderedTheme.ts`: for headless checks. `forceTheme(ctx, 'light')` before navigation
  stores the site's own theme (`gm-theme`); `colorScheme` alone does not override the dark default.
  `pageTheme(page)` reads the preference; `assertTheme(page, theme)` resolves `auto` through the media query,
  rejects missing or wrong metadata, then decodes a real screenshot pixel from uncovered dialog, editor or page
  padding. That pixel must be within 8/channel of the intended neutral palette in `editor.css`, and at least
  80/channel (maximum-channel distance) from every opposite-theme neutral. The guard logs coordinates, RGB and both distances;
  it fails closed if no representative surface exists. It never paints a synthetic swatch or hides content.
  The retro desk has fixed colors and logs an explicit rendered-coverage skip; `dos.html` and the web player
  are not modern-theme coverage and must not call this guard. Call after the target UI loads and again after
  interactions that may change it, before axe or screenshots. Keep palette baselines in step with deliberate theme redesigns.
  Historical private axe runners that only emulate the media scheme do not qualify as light coverage.
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
  - `levelSecrets.ts` (with `levelSecretsScan.ts`) the Level Maps' `levelSecrets/<id>.json`;
  - `levelViews.ts` (with `levelViewsScan.ts` and `levelViewsPlay.ts`; slow, so give it the game ids
    that changed) their `levelViews/<id>.json`;
  - `levelMetadataFiles.ts` reads and writes these per-game files in canonical JSON, pruning retired games and leaving unchanged files untouched; `src/manual/printables/levelMetadata.ts` assembles them for the browser. The existing scan algorithms and stale-data tests remain the authority; no aggregate file needs merge resolution.
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
  samples with Pocket TTS, or one of Kokoro's stock voices via `narrate/kokoro.ts`, which runs Kokoro in
  a child process from the git-ignored `/.narrate` folder that `npm run voice:setup` fills; then
  shifted in pitch and speed as `HOSTS` in `tour/steps.ts` says),
  locally, into `../public/tour/voice/<chapter>/<id>.ogg` (Opus, mono, about 10 kbps), and
  rewrites `index.json` (id → chapter, where, words, seconds and hashes, so unchanged lines are
  skipped) and the generated `README.md` there. Its parts are in `narrate/`: `narrate/pocketTts.ts` (the
  engine, ported from pocket-tts-js, MIT), `narrate/audio.ts` (ffmpeg in and out: the voice sample's
  clearest 10 s, the pitch and speed shift, even loudness, the Opus encoding), `spoken.ts`, `narrate/lineIndex.ts` and `narrate/voiceReadme.ts`. The
  model, the engine and the voice samples stay outside the repo (`--model`, `--engine`, or
  `POCKET_TTS_MODEL`, `POCKET_TTS_ENGINE`, and `NARRATE_SAMPLE_<NAME>` for a sample named in
  `SAMPLES`; `--sample <file>` puts every line in one recording, to compare); CI never runs it.
  `npm run voice -- --split sentences|clauses|stretch` (default `none`) voices each sentence, or each clause, alone and joins the trimmed pieces with fixed silences (`narrate/split.ts`: 0.45 s after a sentence end, 0.25 s after a comma), to give the cloned voices real pauses; `npm run voice -- --only <id>` records a retake (each take differs; `--seed <n>` repeats one),
  `--lines <file.json>` reads `[{ id, chapter, where, text, voice? }]` instead of the tour, `--out <dir>`
  writes elsewhere, `--wav` also keeps each take as .wav, and `--dry-run` lists what it would
  record. Each line is said in the spoken form `narrate/spoken.ts` gives it (numbers in words,
  BBS, DOS, PLAYGAME, THE CHEZ and the like spelled for the voice, straight quotes for Pocket TTS,
  and, last, the made-up and unusual words of the pronunciation lexicon `narrate/pronounce.json`
  respelled by `narrate/pronounce.ts`: word → `say` (and `kokoro` for Kokoro's voices), with
  `sounds`, the intended sound such as `GRAV-ih-tass`, whole words in any case),
  or a step's own `spoken` where even that comes out wrong; the bubbles keep their written words,
  `npm run voice:words` (`narrate/words.ts`; `-- --only <word>[,<word>]`, `-- --compare` adds each
  word as written, lexicon off) records each lexicon word in a short frame in every voice whose lines say it,
  into `/.narrate/words/`, and lists what Whisper hears and what `narrate/letters.ts` spells (wav2vec2,
  no dictionary, so a misread made-up word shows; model outside the repo, `WAV2VEC2_MODEL`), in the
  terminal and `/.narrate/voice-words.md`; a changed respelling changes the spoken form's hash, so
  `npm run voice` then retakes the lines that say that word,
  `npm run voice:phone` / `voice:phone:check` do the same for the desk's wall phone (`--lines phone`:
  `narrate/phoneLines.ts` lists a clip per sentence and the spliced number clips, recorded into
  `../public/phone/voice/` and cast by `src/audio/phone/phoneCast.ts`),
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
- `songsSimilar.ts` (`npm run songs:similar [-- --starters] [--top n] [--json out.json] [id ...]`): advisory list of how
  alike the games' songs are. It builds every `games/<id>/src/song.ts` export, reads the notes back from the .CMF and
  prints each song's tempo, bars, seconds, bytes and instruments, the byte-identical twins, and the pairs whose top lines
  match most closely (intervals and note spacing, in any key). It hears nothing: two songs with low scores can still
  sound alike through the same instruments and groove, which is why the instrument column is there.
- `badgeSimilar.ts` (`npm run badges:similar [-- --threshold 0.27] [--gray 0.03] [--top n] [--out dir] [--strict]`): advisory
  check that no two achievement badges (`../src/achievements/blockArt.json`) look too alike. A coarse 8x8 pass drops
  plainly different pairs, then a 40x40 comparison blends mean luminance difference with an edge-shape
  difference (so hue-only twins are caught), then repeats it under protanopia, deuteranopia, tritanopia and
  achromatopsia (Machado et al. 2009 matrices) for pairs that differ in color but not through the filter.
  Tiers of one achievement (`every-win-1`, `-3`) are skipped. It also lists badges whose art is nearly gray
  already, where only the unearned frame and lock tell earned from not. Hidden badges show their id, not their
  title. Writes `../../.for-lewis/research/badges-similar/index.html` (git-ignored; pairs at 4x, pixelated), prints a table, exits 0
  unless `--strict`. Parts: `badgeSimilarMetrics.ts` (+ test), `badgePng.ts`, `badgeSimilarPng.ts`, `badgeSimilarReport.ts`.
- `sameBytes.ts` (`npm run check:same-bytes -- --save before.json`, then `-- --compare before.json`): did a refactor change a generated byte? It SHA-256 hashes every file under `games/*/disk`, each game's `walkthrough.json` and `walkPaths.json`, and lists what was added, removed or changed since the saved list (exit 1 on any). `--game id,id` limits it, `--games-dir` points at another games folder. It only reads: build first, in a checkout whose disks are real folders (never build through the symlinked disks in a worktree). Recorded demos live on the disks, so they are covered. A game that was not rebuilt shows no difference.
- `replayLog.ts` (`npm run replay:log -- <log.jsonl> [--session id] [--play n] [--out dir] [--frames snaps|clock,clock] [--dir game folder]`) replays a game the dev interaction log recorded (see `src/devLog/gameLog.ts`): the logged seed and keys go into the headless engine at the game clock they were applied, every logged snapshot is checked, and `--out` writes PNG frames of what the player saw. Exits 1 at the first divergence and says where, 2 when the log cannot be replayed. Its command line and log reading are in `replayLogArgs.ts`.
- `walkAuto.ts` (`npm run walk:auto -- <folder | .zip> [--budget ms] [--game NAME.GAM] [--out walkthrough.json]`) runs the
  editor's "Make a walkthrough…" bot (`autoWalk`, 60 s a scene by default) on a game folder or zip and prints each scene's
  style, tries, play time and outcome, and why it stopped (a door that stayed shut). `--out` writes the walkthrough; it
  exits 1 when the bot doesn't win. Arguments, `.gam` picking and the table line are in `walkAutoArgs.ts`. It skips the
  author's own plays and walking paths, which live in a project's companion file.
- `roundTrip.ts` (`npm run roundtrip -- [<folder | .zip>...] [--type gam,map,...] [--out base]`) reads every original file
  with the engine's reader, writes it back with the matching serializer and compares bytes: one table per type
  (identical, different, unreadable) and the first differing offset. Zips are read in memory. It defaults to the
  archive in `.for-lewis/reference/archive` and `cd/`, and writes a `.md` and `.tsv`.
- `test/formatProperties.test.ts` (vitest; `GM_PROPERTY_CASES=<n>` sets the cases per format, default 200, `GM_PROPERTY_SEED=<n>` repeats one failing seed) is the generated-file side of `roundtrip`: a seeded generator makes valid game, map, block, character, monster, palette, sound set, recording, slide list and backdrop structures within DOS's limits; each is written, read back (deep equal) and written again (identical bytes).
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

`gameArchive.ts` builds the catalog ZIPs with the archives SDK through `exportDos`, including the game files, customized XFERPLAY, sound driver, setup help and notices. A fixed timestamp makes them reproducible. ZIP filenames and native contents follow DOS 8.3 naming. URLs such as `games/originals/teddy/teddy.zip` remain stable across releases and serve the current version; service-worker group hashes handle cache updates. Vite serves the same permanent ZIPs and cached preview images, invalidating them when source files change. In dev the ZIPs are built off the server: `archiveQueue.ts` is a priority queue, `archiveWorker.ts` runs `gameArchiveWorker.ts` in a child process (vite-node), and the server starts queueing every archive after it is listening. A request for one not yet built gets 202 with `Retry-After: 2` (also for HEAD) and moves it to the front; a built one is served as before. `src/project/archiveWait.ts` is the browser side (retries, a polite "Preparing … (still building)" note). The worker keeps finished ZIPs by content hash in `node_modules/.cache/game-zips` (`archiveCache.ts`: the entry, its input bytes and a stamp of the files `gameArchive.ts` imports), so a restart or a changed game only re-zips what changed (`GAME_ZIP_CACHE=off` skips it), and it exits when its parent does. The production build still makes every ZIP in `generateBundle`; the Starters' ship split (`zipShare.ts`: a `.zpart` per game and `games/shared/<hash>.bin` for entry data at least 1 KB that two or more of them share; the browser joins them back byte for byte, `src/project/sharedZip.ts`), since their ZIPs were never on a downloads list. Resource-only CD folders receive data ZIPs. Walkthrough JSON and prebuilt catalog pictures remain separate browser metadata.

`../../scripts/game-build-inputs.mjs` fingerprints build inputs and ignores generated output.
`../../scripts/render-game-frames.mjs <0..7>` renders an independent eighth of Depth
Perception's animation frames, for splitting the render by hand. A build remakes them only when
their key changed. All disks and render caches remain untracked. Local builds
prepare missing frame shards with two processes at a time. `GM_SKIP_GAME_BUILD=1` defers game
output generation for these rendering jobs; normal installs and builds generate it.
SDK-only package checks and publication jobs set `GM_SKIP_GAME_BUILD=1` for all steps,
since their selected tests use synthetic format data and do not need the game disks.

`achievementArt.ts` extracts the explicitly selected public games’ original 20×20 blocks
into `src/achievements/blockArt.json`, with per-badge provenance and transparent pixels.
Run `npx vite-node scripts/achievementArt.ts` after changing those source sprites. It
rejects unknown achievement IDs, non-block dimensions and duplicate artwork. It never replaces a badge it did
not make: `achievementArtKeep.ts` refreshes or removes only entries marked `"generator": "scripts/achievementArt.ts"`,
copies every unmarked entry (hand-drawn badges, which are also listed in its `HAND_DRAWN`) through byte for byte with a
logged `kept` line, and `--adopt <id>` deliberately hands an unmarked entry that is not hand-drawn to the generator. The browser
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

- `phoneBoardPhotos.ts`: renders the Phone of the Future's front and back as top-down PNGs (a small z-buffer
  rasterizer over `games/year2000/phone/viewer/parts.json` + `parts.bin`) into
  `src/manual/printables/dexReport/`, for Dex Dynamo's science report. `npx vite-node scripts/phoneBoardPhotos.ts`.

- `fuzzFiles.ts` (`npm run fuzz:files -- [--seed n] [--rounds n] [--type gam,fli,zip,folder,...] [--limit ms] [--save dir] [--out report.txt]`)
  malformed-file test. Starts from real CD files and archive zips (read in memory), makes truncated, bit-flipped,
  huge-header, padded and wrong-type copies, and feeds them to every engine reader, the zip readers and the archive
  importer (`unpackGames`, with one file of a game folder swapped). Each case runs in a child process with a time limit
  and a heap cap. Prints a table per reader (ok, clear Error, bad = TypeError/RangeError from deep inside, hang, memory);
  exits 1 on any bad, hang or memory. Same `--seed`, same cases. `--save` writes the failing inputs to a folder.

- `pocketColorCheck.ts`: host check of the Pocket Player's level colors (`pocket-out/data/` (made by `pocketData.ts`)): the same palette and byte-order math, compared with the engine's render, written as a side-by-side PNG (`npx vite-node scripts/pocketColorCheck.ts out.png`).
- `pocketHostCheck.ts`: the Pocket Player's play rules (the Pocket repository's `src/gmcore.h`) against the real engine, game by game: each packed game's committed walkthrough replays on the engine's headless player, the same keys replay through `host/hosttest.cpp` (built with `c++` and zlib), and position, frame, scroll, score, hit points, lives, counters and a picture hash must match on every tick, and the PC speaker effects it starts (tick, number, frequencies) must be the same; one line per game (`npx vite-node scripts/pocketHostCheck.ts [id ...]`).
- `pocketSetupDrive.py PORT MIRROR ORIENT COLORS [WIRING]`: drives the three-step display setup with pretend BOOT presses and taps, then touch calibration; orientation takes 0 to 5 presses. Needs a board and PlatformIO's Python.
- `pocketControlsCheck.ts`: also checks full-panel card clearing, palette-0 margins and final picture bands at both board sizes (`host/carddrawtest.cpp`), interrupted GT911 packets, sustained flight holds, title labels/search, and both boards' picture sizes and setup orientations. The Pocket Player's touch controls (`src/controls.h` in the Pocket repository) in a touch-event replay (`host/controlstest.cpp`): sliding a finger across the pad, two fingers, a stylus tap against a drag, palm contacts, the left-handed layout, the key menu, and the layout's target sizes.
- `pocketShowcase.py [--minutes 4] [--countdown 5] [--dry-run] [--boards A,B,C]`: a choreographed demo on all three Pocket Player boards at once, for filming (takes the three lock folders, one thread per board: A plays games by self-test, B plays with made-up touches on the pad, C loads SD card games and level cards; big `S2` banners, a live three-column status in the terminal, "All tests passed" at the end, banners off and locks released even on Ctrl-C). Needs firmware with `S2` and `L`.
- `pocketData.ts`: packs every Starter the board can run into ignored `pocket-out/data/` (deflated files shared by content, one `.cfg` per game, `games.txt`); `--list` says why each one is left out; `--out <card>` writes a microSD card's `pocket/` folder, `--gmp <card>` one `pocket/NAME.GMP` per game (the Download chooser's Pocket file). The packing is `src/export/pocketPack.ts`.
- `gmosCard.ts`: writes games for Game-Maker OS (the Raspberry Pi player) to a card folder: `GAMES/<DIR>/` with each public game's DOS files, and `GAMES/LIBRARY.JSL`, its library index in `pocketData.ts`'s `library.jsonl` format plus each game's company, year and blurb; `--index-only` writes the index alone.
- `fidelityWeb.ts` and `fidelity/` (spike, 2026-11-04): the engine against real DOS. `fidelity/dosCapture.sh` runs a CD game in DOSBox with a timed key script (`fidelity/keyseq.swift` posts held keys; `fidelity/volume-keys.txt` is an example) and records video and sound with DOSBox's own capture; `fidelityWeb.ts` plays the same game headless and writes a frame per game tick; `fidelity/compare.ts` prints the share of identical pixels per tick. `ALL=1` also records every presented screen (palette fades, slides, menus) in `<out>.all.rgb`/`.all.txt` through `runHeadless`'s `onPresent`. `dosCapture.sh` exits 2 when the screen is locked and 3 when no AVI was captured. Run only while Lewis is away (it opens DOSBox; the display must be awake and unlocked). Round 3 (2026-11-05): `fidelityWeb.ts` with `-` now plays from the start in record mode (the idle menu would run `demo.rec` and press keys of its own) and `KEYS` ticks count from the first tick of scene `KEYSCENE` (default 2); `fidelity/score.mjs` aligns a web run with a decoded DOS level AVI (monotone dynamic programming) and prints identical pixels per tick, the first difference and a web | DOS | diff picture; `fidelity/pair.mjs` draws one such picture; `fidelity/fades.mjs` counts how many presented screens (fades) appear exactly in a DOS capture; `CYCLES="fixed 40000"` overrides DOSBox's speed in `dosCapture.sh`. Notes: `.for-lewis/research/fidelity/2026-11-04-spike.md`, `2026-11-05-dos.md`.
- `deepSearchCheck.ts <port> <out-dir>`: headless check of the home deep search (a word only inside one game's text file, its "found in" hint, the live announcement, axe at 1440 and 390 in light and dark, no horizontal scroll, slowest key event while indexing); starts its own dev server.

- `pocketArt.ts`: writes the Pocket Player’s art headers to ignored `pocket-out/src/` for copying into its repository, `splash_data.h` (the Sandbox sting's last full frame, 160x100) and `icons_data.h` (19 category icons); `--preview <dir>` writes PPM shots. Needs a built game disk for `SANDLOGO.FLI`.

Pocket library additions: `pocketData.ts` writes optional version-1 `library.jsonl` and a
shared, deduplicated `thumbs.pak` alongside unchanged legacy lists. `--scores <file>` reads
optional `check:cyd` route scores (the maintainer research file by default); absent scores
omit Good on touch. Flash metadata and compressed previews have 64/384 KiB build gates.
`pocketControlsCheck.ts` also runs the real six-tile host renderer, bounded library parser,
cache-corruption and 512-game RAM checks. The Pocket Player README (gamemaker-pocket repository) describes the formats.

- `machineSettingsBrowser.test.ts`: real desk MHz-button keyboard, remembered hardware, TURBO and powered readout regressions, plus 24px targets and dialog axe checks at 1440 and 390 in light and dark. Uses its own server on port 5198 and bundled headless Chromium; run with `npx vitest run scripts/machineSettingsBrowser.test.ts`.
- `cydFriendly.ts` (`npm run check:cyd -- [--out file.json] [--report file.md]` from the root or `web/`): headless CYD touch-board advisory for every public game and Starter; always excludes secret games. Reads built disks, `controls.json`, recorded walkthroughs, route-tool inventory and optional `walkPaths.json`; never builds or rewrites games. Run after the usual game build. Defaults to `.for-lewis/research/pocket/cyd-friendly.json` and `cyd-friendly.md`. JSON schema version 1 has a `games` table keyed by each row's `id`, version, Starter flag, nullable score, measured/provisional/unrated status, reasons, raw metrics, per-jump early/late timing-slack probes, walking-path tick counts and warnings; a later Pocket packer can read it without parsing Markdown. Missing inputs, replay divergence and unsupported random-seed modes produce an unrated row, never a perfect score. `cydReplay.ts` runs the engine simulator, probes earlier and later jump starts and measures solid landing widths; `cydScore.ts` holds the tested scoring policy. The generated report documents units, exact penalties and limitations. These are suggestions from one route, not proof of required precision or board playability. Unknown local flights make a score provisional; always review warnings and test on a touch board before curating a library.
- `knownGamesTable.ts`, `knownGamesSheets.ts` and `knownGamesSources.ts` (`npx vite-node scripts/knownGamesTable.ts [--reference <dir>]`, `npx vite-node scripts/knownGamesSheets.ts <out dir> [--per 12] [--reference <dir>]`): the Imported tab's known-games table. `knownGamesSources.ts` lists the known games (the CD's, and with the maintainer's reference folder the found games and the public archive's zips) and reads the archive walk bot's results. `knownGamesSheets.ts` draws contact sheets for tagging them by eye: per game its title picture and three level views drawn as the engine draws them, with its name, level count, the walk bot's result and what the tag rules read. `knownGamesTable.ts` writes `src/imported/knownGames.json` from the curated tags in `src/imported/knownGames.curated.json` (the rules' guesses where a game has none), with each game's level count and the walk bot's result.

The headless CYD advisory and Pocket host checks are hardware-untested evidence: they do not establish physical touch, display, sound or timing behavior.

## The Pocket Player repository

The Pocket Player firmware and its board tools live in https://github.com/lewismoten/gamemaker-pocket (clone it beside this repository, or set `GAMEMAKER_POCKET_DIR`). Its `pocketStatus.py`, `pocketWalk.py` (with its walk scripts), `pocketBoardCheck.py`, `pocketHeldTrace.py` and `pocketIconsShot.py` moved there; `pocketSdWrite.py`, `pocketSetupDrive.py` and `pocketShowcase.py` stay here and import `pocketStatus.py` from it. GameMaker makes what the board plays: `pocketData.ts` writes `pocket-out/data/` (the repository copies it into its `data/`), `pocketArt.ts` writes `pocket-out/src/splash_data.h` and `icons_data.h` (copy into its `src/`), and the library and `.gmp` exporters, `gmosCard.ts` and `pocketHostCheck.ts`, `pocketCardsCheck.ts` and `pocketControlsCheck.ts` stay here. Those three compile the repository's C++, so they print a skip message and exit 0 when it is not there; nothing in `npm test`, lint, typecheck or verify needs it. The checks read `pocket-out/data/`, so run `pocketData.ts` first.

Firmware downloads: `web/public/pocket/` (the web flasher and its committed firmware images) keeps working here unchanged. The canonical flasher will be https://lewismoten.github.io/gamemaker-pocket/ (the new repository's GitHub Pages); this page becomes a redirect only after that one is live. Follow-up: build and release images from the new repository.

## Other modules and data

Commands here run from `web/` unless a line says otherwise.

- [README.md](README.md) — this build-time file and command map.
- `achievementHonors.ts` — draws the stage honors certificates and Sandbox Diploma achievement badges without game art.
- `artCourseFigures2.ts` — draws course 2’s shadows and depth figures (`npx vite-node scripts/artCourseFigures2.ts`).
- `artCourseFigures3.ts` — draws course 3’s palette ramps, swaps and color-use figures, including built-disk data (`npx vite-node scripts/artCourseFigures3.ts`).
- `artCourseFigures4.ts` — draws course 4’s traveler facings, climb and walk frames and silhouettes (`npx vite-node scripts/artCourseFigures4.ts`).
- `artCourseFigures5.ts` — draws course 5’s animation rings, water and torch frames, and examples from built Starter disks (`npx vite-node scripts/artCourseFigures5.ts`).
- `artCourseKit.ts` — shared six-bit palette, PNG saving and drawing helpers for the art-course figures.
- `levelGenShots.ts` — captures the map editor’s Generate dialog and dungeon or forest results on a server supplied with `--url` (`npx vite-node scripts/levelGenShots.ts --url <own-server> --out <dir> --kind dungeon|forest --roles "3=Wall,25=Floor"`).
- `pocketRepo.ts` — locates the separate Pocket repository through `GAMEMAKER_POCKET_DIR`, defines `pocket-out/` and skips host checks when that clone is absent.
- `pocketCardsCheck.ts` — compares packed scene cards, text, titles and instructions against the engine, including pixels, palettes and waits; skips unpacked FLIs (`npx vite-node scripts/pocketCardsCheck.ts [id ...] [--data <dir>]`).
- `pocketSdWrite.py` — sends a folder to the board’s microSD card over USB serial, replacing matching files and resetting the board afterward (`python web/scripts/pocketSdWrite.py <port> <folder>` from the root with PlatformIO’s Python).
- `fidelity/pipemare-keys.txt` — timed macOS key events for the Pipemare DOS capture.
- `fidelity/sample-keys.txt` — sample timed key events for the DOS capture helper.
- `mcp/README.md` — setup, commands and limits for the local MCP server.
- `mcp/main.ts` — starts the stdio server and reads roots and the built-app directory from CLI options.
- `mcp/server.ts` — exposes the shared game tools and server tools over an MCP transport.
- `mcp/serverTools.ts` — finds, opens, creates and saves games and builds their downloads.
- `mcp/session.ts` — keeps the open game in memory and copies read-only sources into an allowed working folder on save.
- `mcp/sources.ts` — finds folders and ZIPs in allowed roots, public repository games and CD samples, with their player patches.
- `mcp/roots.ts` — resolves allowed folders and links, keeping original and catalog files read-only.
- `mcp/bridge.ts` — pairs one editor tab over a localhost WebSocket, validates origin and pairing codes, and relays tool calls.
- `mcp/exports.ts` — runs the editor’s exporters in Node with local built-site assets and a restricted file fetch.
- `mcp/vite.config.ts` — silent Vite settings for the MCP runner, with no site build plugins, watching or HMR.
- `mcp/mcp.example.json` — example stdio client configuration with a writable game folder.
- `narrate/whisper.ts` — runs local whisper.cpp or openai-whisper on clips for voice checks and word timings, without downloading models.

## Regression files

Run selected files with `npx vitest run scripts/<file>.test.ts`. Browser tests use bundled headless browsers; they do not establish real-device behavior.

- `achievementArtKeep.test.ts` — keeps hand-drawn badges byte-identical and checks deliberate adoption and generated-art ownership.
- `agentUsage.test.ts` — checks log message deduplication, task times and CSV quoting.
- `archiveCache.test.ts` — checks cache hits and invalidation when input bytes or imported code change.
- `archiveQueue.test.ts` — checks build order, request priority, retained results and clearing.
- `badgeSimilarMetrics.test.ts` — checks shape, hue-only and color-vision similarity measurements.
- `cdGamesCp437.test.ts` — checks normalization of CP437-framed catalog titles.
- `cydReplay.test.ts` — replays a built walkthrough and measures landings and jump timing slack.
- `cydScore.test.ts` — checks the CYD scoring penalties, missing inputs and provisional results.
- `deskTargetSizes.test.ts` — measures the desk controls’ rendered hit targets.
- `dialogAccessibility.test.ts` — checks shared modal names against visible headings.
- `dialogLayouts.test.ts` — checks the Community proposal form’s portrait-phone layout.
- `dialogTargets.test.ts` — checks visible dialog controls’ hit targets.
- `dialogsFitMeasure.test.ts` — checks checkbox hit areas, collapsed details and dialog measurements.
- `diskDiff.test.ts` — checks disk diff summaries, format changes and deterministic output.
- `diskDiffArgs.test.ts` — checks two-path and game-at-revision command arguments.
- `dosFloppies.test.ts` — checks floppy layout from a DOS export and refusal to overwrite output.
- `dosNames.test.ts` — checks distinct DOS 8.3 archive names and directory names.
- `editorOverviewTouch.test.ts` — checks actual hits on extended link targets and phone overflow.
- `editorTouchAudit.test.ts` — checks failures for missing editors, overflow, small targets and axe findings.
- `gameArchive.test.ts` — checks reproducible DOS ZIPs, runtime files and reversible player customizations.
- `hostedPlayerBuild.test.ts` — checks metadata and indexing rules for the hosted player copies.
- `levelMetadataFiles.test.ts` — checks canonical per-game JSON, removal of retired entries and preservation of unchanged files.
- `mcp/bridge.test.ts` — checks tab pairing, origin rules, lockout and calls through the editor bridge.
- `mcp/exports.test.ts` — checks that local asset reads cannot escape into a sibling folder with a shared name prefix.
- `mcp/server.test.ts` — checks tools, folder rules, game creation and the real stdio server with an MCP client.
- `narrate/compare.test.ts` — checks spoken-word normalization and differences using synthetic transcripts.
- `narrate/narrate.test.ts` — checks line validation, take selection, README generation and audio processing with synthetic tones.
- `narrate/pauses.test.ts` — checks expected pauses and detected inner silence.
- `narrate/phoneLines.test.ts` — checks caller casting and recorded clips for every generated phone line.
- `narrate/split.test.ts` — checks splitting, joining, trimming and stretching narration pauses.
- `narrate/spoken.test.ts` — checks spoken numbers, names, initialisms and pronunciation replacements.
- `narrate/voiceReadme.test.ts` — checks repeatable README output without changing its supplied heading text.
- `pageCatalog.test.ts` — checks that the slim Starter catalog retains fields needed at page load.
- `release/changelog.test.ts` — checks changelog sections, version selection and release cuts.
- `release/classify.test.ts` — checks commit categories, grouping and omitted private or irrelevant changes.
- `release/cut.test.ts` — checks release cutting against temporary files without a real release.
- `release/fragments.test.ts` — checks target-specific fragments beside legacy notes and removal after a cut.
- `release/supervised.test.ts` — checks the release guard’s main-checkout marker and tag matching.
- `releaseNotes.test.ts` — checks release-note grouping, order, truncation and determinism from disk diffs.
- `replayLogArgs.test.ts` — checks replay options, frame defaults and malformed logs.
- `sameBytes.test.ts` — checks added, removed and changed file hashes.
- `seoAudit.test.ts` — checks built-page metadata and deliberate regressions in temporary folders.
- `versionDisksFiles.test.ts` — reads tracked historical disk bytes from a temporary Git repository.
- `walkAutoArgs.test.ts` — checks walkthrough options, game selection and scene output.
- `waybackLib.test.ts` — checks URL extraction and archive requests with a fake fetch.
- `zipShare.test.ts` — checks that split Starter ZIPs reassemble byte for byte and save space.

## Workspace commands

The specialized web commands are listed with their scripts above or in the [kit README](../../games/kit/README.md). The remaining package scripts are below. Root-only commands run from the repository root; details of repository tools are in the [repository scripts README](../../scripts/README.md).

- `npm run dev` — root or `web/`: starts Vite; the web `predev` hook refreshes existing game outputs in the background and waits when disks are missing.
- `npm run start` — root only: runs the web development command.
- `npm run build` — root: builds SDK packages then the web app; `web/`: typechecks and builds the Vite bundle after refreshing games.
- `npm run build:packages` — root only: builds engine, archives and tools distributions in dependency order.
- `npm run prepare` — root install hook: builds SDK packages and game outputs.
- `npm run preview` — `web/` only: previews a Vite production build.
- `npm run build:games` — root only: generates game disks and extras; `--force` rebuilds games and `--force-all` also rebuilds extras.
- `npm run verify` — root only: runs web format checking, lint, typecheck, tests, package isolation and release-note checks.
- `npm run verify:changed` — root or `web/`: checks changed files against `origin/develop` or `--base <ref>`, with whole-project typechecking.
- `npm run verify:packages` — root only: builds and verifies SDK packages outside the monorepo.
- `npm run test` — root or `web/`: runs Vitest after refreshing game outputs.
- `npm run typecheck` — root or `web/`: checks TypeScript with an incremental build-info cache.
- `npm run format` — root or `web/`: formats the repository with Prettier’s content cache.
- `npm run format:check` — `web/` only: checks repository formatting with the same Prettier cache.
- `npm run lint` — root or `web/`: runs type-aware ESLint with a content cache.
- `npm run lint:full` — `web/` only: runs ESLint without its cache.
- `npm run lint:fix` — `web/` only: runs ESLint and applies available fixes.
- `npm run pretypecheck` — web hook: checks SDK declaration freshness before typechecking.
- `npm run prelint` — web hook: checks SDK declaration freshness before linting.
- `npm run predev` — web hook: refreshes existing games in the background and waits when disks are missing.
- `npm run prebuild` — web hook: refreshes generated games before building.
- `npm run pretest` — web hook: refreshes generated games before the full test suite.
- `npm run pretest:fast` — web hook: refreshes generated games before the fast test suite.
- `npm run precheck:games` — web hook: refreshes generated games before their checks.
- `npm run already` — root only: searches commits, tracked code and private notes for prior work matching task words.
- `npm run heavy` — root or `web/`: runs a command through the shared heavy-job scheduler.
- `npm run look` — root only: captures the current view or a saved shot through the Ghost Jack camera bridge, with optional OCR.
- `npm run phone:build` — root only: rebuilds both phone variants’ boards, checks, Gerbers, parts, previews and shells; physical output is hardware-untested by the build.
- `npm run backup:local` — root only: writes a dated encrypted archive of local work outside Git.
- `npm run backup:restore` — root only: decrypts a local backup into a new or empty folder.
- `npm run release:sizes` — root only: checks site, offline-copy, package and native-download size budgets.
- `npm run release:pages` — root only: builds a release tag in a temporary worktree and prepares the Pages commit; publishing needs `--push` and the supervised tag marker.
- `npm run merge:gate` — root only: merges pinned feature revisions into an isolated candidate, runs required checks and optionally pushes the tested result to develop.
- `npm run worker:bootstrap` — root only: creates a feature worktree with private generated outputs and installs dependencies; `--doctor` reports host capabilities.
- `npm run branches:triage` — root only: reports cached unmerged feature refs, prior equivalent work, conflicts and worktree state without deleting branches.
