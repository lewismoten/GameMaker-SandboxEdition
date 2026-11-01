# Tune-Up: design

A Sandbox Software game built from the music editor's instrument presets. Its pictures are the
preset picker's drawings (`web/src/editor/editors/music/presetIcons.ts`), used as they are
while that file is redrawn; every song is scored with the presets themselves
(`web/src/audio/oplPresets.ts`), so each neighborhood teaches what its instruments sound like.

## Story

The night before the town parade, Gwinn knocks over the Clown Club's instrument trunk. The
instruments scatter across town, one family per neighborhood. Teddy fetches them back. Doc Leo
waits, friendly as ever, at the bandstand, and each family Teddy brings home adds its part to
the parade tune. The last stop is inside the bandstand's sound card, where the drum kit lives.
The clowns are the parade band: friendly from start to finish.

## Scenes

Scene 0 is the title and menu, scene 1 the ending; the levels follow. A **bandstand** scene
comes after each neighborhood: a short pass-through where Teddy hands the instruments to the
band (one clown per instrument) and hears the tune with one more part. It is not counted as a
level.

| # | Level (family) | What you do | Ideas from "Pushing the limits" | Phase |
|---|---|---|---|---|
| 1 | The Piano Shop (Keys) | Hop the black-key ledges over the white keys and gather the 7 keyboards; the shop's piano stairs play a note under each step | 2 sound slots as a keyboard (the stairs) | 1 |
| 2 | The Player Piano (Keys) | Inside the piano: notes drop down two glass tubes onto two keys; Teddy boops each key as its note lands | 1 Hammer Rail, 2 a pitch per lane, tempo on whole ticks, visible song meter | 1 |
| - | The Bandstand | Hand the keyboards to the band; the parade tune with the keys part | music layering (one part per return) | 1 |
| 3 | The Music Store's Back Room (Strings) | Climb harp strings, bounce on pizzicato springs, gather the 8 string instruments | 2 (plucked springs ring by pitch) | 1 |
| - | The Bandstand | Keys and strings together | layering | 1 |
| 4 | The Choir Loft (Voices) | A quiet climb to the loft rail; nine voices come in one by one and an "aah" chord blooms when Teddy reaches the rail | 5 Choir Loft swell, sing-along pages | 2 |
| 5 | The Basement (Bass) | Low, dark rooms; the Deep Sub-Bass rumbles platforms up and down | metronome floor (a click track) | 2 |
| 6 | The Arcade (Synth) | Neon tiles; wobbling pad platforms; pickups chirp speaker chords | 8 speaker arpeggios | 2 |
| 7 | The Roller Rink (Organ) | Teddy skates on his own at the song's tempo; Up and Down change lanes to touch the notes of the tune | 6 Score Scroll | 2 |
| 8 | The Marching Field (Brass) | MEANWHILE... Doc Leo conducts: notes glide along a staff and `D F G H J` flick the baton on each line | 4 The Conductor | 2 |
| 9 | The Woods by the River (Woodwinds) | Doors made of staffs: play the hollow note (`A` to `K`, one key a row) to open each, so the tune is played walking through it | 3 Staff Doors, 7 notes at their pitch's height | 2 |
| 10 | The Clock Tower (Mallets and bells) | Tubular bells ring the doors open on a clock you can see; music-box gears turn | timed doors, visible countdown | 2 |
| 11 | The Farm (Percussion) | The cowbell on a cow, the woodblock at the woodpile, timpani thunder; set the drum, shaker and bell on their pads to clear the stage | 10 Band on the beat | 2 |
| 12 | The Attic (Classic) | The stock instruments in an old trunk; Teddy plays Doc Leo's phrase on a toy piano with chord keys to open it | 7 the hero is the instrument, 8 chord buttons | 2 |
| 13 | Sound Check (Drum kit) | Inside the sound card: the drum channels are doors, and doors that share a channel can't both be open (snare and hi-hat, tom and cymbal) | drum-channel doors, three-layer finale (FM band, speaker chords, VOC choir) | 2 |

Phase 1 builds levels 1-3 and the two bandstands after them, then goes to the ending. Phase 2a
builds levels 6-9 and a bandstand after each (they follow level 3's bandstand for now; levels 4
and 5 slot in before them in phase 2b).

What phase 2a changed from the plan, and why:

- **No key a line or a row** (the Conductor's `D F G H J`, the staff doors' `A` to `K`): PLAYGAME
  moves a hero at most 11 px a tick (`MAXGRAV`), and it touches every cell on the way, so no
  key can send the baton or Teddy straight to a line. Up and Down glide a line at a time
  instead (the rink's lanes too), and Space pokes sideways, half a block, at the key or note.
- **The staff doors** play two pitches, not a scale: a touch sounds one slot, picked by the
  kind of change (hit points first, then a counter), and the door has to count the note.
- **The rink's skating** is Teddy's own idle sequence moving him a block a beat; block gravity
  can't do it (it keeps speeding up, to PLAYGAME's cap of 11 px a tick).

### Ideas left out, and why

- **9 Choose your instrument:** Teddy is the hero of every neighborhood, so a select screen that
  swaps him for a tuba or a flute would fight the story. It could come back as a bonus scene.
- **Player-piano attract demo** (`data1.rec` of a perfect Hammer Rail run): phase 2, once the
  levels settle, since a recording breaks whenever a level changes.

## Collecting, and what is scenery

- Every instrument you can take is a preset picture on its family's pale tile color with a
  gold sparkle frame around it, and nothing else in the game uses that frame. Instruments drawn
  as scenery (in shop windows, on the bandstand) have no frame and sit behind glass or on a
  stand, so they read as decoration.
- Instruments carried are counter 21 (F2 shows it). Each neighborhood's way out takes all of
  its family. At the bandstand, each clown takes one (counter 21 down), and then plays it.

## Felt egg and tin heart

- **Felt egg:** in the reeds by the river (level 9, The Woods by the River): the clump of reeds
  behind where Teddy starts has one hollow reed; walking into it shows the egg, and F fetches it
  (block 149, `about.json` and `web/src/eggs/eggs.ts`). The save sign is on the bandstand after
  the woods (the next scene) until level 10 exists. The 13-egg bonus now opens at 13 felt eggs
  found (`web/src/eggs/eggGate.ts`), so this 14th egg is a spare, not a new requirement.
- **Tin heart:** in the clock tower (level 10), ticking among the music-box gears, where a
  ticking heart is at home. Declared in phase 2 with `games/kit/TIN-HEARTS.md`.

## Timing (slow hands welcome)

The game clock is 18.2 ticks a second and the music is the same crystal (8 CMF ticks a game
tick), so tempos sit on whole ticks:

- **The Player Piano:** 109.2 BPM (a beat of 10 ticks, an eighth of 5). Notes drop one row an
  eighth. A key is lit for a whole eighth, **5 ticks (275 ms)**, split into "early" 1 tick (+5
  points), "on the beat" 3 ticks (+20) and "late" 1 tick (+5); all three count as a hit. A
  boop on an unlit key costs one hit back (never below none), so mashing doesn't pay. Notes in
  the two lanes are at least 3 eighths (15 ticks) apart, and switching lanes is a 2-block walk
  (about 8 ticks). The song plays its phrase 4 times while a row of notes fills across the top
  (the visible meter); then the way out opens for anyone with 12 hits, and the notes keep
  falling for anyone who needs more, so no one is shut out.
- **Later rhythm levels** use the same rules: windows of at least 3 ticks, a meter or
  countdown on screen, and never a key change faster than a person makes one.
- The bots press with a person's timing: a seeded jitter of a tick either way around the
  middle of the window, never two keys in one tick, and at least 3 ticks between key changes.

## DOS fidelity: risks and how each is checked

| Risk | Check |
|---|---|
| A touch reads the shown ring frame (the judge) | Built only from PLAYGAME rules (`GetTouchbl`, `DoBlockTouchChar`); the bot plays it on the engine port (`tools/check.ts`); a DOSBox run is still owed |
| The song leads the game clock at scene start (draw and fade time) | Judged on blocks only; the songs are pads and chords, not hard downbeats. **DOSBox:** measure the lead, then shift the ring phase if it is steady |
| One VOC at a time: a new note cuts the last | Each lane's note is short (0.3 s); clipCheck runs on the walkthrough |
| A VOC is read from disk on every play (lag on a PC with no cache) | Every note slot also has a PC speaker tone; **DOSBox** listen test |
| Sound priority (hit points beat counters) | Lane 2's key gives hit points and a hit, so it rings slot 0 while lane 1 rings slot 7; the bot's log checks both counts |
| 150 blocks a level | The build fails past 150 (BlockBook); the Player Piano uses one art ring a lane plus short key rings |
| Every animating block is redrawn (a slow 386) | Tubes stay on one screen; **DOSBox** on a slow cycle setting |

## Phase 2

Phase 2a (done): levels 6-9 with their bandstands, the felt egg and its save sign, the 13-egg
gate. Phase 2b: levels 4, 5 and 10-13 (and moving the save sign to level 10), the tin heart, the
finale, box art, manual, printables, the catalog and Scoop entries and the timeline date,
voices, the player look, the attract demo, and the DOSBox tests above.
