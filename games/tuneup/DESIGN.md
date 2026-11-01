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

| #   | Level (family)                        | What you do                                                                                                                              | Ideas from "Pushing the limits"                                             | Phase |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----- |
| 1   | The Piano Shop (Keys)                 | Hop the black-key ledges over the white keys and gather the 7 keyboards; the shop's piano stairs play a note under each step             | 2 sound slots as a keyboard (the stairs)                                    | 1     |
| 2   | The Player Piano (Keys)               | Inside the piano: notes drop down two glass tubes onto two keys; Teddy boops each key as its note lands                                  | 1 Hammer Rail, 2 a pitch per lane, tempo on whole ticks, visible song meter | 1     |
| -   | The Bandstand                         | Hand the keyboards to the band; the parade tune with the keys part                                                                       | music layering (one part per return)                                        | 1     |
| 3   | The Music Store's Back Room (Strings) | Climb harp strings, bounce on pizzicato springs, gather the 8 string instruments                                                         | 2 (plucked springs ring by pitch)                                           | 1     |
| -   | The Bandstand                         | Keys and strings together                                                                                                                | layering                                                                    | 1     |
| 4   | The Choir Loft (Voices)               | A quiet climb to the loft rail; nine voices come in one by one and an "aah" chord blooms when Teddy reaches the rail                     | 5 Choir Loft swell, sing-along pages                                        | 2     |
| 5   | The Basement (Bass)                   | Low, dark rooms; the Deep Sub-Bass rumbles platforms up and down                                                                         | metronome floor (a click track)                                             | 2     |
| 6   | The Arcade (Synth)                    | Neon tiles; wobbling pad platforms; pickups chirp speaker chords                                                                         | 8 speaker arpeggios                                                         | 2     |
| 7   | The Roller Rink (Organ)               | Teddy skates on his own at the song's tempo; Up and Down change lanes to touch the notes of the tune                                     | 6 Score Scroll                                                              | 2     |
| 8   | The Marching Field (Brass)            | MEANWHILE... Doc Leo conducts: notes glide along a staff and `D F G H J` flick the baton on each line                                    | 4 The Conductor                                                             | 2     |
| 9   | The Woods by the River (Woodwinds)    | Doors made of staffs: play the hollow note (`A` to `K`, one key a row) to open each, so the tune is played walking through it            | 3 Staff Doors, 7 notes at their pitch's height                              | 2     |
| 10  | The Clock Tower (Mallets and bells)   | Tubular bells ring the doors open on a clock you can see; music-box gears turn                                                           | timed doors, visible countdown                                              | 2     |
| 11  | The Farm (Percussion)                 | The cowbell on a cow, the woodblock at the woodpile, timpani thunder; set the drum, shaker and bell on their pads to clear the stage     | 10 Band on the beat                                                         | 2     |
| 12  | The Attic (Classic)                   | The stock instruments in an old trunk; Teddy plays Doc Leo's phrase on a toy piano with chord keys to open it                            | 7 the hero is the instrument, 8 chord buttons                               | 2     |
| 13  | Sound Check (Drum kit)                | Inside the sound card: the drum channels are doors, and doors that share a channel can't both be open (snare and hi-hat, tom and cymbal) | drum-channel doors, three-layer finale (FM band, speaker chords, VOC choir) | 2     |

Phase 1 built levels 1-3 and the two bandstands after them. Phase 2a built levels 6-9 and a
bandstand after each, and phase 2b levels 4, 5 and 10-13, the last bandstand (the whole band)
and the ending.

What phase 2a changed from the plan, and why:

- **No key a line or a row** (the Conductor's `D F G H J`, the staff doors' `A` to `K`): PLAYGAME
  moves a hero at most 11 px a tick (`MAXGRAV`), and it touches every cell on the way, so no
  key can send the baton or Teddy straight to a line. Up and Down glide a line at a time
  instead (the rink's lanes too), and Space pokes sideways, half a block, at the key or note.
- **The staff doors** play two pitches, not a scale: a touch sounds one slot, picked by the
  kind of change (hit points first, then a counter), and the door has to count the note.
- **The rink's skating** is Teddy's own idle sequence moving him a block a beat; block gravity
  can't do it (it keeps speeding up, to PLAYGAME's cap of 11 px a tick).

What phase 2b changed from the plan, and why:

- **Levels 4 and 5** went in before the arcade, so the game runs 1 to 13 in order, a bandstand
  after each. The choir's swell is the song itself: the choir comes in a voice a bar, one FM
  channel each, until all nine sing in the last bar (a song can't change mid-scene, so the
  loft rail's bloom is a .VOC chord on slot 5). The Deep Sub-Bass doesn't move platforms (a
  block can't move); its speaker columns push Teddy up in pulses on the beat instead (a ring of
  a block that pulls up and one that doesn't), and the metronome floor is a lamp that steps a
  tile a beat.
- **The clock tower's doors** are curtains of tubular bells on a 72-tick ring, with a clock face
  over each on the same ring, so the hand reaching the gold wedge is the countdown.
- **Band on the beat** (the farm): the drum, snare and shaker can only be taken in their beat's
  6-tick window (the hook's ring lights the gold frame), booped from underneath. Setting
  instruments on pads to clear a stage became this, because a touch can't change another cell.
- **Chord buttons** (the attic): only three kinds of touch can count on one counter with
  different sound slots (hit points and a counter, a counter up, a counter down), so the
  phrase is three chords: C and F are keys that count, and G is the trunk's latch, which
  takes them (it is refused until both have played). The F slot is also the "instrument found"
  slot, so finds ring the F chord.
- **Drum-channel doors** (Sound Check): each pair's doors are rings of the song's bar, one open
  while the other is shut; the song plays the snare in the bars its door is open and the hats in
  the others (they share an FM channel in rhythm mode), the toms and cymbal the same. The
  kick's room is the open one at the start.
- **The three-layer finale** works in PLAYGAME: `DoSound` plays a slot's .VOC only when it has one
  and a card is there, and otherwise its PC speaker tune, even with a Sound Blaster. So Sound
  Check's chord chips are slots with no .VOC (speaker chords), the drums found ring a choir
  .VOC, and the song is the FM band in rhythm mode, all at once.
- **The bandstand tune** has nine FM voices for twelve families: the bass takes over the piano's
  left hand, the strings' chord thins, and from the ninth family an older part rests for each
  newcomer; with the drum kit home the chip goes to rhythm mode (six voices and the drums). The
  riser holds two shelves of seven; the drum kit takes five stands, one a drum.
- **The save sign stays on the bandstand after the woods** (band8). `saveSignCheck.ts` wants the
  egg's map to link straight to the sign's map, and the woods link to their bandstand, not to the
  clock tower.
- **A one-screen level starts Teddy at (8, 5)** and a wide one on row 5: PLAYGAME puts the view
  with the hero mid-screen and these levels never scroll up or down, so any other row leaves the
  view off the level (the arcade started on row 8 and is fixed; phase 2c starts the rink and the
  field on row 5, their second lane and line, in place of row 6).

### Ideas left out, and why

- **7 The hero is the instrument** (the attic): Teddy plays the toy piano's chords instead; a
  character file that plays a note per step would need a sound per frame, and PLAYGAME's
  character sounds appear to be one per sequence (its `sound`), not one per frame.

- **9 Choose your instrument:** Teddy is the hero of every neighborhood, so a select screen that
  swaps him for a tuba or a flute would fight the story. It could come back as a bonus scene.
- **Player-piano attract demo** (`data1.rec` of a perfect Hammer Rail run): phase 2, once the
  levels settle, since a recording breaks whenever a level changes.

## Collecting, and what is scenery

- Every instrument you can take is a preset picture on its family's pale tile color with a
  gold sparkle frame around it, and nothing else in the game uses that frame. Instruments drawn
  as scenery (in shop windows, on the bandstand) have no frame and sit behind glass or on a
  stand, so they read as decoration.
- An instrument found plays a short phrase on its family's own preset, most of them a turn of
  the parade tune (`sounds.ts` `FOUND`, slot 7, a counter up). So that slot is the finds' own,
  the floating notes' fifth step rings slot 3 (money down) instead; the player starts with a tip
  for each of those seven notes, so none is refused. Where slot 7 is also a rhythm or door note
  (the player piano's low lane, the field's low lines, the attic's F key, Sound Check's drums
  found) it stays as it was; the woods' low hollow note plays the flute phrase.
- Instruments carried are counter 21 (F2 shows it). Each neighborhood's way out takes all of
  its family. At the bandstand, each clown takes one (counter 21 down), and then plays it.

## Felt egg and tin heart

- **Felt egg:** in the reeds by the river (level 9, The Woods by the River): the clump of reeds
  behind where Teddy starts has one hollow reed; walking into it shows the egg, and F fetches it
  (block 149, `about.json` and `web/src/eggs/eggs.ts`). The save sign is on the bandstand after
  the woods (the next scene: see phase 2b above). The 13-egg bonus now opens at 13 felt eggs
  found (`web/src/eggs/eggGate.ts`), so this 14th egg is a spare, not a new requirement.
- **Tin heart:** in the clock tower (level 10), on the top gear ledge at the far end (two hops
  up from the floor), where a ticking heart is at home. Its touch rings slot 5, which in the
  tower is only the PC speaker's `TICK_TOCK`.

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

| Risk                                                              | Check                                                                                                                                                 |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| A touch reads the shown ring frame (the judge)                    | Built only from PLAYGAME rules (`GetTouchbl`, `DoBlockTouchChar`); the bot plays it on the engine port (`tools/check.ts`); a DOSBox run is still owed |
| The song leads the game clock at scene start (draw and fade time) | Judged on blocks only; the songs are pads and chords, not hard downbeats. **DOSBox:** measure the lead, then shift the ring phase if it is steady     |
| One VOC at a time: a new note cuts the last                       | Each lane's note is short (0.3 s); clipCheck runs on the walkthrough                                                                                  |
| A VOC is read from disk on every play (lag on a PC with no cache) | Every note slot also has a PC speaker tone; **DOSBox** listen test                                                                                    |
| Sound priority (hit points beat counters)                         | Lane 2's key gives hit points and a hit, so it rings slot 0 while lane 1 rings slot 7; the bot's log checks both counts                               |
| 150 blocks a level                                                | The build fails past 150 (BlockBook); the Player Piano uses one art ring a lane plus short key rings                                                  |
| Every animating block is redrawn (a slow 386)                     | Tubes stay on one screen; **DOSBox** on a slow cycle setting                                                                                          |

## Phase 2

Phase 2a (done): levels 6-9 with their bandstands, the felt egg and its save sign, the 13-egg
gate. Phase 2b (done): levels 4, 5 and 10-13 with their bandstands, the tin heart, the finale,
the ending. Phase 2c: box art, manual, printables, the catalog and Scoop entries and the
timeline date, voices, the player look, the attract demo, the rink's and field's start rows,
and the DOSBox tests above.
