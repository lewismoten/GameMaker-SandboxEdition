# Tin hearts (and cameos): the recipe

Every Sandbox Software game and every Bard of Bizarre game hides one **tin heart**: a small riveted
tin heart with a clock face, a nod to the Tin Man and to Lewis's pacemaker (no secret: the cast page and
TURBO BUTTON say so). Find them all and Mystery Robot Joe leaves a diamond
heart trophy on the desk. The web counts a game as soon as its `about.json` declares a heart.

In Game-Maker 3.0 a block has no id or sound of its own, so a heart is just a block that gives points
when touched. The web knows it by its place: the map file and cell in `about.json`. The engine tells
the player when a touch changes a map cell, and a touch at that place counts as a find. The find is
saved in the game's save data as `tinheart.dat`. The disk and the game's play stay exactly as built.

One more heart is in no game: it falls out of the desk's wall clock with the rubber chicken, once
he has popped out a few times (`web/src/tinHearts/deskHearts.ts`, `web/src/desk/props/clockHeart.ts`).
It counts toward the set like the others. Someone who had every game's heart before it was added
keeps the trophy and what it opens, and is shown the clock's as one more to find.

## Placing a heart

1. **Art.** Draw it with `kit/tinHeart.ts` in the game's own ramps, over the ground it sits on:
   ```ts
   import { SHINE_FRAMES, drawTinHeart } from '../../../kit/tinHeart';
   const tin = { ink, tin: [dark, mid, light], white, dark: shadow };
   for (let k = 0; k < SHINE_FRAMES; k++)
     add(`tinHeart${k || ''}`, drawTinHeart(groundPic(), tin, k), { next: `tinHeart${(k + 1) % SHINE_FRAMES || ''}`, ntime: k ? 2 : 50, touch: 'ground', score: 100 });
   ```
   The heart must be drawn whole and centered as `drawTinHeart` draws it. The checks recognize it by
   its outline and clock face (`looksLikeTinHeart`), so don't redraw, crop or shift it. Two frames
   (0 and 2) are enough if the block set is full.
2. **Block rules.** It's a background block. It gives points (100, or what the game's pickups give).
   Its **touch block is the ground under it**, so it disappears when touched; that change is what
   the web listens for. It's not solid, not a pickup, and has no counter effect or hit points. Use
   no sound slot, and **never a .VOC**: a sound would cut a voice clip. If the game has a free
   PC-speaker slot, `TICK_TOCK` from `kit/tinHeart.ts` is the heart's sound.
3. **Where.** Put it off the critical path but findable: a corner, a dead end, behind the bar, by a
   landmark. Make it reachable without special moves, and in a level the player is sure to visit.
   Not in a room the bot must cross. Never on a link cell, a monster's path, or under a wall.
   Optionally, an NPC hints at it (`TIN_HEART_LINE`), as Will does in Quest for the Round Tuit.
4. **Rebuild** (`npx vite-node ../games/<id>/build.ts`) and commit the disk with the source.

## The manifest entry

Add one line to the game's `about.json`, after `"egg"` (or `"sound"`):

```json
"tinHeart": { "map": "port.map", "at": [10, 33] },
```

`map` is the map file on the disk, lower case. `at` is [column, row] on its 100x100 map. You don't
have to work it out by hand:

```sh
cd web
npx vite-node ../games/kit/tinHearts.ts find <id>   # prints the line(s) to paste
npx vite-node ../games/kit/tinHearts.ts             # rewrites web/src/tinHearts/hearts.json
npx vite-node ../games/kit/tinHearts.ts check <id>  # checks the block is there, then touches it on the real engine
```

`hearts.json` is generated. Never edit it, and commit it with the `about.json` change. A game whose
`about.json` says `"secret": true` is never counted or listed, so never give one a `tinHeart`.

## Bot, walkthrough and demo

The bot's route doesn't change. It doesn't need to take the heart, and it shouldn't, since the
heart's points would change the walkthrough's score. If the heart sits in a room the bot crosses,
move the heart, not the bot. After the rebuild, run the game's `tools/check.ts` and
`tools/walkthrough.ts`; `walkthrough.json` and `src/demo.ts` should come out unchanged. If a
level's layout had to change, regenerate the demo with the game's own `gendemo.ts` and rerun
`kit/playtime.ts`.

## Checks before you commit

```sh
cd web
npx vite-node ../games/<id>/build.ts                 # deterministic: rerun leaves git status clean
npx vite-node ../games/kit/tinHearts.ts check <id>   # "ok, <map> at x,y, found when touched"
npx vite-node ../games/<id>/tools/check.ts           # the bot still wins
npx vite-node ../games/kit/textfitCheck.ts <id>      # if you touched any text
npx vite-node scripts/levelSecrets.ts                # the printed Level Maps hide the new spot
npx vitest run src/tinHearts src/cast                # hearts.json current; every heart on its disk; cameos known
npx tsc --noEmit
```

## The cast entry

Add the heart to `web/src/cast/cameos.json` under `"tinHeart"`, so the cast page lists the game:

```json
{ "game": "<id>", "as": "tucked behind the lighthouse" }
```

Keep the `as` short and in lower case, and say where it is in a way that hints without spoiling.

## Cameos

Recurring characters go in the same pass. They're decoration: two blocks at most, never in the
way. Record each one in `web/src/cast/cameos.json` under its cast id (`joe`, `watt`, `lewie`,
`will`, `carl`, `leo`, `chicken`): `{ "game": "<id>", "as": "what they are doing there" }`.
`castData.test.ts` only accepts ids and games the cast page knows.

Draw each with the kit, recolored into the host's palette by nearest color (`kit/cameos.ts`).
`hostPal` is the host's 768-byte palette; pass `{ use: [...] }` to keep a cameo to the host's
sprite colors.

| who | helper | notes |
| --- | ------ | ----- |
| Mystery Robot Joe | `joeCameo(hostPal, 'down' \| 'up' \| 'side', step)` | tin box robot, bulb, glasses, bow tie; a librarian, a counter of things |
| Watt | `wattCameo(hostPal, 'down' \| 'up' \| 'side', step)` | repair robot on treads; likes fuse boxes, chargers, circuit boards |
| Will (Shakespeare in Sweatpants) | `willCameo(hostPal, { face: 'front' \| 'side', arms, mood })` | bald, ruff, velvet doublet, gray sweatpants, fuzzy slippers; a playwright visiting |
| Teenage Lewie (Snowbound) | `lewieCameo(hostPal, 'down0' \| 'side0' …)` | red knit hat, red coat, snow shovel; helping out |
| Carl the fly | `carlPic(colors, pose)` in `kit/carlCameo.ts` | drawn straight in the host's ramps; "the bug" on any circuit board |
| THE CHEZ | `kit/chez.ts` | the red CitiCar, two blocks, at a curb or in a lot |

A game that draws in its own style (as Quest for the Round Tuit draws its townsfolk) may redraw a
character instead, keeping the look in the table.

The rules (low risk, as for the heart):
- Use free block slots only; never renumber blocks a map, monster or save already uses. Add new
  blocks at the end of a set.
- A cameo is scenery: not solid unless it stands where a wall already was, with no touch effect and
  no sound. An NPC who talks is the game's usual talk block, with a short line that fits the
  30-column page.
- Keep it off the critical path and out of the bot's way. Rerun the checks above, the walkthrough
  and the text-fit check.
- Keep it warm. Clowns are always friendly. Use "building blocks", not brand names. No photos:
  redraw as pixel art.
- Never put anything from a secret game in another game.

## The Easter egg

A decorated Easter egg is the second recurring object: `kit/easterEgg.ts`, `drawEasterEgg(ground,
colors, 'bands' | 'zigzag' | 'dots' | 'stars', frame)`. Hide it like the tin heart, with the same
block rules: a few points, touch block the ground, no sound. It isn't collected or counted, but
record its place in `about.json` the same way: the cast page lists its games from it, and the
printed Level Maps keep that cell hidden.

```json
"easterEgg": { "map": "town.map", "at": [41, 12] },
```

## Out of sight

A tin heart or an Easter egg is found, never handed over. The player shouldn't see one until they
go looking, so its cell must be:

- **off screen at every scene start.** Every link into the scene puts the view with the hero
  mid-screen (16 x 10 blocks, top-left at the arrival minus 8 across and 5 down). The cell must
  stay out of it for the first 3 seconds standing still too (a fall, an auto-scroll).
- **in no picture of the game:** the level shots the site draws around where the hero arrives
  (home tiles, cast "Seen in", play page, desk box faces, disk label, Mac icon), `box.shots`,
  `box.poster`, and the title demo from start to end. Keep it out of level cards and FLIs made
  from the map, too.

```sh
cd web
npx vite-node ../games/kit/hiddenView.ts [<id>...]   # what shows each item (exits 1 if any shows)
npx vite-node ../games/kit/hiddenView.ts --json      # the same as JSON
npx vitest run src/tinHearts/hiddenView.test.ts      # scene starts, shots, poster, demo
```

The test skips the slow search of the disk's pictures (cards, FLIs), so run the script as well.
After moving an item, take its game out of `STILL_SHOWN` in the test.
