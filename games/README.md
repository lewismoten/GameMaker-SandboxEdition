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
  walkthrough.json  the whole game played from power-on to the credits (tools/walkthrough.ts)
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
  tools/            dev tools: headless simulator, play-testing bot and its route, checks, previews
```

Not every game has every file (Sandcastle Knight calls `ids.ts` `rules.ts`). Large modules
are split by area, with an index module that calls the parts in order: a Game-Maker block's
number is the order it was added to its set, so the order of those calls is part of the file
format. The sequel `teddy2` shares the first adventure's drawing helpers, block sets, monster
builder and cast portraits: its copies of those files re-export `games/teddy/src`.

## Building and checking

Run everything from `web/` (it has the TypeScript toolchain):

```sh
cd web
npx vite-node ../games/<id>/build.ts              # rebuild games/<id>/disk (and any generated json)
npx vite-node ../games/<id>/tools/check.ts        # play-test it headlessly (see the table)
npx vite-node ../games/<id>/tools/walkthrough.ts  # replay the whole game, rewrite walkthrough.json
npx vite-node ../games/kit/textfitCheck.ts <id>   # PLAYGAME's text lands on plain paper, not art
npx tsc --noEmit                                  # typechecks web/ and games/
npx vitest run                                    # the web tests, some of which read games/
```

A rebuild is deterministic: rebuilding an unchanged game leaves `git status` clean under its
`disk/`, and rerunning `tools/walkthrough.ts` or a `gendemo.ts` leaves `walkthrough.json`
and `src/demo.ts` unchanged. That is the test for any refactor here.

Every game has `tools/walkthrough.ts`. Run it after changing a level: the bot plays the whole
game, then `kit/walkthrough.ts` replays its keys on the web app's real engine, checks that
the run reaches the ending and times the chapters for the web app's "Watch walkthrough".
Then run `npx vite-node ../games/kit/playtime.ts`: it sets each box's "Over N hours of
gameplay!" (`about.json` `box.hours`, the only place a game states its length) from its
walkthrough, so the claims stay in proportion to how long each game takes. Play time is the
level chapters only (not Opening, Story, Ending or Credits), and
`hours = max(1, round(play minutes × 25 / 60))`: 25 claimed minutes per minute of the bot's
perfect run, which puts the median game on 3 hours. A test (`web/src/desk/boxes/playtime.test.ts`)
fails until it is rerun. The other play-testing tools:

| game      | command (from `web/`)                                | what it does                                                                    |
| --------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| blaster   | `npx vite-node ../games/blaster/tools/check.ts`      | the bot pilot flies every leg and boss                                          |
| brief     | `npx vite-node ../games/brief/tools/check.ts`        | the bot restores all 32 books, passes the eight stamp gates, opens the 33rd     |
| depth     | `npx vite-node ../games/depth/tools/check.ts`        | the bot rolls all six scenes, pulls focus, beats Count Polygon                  |
| goat      | `npx vite-node ../games/goat/tools/check.ts`         | the bot eats, gathers wool and screams its way to the manger                    |
| goat      | `npx vite-node ../games/goat/tools/gendemo.ts`       | re-records the title demo into `src/demo.ts` (then rebuild)                     |
| mustard   | `npx vite-node ../games/mustard/tools/check.ts`      | the bot hops the garden, digs to five drops, moves the mountain, rides the breeze |
| mustard   | `npx vite-node ../games/mustard/tools/gendemo.ts`    | re-records the title demo into `src/demo.ts` (then rebuild)                     |
| loaf      | `npx vite-node ../games/loaf/tools/check.ts`         | the bot rolls the hillside, climbs the wasteland, gathers twelve baskets, goes home |
| loaf      | `npx vite-node ../games/loaf/tools/gendemo.ts`       | re-records the title demo into `src/demo.ts` (then rebuild)                     |
| tickle    | `npx vite-node ../games/tickle/tools/check.ts`       | the bot pins and tickles 31 rats: the course, the lab, the sewers, the tower     |
| tickle    | `npx vite-node ../games/tickle/tools/gendemo.ts`     | re-records the title demo into `src/demo.ts` (then rebuild)                     |
| remote    | `npx vite-node ../games/remote/tools/check.ts`       | the bot searches the living room, calls Mom, pays the TV in the void, rides home |
| remote    | `npx vite-node ../games/remote/tools/gendemo.ts`     | re-records the title demo into `src/demo.ts` (then rebuild)                     |
| carl      | `npx vite-node ../games/carl/tools/check.ts`         | the bot flies the living room, the kitchen, the bedroom, the yard, the wild and back for the aux cord |
| carl      | `npx vite-node ../games/carl/tools/gendemo.ts`       | re-records the title demo into `src/demo.ts` (then rebuild)                     |
| reckoning | `npx vite-node ../games/reckoning/tools/check.ts`    | the bot sneaks to the fridge, climbs it for seven celery, outruns the gurgle, splashes the Devil |
| reckoning | `npx vite-node ../games/reckoning/tools/gendemo.ts`  | re-records the title demo into `src/demo.ts` (then rebuild)                     |
| loofah    | `npx vite-node ../games/loofah/tools/check.ts`       | the bot rides the steam for bath salt, tames wild loofahs in the forest-dark aisle, lights six candles, cleanses Scrubbus Maximus |
| loofah    | `npx vite-node ../games/loofah/tools/gendemo.ts`     | re-records the title demo into `src/demo.ts` (then rebuild)                     |
| risi      | `npx vite-node ../games/risi/tools/check.ts`         | the bot airs the banquet, outruns the horde, twists seven tituli, meows six cheeses as Felix, gathers golden scales, makes the Emperor laugh |
| risi      | `npx vite-node ../games/risi/tools/gendemo.ts`       | re-records the title demo into `src/demo.ts` (then rebuild)                     |
| sweats    | `npx vite-node ../games/sweats/tools/check.ts`       | the bot plays the open mic: four intermissions and seventeen monologues (`SWEATS_FROM`/`SWEATS_UPTO=<scene>` for one) |
| sweats    | `npx vite-node ../games/sweats/tools/gendemo.ts`     | re-records the title demo into `src/demo.ts` (then rebuild)                     |
| needle    | `npx vite-node ../games/needle/tools/check.ts`       | the bot gives the gold away, crawls the eye gates, climbs threads, threads the eye |
| needle    | `npx vite-node ../games/needle/tools/gendemo.ts`     | re-records the title demo into `src/demo.ts` (then rebuild)                     |
| depth     | `npx vite-node ../games/depth/tools/gendemo.ts`      | re-records the title demo into `src/demo.ts` (then rebuild)                     |
| logic     | `npx vite-node ../games/logic/tools/check.ts`        | plays every board's solution                                                    |
| maximus   | `npx vite-node ../games/maximus/tools/check.ts`      | lands on every world, drives the rovers around, crosses the training deck       |
| realm     | `npx vite-node ../games/realm/tools/check.ts`        | the bot plays the whole main quest (`BOT_LOG=1` prints every step)              |
| realm     | `npx vite-node ../games/realm/tools/sidecheck.ts`    | the side quests                                                                 |
| realm     | `npx vite-node ../games/realm/tools/gendemo.ts`      | re-records the title demo into `src/demo.ts` (then rebuild)                     |
| sleuth    | `npx vite-node ../games/sleuth/tools/check.ts`       | plays the whole case (`--quick`, `--wrong <who>`, `--walk out.rec`)             |
| teddy     | `npx vite-node ../games/teddy/tools/check.ts`        | the bot plays every level (`TEDDY_WALK=<file>` writes the run as a .rec)        |
| teddy2    | `npx vite-node ../games/teddy2/tools/check.ts`       | the bot plays all eight levels, Teddy's and Gwinn's (`TEDDY2_WALK=<file>`)      |
| year2000  | `npx vite-node ../games/year2000/tools/verify.ts`    | the bot plays all six levels in a row (`GOD=1` keeps it alive)                  |
| year2000  | `npx vite-node ../games/year2000/tools/gendemo.ts`   | re-records the title demo into `src/demo.ts` (then rebuild)                     |

Sandcastle Knight and Snowbound have no check of their own: their `tools/walkthrough.ts` is it.
The felt eggs have checks of their own where a game's route never goes near one
(`depth/tools/egg.ts`, `realm/tools/eggcheck.ts`, `sleuth/tools/check.ts --egg`). The other
title demos are recorded by the build itself (`src/demo.ts` runs the bot) or are fixed key
lists. A few games keep design aids in `tools/` too (`preview.ts`, `sheet.ts`, `maps.ts`):
each says at its top how to run it.

Every bot plays on a headless copy of PLAYGAME's loop built on the web app's engine
(`web/src/engine`), so a check runs the real movement, touch and monster code:
`kit/sceneSim.ts` plays one scene from the build's own data (teddy, teddy2, logic, brief),
`kit/gameSim.ts` plays the built disk scene after scene (depth, realm, snowbound), and the
other games keep a `tools/sim.ts` of their own.

## The kit

`games/kit` is shared by every game; `kit/README.md` lists its modules. In short: an
indexed-color canvas with seeded randomness and dithering (`pixels.ts`), VGA color ramps
(`palette.ts`), FM songs (`music.ts`), PC speaker and `.VOC` sounds (`sound.ts`), DOS 8.3
files (`disk.ts`), each disk's `LICENSE.TXT` (`license.ts`), photos dithered into a picture's
palette (`photo.ts`, from the small scans in `scans/`), where PLAYGAME writes on the load and
save pictures (`saveSlots.ts`), the text-fit audit (`textfit.ts`), the two headless
simulators, the walkthrough writer (`walkthrough.ts`), and a PNG writer for previews.

Every game opens with the same Sandbox Software logo: `kit/sandlogo.ts` ray traces gold chrome
"SANDBOX SOFTWARE" lettering spinning in over a mirrored sandstone floor, with a highlight sweep and a
lens flare, and writes it as `SANDLOGO.FLI` (its own palette, delta frames). Each build puts it on the
disk and lists it first in `title.lst`, ahead of the game's own intro.

`kit/cdDemos/` is not for these games: it records title demos for the games on the original
Game-Maker CD that shipped without one (into `web/public/extras/demos/`, never into `cd/`).

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

**Teddy's Little Bigger Adventure** (`teddy2`). The sequel: the morning after the Big Show, Gwinn's
bed is empty, and Teddy follows her trail out to the Tri-County Fair. Each level scene names its own
character file, so the MEANWHILE... levels load `gwinn.chr` and you play Gwinn, with tricks of her
own (BOOF, a big dig, chewing, zoomies, a sit she hasn't learned). Teddy's new SNIFF sends out a
monster that beats only scents: faint, nearly invisible monsters that turn into what was hidden there.
A rung bell's DING is a monster that drops onto what hangs below it and starts it up (a bucket truck,
a grain hoist, a velvet rope coming down), solid monsters carry the dog up as lifts (THE BIG DROP rides
21 blocks), rapids are water with gravity to the side, and the felt egg is behind a hedge you can only
reach by walking off the left end of the map, which wraps round to the right.

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

**KEEP IT BRIEF! The Tiny Pockets Library** (`brief`). Lewis Moten's thirty-two 100 Word Stories, word for word, each acted out in a book of its own
behind The Dog House's red door. Words are floor blocks that count into counter 3; THE END is
a solid page that only takes exactly one hundred (Game-Maker refuses a touch the counter can't
pay for), opens, and counts the story into its wing's counter. The story is the book's exit
graphic, so it shows exactly when it is put back. Shushers fine points (score) instead of
taking words, so a book can always be finished. In the Reserve Stacks, egg cup gates take four
of a wing's stories and give them straight back as Joe steps through: a counter check that
keeps nothing. The intro's words pour out of the door by palette cycling.

**Depth Perception** (`depth`). Ray, the chrome sphere from every ray tracing demo, rolls through six
scenes of a render Count Polygon is stealing the polygons out of. Everything is ray traced in the
build by a small software renderer (`src/render`): blocks are rendered per cell with their
neighbors (so shadows cross block edges and pits show their walls) through an oblique camera, the
sprites from 3D models, the title, cards and two FLI cartoons from scenes of chrome, glass and
checkerboards, all reduced to 256 colors by median cut and dithering. Every scene is two scenes
sharing one map: a near plane and a far plane whose block sets share their numbers but not their
solidity, so whatever is in focus is sharp and solid and the other plane's blocks are
out-of-focus blurs you roll through. Focus rings are links between the two. Auto-focus panels
blink by next/ntime, slopes are gravity, teapots and bat nests give birth to monsters, and Count
Polygon is a chain of five monsters that each ray kills into the next, fewer-faced one.

**Quest for the Round Tuit** (`realm`). An RPG: Pip of Nowish recovers the three pieces of the Royal
Round Tuit across four towns and four dungeons. The ground is autotiled: every block of shore,
river, road, forest edge, cliff, cobbled street and cave wall is chosen by which of its four corners
lie in that material (marching squares), and painted in true color from a signed distance field,
so edges curve and run at 45 degrees and the foam, wet sand and shadows join from block to block;
each scene's palette is a median cut of its own paintings around a fixed set of sprite colors.
Talking is a link to a scene of its own: PASS.MAP under an all-black palette, the conversation for
its intro, and a link straight back, whose start block can hand over a reward. Quests are counters
and gates that take k and give it straight back (a refused touch keeps the gate shut); shops are
counters you walk into twice. Foes are under power 100, so a bite costs them a hit; bosses are four
solid monsters in an alcove's mouth. THE CHEZ crosses the Dawdle Flats as a second character, where
the low bridges flood and drain by the clock, and the felt egg turns up in a nest behind a waterfall
for four seconds in every twenty-four.

**Third Goat from the Left** (`goat`). Not a Sandbox Software game: a 1995 shareware game by The Bard
of Bizarre (Lewis as his hobo clown Doc Leo), downloaded from The Sofa BBS's file library, so it is
listed with the shareware (`isSandboxGame` in web/src/project/files.ts) and gets no box, floppy or
felt egg. Its about.json says `"series": "bizarre"`: once four or more of the Bard's games are in the
catalog they leave Shareware for a Bizarre tab of their own (web/src/project/bizarre.ts). You are the goat nobody painted on the holy night, from Lewis's song (recorded with
Riffusion). Anything a goat eats is a solid block that turns to floor when pushed (hay and thistles fill
the scream's counter), wool is counter 20 and the empty place third from the left in the line at the
manger only takes five, and the fainting cousins are solid monsters a scream (power 120) knocks into a
stiff one of equal power, so the next scream flies over it to the cousin behind. The music is an OPL2
rhythm-mode arrangement of the song made from an analysis of the recording (`tools/analyze.py`,
`src/sound/song.ts`), and some of the VOCs are cut from it (`tools/cutClips.py`); the title, the
credits and the ending dither the song's cover art, the Bard's logo and Doc Leo's photo
(`tools/scans.ts`).

**Mustard Seed Hustle** (`mustard`). The Bard of Bizarre's second game, another of his gospel
oddities, shareware from The Sofa BBS like the goat (`"series": "bizarre"`). A side-on platformer:
you are a mustard seed with tiny red sneakers, and every level the seed is a different character
file as it grows (a seed, a sprout, then a plant two blocks tall). Air pulls down, so a hop is an
upward push each tick Up is held and Q/E hop sideways; soft dust is a solid block whose touch turns
it into a root, air with no gravity, so the seed digs its own climbable tunnels (landing on dust
puts roots down); dandelion fluff and the evening breeze are air that pulls up. Water (counter 20)
opens the sidewalk's crack at five drops, faith (counter 21) moves boulders one each, and the seed
has no attack at all ("it don't shout"). The song's tools are shared: `kit/song/analyze.py` and
`kit/song/cutclips.py` (each game's `tools/analyze.py` and `tools/cutClips.py` name the song),
`kit/song.ts` writes the arrangement and `kit/songPreview.ts` renders it; the title cartoon is the
song's animated cover, its seven frames dithered into one palette (`tools/scans.ts`).

**Thread the Needle, Brother Camel** (`needle`). The Bard of Bizarre's third game, another of his
bizarre gospels (Matthew 19:24), shareware from The Sofa BBS (`"series": "bizarre"`). A side-on
platformer: the rich man walked off and left his camel with saddlebags of gold. The camel is two
blocks tall; kneeling and crawling (Down, Z, C) show no top block, so he is one block high and fits
the narrow ways ("hump down"). Each level loads a lighter character file (saddle, bags and fancy
shoes, then less, then nothing). The poor along the road are block chains that take a coin of gold
(money, refused when there is none) and give a grace (counter 20); eye gates are solid blocks that
take a grace to open into a gap one block high, and the eye of the needle at the top of the last
level takes four. In the tailor's shop threads are no-gravity blocks to climb, entered past a fray
that takes a spool (counter 21) to mend: bumped sideways, because PLAYGAME only changes a touched
block that is fully on screen, and a block above a climbing two-high character often is not. Sandstorm
gusts are air that pulls down and left, coming and going by next/ntime. The title cartoon dithers
the song's fourteen cover frames (`tools/scans.ts`); the music and five sung clips come from the
recording through the shared song tools.

**Loaf #13 (Left in the Basket)** (`loaf`). The Bard of Bizarre's gospel slow jam about the loaf
nobody picked at the feeding of the five thousand, shareware from The Sofa BBS (`"series":
"bizarre"`). A side-on platformer like the seed's: the loaf rolls (its face goes round with it),
rises while Up is held, and sings "I'm still bread!" (a clip cut from the song). Warm air over a
cooking fire is air that lifts, the weave inside the stacked baskets is air with no gravity
(climb it) and chaff gives way to it; holy crumbs (counter 20) open the lid at seven, each empty
basket at dusk is gathered up full by a touch (counter 21) and the twelfth only takes you with
eleven; on the way home the loaf is a second character file, wrapped in the child's cloth, and her
door takes one holy crumb. No cover came with the song, so the title is a painting drawn in code
(`src/art/cover.ts`) and quantized into its FLI. The music shows off `kit/songFx.ts`: organ swells
by program change, the bass drum tuned as the bass, vibrato-twin choirs, stepped scoops, echoes,
stutters, timpani rolls and dramatic pauses.

**Certified Rat Tickler** (`tickle`). The Bard of Bizarre's song about the day Lewis earned his rat
tickling certificate, shareware from The Sofa BBS (`"series": "bizarre"`). A side-on platformer:
Doc Leo, in a lab coat over his hobo clown clothes, is two blocks tall, hops like the loaf rises,
and PIN and TICKLE each send a hand out to both sides. The technique is the monster powers and
the shapes of the sprites: a pin (power 160) turns a wary rat (150) into a pinned one on its back;
a tickle (170) would beat a wary rat too, but its fingers are drawn only in the top half of the
block and a wary rat only in the bottom half, so no pixels meet unless the rat is on its back
with its paws up (`spriteRules()` checks it). A pinned rat becomes a giggling one that comes to
Doc Leo's hand, and touching it adds it to the laughing carpet (counter 20, all game long); each
level's door is a Dutch door whose bottom half takes the carpet and gives it straight back as he
steps through. Bumping a wary rat costs rapport with a 22 kHz "dread" whistle; a joining rat
chirps at 50 kHz. No recording came with the song, so the music is an original villainous tango
composed in `src/sound/song.ts` (theremin, bandoneon, the choir's maniacal laughter) and every
sound is synthesized; the title is a painting drawn in code, and the parody certificate
(`cert.fli`) is made up for the game.

**Where's the Remote?!** (`remote`). The Bard of Bizarre's song about a mundane thing nobody should
care about, shareware from The Sofa BBS (`"series": "bizarre"`). A top-down search through a 1995
living room, its kitchen, the void between the cushions and the living room ride. Searching is
touching: push into a couch cushion, Teddy's bed, the cat's chair or the laundry and it becomes the
searched version, counting a spot (counter 20); the baby gate takes six. Mom's number is seven
fridge magnets (counter 21) the phone dials, pennies are money and the pay TV in the void takes
ten, and on the ride the spinning rug is gravity in a ring (the bot steps back onto its line when
carried past). Two engine facts shape it: a block's next/ntime is one clock shared by every copy of
that block (so there are no per-block delays), and a hurt freezes you, so a floor that always hurts
holds you there; a Bermuda swirl stings once and closes, and every monster that hurts does it on one
stinging tick of its animation a round. SPACE shouts "Where's the remote?!" (a clip cut from the
recording), a monster that blows dust bunnies, cockroaches and lint away. The music is a kazoo-led
FM arrangement using `kit/songFx.ts` (stutters, filter-sweep "VCR whirrs", an 808 boom and theremin
glides in the void, a calliope for the ride, a dramatic pause before "beneath my thigh"); no cover
came with the song, so the title is a painting drawn in code (`src/art/cover.ts`).

**A Fly Named Carl** (`carl`). The Bard of Bizarre's comedy song about the fly in the room ("There's a
Fly in the Room (And It's Winning)"), shareware from The Sofa BBS (`"series": "bizarre"`). You are Carl,
and a fly doesn't fall: every bit of open air has no gravity, so the arrows (and Q/E/Z/C for the
diagonals) fly and letting go hovers. Gaps one block tall are guarded by a dish towel, the old clap or a
rolled-up magazine, solid monsters that fill the gap; the barrel roll (Space) throws a whoosh ahead the way
Carl last flew (a monster fired by the character, power 160) that kills them into a "MISS" which turns
back into them a while later (newmon with a lifetime). The buzz (B) wakes sleeping ears: an ear (power 105)
buzzed becomes a twitching ear (power 50) that counts (counter 22) when Carl flies into it and dies into a
sound-asleep ear that turns back into the first after a while, so one ear can be buzzed again and again.
Snacks (counter 20) open the floor lamp, smiles from the kitchen walls (counter 21) the door, three ears the
bedroom window, and hourglasses (counter 23, two hours each) break the documentary's clock at 24. Two block
sets (the house, the yard), gusts that blow by next/ntime, and the cover drawn in code (`src/art/cover.ts`);
the music is a kazoo, an island-strummed ukulele and Carl himself as a buzzing one-channel arpeggio.

**The Great Dairy Reckoning of 3:17 A.M.** (`reckoning`). The Bard of Bizarre's spoken monologue (from
Lewis's own struggle: lactose intolerant, loves cheesecake), shareware from The Sofa BBS (`"series":
"bizarre"`). A side-on platformer in four acts. Out of bed without waking her: the noisy things on
the floor (a creaky board, a squeaky toy, the toy blocks) are air that costs dignity once and then goes
quiet (a hurt holds the man still, so a floor that always hurt would hold him there), the dogs asleep
are solid. Up the open fridge's glass shelves (ledges) past the dairy come to life for seven sticks
of celery (counter 20): the cheesecake only lets him near with all seven, takes them, and is eaten.
The dash down the dark hall with the gurgle (a monster that chases at 2 pixels a tick) behind him,
three rolls of toilet paper (counter 21) for the bathroom door. The reckoning loads a second
character file whose Space throws almond milk: two splashes (power 220, at his head and his feet)
beat the soda fountain's milkshakes (200) and knock each half of the Devil (200) a stage further;
the throw keeps its own count because the house's file leaves that sequence's meter at -20000
(undefined: each scene copies the next file's count over it), and the cartons don't grow back (a
block's next/ntime is one clock for all its copies). The recording is spoken with no music bed, so
the FM score is composed for the game (thunder rolls, the ominous organ, a cow's moo, a tango); the
voice clips are cut from the recording (`tools/cutClips.py`), and the title art is painted in code
(`src/art/cover.ts`).

**Cleanse Me, O Loofah, But Leave My Soul** (`loofah`). The Bard of Bizarre's goth rock song about
domestic life ("Don't touch the pink one. It's mine!"), shareware from The Sofa BBS (`"series":
"bizarre"`). A side-on platformer in four acts, one character file throughout: the man in his bath
towel hops like the Reckoning's, and Space throws rosemary brine (power 220, at his head and his
feet) once he has any: the throw's own count starts at 0 (a sequence with no count left can't be
done) and each sprig of rosemary adds three, carried from act to act. In the haunted bathroom the
shower's steam is air that pulls up (it lifts him to the silver rack), the shower head gives birth
to drips, the mirrors fog up "YOU CROSSED A LINE" by next/ntime, the screaming towel is a solid
monster, and five jars of bath salt (counter 20) go in the mop bucket. In the forest-dark aisle the
luffa vines are air with no gravity (climb them), brambles hurt once and are trampled, wild loofahs
(150) are splashed into tame ones worth points, and the checkout takes six silver coins (counter
21). At home, touching an unlit candle lights it (counter 22) and the bathroom door takes six. In
the shower Scrubbus Maximus, the demon sponge, is two monsters in four stages each, like the
Reckoning's Devil; its top half, cleansed, becomes the pink one (counter 23), and her silver rack
takes it back. The music is a goth rock FM arrangement of the recording (`tools/analyze.py`,
`src/sound/song.ts`: fuzz power chords from feedback and pulse waves, a vibrato-twin choir, a
cathedral organ swelling by program changes, booming tuned toms, a funeral bell), the sung clips
are cut from it (`tools/cutClips.py`), and the title art is painted in code (`src/art/cover.ts`).

**Shakespeare in Sweatpants** (`sweats`). The Bard of Bizarre's seventeen spoken monologues about
overly dramatic boring events, shareware from The Sofa BBS (`"series": "bizarre"`): open-mic night at
The Hive, a castle-front coffee house in Oakland (inspired by Lewis's memories of the Beehive; drawn
from memory). Will the poet (a ruff, a velvet doublet, grey sweatpants) performs them in four sets, each
monologue a side-on scene of its own that plays its boring event as an epic; Space declaims, two word
balloons flying out along paths to both sides (power 160) to beat what comes at him. Between sets the
intermissions are scenes on The Hive's one map: five tips buy a coffee at the register (a block that
takes money and turns into a cup that gives counter 20), and the stage's curtain only lets him through
with one. Each monologue's scene fills two of PLAYGAME's own sound slots with its recording: the
spotlight where he starts is the scene's only points-alone block, so stepping into it says the opening
line (the score sound), and the last gate takes the plot (counter 21) and says the punch line (the spend
sound); B and Space say two more lines (`tools/cutClips.py`, 68 clips from Whisper's word timings).
Each set is a group (`src/groups/<id>`) with one block set and one monster block set of its own, its
ramps after the common ones, so every scene shares POET.CBL. The coffee-house jazz score derives four of
its songs from the recordings' music beds (`tools/analyze.py`).

**Veni, Vidi, Risi!** (`risi`). Six comic songs in Latin by Veni, Vidi, Risi!, Lewis's group (lyrics
shaped with ChatGPT from his prompts, music and vocals made with Riffusion), shareware from The Sofa BBS
beside the Bard's (`"series": "bizarre"`). A side-on platformer, one level a song, the six levels in three
pairs that share a block set each (VILLA, CAMPUS, THERMAE: a .BBL holds 150) and one monster set. Marcus
the poet must make Emperor Gravis laugh. Space and Z tell a joke each way (two "HA!"s, power 220, never
running out); a stone face hit by one becomes a spectator shaking with laughter in its seat (230, so the
second joke flies by harmlessly) whose path ends in a laugher (50) that comes to him and counts. Shutters
are air a touch throws open (counter 20), Rufus's table gives birth to clouds, the Gaulish horde is a
charge along a fixed path at a walk (the level is the retreat), tituli twist into tongue twisters when
touched (counter 22) and SAXA turns into SAGA, the kitchen loads a second character file (Felix the
cat, whose meow scares mice into dropping their cheese), steam and drums are air that lifts, and the
Emperor is two monsters in four stages. Hurting monsters sting on one picture a round. Every gate opens a
step before the way on, so its sung line plays out. The FM score is arranged from the recordings'
analysis (`tools/analyze.py`: an opera, a march, a patter song, an aria, an ironic bounce), seventeen
Latin clips are cut from them (`tools/cutClips.py`), and the cover is painted in code (`src/art/cover.ts`).
