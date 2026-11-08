# Final Curtain: the Stage Box (laser kit)

A box for a Glowforge, cut from 3 mm (1/8 in) plywood or MDF. Its front is an etched proscenium arch. A prop dagger
and two curtains, worked in the order Victor's playbill gives (raven, rose, moon), let the trap-room drawer slide out of
the back. On the drawer's floor is the line from the game's box: "The dagger was real. The killer is still in the
theater."

```sh
cd web && npx vite-node ../games/sleuth/laser/stageBox.ts [--kerf 0.2] [--out DIR]
```

It writes `web/public/laser/sleuth/stage-box/` (ignored by version control): `sheet-1-box.svg`, `sheet-2-inside.svg`,
`sheet-3-drawer.svg` (each with a `.png` preview), `assembly.svg` and `manifest.json` (`kind: "kit"`, with the sheets,
previews, parts and checks). `assembly.svg` starts with six ordered assembly cards showing the actual named cut parts (`stageBoxSteps.ts`), followed by four below-floor plan views: all three locks engaged, then the dagger, front curtain and rear curtain released, using the actual skirt and comb dimensions (`stageBoxOperation.ts`). The tests are `web/test/laserStageBox.test.ts`.

## Laser rules it follows

- Red `#FF0000` cut strokes, no fill. Blue `#0000FF` engrave fills, no stroke. No score on wood. One pass: every
  engraving is on the face that lies up on the sheet, so there is no flip. Run engrave, then cut.
- Every cut lies outside all engraving (at least 1 mm), and no two elements touch (the clearance tool runs on every part).
- Three sheets, 480 x 236, 385 x 217 and 328 x 107 mm: each inside the bed (495 x 279 mm usable).
- No people are drawn, so nobody needs clothes. All the words are already in `games/sleuth` (about.json, the playbill in
  `src/blocks/backstage.ts`): the title, "opening night", "Port Ellery 1936", "Halloween night", the Paragon, the
  stage door, "one night, five parts, five suspects", the ghost light at 2 AM, the tagline.

## The mechanism, and how it differs

**Inspired by (generic families):** sliding-panel boxes (panels slide in a set order to uncover the next move);
sequential-latch boxes (a hidden bar blocks each step until the one before it moves); and interlocking-slider locks
where a block in one slot stops a neighbor.

**This one:** three plates stand side by side in slots in the stage floor, behind the front panel, and each slides left:
**C** (the dagger's bar), then **D1** (the front curtain), then **D2** (the rear curtain). Each plate has a skirt that
hangs below the floor. The drawer carries a **comb** of three fingers, one lying in the gap in front of each skirt, so
the drawer cannot be pulled out until all three skirts have slid off their fingers. The order comes from **pegs**: a
two-block peg glued to the back of one plate stands in a slot in the plate behind it, flush with the slot's right
end, so that plate cannot move until the one in front of it has moved as far. Closing is the reverse (the peg stops a
plate closing before the one behind it).

How it differs from the families above: the lock is not a latch bar or a panel stop but a comb on the drawer interleaved
between plates that are themselves the decoration (curtains, and a dagger turned by a lever on the outside); the order is
enforced by pegs in slots, not by one panel physically blocking another's path; the lever turns a pivot pin through
the front panel (a disc in a round hole) and its inside arm drives plate C with a round post in a slot, so a 60 degree
swing of the dagger slides C by 26 mm. The test walks every reachable position of the three plates (0.25 mm steps) to
show the drawer can be released and that no plate gets ahead of the one before it.

## Order of use (the playbill's: raven, rose, moon)

I. **RAVEN**: swing the dagger on the right pillar from lower right to lower left. II. **ROSE**: slide the front
curtain's pull on the lid to the left. III. **MOON**: slide the rear curtain's pull to the left. Pull the drawer out
the back. The playbill is engraved on the left wall (raven, rose, moon, left to right).

## Parts (25 pieces, 3 sheets)

| Part | Qty | What |
| --- | --- | --- |
| P | 1 | front: arch window, apron plaque, dagger pivot hole |
| K | 1 | back: drawer opening (open to the base) |
| L, R | 1 each | walls, with slots for the floor and backdrop tabs |
| T | 1 | lid, two pull slots |
| B | 1 | base |
| FLOOR | 1 | stage floor, three skirt slots |
| W | 1 | backdrop behind the curtains |
| D1, D2 | 1 each | front and rear curtain plates (skirt, pull tab, peg slot) |
| C | 1 | dagger bar (post slot, skirt) |
| PEG | 4 | blocks: two stacked make each of the two pegs |
| COMB | 1 | the drawer's comb |
| DAGGER, ARM, PIN, POST | 1 each | the lever: dagger outside, arm inside, pin disc through the front panel, round post at the arm tip |
| DF, DK, DL, DR, DB | 1 each | drawer front (comb notch), back (pull hole), sides, floor |

## Assembly

1. Glue the box: P, K, L, R, B (finger joints), leaving the lid off. Put FLOOR into the wall slots (its tabs go in the
   slots at the floor line) and glue W into its slots. Glue nothing to a plate or into a floor slot.
2. Lever: fit PIN freely into the hole in P (do not glue PIN to P), then glue DAGGER to PIN’s front face (pommel over the pin) and ARM to its back face, so the arm
   points the same way as the dagger. Glue POST to the arm tip. Check that it turns freely; rub a candle on the edges.
3. Drawer: glue DB, DF, DK, DL, DR (finger joints). Glue COMB into the notch in DF's top edge, fingers toward the
   left as seen from the back, lying flat on the notch floor.
4. Glue a PEG block to the back of C (x 73 to 79 mm, z 10 to 15) and a second on top of it. Do the same on the back of
   D1 (z 20 to 25). The pegs enter D1's and D2's slots.
5. Stand the plates in the floor slots from above, front to back: C (its slot takes the arm's post), D1, D2, with the pull
   tabs up. Slide each fully right (home). Push the drawer in from the back until the comb touches the front panel;
   its fingers must lie in the three gaps.
6. Put the lid on, pull tabs through the lid slots. Test the order: dagger, front curtain, rear curtain, drawer.

## Tolerances to test-cut

Make a scrap test first (a floor slot with a plate skirt, a finger joint, the pin in its hole).

- Kerf: a parameter, default 0.2 mm. Parts grow 0.1 mm per side and holes shrink 0.1 mm, so drawn sizes are final sizes.
- Finger joints: cell width about 9 mm, depth = material thickness; 0.05 mm per side play (about 0.1 mm total).
  Plywood is often 2.7 to 3.0 mm: measure it, and pass the thickness to `dims(t)` if it is not 3.
- Plate slots (skirts, lid pulls): 3.4 mm for a 3 mm plate (0.2 mm per side). Floor slots allow 26.3 mm of travel.
- Peg slots: 0.2 mm per side; the peg sits flush with the right end of its slot (0.2 mm play): the order depends on it.
- Pivot pin 10.0 mm in a 10.4 mm hole. The arm touches the inside of the front panel, so it rubs; wax helps.
- The gaps in front of the plates are 3.6 mm and the comb fingers 3 mm, so a finger stops 0.5 mm short of its plate. If the
  drawer catches early, file the fingers a little.
- Not checked by a real cut yet: friction between plates and floor, and how the lever feels.

Assembly cards and lock diagrams revised with OpenAI Codex (GPT-6), directed by Lewis Moten. No physical cut or assembly is claimed.
