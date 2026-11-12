# In The Year 2000!: the Teleport-A-Phone cryptex (laser kit)

A combination lock cut from **Proofgrade 1/8 in (3.18 mm) plywood or MDF**. Four stepped
rings stand on a square base. Dial **2 0 0 0**, inner ring first, and the hollow core slides
out. Its 16 mm bore holds a rolled note. Lift and reseat the washers to change the code.

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

| Stock (inches) | Sheets | Purchased material (in²) | Purchased material (mm²) | Occupied rectangles (was) |
| -------------- | ------ | ------------------------ | ------------------------ | ------------------------- |
| 6x12           | 4      | 288                      | 185,806                  | 78.4% (80.2%)             |
| 8x12           | 3      | 288                      | 185,806                  | 75.3% (63.7%, 4 sheets)   |
| **12x12**      | **2**  | **288**                  | **185,806**              | 70.0% (83.2%)             |
| **12x20**      | **1**  | **240**                  | **154,838**              | 80.1% (95.1%)             |

Occupied rectangles are each sheet's used corner (parts plus margins) over the purchased
area; a smaller share means a bigger reusable offcut. Sheet 1 is filled first.

The library's 12x20 size uses 16.7% less purchased material than two 12x12 sheets. Retained
wood is about **61,757 mm²**, down from **72,275 mm²** (14.6%). The old 183,222 mm² figure
was cropped layout area, not purchased stock; the manifest now distinguishes purchased
`area.sheets`, occupied bounding rectangles `area.occupied`, and retained compensated
part area `area.wood`. Reclaimed hole waste is not counted twice. The machine-readable
`fitting` array includes a label such as `fits 2 sheets of 12x12`; `fit` is the selected label.

`cryptexNest.ts` nests smaller rings and parts recursively inside larger holes, including
plugs inside collar/washer bores. `cryptexPack.ts` places each root piece by its bounding circle (the square title plate as a
rectangle) at the first free spot on a 1 mm grid, in three size orders and two scan directions,
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
about 251 mm² of uninterrupted annular glue area. The core's 12-layer tube, paired ring
slices, and four-layer base support the thin individual slices once cured. Alternate
plywood grain between layers, support the loose pieces on their waste carrier, and glue
on a flat surface under a weight. MDF needs that support too. No hidden decoration
removes material from these glue lands. The washer's existing 3.1 mm notch ligament is
unchanged and supported by its two-layer laminate.

This is a design rationale, **not a measured breaking load or a guarantee for every sheet**.
A scrap-cut and glue trial in the actual plywood/MDF must confirm handling strength;
reject chipped, delaminated or char-weakened pieces. Going thinner would sacrifice the
4 mm core wall and bearing overlap. Use shallow engraving, not deep relief.

| Cavity measurement                | Before              | Now                      |
| --------------------------------- | ------------------- | ------------------------ |
| Core bore diameter                | 15 mm               | 16 mm                    |
| Core wall                         | 4.5 mm              | 4 mm                     |
| Usable note depth, below lid plug | 30 mm at 3 mm stock | 31.8 mm at 3.18 mm stock |
| Usable cylindrical volume         | 5.30 cm³            | 6.39 cm³ (+20.6%)        |
| Base hollow inner radius (collar) | 26 mm               | 19.08 mm                 |
| Base hollow outer radius          | 34 mm               | 38 mm                    |
| Base hollow annular area          | 1,508 mm²           | 3,393 mm² (+125.0%)      |
| Base hollow volume                | 18.10 cm³           | 43.16 cm³ (+138.5%)      |

The central ridge-slot pocket and all lock contact dimensions are unchanged. The collar
radius includes the diagonal distance to the slot corners, so even there the wall is
4 mm. Core and ring heights both scale with stock thickness: the core spans 12 layers
(38.16 mm), matching four pocket layers plus eight ring layers. Nothing changes the DOS game.

## Hidden pictures and one-pass engraving

Red `#FF0000` is cut stroke only. Blue `#0000FF` is engrave fill only; there is no score
on wood. All art is on the face lying **up on the sheet**, engraved before cutting.
There is no second laser pass or registration flip. Some parts are turned over **during
assembly** so their engraved faces point down. Their blank reverse faces take the glue.

| Part       | Engraved face in assembly | Hidden design and glue exclusion                                                                                                                                                                                       |
| ---------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1 floor   | Up                        | Large phone-booth teleporter, 32 radiating beams, pulse rings, stars and TELEPORT-A-PHONE in the hollow. Arrival booth and A1 beneath the removable core. Both regions avoid the collar and outer rim glue footprints. |
| A5R, A5C   | Up                        | Circuit bands with nodes and stars on the last base layer, beneath loose rings/washers. The wide outer rim adds chip outlines, branches and parallel traces; the collar clears the ridge slot.                         |
| B1, C1, D1 | Down                      | Full bands of teleporter booths and beams (B1), cratered moons (C1), and a suburb skyline with houses and stars (D1). IDs occupy a reserved gap; only the blank reverse glues to the digit slice.                      |
| E1         | Down                      | A band of 32 pixel twinkles and comet trails in the narrow ring; no ID squeezed into its 4 mm wall.                                                                                                                    |
| B2, C2, D2 | Up                        | Larger teleporter, lunar and suburb panoramas under the next loose ring, inside the unchanged digit band.                                                                                                              |
| G1–G4      | Up                        | Small circuit and star bands, IDs and clear notches on the upper washers. Glue blank G1B–G4B underneath, with notches aligned.                                                                                         |
| CORE0      | Up                        | YOU FOUND IT. BZZZT! on the inside floor, with BZZZT! curved along the bottom. The entire wall glue annulus stays blank.                                                                                               |
| HEAD       | Down                      | Cratered moon, pixel stars, a segmented medallion rim and 2000 outside the core's glue annulus.                                                                                                                        |
| LID        | Down                      | Cratered moon and stars with a segmented medallion rim around the central plug footprint; the lid top is blank.                                                                                                        |

The A1 center picture is uncovered when the core is out; the other inner pictures appear
as the unlocked kit is taken apart. CORE0 provides the core-slice picture. CORER and
COREC wall slices, intermediate base layers and lower washer slices stay blank because
their flat faces are glue joints. There is no engraving on a laser-inaccessible vertical
bore wall. Shapes are checked in their entirety against explicit unglued regions, including
edges and filled interiors, not just vertices. Cut-to-engraving gaps remain at least 1 mm,
or 1.5 mm at holes. IDs are omitted where hidden unglued space is too narrow; the assembly
legend lists these parts in parentheses. Keep each unmarked piece with its labeled sheet
position until assembly.

`cryptexArt.ts` draws these hidden scenes separately from the cut geometry in
`cryptexParts.ts`. Art uses filled square pixels at least **0.5 mm** wide, merged into
rectangles with the shared laser bitmap helper. Hidden IDs use the existing micro font
at 0.5 mm per pixel (2.5 mm capitals). Whole pixels stay inside the safe region; no clipped
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
Glue only blank mating faces; keep the floor pictures clear. Build the four two-slice
rings, washer pairs, core and lid separately. CORE0 art faces into the bore. With the
sub-assemblies dry, put core F in the base, slide rings and their loose washers down over
it, largest first, and glue the head last, artwork down. Glue plugs only to the blank
center of the lid's engraved underside. Roll a note into the core and press the lid in.
The assembly SVG has the full sequence and part quantities.

## Lock and verification

The lower three core slices carry a ridge. It waits in the base pocket until the pull,
then must pass through each washer's notch. Each washer sits ten ways in a decagonal
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
