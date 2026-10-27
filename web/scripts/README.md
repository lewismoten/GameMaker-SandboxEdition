# `web/scripts/`: build-time code

Part of the [source map](../src/README.md). A name with no folder is a file here, `../` is `web/`, and
the other folders named (`manual/`, `gfx/`…) are under `web/src/`.

This folder holds the build's Vite plugins and the scripts run by hand (from
`web/`, `npx vite-node scripts/<name>.ts`).

- Vite plugins, imported by `../vite.config.ts` (which also emits the service worker and
  `player-files.json`):
  - `cdGames.ts` serves the CD's games and `../games` (and writes them into the build, with the
    catalogs and gzip copies);
  - `gameShots.ts` draws each listed game's pictures into `games/shots/`;
  - `singlePageBuild.ts` builds `standalone.html`, and `hostedPlayerBuild.ts` the web player
    (`web-player.html`, `player/index.html` and `player/games.json`);
  - `seoBuild.ts` puts tags, JSON-LD and readable text into the pages and writes (and serves in dev)
    `robots.txt`, `sitemap.xml`, `llms.txt`, each game's `play-<id>.html` and its preview picture
    `og/<id>.png` (drawn by `ogImage.ts`), each Guide section's page `help-<id>.html` (its text from
    `manual/guideSections.ts`, which `webManual.ts` shows), and The Sandbox Scoop's RSS feed `scoop.xml`
    (`scoopFeed.ts`: every game's `printables.json` news story, dated from `scoopDates.json`).
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
  - `videoTranscript.ts` a Library video's `public/videos/<id>.transcript.json`, from its YouTube
    automatic captions (`yt-dlp --skip-download --write-auto-subs --sub-langs en-orig <url>`, then
    `npx vite-node scripts/videoTranscript.ts <id>.en-orig.vtt`): the rolling repeats removed, about
    a minute a paragraph, and the names the captions mishear spelled right; everything Lewis said
    is kept as he said it.
- The guided tour's voice: `narrate.ts` (`npm run voice`; `npm run voice:all` records every
  line again) speaks each line of `tour/lines.ts` in its host's voice (cloned from one of Lewis's voice
  samples with Pocket TTS, or one of Kokoro's stock voices via `kokoro.ts`, which runs Kokoro in
  a child process from the git-ignored `/.narrate` folder that `npm run voice:setup` fills; then
  shifted in pitch and speed as `HOSTS` in `tour/steps.ts` says),
  locally, into `../public/tour/voice/<chapter>/<id>.ogg` (Opus, mono, about 10 kbps), and
  rewrites `index.json` (id → chapter, where, words, seconds and hashes, so unchanged lines are
  skipped) and the generated `README.md` there. Its parts are in `narrate/`: `pocketTts.ts` (the
  engine, ported from pocket-tts-js, MIT), `audio.ts` (ffmpeg in and out: the voice sample's
  clearest 10 s, the pitch and speed shift, even loudness, the Opus encoding), `lineIndex.ts` and `voiceReadme.ts`. The
  model, the engine and the voice samples stay outside the repo (`--model`, `--engine`, or
  `POCKET_TTS_MODEL`, `POCKET_TTS_ENGINE`, and `NARRATE_SAMPLE_<NAME>` for a sample named in
  `SAMPLES`; `--sample <file>` puts every line in one recording, to compare); CI never runs it.
  `npm run voice -- --only <id>` records a retake (each take differs; `--seed <n>` repeats one),
  `--lines <file.json>` reads `[{ id, chapter, where, text, voice? }]` instead of the tour, `--out <dir>`
  writes elsewhere, `--wav` also keeps each take as .wav, and `--dry-run` lists what it would
  record. Never put Lewis's voice samples in the repo, a download or a test fixture.
- Pictures made once by hand: `bbsGifs.ts` made the BBS gallery's pictures in `../public/bbs`;
  `castArt.ts` and `castSprites.ts` make the Cast page's pictures in `../public/cast` (the sprites
  also walk the guided tour, with a few hosts of its own), from the other `cast*.ts` drawings (`castEgg.ts`, `castLeoSide.ts`, `castNeedle.ts`, `castTinHeart.ts`).
- Downloads from the command line: `macDmg.ts`, `winExe.ts` and `linuxTar.ts` run the same code as
  the Download button (see [`export/`](../src/export/README.md)).
- [`mcp/`](mcp) (`npm run mcp`): the local MCP server for AI tools. It uses the
  assistant's tools (`assistant/tools`) on game folders, zips, this project's games and the CD's,
  writing only in the folders it is given, with its own vite-node settings (`mcp/vite.config.ts`).
  Its README has the setup for Claude Code, Claude Desktop and other clients.
- `dosbox.ts` (`npm run dosbox`) lays out `../../dosbox/` (git-ignored) to mount as drive C: in
  DOSBox, with Game-Maker installed and every Sandbox and Bard of Bizarre game's disk beside the
  samples; `npm run dosbox:open` starts DOSBox on it.
