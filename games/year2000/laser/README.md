# In The Year 2000!: the Teleport-A-Phone cryptex (laser kit)

A combination lock for a Glowforge, cut from 3 mm (1/8 in) plywood or MDF. Four stepped rings of digits stand on a square
base. Dial the year the game is named for, 2 0 0 0, and a hollow core slides up out of the middle, with room inside for a
rolled note. The lid of the core says BZZZT, the teleporter's sound in the game. Every washer can be reseated, so the
combination can be changed (10,000 of them).

```sh
cd web && npx vite-node ../games/year2000/laser/cryptex.ts [--kerf 0.2] [--out DIR] [--force]
```

It writes `web/public/laser/year2000/cryptex/` (ignored by version control): `sheet-1-base.svg` and `sheet-2-rings.svg`
(each with a `.png` preview), `assembly.svg` (the part ID legend, a card for each sub-assembly from the real outlines, the final
assembly, setting your own code, and the lock to scale) and `manifest.json` (`kind: "kit"`, which the desk's Feelies shelf
lists; it also carries the legend and the sheet areas). The
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
- Two sheets, each inside the bed (495 x 279 mm usable): 450 x 232 mm and 453 x 174 mm.
- No people are drawn. The shapes are a phone booth, a moon and three stars. The words are already in `games/year2000`:
  the title, Teleport-A-Phone, and the teleporter's BZZZT; the digits are the rings'.

## Hollow rings, nesting, IDs and sub-assemblies

- **Rings, not solid discs.** The plain slice of each ring is a rim (a round hole inside it), and each base plate is two parts:
  an outer ring and a collar round the ridge slot. The digit slices stay full (they carry the digits and the washer socket), and the
  floor is solid. The narrowest wall left is **8 mm** (`RIM` in `cryptexDims.ts`): about 2.7 times the 3 mm plywood, which cuts,
  handles and glues without snapping along the grain (laser-cut rings under about 5 mm break), and wide enough for an ID. Each hole
  is under the rim of the next ring up (hole radius = that ring's outer radius minus the rim), so a load passes straight down the
  rims to the base. The washers still lift out of the digit slice's socket and turn, so setting your own code works as before
  (the lock check still frees the core for 2000 and no other of the 10,000 codes).
- **Nesting.** `cryptexNest.ts` cuts the small parts out of the empty middles (first-fit circle packing, 2 mm of wood between cuts,
  re-checked by the build). The kit went from 3 sheets (233,413 mm2 of bed) to 2 (183,000 mm2); the parts use about 72,000 mm2 of
  wood instead of 82,000.
- **IDs.** The letter is the sub-assembly (A base stack, B to E rings 4 to 1, F core, G1 to G4 washer pairs, H head, I lid); the
  number counts layers from the bottom, with R (ring) and C (collar) for the two parts on a base layer (A2R, A2C). An ID is engraved
  only on a face that ends up covered: the floor under the core, the glued face of a plain slice, a digit slice under the next ring up,
  the glued face of a washer, a plate or a collar. The core slices, the plugs, ring 1's digit slice, the head and the lid have none
  (too narrow, or bare on top). `cryptexGroups.ts` is the one list the assembly sheet and the desk's 3D view both read.
- **Sub-assemblies**, built apart and glued where they cure, then put together: the base stack A (slowest, carries the rest; a dry
  core lines up its collars), each ring B to E (glued to nothing else so it turns), the core F (it must be straight to slide), the
  washer pairs G (loose, so they lift and turn) and the lid I. Only the head H is glued onto the finished stack.
- **Set your own code** is its own run of steps in the 3D view: pull the core, lift ring 1, lift its washer G1, turn it, drop it back.

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
