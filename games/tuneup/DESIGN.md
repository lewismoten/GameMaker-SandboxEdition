# Tune-Up: design

A Sandbox Software game. Version 2 rebuilds the first version (Teddy fetching instruments
across thirteen neighborhoods) as a tune-up of THE CHEZ by ear. It is built in phases; this
file says what is built.

## Story

It's the morning of the Clown Club parade, and THE CHEZ is meant to lead it. Overnight, Gwinn
buried Doc Leo's toolbox in the yard and tipped the Clown Club's instrument trunk into the open
hood. With no wrenches, Doc Leo does his shrinking trick and tunes the car up by ear. Sir
Reginald III, his rubber chicken, does the fiddly bits (he fits where Doc Leo can't), and the
two of them talk every repair over. Teddy rides along in the front passenger seat.

Levels 1-4 are Sir Reginald Cluckington III's dream (he was talking in his sleep): a gas
engine THE CHEZ never had. After Oil's Well he swims the oil pipe (a scene nobody steers), and
Doc Leo's card wakes him: THE CHEZ is electric (no exhaust, no spark plugs, no engine oil; the
only oil is in the rear differential), so the dream can be dismissed. The chicken blames
battery fumes; Doc Leo says the batteries are lithium ion now (a deliberate time slip, logged in
the timeline), and the chicken tells the player such car batteries are years off. What's really
wrong: THE CHEZ has no radio, so the real tune-up (levels 5 on) builds toward an AM radio with an
8-track. Every car fact from level 5 on is from the car's blog, thechez.car.blog. After Pump Up
the Volume a balloon pops, he lays an egg, and from then on every card names her Lady Regina
III, formally corrected (*CORRECTION: Lady Regina Cluckington III).

## Scenes

Scene 0 is the title and menu, scene 1 the ending; the levels' scenes follow. Before each level
its intro list plays: (before level 1, the opening cartoon,) the Hat Sting with the level's tool
and the cutaway CHEZ, then Doc Leo and the chicken's card. After a level (or a verse) their card
asks whether it's fixed.

| #   | Level                | Scenes              | Look (base set, theme)                   | What you do                                                                                                                                                                                       |
| --- | -------------------- | ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Jump Start           | jump                | GARAGE, dawn                             | The red clamp on the shelf and the black clamp under the bench open their terminals; Space held under the crank fills its gauge; "Charge!" and THE CHEZ's headlight opens                         |
| 2   | Spark Plucks         | spark               | ENGINE, electric                         | Climb each plug wire between sparks (firing order 1-3-4-2) and pluck its plug: C, E, G, E                                                                                                         |
| 3   | The Timing Beat      | beat1, beat2, beat3 | ENGINE, brass                            | Four pipes drop notes onto four keys; boop each as it lands. Straight, syncopated (a Y-pipe, a slow bent pipe), double time (a crossover)                                                         |
| 4   | Oil's Well           | oil, swim           | ENGINE, amber                            | Z X C V B squirt the oil can along the staff's five lines; oiled Squeaks float home as notes; two later waves, counted down by a row of lamps. Then the swim (nobody steers)                      |
| 5   | The Fan Band         | fan1, fan2          | ENGINE, cool/hot                         | The motor's warm air to the defroster: ride the pulsing columns up and reach each kazoo fan (Space); the hot verse's columns are out of step; a thermometer on the wall climbs as the motor warms |
| 6   | Brake Dance          | brake               | GARAGE, disco (Teddy)                    | Each stiff brake lamp wants a trick (Z turn, X roll over, C play dead, V dance); the freed lamp floats to Teddy                                                                                   |
| 7   | Hubcaps and Balls    | cups1-3             | CURB, spot                               | Cups and balls with three hubcaps and the antenna's ball: watch the shuffle, reach under the right cap; three rounds, the last quicker                                                            |
| 8   | Pump Up the Volume   | pump                | CURB, noon                               | Balloon animals breathe in and out on their own; hop onto each as it puffs up, up to the squashed tire, and pump it to 32 psi; a slide whistle down its far side                                  |
| 9   | Muffled              | hush                | GARAGE, night (Teddy)                    | Gwinn asleep with the 8-track tapes: hop the squeaky toys (each costs energy, the Zzz meter), take the shelf over her bed, fetch the tapes. The felt egg                                          |
| 10  | The Rain Delay       | rain                | CAB, rain                                | Cross the windshield between wiper sweeps (every 2 beats, every 3, then 5/4); each raindrop rings a tongue drum in D. The save sign                                                               |
| 11  | The Horn Section     | horn1-3             | CURB, gold                               | The Clown Club's board lights a call (3, 4, then 5 notes); on each stage reach up under the right horn pad to honk it open and climb through; a wrong one blows a raspberry                       |
| 12  | Key Change           | gear1-4             | ENGINE, gear1-4 (blue, green, gold, red) | Four gear rooms, each a whole step higher: hop the teeth as they come round on the beat; a speedometer climbs; the door keeps its own clock                                                       |
| 13  | The Instrument Panel | dash1, dash2        | CAB, dash (Teddy)                        | Hop into each preset as the dial's needle crosses its station (the last brings the choir's "aah"); three gauge chords, C F G, under the choir swell; the AM/FM radio and its 8-track go in        |

The ending is a stub for now: the cutaway CHEZ with every real part tuned, the parade next.

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
- **Timers belong to block numbers, not cells.** PLAYGAME runs every block's timer for all
  blocks of its number at once, from the scene's start, so a touched block can't start its own
  countdown. Balloons are rings that breathe on their own (each balloon starts at its own
  point); a squeaky toy squeaks once and stays squashed. PLAYGAME also changes only blocks
  wholly on screen, so nothing touchable sits on a level's top row.
- **Teddy** (`src/heroes.ts`) is the trilogy's corgi drawing, one block tall, with four tricks
  that each fire a sparkle on a power ladder (`src/realMonsters.ts`). **Nobody** is a clear
  block with no keys, for the swim.
- **Rings on the song's beat** (levels 10-13): a block's ring starts with the scene, as its song
  does, so a ring whose frames add up to whole beats keeps time with the music: the wiper blades,
  the horn board, the gear teeth, the door's clock and the radio dial's needle are all rings. A
  ring that should run late (the upper tooth, a beat behind) is its own ring of blocks, not a
  later frame of the same one.
- **Touches**: PLAYGAME touches the cells at a move's destination before solids stop it, so a
  reach up into a solid pad touches it, and standing on a block touches it every tick (gravity
  tries to move the hero down). So nothing that costs points is ever stood on; the horn pads are
  overhead, and a wrong one blows its raspberry only when reached.
- **Counters** for doors in levels 10-13 reuse the fans' and the tapes' counters, which their
  doors spent to nothing; counters a gate leaves something in (the Timing Beat's) are never reused
  for a door.
- **The choir swell** (`src/sound/realSongs2.ts` `choirSong`): rhythm mode off for all nine FM
  voices, each pair a voice and its vibrato twin (`kit/songFx` `detuned`), coming in a bar apart,
  louder by program changes (`sweep`, `swell`); the ninth sings the tune.
- **Views**: a level's view is centered on where Doc Leo starts and never scrolls up or down,
  so every level starts him at (8, 5) in mid air and he drops to the floor.

## Still to build (the design's later phases)

Level 14 (the parade route on the kit's pseudo-3D road), the ending cartoons, the box cover and
text, version 2.0, and a DOSBox listen and timing pass.
