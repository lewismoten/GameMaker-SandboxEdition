# Stick Man Stars: tools

- `check.ts`: the bot plays all four levels and must win without losing a life. `route.ts` picks every star on the hill, shows the mistake once (a star thrown from too far pops nothing), pops each moving house and each spam bot when it comes in range, takes three stars for the Big Repo (checking each stage), and adds up the score of every level (coins, stars picked, pops) so nothing was missed.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the start of the hill).
- `preview.ts`: PNGs of the blocks, the hero's poses, the monsters, each level (in its own sky) and every picture.
- `shots.ts`: pictures of the lessons for the progress shots.
- `skyFli.ts` (src): the between-level cartoons and the won street at nightfall (`won.fli`, a finite palette animation).
- `sounds.ts` (src): the short code-synthesized `HOUSELIT.VOC` and its PC-speaker fallback. DOS has one weapon-impact slot: the cue also acknowledges bot pops and the Big Repo’s intermediate lanterns, never already-lit scenery. Houses light under the confetti on the impact frame.
- `polish.test.ts`, `polishRuntime.test.ts`: cue synthesis and lighting-frame timing, ending-palette and quiet-pocket contracts, repeated playthroughs and fresh-game reset. Run after building the disk, from `web/`, with `npx vitest run --dir ../games/stick-man-stars`. The runtime checks include an untimed 600-tick garden pause and walking straight onward.
- Shy Street ends with a safe garden at blocks 71–80. The route pauses there briefly, then walks on to Spam Row; the player is never timed or required to wait.
- `layoutCheck.ts`: no sign over another sign, a house, a door, a brick tunnel or a wall.
- `view.ts`: the screen the engine really shows (16 by 10 blocks, his feet 120 px down: four rows of sky over his head), standing and mid-jump, at the start, the moon and the gate. `shots.ts` crops from row 2, which a player never sees. Keep sky art in rows 4 to 7 of a level, and the brick ceiling at row 0 (Space works again in the air, so without it he climbs out over the walls).
