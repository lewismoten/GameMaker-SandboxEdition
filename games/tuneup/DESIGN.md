# Tune-Up: design

A Sandbox Software game. Version 2 rebuilds the first version (Teddy fetching instruments
across thirteen neighborhoods) as a tune-up of THE CHEZ by ear. It is built in phases; this
file says what is built.

## Story

It's the morning of the Clown Club parade, and THE CHEZ is meant to lead it. Overnight, Gwinn
buried Doc Leo's toolbox in the yard and tipped the Clown Club's instrument trunk into the open
hood. With no wrenches, Doc Leo does his shrinking trick and tunes the car up by ear. Sir
Reginald III, his rubber chicken, does the fiddly bits (he fits where Doc Leo can't), and the
two of them talk every repair over. Partway through The Timing Beat he lays an egg, and from
then on every card names her Lady Regina III, formally corrected. Teddy rides along in the
front passenger seat.

## Scenes

Scene 0 is the title and menu, scene 1 the ending; the levels' scenes follow. Before each level
its intro list plays: (before level 1, the opening cartoon,) the Hat Sting with the level's tool
and the cutaway CHEZ, then Doc Leo and the chicken's card. After a level (or a verse) their card
asks whether it's fixed.

| #   | Level            | Scenes                  | Look (base set, theme) | What you do                                                                                                                  |
| --- | ---------------- | ----------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | Jump Start       | jump                    | GARAGE, dawn           | The red clamp on the shelf and the black clamp under the bench open their terminals; Space held under the crank fills its gauge; "Charge!" and THE CHEZ's headlight opens |
| 2   | Spark Plucks     | spark                   | ENGINE, electric       | Climb each plug wire between sparks (firing order 1-3-4-2) and pluck its plug: C, E, G, E                                    |
| 3   | The Timing Beat  | beat1, beat2, beat3     | ENGINE, brass          | Four pipes drop notes onto four keys; boop each as it lands. Straight, syncopated (a Y-pipe, a slow bent pipe), double time (a crossover) |
| 4   | Oil's Well       | oil                     | ENGINE, amber          | Z X C V B squirt the oil can along the staff's five lines; oiled Squeaks float home as notes; two later waves                |

The ending is a stub for now: the cutaway CHEZ with the engine bay tuned.

## How it's made

- **Palettes** (`src/art/palette.ts`): a fixed half (the Teddy finale's ramps, Doc Leo's, the
  chicken's) and seven scenery roles each scene colors from a theme, as maximus does. One block
  drawn in roles is the garage at dawn or the engine bay lit blue-white, brass or amber.
- **Block sets** (`src/blocks/sets.ts`): GARAGE, ENGINE, CURB, CAB and PARADE base sets. A
  level's .BBL starts with its base set in the same slots and adds its own blocks.
- **Doc Leo** (`src/sprites/cast.ts`) is the drawing CERTIFIED RAT TICKLER made of him, his
  coat recolored as a blue shop coat. Three character files: LEO (walk, hop, climb, a reach that
  repeats while Space is held), PIANO (one reach a press) and OIL (Z to B each fire a drop into
  their own row, no hopping).
- **The Timing Beat** (`src/levels/beat.ts`): a pipe cell `d` cells above its key shows a ring
  of blocks started at member `d - r`, so lanes whose notes are one pattern turned share a ring.
  Keys judge the timing by the frame on show. Each lane's hit is its own kind of change, so its
  own pitch; each verse counts on its own counter.
- **Oil's Well** (`src/levels/oil.ts`): a drop (power 60) turns a Squeak (50) into a note (60)
  that heads for Doc Leo; its monster block counts it on touch. Waves are blocks that give
  birth once on a timetable.
- **Views**: a level's view is centered on where Doc Leo starts and never scrolls up or down,
  so every level starts him at (8, 5) in mid air and he drops to the floor.

## Still to build (the design's later phases)

Levels 5 to 14 (the Fan Band, Teddy's levels, the shell game, balloons, Muffled, the rain,
the horn section, Key Change, the instrument panel and the parade route), the ending cartoons,
the box cover, and a DOSBox listen and timing pass.
