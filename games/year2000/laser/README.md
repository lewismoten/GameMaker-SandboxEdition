# In The Year 2000!: the Teleport-A-Phone cryptex (laser kit)

A combination lock cut from **Proofgrade 1/8 in (3.18 mm) plywood or MDF**. Four stepped
rings stand on a square base. Dial **2 0 0 0**, inner ring first, and the hollow core slides
out. Its downward-facing 16 mm bore holds a rolled note against the glued base floor. Lift and reseat the washers to change the code.

```sh
cd web
npx vite-node ../games/year2000/laser/cryptex.ts --out /tmp/cryptex-out
npx vite-node ../games/year2000/laser/cryptex.ts --sheet 12x20 --out /tmp/cryptex-out-12x20
# Optional: --kerf 0.15, --sheet 6x12 or 8x12, --force
```

The default is `--sheet 12x12`, kerf 0.2 mm. Without `--out`, output goes to the ignored
`web/public/laser/year2000/cryptex/` directory. Each numbered `sheet-N.svg` has a PNG
preview. `assembly.svg` has the part legend, assembly cards, final assembly and code
setting; `manifest.json` includes the chosen stock, margins, fitting table, part quantities,
assembly face directions, hidden engraving regions, lock results and material areas.
The source cache includes sheet size and kerf. The build exits 1 for failed lock, cut
spacing, engraving containment or hidden-region checks.

## Sheet sizes and material

Dimensions below are **purchased stock**, long edge horizontal. Leave **6.5 mm on each
short end and 12.9 mm on each long edge**. This keeps a 12 in edge within the 279 mm
engraving height and a 20 in edge within the 495 mm bed width. The SVG is the full stock
size; its margins are empty. Align it to the matching stock without resizing. The usable
rectangle for 12x12 is 291.8 x 279 mm; for 12x20 it is 495 x 279 mm.

At the default 0.2 mm kerf:

| Stock (inches) | Sheets | Purchased material (in²) | Purchased material (mm²) |
| --- | --- | --- | --- |
| 6x12           | 4      | 288                      | 185,806                  |
| 8x12           | 3      | 288                      | 185,806                  |
| **12x12**      | **2**  | **288**                  | **185,806**              |
| **12x20**      | **1**  | **240**                  | **154,838**              |

Occupied rectangles are each sheet's used corner (parts plus margins) over the purchased
area; a smaller share means a bigger reusable offcut. Sheet 1 is filled first.

- **Rings, not solid discs.** The plain slice of each ring is a rim (a round hole inside it), and each base plate is two parts:
  an outer ring and a collar round the ridge slot. The digit slices stay full (they carry the digits and the washer socket), and the
  floor is solid. The minimum continuous laminated wall is **4 mm** (`RIM` in `cryptexDims.ts`),
  supported by the cured stack; see the fabrication allowance below. Each hole
  is under the rim of the next ring up (hole radius = that ring's outer radius minus the rim), so a load passes straight down the
  rims to the base. The washers still lift out of the digit slice's socket and turn, so setting your own code works as before
  (the lock check still frees the core for 2000 and no other of the 10,000 codes).
- **Nesting.** `kit/laserNest.ts` (tools package) cuts the small parts out of the empty middles (first-fit circle packing, 2 mm of wood between cuts,
  re-checked by the build). The kit went from 3 sheets (233,413 mm2 of bed) to 2 (183,000 mm2); the parts use about 72,000 mm2 of
  wood instead of 82,000.
- **IDs.** The letter is the sub-assembly (A base stack, B to E rings 4 to 1, F core, G1 to G4 washer pairs, H head, I posts, J retaining bridge); the
  number counts layers from the bottom, with R (ring) and C (collar) for the two parts on a base layer (A2R, A2C). An ID is engraved
  only on a face that ends up covered (never visible with the cryptex closed). Prefer a small, shallow ID on a covered glue
  face, away from cut edges; otherwise use a clear spot on the hidden art face without overlapping artwork. Base layers
  A2R–A4R and A2C–A4C use their upper glue faces, as do lower washers G1B–G4B. Other existing IDs use the floor under the
  core or clear spaces on covered art faces. E1 has a small ID beside its artwork on the face that points down in assembly.
  E2: the remaining digit slice, no ID. It is ring 1's only digit slice left after B2–D2 are placed.
  The core slices, posts, head and bridge have none (too narrow, or bare on top). `cryptexGroups.ts` is the one list the assembly sheet and the desk's 3D view both read.
- **Sub-assemblies**, built apart and glued where they cure, then put together: the base stack A (slowest, carries the rest; a dry
  core lines up its collars), each ring B to E (glued to nothing else so it turns), the core F (it must be straight to slide), the
  washer pairs G (loose, so they lift and turn) and the posts I and retaining bridge J. The posts glue to the base; the bridge slides onto their mushroom heads around the finished ring stack; the head H glues to the core above the bridge.
- **Set your own code** is its own run of steps in the 3D view: pull the core, lift ring 1, lift its washer G1, turn it, drop it back.

The library's 12x20 size uses 16.7% less purchased material than two 12x12 sheets. Retained
wood is about **62,635 mm²**, down from **72,275 mm²** (13.3%). The old 183,222 mm² figure
was cropped layout area, not purchased stock; the manifest now distinguishes purchased
`area.sheets`, occupied bounding rectangles `area.occupied`, and retained compensated
part area `area.wood`. Reclaimed hole waste is not counted twice. The machine-readable
`fitting` array includes a label such as `fits 2 sheets of 12x12`; `fit` is the selected label.

`cryptexNest.ts` nests smaller rings and parts recursively inside larger holes, including
core slices inside collar/washer bores. `cryptexPack.ts` places round root pieces by their bounding circles (the base, bridge and posts as
rectangles) at the first free spot on a 1 mm grid, in three size orders and two scan directions,
keeping the fewest sheets and then the least occupied area; every round part looks the same
turned, so quarter turns change nothing. It uses the actual kerf-compensated outline bounds, including mitered
corners and the cut hairline. Nesting keeps at least **2 mm between compensated cut
paths**; the build independently measures every pair of cut paths on each finished sheet.
This is heuristic packing, not a proof of a global nesting optimum.

## Larger hollow, continuous glue lands

The new minimum `RIM` is **4 mm**, down from 8 mm. This applies to the core wall, the
collar at the ridge-slot corners, the narrowest plain ring, and the bearing overlaps
between stepped rings. Most plain-ring walls and the outer base rims are actually
11 mm wide; their holes stop 4 mm inside the next ring's outer edge to carry the load.
The digit slices retain their full faces around the unchanged washer sockets.

The choice is a fabrication allowance: 4 mm is 1.26 times the 3.18 mm stock thickness,
with continuous closed loops rather than unsupported tongues. Each core wall joint has
about 251 mm² of uninterrupted annular glue area. The core's 13-layer tube, paired ring
slices, and four-layer base support the thin individual slices once cured. Alternate
plywood grain between layers, support the loose pieces on their waste carrier, and glue
on a flat surface under a weight. MDF needs that support too. Hidden decoration stays off
these glue lands; small assembly IDs may be shallowly engraved on them. The washer's
existing 3.1 mm notch ligament is
unchanged and supported by its two-layer laminate.

This is a design rationale, **not a measured breaking load or a guarantee for every sheet**.
A scrap-cut and glue trial in the actual plywood/MDF must confirm handling strength;
reject chipped, delaminated or char-weakened pieces. Going thinner would sacrifice the
4 mm core wall and bearing overlap. Use shallow engraving, not deep relief.

| Cavity measurement                | Before              | Now                      |
| --------------------------------- | ------------------- | ------------------------ |
| Core bore diameter                | 15 mm               | 16 mm                    |
| Core wall                         | 4.5 mm              | 4 mm                     |
| Usable note depth, below solid ceiling | 30 mm at 3 mm stock | 38.16 mm at 3.18 mm stock |
| Usable cylindrical volume         | 5.30 cm³            | 7.67 cm³        |
| Base hollow inner radius (collar) | 26 mm               | 19.08 mm                 |
| Base hollow outer radius          | 34 mm               | 38 mm                    |
| Base hollow annular area          | 1,508 mm²           | 3,393 mm² (+125.0%)      |
| Base hollow volume                | 18.10 cm³           | 43.16 cm³ (+138.5%)      |

The central ridge-slot pocket and all lock contact dimensions are unchanged. The collar
radius includes the diagonal distance to the slot corners, so even there the wall is
4 mm. Core and ring heights both scale with stock thickness: the core spans 13 layers
(41.34 mm), passing through the retaining bridge above four pocket layers and eight ring layers. Nothing changes the DOS game.

## Hidden pictures and one-pass engraving

Red `#FF0000` is cut stroke only. Blue `#0000FF` is engrave fill only; there is no score
on wood. All art is on the face lying **up on the sheet**, engraved before cutting.
There is no second laser pass or registration flip. Some parts are turned over **during
assembly** so their engraved faces point down. Their blank mating regions take the glue. Small
covered IDs are allowed on glue faces; hidden artwork stays off them.

| Part       | Engraved face in assembly | Hidden design and glue exclusion                                                                                                                                                                                       |
| ---------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1 floor   | Up                        | Large phone-booth teleporter, 32 radiating beams, pulse rings, stars and TELEPORT-A-PHONE in the hollow. Arrival booth and A1 beneath the removable core. Both regions avoid the collar and outer rim glue footprints. |
| A5R, A5C   | Up                        | Circuit bands with nodes and stars on the last base layer, beneath loose rings/washers. The wide outer rim adds chip outlines, branches and parallel traces; the collar clears the ridge slot.                         |
| B1, C1, D1 | Down                      | Full bands of teleporter booths and beams (B1), cratered moons (C1), and a suburb skyline with houses and stars (D1). IDs occupy a reserved gap; only the blank reverse glues to the digit slice.                      |
| E1         | Down                      | A band of 31 pixel twinkles and comet trails in the narrow ring; E1 sits in a clear gap beside the artwork on this hidden face.                                                                                        |
| B2, C2, D2 | Up                        | Larger teleporter, lunar and suburb panoramas under the next loose ring, inside the unchanged digit band.                                                                                                              |
| G1–G4      | Up                        | Small circuit and star bands, IDs and clear notches on the upper washers. Glue ID-marked G1B–G4B underneath, with decagon flats aligned; their IDs face up into the glue joint.                                              |
| CORE0      | Down                        | YOU FOUND IT. BZZZT! on the inside ceiling, with BZZZT! curved along the bottom. The entire wall glue annulus stays blank.                                                                                               |
| HEAD       | Down                      | Cratered moon, pixel stars, a segmented medallion rim and 2000 outside the core's glue annulus.                                                                                                                        |
| LID bridge | Down                      | Cratered moon and stars with a segmented medallion rim around the core passage, clear of its ridge notch and the two post keyholes; the bridge top is blank.                                                                                                        |

The A1 center picture is uncovered when the core is out; the other inner pictures appear
as the unlocked kit is taken apart. CORE0 provides the core-slice picture. CORER and
COREC wall slices stay blank. Intermediate base layers A2R–A4R and A2C–A4C carry 3.5 mm
IDs on their upper glue faces; lower washers G1B–G4B carry 2.5 mm IDs on their upper glue
faces. There is no engraving on a laser-inaccessible vertical
bore wall. Shapes are checked in their entirety against explicit unglued regions, including
edges and filled interiors, not just vertices. Cut-to-engraving gaps remain at least 1 mm,
or 1.5 mm at holes, except E1's 2.5 mm ID on its 4 mm rim: its 0.5 mm pixels keep at
least 0.5 mm from both cuts, with the neighboring artwork clear. IDs are omitted where hidden unglued space is too narrow; the assembly
legend lists these parts in parentheses. Keep each unmarked piece with its labeled sheet
position until assembly.

`cryptexArt.ts` draws these hidden scenes separately from the cut geometry in
`cryptexParts.ts`. Art uses filled square pixels at least **0.5 mm** wide, merged into
rectangles with the shared laser bitmap helper. IDs use the existing micro font at
0.5–0.7 mm per pixel (2.5–3.5 mm capitals), with no SVG text or fonts on cut sheets.
Whole pixels stay inside the safe region; no clipped
slivers, strokes or fine outlined details are generated. The narrow starfield uses rotated
rectangles to keep its pixels full width. The core message is one text block with 0.5 mm
line gaps, like its letter gaps. There are no people or vehicles in the hidden pictures.

## Scrap trial and assembly

First cut one plain/digit ring pair, its two washer layers, and a core slice from the same
stock. Glue the ring with its plain-slice art down, and the washer with its art up, keeping
the bore, notch and socket clean. The washer should drop in with a little play; a core
slice should turn freely. Lower declared kerf if the washer is tight; raise it if it rocks.
Measure stock thickness with calipers: all layers must use the same thickness. The 3.18 mm
assembly dimensions scale together if the stock measures closer to 3 mm.

Build the base from A1 and four ring/collar layers, slots aligned to the reading marker.
Glue the mating faces, including the small covered IDs; keep the floor pictures clear.
Build the four two-slice
rings, washer pairs and core separately; dry-fit the captured frame. CORE0 art faces into the bore. With the
sub-assemblies dry, stack rings and loose washers on the base, largest first, notches
at the marker. Keep F out until the bridge is fitted. Glue the two LIDP posts into A1 and let cure. With the core out, lower LID bridge
artwork down over the post heads through the wide keyholes, shifted 6 mm toward the
title edge. Slide it back to center, then insert the core. Never glue the bridge.
The bridge captures the rings and washers. Glue HEAD
artwork down onto the core above the bridge, keeping glue off the retaining bridge. There is
no removable lid. Dial 2000, pull the core and load the note through its open bottom;
lower the core over the note onto A1 and scramble the rings.
The assembly SVG has the full sequence and part quantities.

## Lock and verification

Four CORER tabs, at layers 5, 7, 9 and 11, turn inside the lower washers' circular reliefs. Each tab sits immediately below an upper washer's notch. Any wrong digit stops the core before its bottom opening can leave the base collar. Each washer sits ten ways in a decagonal
socket; only the four aligned notches free the core. There are no detents: use the marker.
To change the code, dial 2000, pull the core, lift a ring and reseat its washer with the
notch under the desired digit. Read the code from the inner ring outward.

`checkLock` tests all 10,000 codes against the real cut shapes: only 2000 opens the core.
Tests also cover actual kerfs of 0.1 and 0.3 mm for files drawn at 0.2 mm, the pocket fit,
wrong-digit blocking, a few degrees of dial play, and a reseated code (7391).

```sh
cd web
npx vitest run test/laserCryptex.test.ts
npx tsc --noEmit -p .
```

Original kit: Claude Sonnet 5.5 (Anthropic), directed by Lewis Moten. Cavity revisions,
hidden artwork, stock packing, checks and documentation: OpenAI Codex (GPT-6), directed
by Lewis Moten. Artwork is drawn in code; existing pixel-font credits remain in NOTICE.md.

## Compartment closure

Build F bottom to top as four COREC, alternating CORER and COREC (four CORER,
three COREC), one more COREC, then solid round CORE0 artwork down. CORE0 is glued
around its blank wall annulus; its hidden message faces into the bore. All existing
part IDs remain. Quantities are now four CORER and eight COREC, plus the solid cap.
Lower washers have round tab reliefs; upper washer notches and socket fits are unchanged.

The old lid IDs form a captured frame: LIDP are two upright posts, with feet glued
through A1 and mushroom heads that capture bridge LID. The posts stand outside the largest ring; the bridge's
12.3 mm radius passage has a marker-side ridge notch; it clears the unlocked core but stops every washer and ring. HEAD glues to
the core above the bridge. The post feet must remain glued. To release the bridge, first withdraw the core,
then slide the bridge 6 mm toward the title edge and lift through its wide keyholes.
The inserted core permits only 0.3 mm sideways play, blocking that release slide.
This retains access to the loose washers for changing the code after unlocking. No independent cover can be removed while locked to reach the note.
The base hollow outside the collar is for the teleporter artwork, not the note.

The note is enclosed by the continuous laminated core wall, solid CORE0 ceiling and
glued A1 floor. Each wrong ring stops its own tab immediately, before the bottom mouth
leaves the base collar; only 2000 lets all four tabs pass. Each shallow lower washer ID
has at least 0.3 mm clearance to cuts in its decagon corner. The side-post tenon sockets
have 0.15 mm assembly clearance per side, with the same kerf compensation as other cuts.
This is a wooden puzzle, not protection against destructive entry. Scrap-fit the frame
and test all four single-wrong-digit cases before loading a note.

Compartment correction, assembly model and regression checks: OpenAI Codex
(GPT-6.1 Sol), directed by Lewis Moten.
