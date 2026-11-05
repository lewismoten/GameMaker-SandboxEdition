# Notice and credits

## A derivative work of RSD Game-Maker

This repository is a **modified fork** of the source code of _Game-Maker_, the game
construction kit produced from 1991 to 1995 by Recreational Software Designs (RSD) of
Amherst, New Hampshire. It was sold by direct mail in the US by KD Software (RSD also made a
distribution deal with GameLynk), in the UK as _Captain GameMaker_ by Screen Entertainment,
and worldwide on CD-ROM by Microforum, as [Wikipedia](https://en.wikipedia.org/wiki/Game-Maker)
records. Game-Maker was created by
G. Andrew (Andy) Stone with G. Oliver Stone, Oliver Stone Jr. and Joan Stone. Today it is
usually called **RSD Game-Maker**, to tell it apart from later, unrelated products with
similar names; this repository does the same.

On 12 July 2014 Andy Stone, Game-Maker's original programmer, published the source code,
the CD image and an installed copy on GitHub under the **MIT License**
([gandrewstone/GameMaker](https://github.com/gandrewstone/GameMaker)). This fork keeps
that history and that license. Everything added here (the browser version in `web/`, the
"1994 desk", the Sandbox Software and Bard of Bizarre games in `games/`, and the Mac,
Windows and Linux players in `mac/`, `win/` and `linux/`) is released under the same MIT
License; see [LICENSE](LICENSE), whose original copyright notice is kept unchanged as the
license requires.

## The name: Game-Maker: Sandbox Edition

To keep this fork from being mistaken for RSD's own release, it goes by **Game-Maker:
Sandbox Edition** (short: _Game-Maker SE_), after the Sandbox BBS Lewis ran in Pittsburgh in
the 1990s. It is based on RSD Game-Maker 3.0 and keeps its file formats, but it is not the same
program, and the pieces it draws are its own:

- the **Owner's Guide** on the desk is a new guide written for this edition, not the manual
  RSD shipped;
- the **Game-Maker box** and **CD** on the desk are this edition's own designs, marked
  "Sandbox Edition", not photographs or copies of the original box and disc;
- the DOS **Game-Maker** you run on the desk is a recreation drawn to look like the original,
  rebuilt in TypeScript from its source on a simulated PC; no DOS or x86 code runs.

Refer to this project as _Game-Maker: Sandbox Edition_ (https://github.com/lewismoten/GameMaker-SandboxEdition)
and to the original as _RSD Game-Maker 3.0_ (Game-Maker 3.0 by Recreational Software Designs)
(https://github.com/gandrewstone/GameMaker).

## Why a web version

When he released the code, Andy Stone said that people were free to use it as they liked,
but that "if there is interest in preserving the old games you guys made then porting
Game-Maker to modern OSes is the first step"
([Wikipedia: Game-Maker](https://en.wikipedia.org/wiki/Game-Maker)). Running it in a web
browser seemed the simplest way to reach every modern operating system at once: Windows,
macOS, Linux, Chromebooks, tablets and phones, with nothing to install.

The port's focus is **the original file formats**. Game-Maker: Sandbox Edition reads and writes
`.GAM`, `.MAP`, `.BBL`/`.MBL`/`.CBL`, `.MON`, `.CHR`, `.PAL`, `.SND`, `.REC` and the rest
byte for byte, so a game made in the browser today still loads in the original DOS
RSD Game-Maker and plays on original hardware or in a DOS emulator such as DOSBox, and an old
game folder opens in the browser unchanged.

## Credits

- **RSD Game-Maker 1.0–3.0** (1991–1995): Recreational Software Designs: G. Andrew Stone,
  G. Oliver Stone, Oliver Stone Jr. and Joan Stone. Source released under the MIT License
  by Andy Stone in 2014.
- **Peter (Pete) Savage** wrote Game-Maker's Sound Blaster voice-file routines
  (`code/GM/SOUNDC.C`) and joystick routines (`code/GM/JSTICKC.C`, `code/GM/JSTICKA.ASM`),
  and the Sound Designer's digitized speech with Andy Stone (`code/GM/SNDEDIT.C`).
- **This fork**: Lewis Moten.
- **The web port**: written with **Claude Opus 5.5** (Anthropic), covering both the
  _1994 desk_ (the recreated PC, DOS prompt, Game-Maker's VGA designers, the BBS) and the
  _modern web_ editor and player. AI assistance did most of the porting and code
  generation: reading the original C source, writing the TypeScript, building the Sandbox
  Software games in code, and testing them, directed and reviewed by Lewis.
- **Helpers from October 30, 2026**: **Claude Sonnet 5.5** (Anthropic) runs as Claude Opus
  5.5's helper agents. Opus plans the work and briefs each helper, Sonnet does it, and Lewis
  directs both. Its first jobs were the guided tour's "What's in the box" chapter and fixes to
  the game builds. It also drew Teddy's Forte Locks toy safe on the desk (`web/src/fortKnox/`: the
  safe, its dial and the dog treat store inside), from Lewis's description of his childhood
  bank. Notes kept for Lewis stay out of the repository.
- **Reviews and a sounding board**: Lewis has also had **ChatGPT-6.1 Sol** (OpenAI) review
  the fork, TURBO BUTTON and the games' content, and talked ideas through with **Google
  Gemini 3** (Google): 1990s nostalgia and his own memories, the home-office supplies of the
  time, how the CMF music format worked, what came in a 1990s software box, how a save editor
  might look, and ways to get more out of a game. Gemini 3 drew the ASCII-art can in
  LUNCHMEAT's flood on The Sofa (`web/src/retro/bbs/sofaSpam.ts`). What they suggested came
  to the project as notes and ideas, through Lewis.
- **OpenAI Codex** (through Visual Studio Code, directed by Lewis): from October 27 to 30,
  2026, while Claude was out of its weekly tokens, Codex worked on the fork with four OpenAI
  models, by Lewis's account of when he switched between them (the commits carry only a
  "Co-authored-by: Codex" line, so the hand-over times are approximate):
  - **GPT-6.0** and **GPT-6.1 Sol**, until about 6:30 p.m. on October 30, did most of it: the
    editor, map, palette and Integrator features, achievements, the BBS callback signup,
    FASTPLAY, per-game ZIPs and the npm packages listed below. Which of the two made which
    change was not recorded.
  - **GPT-6 Astra**, from about 6:30 to 7:15 p.m.: the continuous course maps and the
    fictional hint line.
  - **GPT-5.6 Terra**, from about 7:15 p.m.: rebalanced the score values of seven Sandbox and
    Bard games (and one game's gold), Teddy's piggy bank, detecting dedicated palette color
    areas, finer map zoom, and grouped duplicate map arrivals.

  Codex made no new levels, art, music or story text for the games. The entries below that say
  "OpenAI Codex (GPT-6)" are part of the same work.

- **The npm engine package** (`web/packages/engine/`): extracted and documented with
  **OpenAI Codex (GPT-6)** through Visual Studio Code, directed by Lewis, from this fork's
  existing TypeScript web engine.
- **Editor extensions and character auditions** (`web/src/editor/`): native frame
  painting, live scenery previews, resource selection improvements, asset galleries,
  native file copy/paste and Integrator file scoping, repeating map
  viewports and seam-aware editing tools, audition code
  and its short playful UI lines were implemented with **OpenAI Codex (GPT-6)**,
  directed by Lewis Moten. Auditions read artwork from the selected source game;
  that artwork remains the work of its credited authors.
- **First-run hardware setup and FASTPLAY** (`web/src/player/`, `web/src/retro/hacks/fastPlay.ts`): browser setup controls, remembered per-game choices, the BBS utility, regression checks and playful UI lines implemented with **OpenAI Codex (GPT-6)**, directed by Lewis Moten. The original PLAYGAME configuration flow in `code/GM/PLAYGAME.C` is the behavioral reference; no original DOS files are changed.
- **Incremental JPEGs and interrupted BBS picture transfers** (`web/packages/engine/src/formats/jpeg.ts`, `web/src/retro/bbs/`): completed-MCU visibility, atomic scan refinements, verified-prefix transfer handling, viewer cleanup and regression checks implemented with **OpenAI Codex (GPT-6)**, directed by Lewis Moten. JPEG syntax follows [ITU-T T.81 (1992)](https://www.w3.org/Graphics/JPEG/itu-t81.pdf), by CCITT/ITU and the Joint Photographic Experts Group. The existing AC-refinement procedure identifies libjpeg as its algorithm reference (Independent JPEG Group, Thomas G. Lane and contributors; [IJG License](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/README.ijg)). This software is based in part on the work of the Independent JPEG Group. The tiny test images are original program-generated color patterns encoded locally with libjpeg-turbo 3.2.0's cjpeg ([IJG and BSD-style licenses](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/LICENSE.md)); no encoder source or binaries are bundled. The ZMODEM simulation follows Chuck Forsberg/Omen Technology's [1988 protocol description](https://techheap.packetizer.com/communications/modems/zmodem8.html): damaged subpackets are rejected instead of painting invented pixel corruption. These publications are references; their text and diagrams are not bundled.
- **Continuous course maps** (`web/src/manual/printables/levelCourseSvg.ts`): shared-coordinate image assembly and map annotations implemented with **OpenAI Codex (GPT-6)**, directed by Lewis Moten. Game artwork retains its existing authors and credits.
- **Fictional hint line** (`web/src/desk/room/phone/hintBill.ts`, `hintLine.ts`): local elapsed-time accounting, backup integration, phone menu and cancellation, achievement, original Teddy dialogue and regression tests implemented with **OpenAI Codex (GPT-6)**, directed by Lewis Moten. The charges are simulated game data; no payment service is used. The per-minute billing paid up front, the automated game-by-game phone tree (`hintTree.ts`, `audio/phone/hintGames.ts`, hints adapted from each game's own hint book) and the Hint Giant script were reworked with **Claude (Sonnet 5.5)**, directed by Lewis Moten.
- **BBS callback signup** (`web/src/retro/bbs/signup*.ts`): local verified-handle records, simulated incoming modem callbacks, signup flow, tests and playful lines implemented with **OpenAI Codex (GPT-6)**, directed by Lewis Moten. Manual `ATA` answering and `RING` result codes follow the [U.S. Robotics modem command reference](https://ads.usr.com/support/3cxm756/3cxm756-ug/ATCOMS.HTM). This is a behavioral reference; no vendor source, documentation text or modem binaries are bundled.
- **Final Curtain's paper spyglass and evidence sheet** (`web/src/manual/printables/spyglass.ts`, `fingerprint.ts`, `sleuthPrints.ts`; the stage door in `games/sleuth/`): the black-ink spyglass drawing, the seeded fingerprint patterns and the stage-door puzzle were written by **Claude Sonnet 5.5** (Anthropic), from Lewis Moten's idea. The prints are hidden with the red-film technique the hint book uses (`redFilm.ts`), after Daniel C. Wilson's "red reveal" (danielcwilson.com/blog/2018/02/optical-fun-red-reveal/); no code was copied from it. No third-party artwork or fingerprint data was used.
- **The Starters** (`games/kit/starter/`; 56 games in the Starters home tab):
  - **The Basics:** `games/first-steps/`, `games/keys-and-doors/`, `games/meet-the-monsters/`, `games/room-to-room/`, `games/coins-and-score/`, `games/breakable-walls/`, `games/walk-the-ground/`, `games/watch-your-step/`, `games/things-that-grow/`.
  - **Moving and Pushing:** `games/power-up/`, `games/throw-it/`, `games/many-weapons/`, `games/inventory/`, `games/health-and-hearts/`, `games/momentum/`, `games/jump-boots/`.
  - **Worlds That Push Back:** `games/slippery-and-bouncy/`, `games/gravity-on-gravity-off/`, `games/swim/`, `games/gusts/`.
  - **Changing Your Hero:** `games/kit-moves/`, `games/choose-hero/`, `games/take-the-wheel/`.
  - **Foes and Bosses:** `games/boss-hits/`, `games/boss-phases/`, `games/who-wins/`, `games/short-lived/`, `games/follower/`, `games/searchlight/`, `games/flock/`.
  - **Telling a Story:** `games/say-something/`, `games/pictures-and-cartoons/`, `games/sounds-and-music/`, `games/day-night/`, `games/same-house/`, `games/voice/`.
  - **Putting It Together:** `games/beat-the-clock/`, `games/countdown/`, `games/warning-first/`, `games/one-more-try/`, `games/your-first-game/`.
  - **Wiring and Puzzles:** `games/switches/`, `games/three-tokens/`, `games/and-gate/`, `games/secret-doors/`, `games/show-the-count/`.
  - **Bigger Worlds:** `games/scroll/`, `games/many-rooms/`, `games/diagonal-wrap/`, `games/blocks-budget/`.
  - **Showcase Tricks:** `games/dialog/`, `games/popups/`, `games/scripted/`, `games/parallax/`, `games/horizon/`, `games/beltway/`.

  The shared palette, block set, sign blocks, hero, monsters, screens, song and sounds, First Steps', Keys and Doors', Meet the Monsters' Room to Room's, Coins and Score's and Power Up's levels, lock blocks, the mint gumdrop and star monsters, Throw It's thrown star, sparkle and grump, Health and Hearts' heart and extra-life face, Say Something's friends, speech bubbles and talks, Beat the Clock's bar, clock face, gate and clock door, Switches' levers, dotted planks and pools, Gravity On, Gravity Off's top-down block set and Kit's four-direction top-down pictures, Sounds and Music's money bag, notes and two songs, Your First Game's levels, title and Make it yours guide, Who Wins?'s levels, red crowned gumdrop and mint, purple and red foes, Pictures and Cartoons' framed paintings, easel and the BLOOM cartoon (a seed, sun, daisy and Kit, drawn frame by frame in code), Smash It's crates, rubble, stuck coin and spinning gems, Big Bug's beetle stages and the arena title look, Warning First's fog vents, fog and flickering planks, Day and Night's sun that is a moon, windows, lanterns, stars, gates, three palettes and song, The Same House's street fronts, house and tower room, seven palettes, house numbers, title picture and song, Here Today's bubble, sleepy and awake gumdrops and song, Three Tokens' purple tokens, gates and circuit-board title look, Rooms on One Map's colored room bricks, Many Weapons' pouches, flame, frosty grump and song, Everybody Talks' speech-bubble cards, talk layout, neon title and song, Diagonal Wrap's edge-marked roads and two-block hedges, Score Popups' coins, gem, box and hand-drawn numbers, Boots and Jet Pack's blue boot-charge bubbles and song, words and manual, Round and Round's truck, sliding scenery strips, loop track, car and lap lamps, and the play-testing bot were written fresh with **Claude Sonnet 5.5** (Anthropic), directed by Lewis Moten. Everything is drawn and composed in code; the sign letters are the PC's 8x8 font already credited above (the arrows are drawn). No third-party artwork or audio was used.

- **FLAGS.EXE** (`web/src/retro/hacks/flags*.ts`): the debugging utility that lists, sets, clears, resets, backs up and restores the desk PC's remembered browser state, its BBS Warez listing and tests, written with **Claude Sonnet 5.5** (Anthropic), directed by Lewis Moten.
- **DOS clock shortcuts** (`web/src/retro/dos/`): named room times, command help, and clock regression checks implemented with **OpenAI Codex (GPT-6)**, directed by Lewis Moten.
- **Website game ZIP distributions** (`web/scripts/gameArchive.ts`, `web/src/project/hostedZip.ts`): the reproducible DOS distribution builder, shared browser ZIP loading, permanent links and Vite serving were implemented and verified with **OpenAI Codex**, directed by Lewis Moten. Original game data stays intact; DOS runtime and game notices travel in each archive.
- **The npm archive utilities** (`web/packages/archives/`): the fork's ZIP codec and portable game import discovery, consolidated and verified with **OpenAI Codex (GPT-6/6.1)** under Lewis Moten's direction. The underlying code was written with **Anthropic Claude Opus 5.5**. Compression uses platform streams; no third-party archive library is included. The package carries its own license and notices.
- **The npm development toolkit** (`web/packages/tools/`): extracted, packaged and verified with **OpenAI Codex (GPT-6/6.1)** under Lewis Moten’s direction, using this fork’s format codecs, drawing and audio builders, and reference simulation. Game-specific assets stay in the consuming projects. The self-contained npm workspace migration was implemented and verified with OpenAI Codex (GPT-6.1).
- **Added to the site in October 2026**, also written by **Claude Opus 5.5** as Lewis
  directed, from no one else's code, art, data or recordings: the desk modem's line speeds
  and the handshake sounds you hear for each (see "Modem sounds" below); TERMINAL's TTY calls
  with Mrs. Novak (see "TTYs" below); the Sandbox BBS's door game, TIC-TAC-TOE BY MODEM, and
  its make-believe opponent SCROLLMASTER; the printable World Map and Level Maps, drawn from
  each game's own files; the editor's level check, its generators (the maze, the one-click
  fixes, the block-art helpers) and its walkthrough bot (see "The level check" below); opening
  games that other sites link to or send (`web/src/linkIn`, `docs/embed.md`); the new
  opening of Teddy's Theme (`games/kit/teddyTheme.ts`), an original tune for the Teddy games;
  and the "Made with Game-Maker: Sandbox Edition" opening stings the editor offers new games
  (`games/kit/madewith.ts`, shipped as `web/public/opening/madewith.fli` and `.gif`, ray
  traced like the Sandbox Software sting, and the three flat ones `games/kit/madewithMore.ts`
  draws: block by block, wipe and typewriter, `web/public/opening/mw*.fli`; the editor's
  "Classic RSD" choice copies RSD's own `RSDTBOX.FLI` from the CD instead), the "PRESENTS" card the editor draws for a
  game's maker (`web/src/editor/tools/opening`), and _TURBO BUTTON_, the site's 1990s-style
  game magazine (`web/src/manual/magazine`): its words, layout and drawings, with screenshots
  of the games, the desk and the site themselves and its interview with Lewis drawn from his own account in
  `docs/history.md`; The Ultimate Owner's Guide (`web/src/manual/ultimate`); and the desk's
  props, drawn in code: the GRAVITAS game pad, the ILLOGITECH speakers and their SOUND BOASTER
  switch, the mugs (each badge made from a game's own files or the BBS's ANSI art) and the mouse
  pad prints. Like everything else added here they are under
  the MIT License, so the games they open can carry them anywhere.
- **Lewis's DOSBox screenshot** of A Fly Named Carl's garbled title (his own capture, taken while
  testing the games in real DOS) illustrates "Where Game-Maker Runs Out" in The Ultimate Owner's
  Guide (`web/public/ultimate/carl-dos.webp`, cropped to the game screen and scaled to 320 × 200),
  and _TURBO BUTTON_'s feature "Bugs Only DOS Could Find" (`web/public/magazine/dos-carl.webp`,
  cropped to the game screen at the size DOSBox drew it). It is source material from Lewis,
  shared under the same terms as the rest of this fork.
- **Pictures and recordings made by scripts in this repository** (`web/public`), all under the
  MIT License like the games they show: the Cast page's pictures (`cast/`, drawn from the games'
  built files by `web/scripts/castArt.ts` and `castSprites.ts`); the gameplay frames behind box
  shots and manual pages (`frames/`, `web/scripts/shotFrames.ts`); the 1200 × 630 social preview
  `og-image.png` (`web/scripts/ogImage.ts`); the app icons (`icon.svg` and the PNGs made from
  it, drawn for this project as a block grid); the magazine's screenshots of the site, its
  editors and the desk (`magazine/`, `web-*.webp` and `desk-1994.webp`); and the demo recordings
  for CD games that shipped without one (`extras/demos`, recorded and replayed by
  `games/kit/cdDemos/make.ts`; they are not part of the original games). The Credits page's
  small title-screen pictures (`credits/`) are frames of RSD's own Game-Maker title screen and
  of the CD games it names, shown to credit their authors, and of this fork's own games; the
  BBS picture thumbnails there (`credits/bbs`) are the pictures credited in the paragraph on the BBS pictures.
- **Tricks From the Shareware Authors** (chapter 17 of The Ultimate Owner's Guide,
  `web/src/manual/ultimate/chaptersShareware.ts`) and the archive counts in its "Where Game-Maker
  Runs Out" describe techniques found by surveying community Game-Maker games in the
  [Internet Archive's Game-Maker Archive collection](https://archive.org/search?query=subject%3A%22Game-Maker+Archive+featured+games%22):
  _Blinky 2_, _Blinky 3_, _Ninja Tuck_ and _A-J's Quest_ (A-J Games), _Crystal Mania 4_,
  _Parsec Man 3D_ (Mark Hadley), _Thal's Quest for the Crystals_,
  _Orb: the Derelict Planet_, _Shanna_ (Angelo Felix), _Andy in Asunderland_, _Builder_
  (A-J Games), _Hurdles_ (Roland Ludlam), _Seal Boarders_, and RSD's _Penguin Pete_. The games
  belong to their authors; the guide names them and describes their ideas in its own words, and
  copies none of their art, music, sounds or text.
  Its section "Customizing the player's own words" describes the hex edit found by comparing
  _Builder_'s player byte for byte with the CD's `XFERPLAY.EXE` (its menu words overwritten with
  spaces) and that of A-J Games' unfinished _Rōdïp: Rover of the Deep_ (its status words renamed
  Energy and Failsafes, the high-score words cleared): these two games led this project to map
  every word the player shows, and the earlier players' `GMTITLE.GIF` title card, from the same survey; its table of
  the player's words (`playerWords.ts`) is read from the CD's own `cd/gm/xferplay.exe`. No
  author's player or registration details are copied or named.
  The same two A-J Games players led to the **DOS player customizer**: the integrator's DOS player
  panel (`web/src/editor/editors/integrator/dosPlayer/`) and the desk's `PLAYHACK.EXE`
  (`web/src/retro/hacks/playHack.ts`), which patch a copy of the CD's `XFERPLAY.EXE` within the
  rules their hand edits kept (`web/src/dosPlayer/`), with presets after Builder's blanked menu
  and Rōdïp's renamed status words. Importing a game folder reads such a hand-edited player back
  into the panel; Acord Games' shared player, whose renamed file extensions it recognizes and maps
  back, is only read, never copied. The patch offsets were found in this project's own reading of
  `cd/gm/xferplay.exe` against `code/GM/PLAYGAME.C` and `HISCOREL.C`.
- **MD5** (`web/packages/archives/src/player/md5.ts`) is written from the algorithm's description in RFC 1321
  (R. Rivest, MIT Laboratory for Computer Science and RSA Data Security, Inc., 1992), only to tell
  the CD's `XFERPLAY.EXE` from other files before patching it; no RSA reference code is used.
- **Research: the whole Game-Maker Archive, ideas only.** A second survey read every Game-Maker
  game in the Internet Archive's Game-Maker Archive collection, 271 games in all, with this
  project's own file readers (no program from them was run). Its techniques are described,
  without naming the games, in The Ultimate Owner's Guide's "More from the archive" (chapter 17,
  `web/src/manual/ultimate/archiveTricks.ts`), chapter 4's "The gate is the exit" and "An AND
  gate from monster power", and chapter 5's "Links that misfire", "Many rooms on one map" and
  "Laps round the wrap" (`chaptersPlay.ts`), and in _TURBO BUTTON_'s "Masters, the next disk
  box" (the third page of `sections/masters.ts`). The faults it found in those games shaped the
  Level check's link, missing-part and speed-limit checks (`web/src/editor/check/checks/linkChecks.ts`,
  `missingParts.ts`, `gameChecks.ts`). Ideas only: none of the games' art, music, sounds, text
  or players is copied, and no author, owner or registration detail is named.
  The same survey of the games' music instruments showed which timbres the music editor's presets lacked; six presets (Wobbly Vibes, Soft Reed, Glass Tine Keys, Round Sub, Chime Harp, Wobble Pad) were then designed from the chip's operator settings, written by **Anthropic Claude Sonnet 5.5**. No instrument data was copied.
  A second survey (November 2026) of every archived game's CMF instruments, compared by ear-proxy renders through the engine's OPL2, proposed eight more (Distant Choir, Fuzz Stab, Whistle Lead, Wobble Organ (low), Low Brass Swell, Reed Swell, Steel Clank, Sparkle Bell), also written fresh by **Anthropic Claude Sonnet 5.5**; each differs from every archived and CD patch in at least five of its eleven bytes. No instrument data was copied.
- **Ideas from the same archive in this project's games.** A second survey of the community games in
  the Internet Archive's Game-Maker Archive collection suggested touches to this project's own
  games: _Quest for the Round Tuit_'s tide poles on the Dawdle Flats and _In The Year 2000!_'s
  boarding-ramp countdown, both clocks read from a chain of timed blocks, as the archive's games
  did with block rings and staged lights; and _A Fly Named Carl_'s sugar, a flight meter made of
  the air itself (fresh air costs a counter, and with none left it no longer holds him up), as an
  archive game's sky costs its flight counter; and _Mustard Seed Hustle_'s red laces, an upgrade
  made by sequence order (faster walks placed before the plain ones on the same keys, on only
  while the laces are carried), as an archive game's speed boots work. Ideas only: the blocks,
  art and words are this project's own, and nothing from those games is copied.
- **Research: watching people play Game-Maker games.** Observations from two videos informed
  The Ultimate Owner's Guide (chapters 2–4, 9–12, 15 and 17, `web/src/manual/ultimate/`) and
  _TURBO BUTTON_'s Design Desk letters (`sections/mailBag.ts`), "What Players Hate (and How to
  Fix It)" (`sections/gripes.ts`) and "Readers' Picks: Polish Over Size" (`sections/readersPicks.ts`,
  whose three games are made up): **levelengine**'s livestream
  "[RSD Game Maker Binge](https://www.youtube.com/playlist?list=PLmyqeI1gB83ufUYjoFYJ2WeAMjlJQoq76)" (YouTube, 2020, 34 parts, with
  its viewers' chat), and **Pixelmusement**'s
  "[ADG Episode 250 - Game-Maker](https://www.youtube.com/watch?v=8oy5pXPXxbk)" (Ancient DOS
  Games, YouTube, 2018). What made players stuck, quit or grin is retold in this project's own
  words, and every engine claim was checked against `code/GM/PLAYGAME.C` and its port (where a
  video and PLAYGAME disagree, PLAYGAME wins). No material is copied: the videos and the chat
  aren't quoted, no viewer is named, and none of the games' art, music or text is used.
- **The Shareware Shelf** in _TURBO BUTTON_ (`web/src/manual/magazine/sections/shelf.ts`) lists
  the titles, years and makers of the Game-Maker games in the
  [Internet Archive's Game-Maker Archive collection](https://archive.org/search?query=subject%3A%22Game-Maker+games%22),
  fetched from archive.org's public search API by `web/scripts/gameMakerArchive.ts` into
  `web/src/manual/magazine/data/gameMakerArchive.json` (the query and date are in the file).
  Titles only: no files from the collection are copied, and the page doesn't link to them. Its
  companion feature, "Tricks of the Shareware Masters" (`sections/masters.ts`), describes in its
  own words techniques found in the collection's featured games (_Blinky 2_, _Blinky 3_,
  _Parsec Man 3D_, _Ninja Tuck_, _Hurdles_, _Seal Boarders_, _A-J's Quest_, _Shanna_, RSD's
  _Penguin Pete_, and the limits reached by _A-J 3_, _Taken by a Vampire One Night_, _Badman III_
  and _Crystal Quest_), showing none of their art, music, sounds or text.
- **Sandbox Software games** (`games/`): new games made for this fork, built in code into
  real Game-Maker files. "Sandbox Software", its address and its BBS number are fictional.
  The games were written and built by **Claude Opus 5.5**: the code, art, music, sounds and
  text. Many are drawn from Lewis "Lewie" Moten III: his blog writing, photos he provided,
  and conversations about his interests, experiences and hobbies. Lewis directed each game
  and played it as it came together, and his feedback shaped every one. Teddy, Gwinn,
  Doc Leo and THE CHEZ (Lewis's CitiCar) appear as themselves.
- **KEEP IT BRIEF!'s stories** are Lewis's 100 Word Stories, written for **Laurence Simon**'s
  weekly 100 Word Stories challenge on the
  [100 Word Stories Podcast](https://oneadayuntilthedayidie.com/). Each week's topic, shown on
  the game's story cards, was set by Laurence or chosen by the week before's winner, voted for
  by the podcast's writers and listeners; thanks to all of them.
- **The Bard of Bizarre games** (`games/`: Third Goat from the Left, Mustard Seed Hustle,
  Thread the Needle, Brother Camel, Loaf #13, Certified Rat Tickler, Where's the Remote?!,
  A Fly Named Carl, The Great Dairy Reckoning of 3:17 A.M., Cleanse Me, O Loofah, But Leave
  My Soul, I Screamed, She Smirked, Shakespeare in Sweatpants, and Veni, Vidi, Risi! by
  Lewis's group of that name): games made from Lewis's songs and monologues, presented as
  1995 shareware from The Sofa BBS; their shareware fee and address are part of the story,
  and they are free under the MIT License, except the voice clips cut from their recordings
  (see "The Bard of Bizarre recordings" below). The songs' lyrics and monologues were shaped with
  ChatGPT from Lewis's prompts, and their music and vocals were made with Riffusion (one
  service under three names: Riffusion renamed itself Producer.ai, and Google bought it and
  made it Google Flow Music); the games' FM scores are arranged from those recordings, and their
  voice clips are cut from them. The exceptions: Certified Rat Tickler came with no
  recording, so its music was composed for the game by Claude Opus 5.5, as was the music
  under The Great Dairy Reckoning's spoken recording and Shakespeare in Sweatpants' FM score
  (composed from the tempo, key and chords of its recordings' music beds); Mustard Seed
  Hustle's animated cover was made with Producer.ai (Riffusion's later name); the covers of Third Goat from the Left
  and Thread the Needle, Brother Camel were made with Riffusion; the other games' title and
  cover art was drawn for them by Claude Opus 5.5. The Bard's logo (the rooster in
  spectacles) was made with DeepAI, and the Doc Leo photos are Lewis's own. Claude Opus 5.5
  wrote and built the games themselves (code, levels, art and arrangements), directed by
  Lewis.
- **The BBS pictures** (`web/public/bbs`, downloadable from the Sandbox BBS's GIF Gallery and
  The Sofa's GIF area): the photos are Lewis's own (Teddy, Gwinn, the gazebo, the hobo clown
  and Doc Leo, the Dog House library and THE CHEZ), except **CHEZTED.GIF** and
  **THECHEZ2.GIF**, one shot of Lewis holding Teddy in front of THE CHEZ, which was taken by
  **Nicky Foster** of the Front Royal-Warren County Chamber of Commerce as a promotional photo
  of Lewis as one of the sponsors of its upcoming Revitalize or Die Civic Pride Workshop, and
  **COLONIAL.GIF**, Lewis in colonial dress beside George Washington, which was taken by
  **Todd Jones**, Director of Technology, County of Warren, at a Warren County VA250 event, a
  flag retirement ceremony. The Bard logo (BARDLOGO.GIF) was made with DeepAI; the Library's
  printed disk labels for the Bard's games carry it too, its white ground taken out.
- **The desk's posters** (`web/public/desk`): the "Moten Snow-to-Software Operations" poster
  (`moten-snow-to-software.*`) was made with **DeepAI**, on Lewis's paid commercial plan. The
  Doc Leo black-light poster (`docleo-blacklight-*.webp`) was made by **Claude Opus 5.5** from
  two of Lewis's photos of himself, over many rounds of his corrections, with
  `games/kit/scans/blacklight.py` (Python with Pillow and NumPy). Its glance frames, in which
  Doc Leo now and then looks to one side and smiles, were drawn the same way from the same
  photo. The poster's DOC LEO lettering is set in **Phosphate** (Steve Jackaman and Ashley
  Muir; © International TypeFounders, Inc.), a typeface that comes with macOS: only the
  lettering's pixels are in the poster pictures, and no font file is in the repository.
- **The guided tour's voices** (`web/public/tour/voice`): Doc Leo's lines (and Teddy's, when he
  talks) are spoken in voices cloned from **Lewis Moten's own recordings**, made by him, with his
  consent, by
  **Pocket TTS** (Kyutai, [huggingface.co/kyutai/pocket-tts](https://huggingface.co/kyutai/pocket-tts),
  model weights under the Creative Commons Attribution 4.0 International License, CC BY 4.0),
  in **vlapky**'s ONNX conversion,
  [pocket-tts-onnx](https://huggingface.co/vlapky/pocket-tts-onnx) (its weights CC BY 4.0, its
  conversion code Apache-2.0). The clips are made on the developer's computer by
  `web/scripts/narrate.ts`, whose engine (`web/scripts/narrate/pocketTts.ts`) is ported from
  vlapky's **pocket-tts-js** (MIT License, Copyright (c) 2026 vlapky; the notice is kept in that
  file) and runs Microsoft's **ONNX Runtime** (onnxruntime-web's WASM build, MIT License,
  Copyright (c) Microsoft Corporation), with ffmpeg for the sound files. The model, the engine
  and Lewis's recording stay on his computer and are not in the repository or any download;
  Pocket TTS's built-in voices are never used. Only the generated clips are committed, and they
  play on the site only (exported games don't carry them).
  The cloned voices speak for Doc Leo (Lewis's own), Joe the night librarian, teenage Lewie,
  Watt and Professor Fiddlesticks, each shifted in pitch and speed. Gwinn's lines are spoken in **Kokoro**'s stock
  "Sky" voice (`af_sky`), pitched up, Dex Dynamo's in its "Puck" voice (`am_puck`), Inspector
  Ada Penn's in its "Emma" voice (`bf_emma`) and Courier Max's in its "Michael" voice
  (`am_michael`), a little faster: **Kokoro-82M**
  by hexgrad ([huggingface.co/hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M),
  Apache-2.0) in the ONNX Community's conversion, run by **kokoro-js** (Apache-2.0) with Hugging
  Face's **Transformers.js** (Apache-2.0), the **phonemizer** package (Apache-2.0) and ONNX
  Runtime (MIT). These are installed by `npm run voice:setup` into a git-ignored folder outside
  the app's own packages, and the model stays on Lewis's computer.
- **The wall phone's voices** (`web/public/phone/voice`, on the 1994 desk): every caller's lines
  (Mom, Dad, Grandma, Jenny, Linda, Gus, the 911 dispatcher, the time and weather lines, the Movie
  Line, the ratings council's recording, three answering machines and the Hint Giant of Teddy's Hint Kennel) are
  recorded clips made on the developer's computer by `web/scripts/narrate.ts --lines phone`, with
  the same tools as the tour's voices (above). Dad, the Movie Line and the Hint Giant are spoken in voices
  cloned by **Pocket TTS** (Kyutai, CC BY 4.0) from voice samples kept on Lewis's computer ("olden
  mon", "Snooty Wiz" and "Scroobie", the last also Teddy's tour voice, here a little lower and slower), shifted in pitch and
  speed; Lewis's own voice is not used. The others use **Kokoro-82M**'s stock voices (hexgrad,
  Apache-2.0): `af_heart` (Mom), `af_sarah` (Linda), `am_onyx` (Gus), `af_jessica` (Jenny),
  `af_aoede` (Grandma), `am_liam` (the 911 dispatcher), `af_alloy` (time and temperature),
  `am_adam` (the weather line), `af_kore` (the phone company's recording), `am_fenrir` (the
  ratings council), and `af_river`, `am_eric` and `am_echo` (the answering machines). The phone-line sound
  (a 300 to 3400 Hz band and a little hiss) is made live in the browser. Words with no clip are
  spoken by the browser's own speech. Checked with OpenAI's **Whisper** (MIT).
- **Teddy's and Gwinn's barks** (`web/public/tour/sfx`): Lewis Moten's own recordings of his
  dogs, cut into short clips for the guided tour. Five of the clips are Tune-Up's barks too
  (`games/tuneup/src/sound/barks`, as 8-bit WAVs for its VOCs). The whole recordings stay on
  his computer.
- **Tune-Up's slide whistle** (`games/tuneup/src/sound/notes.ts` `slideWhistleVoc`): synthesized
  in code for the game (a gliding tone with a breath of noise), not a recording.
- **Tune-Up's traffic camera and siren** (`games/tuneup/src/sound/notes.ts` `ticketVoc`):
  synthesized in code for the game (two clicks of noise, a rising whine and a soft two-tone
  siren), not a recording.
- **Public-domain melodies.** The games' and the site's music is arranged and synthesized for
  this project (there is no recording to credit), but a few pieces quote older tunes whose
  compositions are in the public domain in the US:
  - _Teddy's Little Bigger Adventure_: `games/teddy2/disk/main.cmf` (Main Street) quotes
    **Yankee Doodle**, a traditional American tune (18th century), public domain; arrangement
    by the game.
  - _I Screamed, She Smirked_: `games/smirked/disk/title.cmf`, `story.cmf` and `foyer.cmf`
    open with the mordent of the **Toccata and Fugue in D minor**, BWV 565, credited to
    J. S. Bach (about 1704), public domain; arrangement by the game.
  - _The desk's wall phone_: its hold music (`web/src/desk/room/phone/sounds.ts`) is the
    opening of **Für Elise** by Ludwig van Beethoven (about 1810, published 1867), public
    domain.
  - _Teddy's Little Biggest Adventure_: its ending song (`games/teddy3/src/sound/music.ts`)
    plays **Happy Birthday to You**, the tune of "Good Morning to All" by Mildred J. Hill
    (1893), public domain in the US; arrangement by the game, which credits it on its
    credits screen.
  - _A hidden bonus on the site_: a music box (`web/src/eggs/musicBox.ts`) plays **Yankee
    Doodle**, the same traditional tune, public domain.
  - _RSD's sample music on the CD_ quotes public-domain works: `GMMOONLT.CMF` is the first
    movement of Beethoven's Piano Sonata No. 14, the **Moonlight** (1801); `GMRANGE.CMF` is
    **Home on the Range** (Daniel E. Kelley, music, and Brewster M. Higley, words, 1872).
  - _The shareware games A-J's Quest (`cd/sharware/ajquest`) and Ralph's game
    (`cd/sharware/fluffyr`)_ use `GMFAIRY.CMF`, the **Dance of the Sugar Plum Fairy** from
    Tchaikovsky's _The Nutcracker_ (1892), public domain.
- **Third-party music under copyright.** Three shareware games on the CD by A-J Games,
  _Bounerim_ (`cd/sharware/bounerm`), Ralph's game (`cd/sharware/fluffyr`) and _Sign of the
  Hedgehog_ (`cd/sharware/signhdg`), include `SND7.CMF`, an arrangement of John Williams's
  **The Imperial March** (1980), which is under copyright and not licensed by this project.
  It is kept as those games were distributed in the 1990s, unaltered, as part of their
  authors' original files.
- **Pictures in the CD's games.** Most of the CD games' pictures are drawn or rendered, but
  some are scanned photographs, paintings or frames of film. None of them name a source, so
  these were traced in October 2026 by looking at them and searching by text; where a source
  is not certain it says "likely" or "appears to be". They are kept unaltered, as their
  authors distributed them, and are not licensed by this project:
  - _Nebula_ (`cd/gameware/nebula`, RSD): `BLUE.GIF` is the **Blue Marble**, the photograph
    of the Earth taken by the crew of Apollo 17 in 1972
    ([NASA](https://en.wikipedia.org/wiki/The_Blue_Marble)), also small in `MENU.GIF` and
    `NOVA.FLI`. `SATRING.GIF` is a **Voyager 1** picture of Saturn's crescent and rings
    (1980, frame C3501159, the same picture as `cd/picture/space/planets/c3501159.gif`),
    tinted blue. `YELOSUN.GIF`, `YELOLOW.GIF`, `YELOBYE.FLI`, `NOVA.FLI` and `MENU.GIF` appear
    to be a **Voyager 1** color picture of Jupiter's moon **Io** (1979) with a volcanic plume
    on its edge ([NASA/JPL](https://photojournal.jpl.nasa.gov/target/io)). These NASA pictures
    are in the **public domain** in the US. The green planet in `GREENHI.FLI`, `GREENBYE.FLI`
    and `HISCORE.GIF` is a planet photograph tinted green, likely also from NASA (possibly
    Mars); its source was not identified.
  - _Woman Warrior and the Outer Limits_ (`cd/gameware/outerlim`) and _Woman Warrior and the
    Attack From Below_ (`cd/gameware/warrior`), by Sheldon Chase for KD Software: their title
    pictures (`OLSTART.GIF`, `WARRIOR.GIF`, and the same collage in their `MENU.FLI`,
    `MENUBOX.FLI` and `TEXTBOX.FLI`) and the ending picture `OLENDING.GIF` are frames
    captured from the television series
    [**The Outer Limits**](<https://en.wikipedia.org/wiki/The_Outer_Limits_(1963_TV_series)>)
    (1963–1965). The game's own story screen says it "uses parts from two episodes",
    ["The Cry of Silence"](https://en.wikipedia.org/wiki/Cry_of_Silence) (1964), whose star
    June Havoc the woman appears to be, and
    ["The Zanti Misfits"](https://en.wikipedia.org/wiki/The_Zanti_Misfits) (1963). The series
    is **under copyright** (today MGM's), not licensed by this project.
  - _Paper Airplane_ (`cd/sharware/paperair`), by Matt Bell: its title picture `GMTITLE.GIF`
    is **The Nazgûl** by **Ted Nasmith** (gouache, first published in the 1990 Tolkien
    Calendar; [tednasmith.com](https://www.tednasmith.com/tolkien/the-nazgul/)), scanned with the title
    lettered over it. `OPENPAP.GIF`, a falcon turning into an F-16, may be **Jody Sjogren**'s
    _Metamorphosis II: Falconfyre_ (1986;
    [Wright State University](https://wright.libraryhost.com/repositories/2/top_containers/6194)),
    which was not confirmed. The figure of cloud over a runway in `ENDPAP.GIF` is a painting or
    photo collage whose source was not identified. All are **under copyright**, not licensed by
    this project.
  - _Sample_ (`cd/gameware/sample`, RSD): `SAMPLE.GIF`, also in `MENUBKG.FLI` and
    `TEXTBKG.FLI`, is a **painting** of tropical birds (a long-billed orange bird, a
    blue-and-yellow macaw, a hummingbird and egrets) whose artist was not identified;
    presumably under copyright.
  - _Houses_ (`cd/gameware/houses`, RSD): `HOUSES.GIF` and `BKG.GIF` are a **photograph** of a
    boathouse with a canoe on a pond; its source was not identified.
  - _Glubada Pond_ (`cd/gameware/glub`): `OCEAN.GIF` (also in `END.FLI`) is the CD's own
    picture library's `cd/picture/nature/ocean1.gif`, a beach photograph; `POND.GIF` is its
    `cd/picture/nature/amer01_i.gif`, a mountain lake; and `WATER.GIF` is another photograph.
    Their sources were not identified.
  - _RSD's title picture_ (`GMTITLE.GIF`, "Recreational Software Designs' Game-Maker
    Presents:", in many of the CD's games) is lettered over a **photograph of clouds** whose
    source was not identified.
- **The CD's picture and animation libraries** (`cd/picture`, `cd/animate`) are a collection
  of 1990s GIF pictures and FLI animations of mixed and mostly unrecorded origin: NASA
  pictures (Voyager, Magellan, Viking, the Space Shuttle) alongside photographs of cars,
  places and animals whose photographers are not named and which are likely under copyright.
  They are kept as Andy Stone released them and are not on the website.
- **The sample and shareware games on the CD** (`cd/`) remain the work and copyright of
  their authors (RSD, A-J Games, KD Software, GameLynk, Sheldon Chase, Mark Hadley, Matt
  Bell and others). Shareware games are shown play-only, with their authors' original
  notices; they have no download, can't be edited, and the desk's make-believe GMCRACK
  leaves them alone. The CD's tools are kept as it held them, each its author's: LHarc 1.13
  (`cd/backup/lharc.exe`, "(c)Yoshi, 1988-89") and LHA 2.13 with its
  documentation (`cd/sharware/tools`, Haruyasu Yoshizaki), and Alchemy Mindworks' Graphic
  Workshop shareware for DOS and Windows (`cd/sharware/tools/gwsdos.zip`, `GWSWIN.ZIP`).
  None of them are on the website.

## The Bard of Bizarre recordings: personal, non-commercial only

The Bard of Bizarre's song and monologue recordings were made with Riffusion (one service,
later called Producer.ai and now Google Flow Music) during Lewis's **free plan**. Lewis pays
for the service now, and the animated covers (Mustard Seed Hustle's and Thread the Needle,
Brother Camel's) were made on the paid plan, but every recording was made on the free plan. The service's terms for free-plan output allow
"personal, non-commercial uses only". So the recordings, and every voice clip cut from them,
are **not covered by the MIT License**: don't sell them or use them commercially. The
recordings themselves aren't in this repository.

These files are cut from those recordings (each game's `tools/cutClips.py` cuts them):

- `games/<id>/src/sound/clips/*.pcm` in goat, mustard, needle, loaf, remote, carl,
  reckoning, loofah, smirked, sweats and risi: the raw clips.
- The voice clips on each game's disk (`games/<id>/disk/*.voc`), and so in every download
  and on The Sofa BBS:
  - **Third Goat from the Left** (goat): HEY, HOOK, NIGHTLNG, SEESYOU, YAY.
  - **Mustard Seed Hustle** (mustard): ALIVE, FEET, HALLELU, HUSTLE, KEEPON, MOUNTAIN.
  - **Thread the Needle, Brother Camel** (needle): DREAM, GOLD, HUMPDOWN, SQUEEZE, THREAD.
  - **Loaf #13 (Left in the Basket)** (loaf): BREAD, COUNTME, MAMA, STILL, TWELVE, WASTED.
  - **Where's the Remote?!** (remote): DOGCAT, FRIDGE, HAND, MOM, RACCOON, REMOTE, SNEAKY.
  - **A Fly Named Carl** (carl): AUX, HOOK, LAMP, MISS, NAMED, SEEN, SMILE, TIME, WINDOW.
  - **The Great Dairy Reckoning of 3:17 A.M.** (reckoning): ALMOND, BEGONE, BETRAY, BETTER,
    CANT, COLON, COWARD, DEMON, ENEMY, INTOL, LACTAID, OHNO, SHINS, SUFFER, and FLUSHLAC and
    SLAMWRTH (a made sound followed by a clip).
  - **Cleanse Me, O Loofah, But Leave My Soul** (loofah): BRINE, LINE, LUCIFER, MANGO, NEVER,
    PINK, ROUGH, SCRUBBUS, WORSE, WRONG, and DRAINNEV and TOWEL (a made sound followed by a
    clip).
  - **I Screamed, She Smirked** (smirked): AFRAID, ASHAMED, CARDBRD, DONTRUN, EXIT, FOG,
    GETDOWN, JUICE, MILD, NOTREAL, OKAY, PATS, SNEEZING, SWORD, TARGET, WEREWOLF.
  - **Shakespeare in Sweatpants** (sweats): the 68 monologue clips, `<line>_L`, `_O`, `_P` and
    `_W` for each of ANTS, BIRD, BLNKT, CART, CHAIR, FICUS, GOAT, ITCH, KALE, LIKE, LILY, OUT,
    PEN, PIZZA, PLATE, SOCKS and UMBR.
  - **Veni, Vidi, Risi!** (risi): CANIS, CANTEMUS, CHEDDAR, CORONA, CURRIMUS, DII, FELIS,
    FLATUS, NEMO, PISCIS, QUIS, RIDETIS, SUMMA, TECTA, TER, TITUS, VICTORIA.

Each of those games' LICENSE.TXT names its clips under "VOICE CLIPS: NOT MIT", its readme and
credits say so, and the Windows, Mac, Linux, DOS and web-app downloads' notices repeat it, as
does the one-page download's text (`web/src/export/recordedAudio.ts`). **Everything else in each game is MIT licensed**: the
code, levels, art, text, the other sound effects (made in code) and the FM (CMF) music
arranged or composed by Claude. Certified Rat Tickler has no recording, so none of it is
affected.

## About this fork

Lewis bought Game-Maker in 1992 with money earned shoveling snow that winter
([Moten Snow-to-Software Operations](https://lewismoten.com/1992/12/11/moten-snow-to-software-operations-founder-operator/)).
He made a few games with it, among them a Christmas game full of candy canes and Santa
Claus, but never sold or gave them out, and none survive: they were lost with much else in
an apartment fire during college. He never received a newsletter, never knew there were
BBSes trading Game-Maker games, and never heard there was a later version; he left for
college in 1994, and his parents may well have taken any mail for junk. The original
license and payment terms confused him and felt restrictive, which was the main reason he
never shared his games. He was a kid without a bank account who bought things with money
orders paid for out of his allowance. The Sandbox BBS, the Owner's Guide's plain wording
and the free, open license here are the version of Game-Maker he wishes he'd had.

## Third-party formats, trademarks and code

Game-Maker: Sandbox Edition contains no third-party code except as listed. It reimplements file
formats from their published descriptions and from Game-Maker's own source.

- **L-Space (the Library's gap between two stacks)**: a nod to Terry Pratchett's Discworld, where the librarian travels between libraries through the stacks. Only the idea of a shelf-gap that leads elsewhere is borrowed; no text or characters from the books. The Library's ambient cough, page turn and chair creak are synthesized in `web/src/library/ambience.ts`.
- **GIF**: "The Graphics Interchange Format© is the Copyright property of CompuServe
  Incorporated. GIF℠ is a Service Mark property of CompuServe Incorporated." GIF images
  are encoded and decoded with LZW compression, which was patented by Unisys; those
  patents expired in 2003–2004.
- **FLI** animations: the Autodesk Animator format of Autodesk, Inc., implemented from its
  public documentation.
- **Sound Blaster**, **CMF** (Creative Music File), **VOC** and **SBI**: trademarks and
  formats of Creative Technology Ltd. The CMF player is a port of Game-Maker's own
  `SBMUSIC.C` and of the behavior of Creative's SBFMDRV driver; no Creative code is used.
- **YouTube**: the Library lists Lewis Moten's own videos about this project, from his
  YouTube channel. Their card pictures are copies of YouTube's thumbnails kept on the site, so
  showing the Library asks YouTube for nothing; a video's player is embedded from
  youtube-nocookie.com only when the visitor presses Play.
- **The Game Crafter's Large Retail Box template** (thegamecrafter.com,
  `templates/large-retail-box.png`): the Library's retail boxes to print follow its
  measurements (a 13.25 × 15.75 in sheet at 300 dpi, a 9.375 × 11.875 in face, 1.125 in walls,
  0.6875 in turn-ins, 1/2 in glue tabs, a 1/8 in bleed and safe line;
  `web/src/manual/printables/retailBoxTemplate.ts`). None of its art is copied; the box art and
  die lines are drawn by this project. The disk and CD label sizes are the common sticker-paper
  sizes (a 2.75 in wrap-around 3.5" diskette label; a 117 mm CD label with a 41 mm hole).
- **OPL2 / YM3812** FM synthesis: a chip by Yamaha Corporation. The emulation in
  `web/packages/engine/src/audio/opl.ts` was written for this project.
- **PNG** (RFC 2083): the Assistant's pictures for AI tools (`web/packages/tools/src/image/png.ts`) are
  written from the specification; compression is the browser's or Node's own.
- **Model Context Protocol** and **WebMCP**: the local server for AI tools (`web/scripts/mcp`)
  speaks the Model Context Protocol with its MIT-licensed TypeScript SDK (see Tools used to
  build and test). The editor's Assistant can also offer its tools through WebMCP, a draft of
  the W3C Web Machine Learning Community Group, implemented from the draft with no code used.
- **The Assistant chat** (`web/src/assistant/chat`) talks to the person's own AI with plain
  `fetch`: OpenAI's Chat Completions API shape (which OpenAI, LM Studio and Ollama's `/v1`
  take) and Ollama's `/api/chat`, both written from their public API documentation with no
  code used. No model ships with the site; each person sets up their own (Ollama or an
  OpenAI-compatible server). A game changed with it keeps an "Assistant: <model> via
  <provider>" line in its companion data, and its Windows, Mac, Linux and web downloads show
  that line in their About text. The chat was written by **Claude Opus 5.5** as Lewis
  directed.
- **The music editor and its FM instruments** were made for this project. The editor is an
  original design, not based on AdLib's Visual Composer, and no AdLib or Creative instrument
  bank is included. The classic piano and brass, and one kick drum used in two games, matched
  AdLib's `STANDARD.BNK` settings (PIANO1, BRASS1, BDRUM1). They were replaced with original
  patches in October 2026. Some of the original RSD songs in `cd/` and `runtime/` use
  AdLib's BRASS1 settings; they are kept as RSD released them.
- **8×8 text font**: Daniel Hepper's `font8x8_basic`, plus accented letters and symbols
  from his `font8x8_ext_latin` and `font8x8_misc` and Greek letters from his `font8x8_greek`
  (`web/packages/engine/src/gfx/cp437Glyphs.ts`), all in the public domain. The
  [upstream font8x8 headers](https://github.com/dhepper/font8x8/blob/master/font8x8_basic.h)
  also credit Marcel Sondaar and International Business Machines (public domain VGA fonts)
  as their basis. The other code page 437 glyphs (card suits, notes, arrows, math signs)
  were drawn for this project using Claude Opus 5.5 under Lewis Moten's direction and are
  distributed under this project's MIT License.
- **3×5 micro font** (`games/teddy/src/art/draw.ts`, extracted into
  `web/packages/tools/src/microFont.ts`): the small sign font introduced by Lewis Moten
  using Anthropic Claude Opus 5.5 in
  [commit 7241036f49cab9dea52f58541e30ce6c9ce86052](https://github.com/lewismoten/GameMaker-SandboxEdition/commit/7241036f49cab9dea52f58541e30ce6c9ce86052).
  It is distributed under this project's MIT License. OpenAI Codex (GPT-6/6.1) extracted
  its bitmap table and added the toolkit's reusable rendering APIs. This font has its own
  project provenance, separate from Daniel Hepper's public-domain 8×8 fonts.
- **Caveat** (the handwriting in the Owner's Guide's registration record,
  `web/src/manual/regRecord.ts`), a font by Impallari Type ("Copyright 2014 The Caveat
  Project Authors"), under the SIL Open Font License 1.1. Its 600 weight, cut to Latin-1
  with fontTools (its name and license kept inside it), is kept with the site as
  `web/src/manual/fonts/caveat-600.woff2`, with the license beside it (`Caveat-OFL.txt`), so
  the page asks no font server for it. It isn't in exported games. It is also the pencil hand of Dex Dynamo's
  science report in In The Year 2000!'s box (`web/src/manual/printables/dexReport.css`), loaded from the same file.
  The report's text and pencil drawings, and the board photos in it (renders of the kit's 3D viewer data), were made
  by Claude Sonnet 5.5 (Anthropic) for this project.
- **ChatGPT**, **Riffusion** (later **Producer.ai**, now Google's **Google Flow Music**:
  one service under its successive names) and **DeepAI** are their owners' names for the
  tools used to make the Bard of Bizarre songs and art, and **ChatGPT** and **Gemini** for
  the tools Lewis reviews and brainstorms with (see Credits); none of their code is used.
- **MS-DOS** is a trademark of Microsoft Corporation; **IBM PC** of IBM; **DOSBox** is a
  separate GPL program and is not included. `npm run dosbox` (`web/scripts/dosbox.ts`) only lays
  out a folder of this repository's files for a DOSBox the developer installs, and opens it.
- **Modem sounds** on the desk (`web/src/retro/bbs/modem.ts`, `lineSpeed.ts`): the dial tone,
  touch-tones (the standard DTMF pairs), rings and each line speed's handshake are
  synthesized in code from the published standards: **Bell 103** (300 baud) and **Bell 212A**
  (1200), the Bell System's, and the ITU-T's **V.22bis** (2400), **V.32** and **V.32bis**
  (4800 to 14,400), **V.8** and **V.34** (28,800 and 33,600) and **V.90** (56K). No recording of
  a modem is used. The names are their owners'; nothing else of theirs is used.
- **TTYs (text telephones)** on the desk (`web/src/retro/bbs/baudot.ts`, `tdd.ts`,
  `ttyInfo.ts`): the 5-bit Baudot code at 45.45 baud, its 1400/1800 Hz tones and its US
  figures table follow ITU-T Recommendation V.18 (1994) and ANSI/TIA-825. The code table was
  cross-checked against Asterisk's `main/tdd.c` (GPL v2, Digium); none of its code is used.
  The period facts are from Gallaudet University's Technology Access Program (TTY Basics,
  V.18 notes), the FCC (relay service nationwide from July 26, 1993), and Ultratec.
  **Ultratec** and **Turbo Code** are Ultratec, Inc.'s names; Turbo Code (U.S. Patent
  5,432,837) is named only as the historical protocol, and nothing of it is implemented.
  Mrs. Novak and her number (555-0156) are made up.
- **Real names in the games.** The games name some real hardware, software and products of
  their time as part of the setting: AdLib, VGA, the RCA 1802, MOS 6502 and Atari 400, Yamaha's
  OPL3, AMI BIOS, PKZIP and PKUNZIP, Xmodem, Ymodem and ZMODEM, Renegade BBS and The Major BBS (Galacticomm's; The Sofa runs a look-alike), VPIC (Bob Montgomery's picture viewer; the desk's is a look-alike), QEMM, the 286 to Pentium, Windows 3.1 and NT, OS/2, the ATI, Trident, Tseng and
  Paradise Super VGA cards (from RSD's own system requirements), the Remington Noiseless
  typewriter, Autodesk Animator and the CitiCar, an electric car Sebring-Vanguard built in the 1970s (Lewis's own car, THE CHEZ). The 1994 desk, where nearly everything does something when clicked and some things are hidden to find, was inspired by The Brothers Chaps' (Mike and Matt Chapman's) Homestar Runner and Strong Bad's emails, Flash cartoons whose last scenes hid extras to click; nothing of theirs is copied, and the names are their owners'. The TURBO BUTTON magazine's history of Easter eggs names the Atari 2600 and its games Adventure (Warren Robinett, 1980) and Moonlander (1973), and Atari's Steve Wright, who named Easter eggs. Brand names also appear where Lewis's
  song lyrics and his 100 Word Stories (in _KEEP IT BRIEF!_) are quoted word for word. These
  are trademarks of their respective owners; no endorsement is implied. Every other store,
  arcade, brand, product and publication in the games is made up.
- **Illogitech**, the brand on the desk's speakers and in their _TURBO BUTTON_ ad, is a made-up
  parody name. It is not a real company or product, and no connection with or endorsement by
  any company is implied.
- **Sound Boaster** and its maker **Overcreative Labs**, the sound card brand on the desk speakers'
  switch and in its _TURBO BUTTON_ ad, are made-up parody names. They are not a real company or
  product, and no connection with or endorsement by any company is implied. The desk PC's card
  is "Sound Blaster compatible", as the clone cards of the time said; Sound Blaster is Creative
  Technology's trademark (below). The makers' names printed on its chips in _Virus Blaster_
  (**YO MAMA!** on the FM music chip, **ANALOG DEVIOUS** on the DSP, **TEXAS INSTRUMENTALS** on
  the amplifier) are made-up parody names too, not real companies.
- **Gravitas** and its **GRAVITAS PC GamePad**, the game pad on the desk's keyboard tray and in
  its _TURBO BUTTON_ ad, are a made-up parody name. It is not a real company or product, and no
  connection with or endorsement by any company is implied. The ad's prices ($24.95 for the pad,
  $33.95 for the joystick) are part of the story, after what Lewis remembers paying in 1994.
- **HOLE-Y MOLEY**, the Disk Doubler, and its maker **Punchline Products**, the disk notcher in its
  _TURBO BUTTON_ ad, are made-up parody names. They are not a real company or product, and no
  connection with or endorsement by any company is implied; the ad's drawing of the press is this
  project's own. Its price ($14.95) is part of the story, after what Lewis remembers paying.
- **Borland C++** was included in the original 2014 repository (in `tools/`) to build the
  DOS source; it is Borland's (now Embarcadero's) software and is not covered by the MIT
  License, so this fork leaves it out. The README says where to get it.
- **The git history** still holds them: the early commits contain Borland C++ (`tools/BORLANDC`)
  and the Borland and Creative library files listed below, which later commits removed. Those
  files in the history are their owners' and aren't covered by the MIT License.
- **Borland's runtime library** files that Game-Maker's source was built with (`CL.LIB`,
  `EMU.LIB`, `MATHL.LIB`, the startup code `STARTUP.ASM`, `SETARGV.ASM`, `SETENVP.ASM`,
  `FULLPATH.C`, `RULES.ASI`, and the `EGAVGA.BGI` graphics driver) and **Creative's Sound
  Blaster library** `SBCL.LIB` were in `code/` in the original repository. They belong to
  Borland and Creative Technology, not the MIT License, so this fork leaves them out (also
  from `code/GM/GM.ZIP`). The web port uses none of them: its sound and graphics are
  written from the formats and from how the DOS programs behaved.
- **`SNDBLAST.DRV`**, the Sound Blaster voice driver in `cd/gm` and `runtime/run/GM`, is
  Creative Technology's software ("Copyright (c) Creative Technology Pte Ltd., 1989-1990.
  All rights reserved") and is not covered by the MIT License. It is included as it came
  on the original Game-Maker CD, and "Export for DOS" adds it to exported games the way
  Game-Maker's own Transfer utility did. It will be removed if Creative asks.
- **`XFERPLAY.EXE`** and Game-Maker's other DOS programs (`cd/gm`, `runtime/run/GM`) were
  built by RSD with Borland C++ and Creative's library, so they hold Borland's run-time
  code ("Borland C++ - Copyright 1991 Borland Intl.") and Creative's FM music functions
  ("Copyright (c) Creative Technology Pte Ltd, 1990"), as every program built with them did.
  "Export for DOS" ships `XFERPLAY.EXE` (renamed after the game) and `SNDBLAST.DRV` with
  a README that gives Game-Maker's MIT License and names these parts.
- The desk's hardware brands (ILLOGITECH, SOUND BOASTER and Overcreative Labs, GRAVITAS, PIXELMAX, SQUEAK, AwkWard BIOS, Square Deal Pad Co.'s mouse pads), the magazine's other advertisers (HOLE-Y MOLEY and Punchline Products, Kiln & Kilobyte's mugs, Tin Can Telecom's modem, Shoebox Media Co.'s disk box), and its phone
  numbers are made up, as are the magazines and awards on the game boxes and the magazine
  _TURBO BUTTON_, its prices and its coupons. Its two BBSes
  are named after real Pittsburgh boards, The Sofa and the Sandbox (Lewis's own); how they
  look, what's on them and their numbers are made up.
- **TURBO BUTTON's Game-Maker ad** (its send-away ad, `web/src/manual/magazine/sections/ads.ts`)
  takes its look from the full-page Game-Maker ad by RSD and KD Software in _Computer Gaming
  World_ #99 (October 1992), page 55
  ([Internet Archive](https://archive.org/details/Computer_Gaming_World_Issue_99/page/n53/mode/2up)):
  a hot pink page, big condensed serif headlines, a grid of screenshots and an order coupon.
  Its words, pictures and coupon are new; nothing of the original ad is reproduced, and the
  page links to the original.
- **The level check** (`web/src/editor/check`): its heat map's six colors are taken from
  **viridis**, the color map by Stéfan van der Walt and Nathaniel Smith (CC0, public domain
  dedication), chosen because it reads with every kind of color vision; its monster and
  text-screen contrast is the **relative luminance and contrast ratio** of the W3C's Web Content
  Accessibility Guidelines (WCAG) 2, and its flashing check follows WCAG 2's **three flashes a
  second** threshold (success criterion 2.3.1). All are used as published; no code of theirs is
  included.
- **The palette editor's Color vision check** (`web/src/editor/editors/palette/colorVision.ts`)
  simulates protanopia, deuteranopia and tritanopia with the severity-1.0 matrices published
  by **Gustavo M. Machado, Manuel M. Oliveira and Leandro A. F. Fernandes**, "A
  Physiologically-based Model for Simulation of Color Vision Deficiency" (IEEE Transactions
  on Visualization and Computer Graphics 15(6), 2009), applied in linear RGB. Its grayscale is
  the WCAG 2 relative luminance above, and it measures how alike two colors look with the
  CIE's **CIELAB** color space and 1976 color difference (ΔE), using the sRGB standard's
  (IEC 61966-2-1) transfer curve. All are published formulas and numbers; no code of theirs
  is included.
- **The badge look-alike check** (`web/scripts/badgeSimilarMetrics.ts`, `npm run badges:similar`) uses
  the same Machado, Oliveira and Fernandes (2009) severity-1.0 matrices in linear RGB, with
  Rec. 601 luma for grayscale and achromatopsia. Published numbers only; no code of theirs is included.
- **The sound effect makers** (`web/src/audio/sfxSynth.ts`, `sfxPresets.ts` and
  `web/src/editor/tools/speakerFx.ts`) follow the idea of **sfxr**, Tomas Pettersson's
  ("DrPetter") 2007 sound effect generator: a few sliders for pitch, slide, vibrato and an
  envelope, with presets (jump, coin, hurt, explosion…) that give a new take each time. The
  synthesizers were written fresh for this project; no sfxr code is included.
- **The sound set editor's "Preview as PC speaker"** (`web/src/audio/vocToSpeaker.ts`) finds
  each step's pitch with the normalized square difference function and its "first peak near the
  highest" rule from **Philip McLeod and Geoff Wyvill**, "A Smarter Way to Find Pitch"
  (Proceedings of the International Computer Music Conference, 2005), with parabolic
  interpolation of the peaks, and falls back on the zero-crossing rate for noise. Written fresh
  from the paper; no code of theirs is included.
- **The music editor's accompaniment generator** (`web/src/editor/editors/music/arrange/`)
  finds a tune's key with the **Krumhansl-Schmuckler** method, using the major and minor key
  profiles published by **Carol L. Krumhansl and Edward J. Kessler** (Psychological Review 89,
  1982), and picks its chords with a Viterbi pass; its takes are seeded with **Mulberry32**, the
  public-domain generator by Tommy Ettinger. Its band's patterns follow the project's own
  `web/packages/tools/src/kit/song.ts`. The profile numbers are published data; no one else's code is included.
- **Seeded random numbers and string hashes** (`web/src/seededRandom.ts`, shared by the
  walkthroughs, printables, magazine art, felt eggs and editors) use three public-domain
  algorithms: **Mulberry32** by Tommy Ettinger, **xorshift32** from George Marsaglia's
  "Xorshift RNGs" (Journal of Statistical Software 8, 2003) and the **FNV-1a** hash by Glenn
  Fowler, Landon Curt Noll and Kiem-Phong Vo. Each is a few lines written from its description.
- **Mr. Yuck** is a trademark of UPMC Children's Hospital of Pittsburgh. The green
  poison-warning sticker on the desk's phone is a simple drawing in tribute to it, not the
  original artwork.

## The Mac, Windows and Linux players

Download → Mac, Windows and Linux wrap a game's one web page in a small player program
written for this project (`mac/`, `win/`, `linux/`; the prebuilt players are in
`web/public/mac`, `web/public/win` and `web/public/linux`). Every such download carries the
notices below that apply to it as `THIRD-PARTY-NOTICES.txt` (and the Windows `.exe` inside
itself, under its window menu's "Third-party notices…"); the text is in
`web/src/export/notices.ts`. What the players contain or use from others:

- **Windows: the WebView2 interface header.** `win/Player/webview2.h` lists the vtable slots
  and interface IDs the player calls, generated from `WebView2.h` of Microsoft's WebView2 SDK
  (NuGet `Microsoft.Web.WebView2` 1.0.3485.44), which is under a BSD-style license:
  "Copyright (C) Microsoft Corporation. All rights reserved." The license's full text is
  kept at the top of that file. No other SDK file is included, nor Microsoft's
  `WebView2Loader.dll`.
- **Windows: finding the WebView2 runtime.** The player loads the runtime's own
  `EmbeddedBrowserWebView.dll` from the folder Edge's updater records in the registry, the
  approach of the open source [webview](https://github.com/webview/webview) library (MIT
  License, Copyright (c) 2017 Serge Zaitsev, Copyright (c) 2022 Steffen André Langnes). The
  approach is credited in `win/Player/main.c`; the player's code is written in C for this
  project.
- **Windows: the Microsoft Edge WebView2 Runtime** is Microsoft's software, part of Windows
  10 and 11; it is not included. Microsoft Edge and WebView2 are trademarks of Microsoft.
- **Windows: the C runtime startup code.** The `.exe` players are built by `win/build.sh`
  with [Zig](https://ziglang.org/) (MIT License), whose MinGW-w64 libraries link a little of
  the MinGW-w64 runtime's startup code into each program; the program otherwise calls only
  Windows' own DLLs. In the runtime's words, such a program "was built using MinGW-w64 and
  statically linked against the MinGW-w64 runtime. Some parts of the runtime are under
  licenses which require that the copyright and license notices are included when
  distributing the code in binary form." Those permissive notices (the mingw-w64 project's
  own, copyright 2009–2013, and its contributors') are listed in
  [COPYING.MinGW-w64-runtime.txt](https://github.com/mingw-w64/mingw-w64/blob/master/COPYING.MinGW-w64-runtime/COPYING.MinGW-w64-runtime.txt).
- **Linux: GTK 3 and WebKitGTK** (`libwebkit2gtk-4.1` or `-4.0`, with GLib and GTK; GNU
  LGPL 2.1 or later) are loaded with `dlopen` when the player starts, from the computer's own
  packages. None of their code or headers is included: the few functions the player uses are
  declared by hand in `linux/Player/main.c`. The program is built by `linux/build.sh` with
  Zig against glibc 2.28, so it carries only glibc's small start files (GNU LGPL 2.1 or
  later, with the exception that lets them be linked into any program).
- **Mac: AppKit and WebKit**, Apple's frameworks that are part of macOS. The player
  (`mac/Player/main.swift`) links only to the system's own libraries.
- Zig itself is a build tool; beyond the runtime pieces above, the Windows and Linux
  players may contain a few of its compiler support routines (compiler_rt, MIT License,
  Copyright (c) Zig contributors). The `.dmg`, `.tar.gz` and `.zip` containers, the Mac code signature and the Windows
  resources are written by this project's own code in `web/src/export/`.

## Third-party code and acknowledgments in the original source

The original source in `code/` is the Stones' work, but it also holds other people's code
and documents, kept as Andy Stone published them. Each keeps its own terms, not the MIT
License, and its notices stay in the files. Most of it is reference material that
Game-Maker's makefiles don't build.

**Documents and citations**

- **CRC-32**: PKWARE's ZIP format description `code/GM/APPNOTE.TXT` (described in
  `code/Image/PNG/INDEX` as from PKZIP 1.93a) says "The CRC-32 algorithm was generously
  contributed by David Schwaderer and can be found in his excellent book 'C Programmers
  Guide to NetBIOS' published by Howard W. Sams & Co. Inc." The same file credits Roger
  Schlafly for PKZIP's encryption and Robert Mahoney for the `.ZIP` name, and cites
  Storer, _Data Compression, Methods and Theory_ (Computer Science Press, 1988) and Held,
  _Data Compression, Techniques and Applications_ (John Wiley & Sons, 1987). Game-Maker's
  own C and assembly code computes no CRC.
- **FLI format**: `code/Image/FLI/FLIDOC.TXT`, the _Turbo C FLI Library_ document for
  Autodesk Animator files, "Copyright 1989-1990 Dancing Flame, San Francisco. Program Code
  and Library by Jim Kent. Documentation by Jim Kent and Heidi Brumbaugh." Andy Stone's
  `FLI.CPP` quotes it in a comment.
- **PNG specification**, tenth draft (`code/Image/PNG/PNG10.TXT`, `PNG.TXT`): copyright
  1995 Thomas Boutell, which may be reproduced only "in complete and unaltered form".
- **References in comments**: `code/GM/SVGAA.ASM` marks a commented-out ATI bank switch
  "From svgakt30.zip", and `code/DRV/STLTH64.ASM` cites "vgadoc3" for an S3 register.
- Also kept as found: the Association of Shareware Professionals' ombudsman statement
  (`code/GM/OMBUDSMN.ASP`); a captured SunOS 5.4 `make` manual page
  (`code/Image/PNG/MAKEINFO.TXT`); and the installer's credit line for Haruyasu
  Yoshizaki's LHarc (`code/GM/FLOPINST.CPP`), the archiver it ran (`LHARC.EXE` itself
  is on the CD, in `cd/backup`; see above).

**Bundled code by other authors** (all under `code/Image/`)

- **Info-ZIP Zip 2.0.1 and UnZip 5.12** (`PNG/ZIP`, `PNG/UNZIP`, `PNG/ZIP201.ZIP`,
  `PNG/UNZIP512.ZIP`). Zip: "Copyright (C) 1990-1993 Mark Adler, Richard B. Wales,
  Jean-loup Gailly, Kai Uwe Rommel, Igor Mandrichenko and John Bush. Permission is granted
  to any individual or institution to use, copy, or redistribute this software so long as
  all of the original files are included, that it is not sold for profit, and that this
  copyright notice is retained." UnZip's terms are in `PNG/UNZIP/COPYING`. They include
  Samuel H. Smith's 1989 copyright on the code in `UNREDUCE.C` and the old unshrink, which
  says "Do not use any of this in a commercial product"; Igor Mandrichenko's VMS code (not
  for profit); and Greg Roelofs's `UNSHRINK.C`, which requires his name to stay with it.
  Mark Adler put `inflate`, `explode`, `funzip` and `ship` 1.7 (`PNG/SHIP17.ZIP`) in the
  public domain or left them uncopyrighted. `PNG/ZIP/MKTIME.C` is copyright 1988, 1989
  David MacKenzie. Info-ZIP's comments also thank Haruhiko Okumura (`ar`/`ar002`).
  `PNG/UNZIP/CONTRIBS` lists the other contributors.
- **pnglib 0.6** (`PNG/T`, `PNG/PNGLIB06.ZIP`, 1 May 1995), the draft PNG reference
  library: "Copyright (c) 1995 Guy Eric Schalnat, Group 42, Inc." It may be used, copied,
  modified and distributed provided its origin isn't misrepresented, altered versions are
  marked, and the notice in `png.h` stays. The zlib library it needs isn't included.
- **GIFSAVE** 1.0 (`GIF`), by Sverre H. Huseby (1992): "dedicated to the Public Domain".
  It isn't part of Game-Maker's build.
- **BMP2BGI** 1.0 (`BMP2BGI1.ZIP`, 1991) by Richard G. Rasulis, Jr. ("(c) R.G.Rasulis
  Consulting Services"). Its `BMP.H` is "(c) Ziff-Davis Publishing", from Charles
  Petzold's article in _PC Magazine_ (vol. 10, no. 10, pp. 365–370). No license is
  given.

**Unattributed, so flagged rather than credited**

- `code/GM/SBC.H`, `SBCVOICE.H`, `SBCMUSIC.H`, `SBCTS.H` and `SBMIDI.H` declare the
  functions of Creative's Sound Blaster library (`SBCL.LIB`, left out, above). They
  carry no notice but appear to come from Creative's developer kit.
- `code/Image/LZTIMER.H` declares `ZTimerOn`/`ZTimerOff`/`ZGetTime`, the names used by
  Michael Abrash's "Zen timer". The timer itself isn't included, and its use in
  `IMAGE1.CPP` is commented out.
- `code/DRV/S3_BIOS.ASM` (not built) looks like code taken from a disassembled S3 video
  BIOS.
- `code/GM/APTE.TXT` appears to be a Borland technical note.
- The sample pictures in `code/Image/PNG/PICS` are of unknown origin. One of them says so
  itself ("Peppers").

**What the web port uses**: none of this code. `web/packages/archives/src/project/zip.ts` writes its own
table-driven CRC-32 (the standard ZIP polynomial that APPNOTE credits to Schwaderer) and
follows APPNOTE's layout. The FLI reader `web/packages/engine/src/formats/fli.ts` follows Andy Stone's
`FLI.CPP` and the format in Kent's `FLIDOC.TXT`. The GIF LZW coder in
`web/packages/engine/src/formats/gif.ts` is new, not GIFSAVE. `web/packages/engine/src/formats/voc.ts` reproduces Peter
Savage's `SOUNDC.C`, and `web/src/vga/sndedit.ts` ports `SNDEDIT.C`.

## DOS reference tables and the scroll overflow: chiguire

Pull request 4 to gandrewstone/GameMaker (https://github.com/gandrewstone/GameMaker/pull/4,
by chiguire, MIT License like the upstream repository) ran the original PLAYGAME in DOS with a
frame-dump hook and kept the results. This fork uses two things from it:

- The tables in `games/kit/dosStates/` (one line per 20 ticks of a DOS replay of eight games'
  `demo.rec`: tick, score, scene, character position), copied unchanged from
  `port/baseline/<game>/states.txt`. `games/kit/dosStates.ts` compares our engine against them.
- The finding that ChangeScroll's speed arithmetic overflows a 16-bit `int` in DOS. Our
  `web/packages/engine/src/engine/scroll.ts` wraps the same way.

## The Pocket Player (hardware/pocket-player)

A firmware for the ESP32-3248S035 board that plays the Starter games, and a dev-only install page (`web/public/pocket/`, not linked from the site). Claude Sonnet 5.5 wrote the firmware and the page. The firmware binaries' complete third-party notices are in [`web/public/pocket/fw/NOTICES.txt`](web/public/pocket/fw/NOTICES.txt).

- **LovyanGFX 1.1.16** (lovyan03, FreeBSD/BSD-style license, with its bundled Adafruit_ILI9341, Adafruit_GFX and TFT_eSPI notices), the **Arduino core for ESP32 2.0.16** (LGPL-2.1), **ESP-IDF v4.4.7** (Apache-2.0), and **Mbed TLS 2.28.7** (Apache-2.0 chosen from its Apache-2.0-or-GPL-2.0-or-later offer) are compiled into the firmware image set. Their versions, source and license URLs, copyright lines, and required complete license texts are in the firmware notices file.
- The firmware is built with **PlatformIO** and its `espressif32` platform; they are build tools, not code asserted to be redistributed in the served firmware binaries.
- **ESP Web Tools** 10.2.1 (esphome/esp-web-tools, Apache-2.0, Open Home Foundation) is copied, as built, into `web/public/pocket/ewt/` with its license. It bundles **esptool-js** (Espressif, MIT), **@material/web** (Google, Apache-2.0) and **improv-wifi-serial-sdk** (Apache-2.0). Nothing loads from outside the site.
- The board's pin numbers come from community tables: https://homeding.github.io/boards/esp32/panel-3248S035.htm and https://community.home-assistant.io/t/help-making-esp32-3248s035-work/748332. Only numbers are used.
- The files in `hardware/pocket-player/data/` are the Starter games' own maps, blocks, palettes and hero files, deflated and shared between games. The firmware unpacks them with an ESP32 ROM raw-deflate decoder; the Mac test uses the system zlib and ships nothing. Its separate primary provenance remains to be pinned before it is credited as a firmware component.

## Tools used to build and test

Built with [TypeScript](https://www.typescriptlang.org/) (Apache-2.0),
[Vite](https://vitejs.dev/), [Vitest](https://vitest.dev/) and vite-node (MIT, both from the
Vitest project), and
`@types/node` (MIT), and checked with [Prettier](https://prettier.io/) and
[ESLint](https://eslint.org/) with `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`
and `globals` (MIT). The local MCP server for AI tools (`web/scripts/mcp`, `npm run mcp`) uses
the [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
(`@modelcontextprotocol/sdk`, MIT, Anthropic, PBC) and [ws](https://github.com/websockets/ws)
(MIT, Einar Otto Stangvik, Arnout Kazemier, Luigi Pinca and contributors) with `@types/ws`
(MIT, DefinitelyTyped); they run only on the developer's own computer, in Node. These are the
third-party development dependencies in the workspace manifests, used to build, test and run local tools; none of
their code ships in the app except Vite's small module runtime and preload helper (MIT, Copyright (c) 2019-present, VoidZero Inc. and Vite contributors; the downloads' notices carry that line). The site's Credits page (`#/credits`) lists every one of them and the packages
they use, with versions and licenses, from root `package-lock.json`. The native players are built with Zig (MIT) and, on a Mac, Apple's Swift compiler;
see above for what ends up in them.

The desk's black-light poster (`games/kit/scans/blacklight.py`) is drawn on the developer's
computer with Pillow (MIT-CMU License) and NumPy (BSD); the Caveat font was cut down with
fontTools (MIT). Only their output is committed.

The tour's narration script (`web/scripts/narrate.ts`, `npm run voice`) runs on the
developer's computer with ffmpeg, Pocket TTS's ONNX model and ONNX Runtime's WASM build (see
"The guided tour's voice" in Credits), read from folders outside the repository; only the clips
it makes are committed. Its check (`web/scripts/narrate/verify.ts`, `npm run voice:check`)
hears each clip with OpenAI's Whisper (MIT; the large-v3 model, run by whisper.cpp, MIT, or
openai-whisper's own command), on the developer's computer, to find words the voices said
wrong; nothing of it ships.

`npm run video:transcript` (`web/scripts/videoTranscribe.ts`) runs on the developer's computer
with yt-dlp (Unlicense), ffmpeg, and whisper.cpp (MIT) with OpenAI's Whisper large-v3 model
(MIT), on the maintainer's own YouTube videos. Only the transcripts it writes are committed;
the Library marks each one made this way as made with Whisper speech recognition.

The Bard of Bizarre games' song tools (`games/kit/song/*.py` and each game's
`tools/analyze.py` and `tools/cutClips.py`) run on the developer's computer with ffmpeg,
NumPy and SciPy (BSD), and OpenAI's Whisper (MIT) for word timings when it is installed.
They read recordings that are not in the repository, and nothing of theirs is
committed except the note data and clips they produce. Browser checks during development
(playwright-core, Apache-2.0, and axe-core, MPL-2.0, which `npm run tour:check` uses) are
development dependencies of `web/` and ship in nothing.

### Previewable source audio conversion

Recorded authoring clips are stored as lossless mono 8-bit PCM WAV files, with RIFF/WAVE
PCM fields documented by [Microsoft](https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/ns-mmeapi-waveformatex). Native WAV conversion uses this project’s own reader. The tools package's Node-only `audio-files` entry invokes an external FFmpeg
executable to decode compressed sources such as FLAC and Ogg, or resample audio to native VOCs; no FFmpeg code
or executable is bundled. FFmpeg is by the FFmpeg developers under LGPL-2.1-or-later, or
GPL-2.0-or-later when GPL components are enabled ([license](https://ffmpeg.org/legal.html)).
The converter, source-format migration and verification were implemented with OpenAI
Codex under Lewis Moten's direction. Existing audio, voices, source recordings and their
credits are unchanged; the native DOS audio bytes are preserved.

The source-only game build runner, reproducibility and historical-version checks, and
parallel Depth Perception animation rendering were implemented with OpenAI Codex under
Lewis Moten's direction. No third-party rendering code or data was added.

### Consolidated game-building helpers and fonts

Reusable builders, drawing and image processing, synthesis, native animation and checking
helpers are owned by `web/packages/tools`. The extended rounded and square 3×5 glyphs
were consolidated from the public games' existing font tables. They and the rounded
stroke-lettering data were made for this project by Lewis Moten using Anthropic Claude
Opus 5.5, under the project's MIT License. Their provenance, source commits and references
for median-cut quantization and sphere tracing are recorded in
[the tools package's notices](web/packages/tools/NOTICE.md). CP437's separately credited
public-domain data and this project's additions keep their existing attribution.
OpenAI Codex consolidated the helpers and consumers, preserved the existing game output,
and implemented the shared rendering adapters and verification under Lewis Moten's direction.

### Depth Perception's plastic trinkets

The 3D-printable STL files in Depth Perception's box (Roll Ray, Count Polygon, THE CHEZ, the teapot,
Doc Leo with the rubber chicken, Teddy and Gwinn) are meshed by code from the game's own
distance-field models, with no hand-made meshes: surface nets, the binary STL writer and the
mesh checks are in `web/packages/tools/src/mesh`, and the small WebGL viewer in the desk's box is
original code, with no 3D library. They were written with Anthropic Claude Sonnet 5.5 under Lewis
Moten's direction, under the project's MIT License. The teapot is a nod to the Utah teapot
(Martin Newell, University of Utah, 1975); it is drawn from ellipsoids, a torus and a cone, and
none of Newell's patch data is used.

The multi-color 3MF files follow the 3MF Core Specification (3MF Consortium, https://3mf.io, published under
its open license): a ZIP package with `3D/3dmodel.model`, `[Content_Types].xml` and `_rels/.rels`, one
object per color with a base material color. The ZIP container is written by this project's own small
writer (`web/packages/tools/src/mesh/zipFile.ts`); no 3MF or ZIP library is used.

The other games' pixel-figure trinkets (`games/kit/pixelTrinkets.ts`) are made from each game's own
hero and monster pictures and palette, one pixel to one block, with no outside art; the code was
written with Anthropic Claude Sonnet 5.5 under Lewis Moten's direction.

The laser-cut wooden nickels (`games/kit/laserNickels.ts`, with `laserNickelDefs.ts`, and the SVG builder, pixel
text and preview in `web/packages/tools/src/kit/laser*.ts`) are made for Lewis Moten's Glowforge from each game's own
hero and monster pictures, drawn as pixel engraving, with the words from each game's own text. Their letters are the
engine's 8×8 PC font (Daniel Hepper's public-domain `font8x8_basic`, credited above) and the project's 3×5 micro
font; no outline font and no other outside art is used. The code was written by Claude Sonnet 5.5 (Anthropic) under
Lewis Moten's direction.

Final Curtain's laser-cut Stage Box (`games/sleuth/laser/`, with the joint and layout helpers `laserJoints.ts` and
`laserLayout.ts` beside the nickel builder) was designed and coded by Claude Sonnet 5.5 (Anthropic) from Lewis Moten's
idea of an etched proscenium box with two curtains and a prop dagger. The mechanism (a stack of plates gated by pegs,
with a comb on the drawer) is original; finger joints and sliding slots are common woodworking. Its engraving uses only
words already in Final Curtain, set in the same public-domain 8×8 PC font as the nickels.

The meshes are thinned (`web/packages/tools/src/mesh/decimate.ts`) by quadric edge collapse, the
method of Michael Garland and Paul Heckbert's "Surface Simplification Using Quadric Error Metrics"
(SIGGRAPH 1997), written from the paper with no code from any library; the published method is an
algorithm, not licensed code. It was written with Anthropic Claude Sonnet 5.5 under Lewis Moten's
direction.

### Tiny Shelf Classification

The Library's call numbers (such as 614-MAH) use the **Tiny Shelf Classification**, dedicated to
the public domain (CC0 1.0) by Lewis Moten, github.com/lewismoten/Tiny-Pockets-Press. Only the
few codes the Library uses are copied, in `web/src/library/tinyShelf.ts`. The cabinet and
shelves styling and markup were written by Claude Sonnet 5.5 under Lewis Moten's direction.

### Tiny Pockets Press logo

The small logo on the brass plaque at the top of the Library's card catalog is the Tiny Pockets
Press logo (`logo-256.png`, github.com/lewismoten/Tiny-Pockets-Press), © 2026 Lewis Moten,
under the ISC License ("Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above copyright notice and this
permission notice appear in all copies."). It ships as `web/public/library/tiny-pockets-press.webp`
(a lossless conversion). The photocopier beside the cabinet and the plaque were drawn in CSS by
Claude Sonnet 5.5 under Lewis Moten's direction.

### Sandscript, the Sandbox games' secret alphabet

Sandscript (`games/kit/sandscript.ts`), the alphabet for little messages hidden in the Sandbox
games, and its key on the folded note in the Library room (`web/src/library/sandNote.ts`) were
designed for this project by Claude Opus 5.5 under Lewis Moten's direction, under the project's
MIT License. Its letters were drawn fresh (strokes and dots hanging from a rim on a 3 × 3 grid);
they are not copied from any existing alphabet, cipher or game's script.

### The repository's social preview

The desk scene in `docs/social-preview-*.png` (the README's top image and GitHub's link
preview) was painted by **ChatGPT** (OpenAI) from Lewis Moten's prompt and a pack of the site's
own renders: the desk's props, the Game-Maker box, TURBO BUTTON's cover and the room. Claude
Opus 5.5 laid the real DOS Game-Maker Map Maker screen into its monitor, drew the tablet on its
stand (showing a screenshot of the site's home page) in CSS, and lettered the title and the
sticky note, under Lewis Moten's direction.

### Ready-made palette references

The tools package's `palettePresetData.ts` contains Atari NTSC/PAL swatches by Ricardo
Cancho Niemietz (2008, public-domain dedication with unrestricted-use fallback), NES
swatches from Persune's Pally (MIT-0, copyright 2024 Persune), and Groepaz's Commodore 64
NTSC CXA2025 reference swatches (unrestricted free use, attribution appreciated).
OpenAI Codex extracted and adapted the swatches to this project's VGA palette conventions
under Lewis Moten's direction. Source links, transformations and Pally's complete license
are in [the tools package's notices](web/packages/tools/NOTICE.md#ready-made-palette-reference-data).
No third-party font or image file was added.

RGBI and SMS hardware mappings use project-owned MIT code referring to IBM's 1984
_Technical Reference: Options and Adapters_ and Maxim / SMS Power's palette documentation,
linked in the tools notices. The monochrome ramps, added skin/hair ramps and four LCD-green
shades are project designs made by Lewis Moten using OpenAI Codex, under the project's MIT License.
Exported player-page and native-download notices carry the reference palette credits.

### The Phone of the Future (electronics kit)

`games/year2000/phone/` holds a solderable toy-phone design: a KiCad 9 schematic and two-layer
board, a PIC16F628A firmware in assembly, a bill of materials and a mechanical interface file.
It was designed by Claude Sonnet 5.5 (Anthropic) under Lewis Moten's direction, using KiCad
(kicad-cli for ERC, DRC and exports) and gputils/gpasm. The circuit, footprints, generators and
a small PIC16F84A-style simulator are project-owned MIT code. The schematic embeds symbols copied from
the KiCad stock libraries (CC-BY-SA 4.0 with the KiCad libraries exception, KiCad Libraries
Development Team). References: the ITU-T Q.23 DTMF frequencies, the MT8870D (Mitel/Zarlink/
Microchip), CM8870 (California Micro Devices), HT9170 (Holtek), MAX7219 (Maxim Integrated), GNQ-3641 (G-NOR), PIC16F628A and MCP1702 (Microchip) datasheets. The README's programming steps use ZEPPP (Zero External Parts PIC Programmer by battlecoder, MIT License, https://github.com/battlecoder/zeppp); none of its code is copied. The 3D models are simple boxes and cylinders written by project code. The design is untested hardware.

The two builds of the kit (the 99 x 99 mm Junior Lab Edition and the 73.66 x 175.26 mm Deluxe Model) carry silkscreen QR codes
made with **OpenCV**'s `QRCodeEncoder` (Apache-2.0, the OpenCV team; `games/year2000/phone/tools/silkart.py`) and checked by its
QR detector, and block art of Dex Dynamo taken from the game's own sprite (`games/year2000/src/sprites/sprites.ts`).
The 3D-printed shell, dial, button caps and battery box (`tools/shell.ts`, `shellParts.ts`) are signed-distance shapes meshed
by this repository's trinket tools, designed by Claude Sonnet 5.5 (Anthropic) under Lewis Moten's direction. The AAA cells'
maker "ZORP" is invented. The shell is untested: nothing has been printed.

- **Embroidery generator and Maximus's patch** (`web/packages/tools/src/embroidery/`, `games/maximus/patch/`, `web/src/desk/boxes/patchModel.ts`): the stitch generator, the DST, EXP and PES writers, the single-line lettering, the stitch simulation and the patch design were written by **Claude Sonnet 5.5** (Anthropic), directed by Lewis Moten. The file layouts follow the public descriptions of the Tajima DST, Melco EXP and Brother PES/PEC formats kept by the open embroidery projects (Embroidermodder's libembroidery, MIT, and pyembroidery, MIT); no code or data was copied, and the PES thread-chart indices are approximate. The patch uses only the game's own colors and words. Nothing has been sewn on a real machine.
