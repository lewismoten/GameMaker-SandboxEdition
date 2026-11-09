# Snowbound: the Plowed Street box (laser kit)

A box for a Glowforge, cut from 3 mm (1/8 in) plywood or MDF. Its lid is an etched street map of Fort Ashby with the
plowed streets cut out as slots. Slide the plow (a knob) along the streets, past the dead-end drifts, to LaVale Mall,
and the drawer slides out. On the drawer's floor is a note from the game: "You made it to LaVale Mall. Game-Maker is
$89, but only until January."

```sh
cd web && npx vite-node ../games/snowbound/laser/plowedStreet.ts [--kerf 0.2] [--out DIR] [--force]
```

It writes `web/public/laser/snowbound/plowed-street/` (ignored by version control): `sheet-1-walls.svg`,
`sheet-2-lid-base.svg`, `sheet-3-inside.svg`, `sheet-4-drawer.svg` (each with a `.png` preview), `assembly.svg` and
`manifest.json` (`kind: "kit"`, which the desk's Feelies shelf lists next to the wooden nickel). `assembly.svg` has six
ordered assembly cards drawn from the real cut outlines (`plowedSteps.ts`), the street map with the way marked, and the
plate over the lug, locked and open. The tests are `web/test/laserPlowedStreet.test.ts`. The build exits 1 if the lock
check, the spacing check or the engraving check fails.

## Laser rules it follows

- Red `#FF0000` cut strokes, no fill. Blue `#0000FF` engrave fills, no stroke. No score on wood. One pass: every
  engraving is on the face that lies up on the sheet, so there is no flip. Run engrave, then cut.
- Every cut lies outside all engraving (at least 1 mm), and no two elements touch (the clearance tool runs on every part).
- Four sheets, each inside the bed (495 x 279 mm usable). The biggest is 366 x 130 mm.
- No people are drawn, so nobody needs clothes. The shapes are a plow truck, a few diamond snowflakes and words that are
  already in `games/snowbound` (about.json: the title, the tagline, Fort Ashby, December 1992, the $89, LaVale Mall;
  the three street names: Jamie, Gale and Bowden).
- The streets are a tree (no loop), so every island of the lid stays attached to the rest.

## The mechanism, and how it differs

**Inspired by (generic families):** maze boxes (a pin follows a groove cut in a plate), sliding-tile boxes (a hidden
piece only clears a gate in one arrangement) and sequential slider locks.

**This one:** the lid's streets are only the guide. Two knobs stand on a loose **plate** under the lid, one in each of
two identical street maps (42 mm apart), so the plate slides wherever the streets allow but cannot turn. The drawer's
back panel has a small **lug** tab that rises through the **shelf** (its slot is open at the front) into the plate's
layer. The plate has a **bay** (wide enough for the lug at every place on the map) and one narrow **channel** out of the
bay's front. When the plow is at LaVale Mall, the only place on the map where the channel is over the lug, the lug can
leave and the drawer opens. Everywhere else the plate's front lip stops the lug.

How it differs from the families above: the maze is cut in the lid, where you can see it, and the thing you push is
loose; the lock is not a pin in the maze but a gate in the plate under it, so the lid never moves and nothing sticks
out the side; the gate depends only on how far right the plow is, and the map is built so that column exists only at
the mall (the rightmost column holds one cell). The test walks every place the knob can reach (0.1 mm steps) and shows
the lug can leave only from the mall's cell, and that the lug always stays in the bay and the plate inside the box.

**Limits, said plainly:** while it is locked the drawer still opens by up to about 2 cm (as far as the plate's lip lets
the lug travel). A strong pull on a knob can lift the plate 1.7 mm; the lug is 2.7 mm into the plate, so it still holds.
The test treats the plate as moving without turning; the twin knobs make that true to within the play of the stems.
Nothing here has been cut: friction between the plate and the shelf, and how the plow feels, need a test cut.

## Order of use

Slide the plow from HOME: right, right, down, down, right, right, up, up, right, down, down, right (12 streets). Dead ends
along the way are the drifts. Pull the drawer out the front.

## Parts (25 pieces, 4 sheets)

| Part | Qty | What |
| --- | --- | --- |
| P | 1 | front: drawer opening, a slot above it for the lug, title |
| K, L, R | 1 each | back and side walls; the sides have two slots for the shelf's tabs |
| T | 1 | lid: two identical street maps cut out as slots, the title, the tagline |
| B | 1 | base |
| F | 1 | shelf under the plate: tabs in the side walls, slot open at the front |
| PL | 1 | plate: bay, channel, a dot where each knob stands |
| STEM | 4 | 5 mm discs: glue two (one on the other) on each dot of the plate |
| CAP | 2 | 14 mm discs: glue on top of a stem, above the lid |
| RAIL | 2 | strips under the drawer's sides |
| DF, DK, DL, DR, DB | 1 each | drawer: front (finger hole), back (the lug tab), sides, floor (the note) |

## Assembly

1. Glue the box: P, K, L, R to B (finger joints). Leave the lid off. Put F into the wall slots (glue the tabs, not the plate).
2. Glue two STEM discs, one on the other, on each dot on PL. PL stays loose. Never glue it to F.
3. Drawer: glue DB, DF, DK, DL, DR (finger joints), DK at the back with its tab up. Glue the two RAILs on the base under the
   drawer's sides, with the drawer in place and a sheet of paper beside it.
4. Test: the drawer should slide in and out; the lug stands in the shelf slot. Set PL on F with the channel at the front and the
   lug in the bay.
5. Lower T onto the box so both stems stand in their streets (the lid is glued at the finger joints). Glue a CAP on each stem
   above the lid.
6. Test: with the plow at HOME the drawer stops after a short opening. At LaVale Mall it opens fully.

## Tolerances to test-cut

Make a scrap test first (a finger joint, a street with a stem in it, the lug in the shelf slot).

- Kerf: a parameter, default 0.2 mm. Parts grow 0.1 mm per side and holes shrink 0.1 mm, so drawn sizes are final sizes.
- Finger joints: cell width about 9 mm, depth = material thickness; 0.05 mm per side play. Plywood is often 2.7 to 3.0 mm:
  measure it. This kit is drawn for 3 mm.
- Streets: 6 mm drawn, 5.8 cut; a stem is 5 mm (5.2 cut), so 0.3 mm of play each side. The shelf's lug slot is 6 mm (5.8 cut)
  for a 5 mm tab (5.2 cut). The plate's channel is 7.4 mm wide.
- If the plow catches in a street, sand the stem; if the plate wanders, make the stems 0.1 mm bigger in the dims.
- Not checked by a real cut yet.
