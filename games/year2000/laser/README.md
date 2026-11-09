# In The Year 2000!: the Teleport-A-Phone cryptex (laser kit)

A combination lock for a Glowforge, cut from 3 mm (1/8 in) plywood or MDF. Four stepped rings of digits stand on a square
base. Dial the year the game is named for, 2 0 0 0, and a hollow core slides up out of the middle, with room inside for a
rolled note. The lid of the core says BZZZT, the teleporter's sound in the game. Every washer can be reseated, so the
combination can be changed (10,000 of them).

```sh
cd web && npx vite-node ../games/year2000/laser/cryptex.ts [--kerf 0.2] [--out DIR] [--force]
```

It writes `web/public/laser/year2000/cryptex/` (ignored by version control): `sheet-1-base.svg`, `sheet-2-rings.svg`,
`sheet-3-core.svg` (each with a `.png` preview), `assembly.svg` (six assembly cards from the real outlines, the lock to
scale and how to change the combination) and `manifest.json` (`kind: "kit"`, which the desk's Feelies shelf lists). The
tests are `web/test/laserCryptex.test.ts`. The build exits 1 if the lock check, the spacing check or the engraving check
fails.

## Scrap test first

Before the real sheets, cut one ring pair and one washer from scrap of the same plywood: glue the pair, drop the washer
into the ring (it should drop in with a little play and not rock), and slide a core slice (a COREC disc) through the
washer's bore (it should turn freely). If the washer is tight, lower the kerf you give the build (`--kerf 0.15`); if it
rocks, raise it. Measure your sheet with calipers too: ply sold as 3 mm is often 2.6 to 3.2 mm, and the stack heights (36 mm
for the core, 12 mm for the pocket) add up.

## Laser rules it follows

- Red `#FF0000` cut strokes, no fill. Blue `#0000FF` engrave fills, no stroke. No score on wood. One pass: every engraving
  is on the face that lies up on the sheet, so there is no flip. Run engrave, then cut.
- Every cut lies outside all engraving (at least 1 mm), and no two elements touch (the clearance tool runs on every part).
- Three sheets, each inside the bed (495 x 279 mm usable). The biggest is 472 x 202 mm.
- No people are drawn. The shapes are a phone booth, a moon and three stars. The words are already in `games/year2000`:
  the title, Teleport-A-Phone, and the teleporter's BZZZT; the digits are the rings'.

## The mechanism, and how it differs

**Inspired by (generic families):** the cryptex (a stack of lettered rings), pin-tumbler and wafer locks, and the keyed
shaft that only slides out through aligned notches.

**This one:** the stack stands on its end and steps up like a pyramid, so each ring shows its own band of digits from
above, which flat plywood needs (a laser cannot engrave a ring's rim). The core is a stack of 12 glued slices; its lower
three have a ridge. At rest the ridge waits in the base's pocket, just under the rings. Each ring has an inner **washer**
with one notch, seated in a ten-sided socket in the ring, so there are ten ways to seat it, one per digit. Pulling the core
up pushes the ridge through ring 4 (the biggest, at the bottom), then ring 3, 2 and 1, and it passes only if every notch
is under the marker (the triangle on the base, at three o'clock). A ring turned to the wrong digit is 36 degrees off and
blocks the ridge. A ring may be about 5 degrees off its digit and still pass, since the notch is 7 mm wide and the ridge 4 mm.
Rings turn freely on the round part of the core, with no ridge in their layer until the pull.

**Changing the combination:** pull the core, lift off ring 1, lift each washer out of its ring, turn it (the notch moves
to the digit you want) and drop it back. Read it from the inner ring out along the marker.

**What it doesn't have:** detents. A click for each digit needs a flexing tongue, which 3 mm plywood does not give reliably,
so the 5 degree window stands in for them. The head and the lid are friction fits, so a drop of wax on the plugs helps.

## The lock check

`checkLock` in `cryptexDims.ts` uses the real cut shapes. It tries every one of the 10,000 combinations, with each ring set
exactly on its digit, and only 2000 frees the core. The ridge is tested against the washer's bore and notch (outline
points and a grid) and against the base's pocket. It repeats at the laser's kerf of 0.1 and 0.3 mm when the files were made
for 0.2 mm; the parts then come out 0.05 mm bigger or smaller per side, and the washer still fits its socket.
