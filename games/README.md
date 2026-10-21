# games/

The original games made for Game-Maker: Sandbox Edition. Each one is built entirely in code:
a `build.ts` draws every block, lays out every map, composes the music and writes each file
through the same format code the web app reads (`web/src/formats`), so the result is a real
DOS Game-Maker / PLAYGAME disk in `games/<id>/disk/`. The web app's CD (`web/scripts/cdGames.ts`)
picks up every folder here that has an `about.json` and a `disk/`.

## Layout

Every game folder has the same shape:

```
games/<id>/
  build.ts          builds the game into disk/ (the only script the CD needs)
  about.json        title, author, label, box and catalog text
  manual.json       the printed manual
  printables.json   the paper extras in the box (see web/src/manual/printables)
  disk/             the built game, exactly as it would be on its floppy (committed)
  src/              the game itself
    ids.ts          the numbers every file agrees on (counters, sequences, monster slots, sounds)
    game.ts         the .GAM scene graph: which files each scene loads and how scenes link
    demo.ts         the title screen's demo recording
    art/            palette, drawing helpers, fonts, map renderer
    blocks/         background block sets (.BBL)
    sprites/        monster and character block art (.MBL / .CBL)
    characters/     the character (.CHR) and the monsters (.MON): moves, powers, what becomes what
    levels/         the maps (Virus Blaster calls them stages/, and keeps its bosses in bosses/)
    screens/        320x200 pictures, FLI cartoons and every page of text
    sound/          FM songs (.CMF) and sound effects (.SND / .VOC)
  tools/            dev tools: headless simulator, play-testing bot, checks, previews
```

Not every game has every file (Sandcastle Knight and Snowbound have no `tools/`; some games
call `ids.ts` `rules.ts`). Large modules are split by area, with an index module that calls
the parts in order: a Game-Maker block's number is the order it was added to its set, so the
order of those calls is part of the file format.

## Building and checking

Run everything from `web/` (it has the TypeScript toolchain):

```sh
cd web
npx vite-node ../games/<id>/build.ts          # rebuild games/<id>/disk (and any generated json)
npx vite-node ../games/<id>/tools/check.ts    # play-test it headlessly, where the game has a check
npx tsc --noEmit                              # typechecks web/ and games/
```

A rebuild is deterministic: rebuilding an unchanged game leaves `git status` clean under its
`disk/`. That is the test for any refactor here.

The play-testing tools:

| game     | command (from `web/`)                              | what it does                                                                          |
| -------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| maximus  | `npx vite-node ../games/maximus/tools/check.ts`    | lands on every world, drives the rovers around, crosses the training deck             |
| year2000 | `npx vite-node ../games/year2000/tools/verify.ts`  | the bot plays all six levels in a row (`GOD=1` keeps it alive)                        |
| year2000 | `npx vite-node ../games/year2000/tools/gendemo.ts` | re-records the title demo into `src/demo.ts`                                          |
| teddy    | `npx vite-node ../games/teddy/tools/check.ts`      | the bot plays every level (`TEDDY_WALK=<file>` writes the run as a .rec)              |
| logic    | `npx vite-node ../games/logic/tools/check.ts`      | plays every board's solution                                                          |
| blaster  | `npx vite-node ../games/blaster/tools/check.ts`    | the bot pilot flies every leg and boss                                                |
| sleuth   | `npx vite-node ../games/sleuth/tools/check.ts`     | plays the whole case on the built disk (`--quick`, `--wrong <who>`, `--walk out.rec`) |

Each `tools/sim.ts` is a headless copy of PLAYGAME's main loop built on the web app's engine
(`web/src/engine`), so a check runs the real movement, touch and monster code. Some builds
use it too: the title demos are recorded by a bot playing in the simulator.

## The kit

`games/kit` is shared by every game (see `kit/README.md`): an indexed-color canvas with
seeded randomness and dithering (`pixels.ts`), named VGA color ramps (`palette.ts`), FM
instruments and note strings to `.CMF` (`music.ts`), PC speaker and synthesized `.VOC` sounds
(`sound.ts`), DOS 8.3 file writing (`disk.ts`), and a PNG writer for design previews (`png.ts`).

Every game opens with the same Sandbox Software logo: `kit/sandlogo.ts` ray traces gold chrome
"SANDBOX SOFTWARE" lettering spinning in over a mirrored sandstone floor, with a highlight sweep and a
lens flare, and writes it as `SANDLOGO.FLI` (its own palette, delta frames). Each build puts it on the
disk and lists it first in `title.lst`, ahead of the game's own intro.

## The games

**Maximus: The Hundred Worlds** (`maximus`). Courier Max crosses a galaxy of planets by pod,
on foot, by rover and in a diving bell to find ten star-shards. Every planet is a procedural,
wrap-around 100x100 map (walk east long enough and you are home again). Block sets are drawn
in palette roles rather than colors, so one SURFACE.BBL becomes grassland, glacier or lava
under each planet's palette. The four vehicles are four characters that share sequence
numbers, so ammunition (a sequence's counter) carries over between them. Each monster family
fills a whole .MON with an easy and a hard edition, and the box's about.json and manual.json
are written from the built game so every number in them is true.

**Sandcastle Knight** (`sandcast`). Teddy the corgi knight takes back the backyard sandbox.
Anthills are blocks that give birth to ants until they're plugged with sand, bridges crumble
one touch at a time, hose streams are gravity currents, and the tide rolls up the beach by
next/ntime chains started at different phases. The same blocks are re-lit for the burrows and
the dusk by tinted palettes, and the screens are a dial-up BBS session. PC speaker only.

**Snowbound: The $89 Shovel** (`snowbound`). Shovel the real streets of Fort Ashby at $1
a scoop: deep snow is solid and pays money when pushed, the mall lot snows back over on a
timer, ice slides you by gravity, and the sled run's glide blocks pull up and down at once so
the sled keeps its speed. Plows and cars are two monsters side by side that die into their
mirror twins at the end of each leg, so the blade always leads. The register only opens with
$89, because Game-Maker refuses a touch that a counter can't pay for.

**In The Year 2000!** (`year2000`). Dex Dynamo crosses a 1990s idea of the future to the
Science Fair on the Moon. Phone booths are 25-cent teleporters (the door spends a quarter
and opens onto the booth's scene link), laser fences blink by next/ntime chains, moving walkways are gravity, keycards and
remotes are counters that staff doors, garage doors and airlocks spend, and on the Moon a second character file bounds
along in one-sixth gravity.

**Teddy's Little Big Adventure** (`teddy`). Teddy hops, barks, digs, high-fives, sits, spins
and plays dead across town. Every trick sends out a monster of its own, and a ladder of monster
powers decides what each trick beats: a bark beats a blocker cat, only a high five beats a
kid's raised hand, only the heart from sitting pretty beats someone asking for a sit. Beaten
monsters are reborn as what they become (a falling treat, a ticket, a costume piece), so every
puzzle is a birth chain.

**Ohm Sweet Ohm** (`logic`). Watt the repair robot rolls through twenty circuit boards. All the
boards of a room share one map, each in its own screen-sized window, and each outlet links back
into the same scene at the next board. Current is monsters: a battery gives birth to sparks that
run along their wire's path back to back, and switches, relays, fuses and gates are monsters
whose powers decide what the current gets through. The build writes printables.json so the
hint book always matches the boards.

**Virus Blaster** (`blaster`). A vertical shooter in an engine with no scrolling shooter: the
ship's every frame drifts it up the map, and Game-Maker scrolls to follow, which is the whole
auto-scroller. Turrets are blocks that give birth to bullets, and bosses are many monsters at
once: weak points are chains of monsters that each hit turns into the next, more damaged part.
The play-testing pilot tries every stick position on copies of the game a few ticks ahead.

**Final Curtain** (`sleuth`). A 1936 murder mystery at the Paragon Theatre. Seventy of its
seventy-two scenes share one map and differ only in where Ada starts, which links they carry
and which intro they show: a question is a link to a scene whose intro is the answer, and that
scene looks exactly like the room she asked it in, so the conversation simply goes on. The safe
is a combination lock made of counters, the dark under the stage gives way to the floor only
where the lantern has been, and the check bot plays the whole case from the built disk.
