# Tune-Up: the paper THE CHEZ (papercraft kit)

A fold-up paper model of THE CHEZ, the tomato-red 1976½ CitiCar, 180 mm (7.09 in) long (one unit of the game's 40x20 side view,
`games/kit/chez.ts`, is 4.5 mm) and 84 mm (3.31 in) wide. Two ways to make it from the same pieces:

- **Glowforge**, on cardstock: `sheet-1.svg`, `sheet-2.svg` by default. Red `#FF0000` is cut (outlines, the windows and headlights), magenta
  `#FF00FF` is score (the folds), blue `#0000FF` is engrave (the charcoal racing stripes, the black roof, the tire rings and
  the charge port). Run engrave, then score, then cut. Red cardstock is the body; the white pinstripe beside each stripe
  is left to a white paint pen. Laser sheets use the selected stock size and the cutter margins below.
- **Home printer**: `print-letter.pdf` or `print-a4.pdf` (three landscape pages), in color. Cut the solid black lines,
  fold along the dashed ones, and the light-gray tabs are for glue. The same pages come as `.svg` and `.png` (150 dpi).
  Windows and headlights are printed in place; cut them out with a craft knife if you want them open.

```sh
cd web && npx vite-node ../games/tuneup/laser/chezPapercraft.ts [--sheet 12x12] [--out DIR] [--force]
```

It writes `web/public/laser/tuneup/papercraft-chez/` (ignored by version control), and `scripts/build-games.mjs` runs it
whenever Tune-Up is built. The desk's Feelies shelf lists it (`manifest.json`, `kind: "kit"`). The build exits 1 when two
elements on a piece come closer than 1 mm. The tests are `web/test/laserPapercraftChez.test.ts`.

## Sheet sizes and fitting

`--sheet` accepts `12x12` (default), `12x20`, `6x12` or `8x12`, in inches. Each SVG has the full stock size,
with the long edge horizontal. Leave 6.5 mm (0.26 in) on each side and 12.9 mm (0.51 in) at the top and bottom:
the 12-inch edge then stays inside the Glowforge's 279 mm (10.98 in) engraving height.

These are Proofgrade **sheet dimensions**, used for cardstock. The paper net and folds stay at their original size;
this is not a plywood model. Letter and A4 printer patterns stay the same when `--sheet` changes.

Parts may turn a quarter turn; small solid pieces nest in cut-out holes. The layout keeps at least 5 mm (0.20 in) between pieces, including nested pieces. Counts below use the supplied layout; hand packing may differ.
The manifest records `material.stock`, dimensions and margins in mm, the four-size `fitting` table, the selected `fit`,
and each placed piece's position and quarter turn. Changing size refreshes the source key and removes obsolete sheet files.

| Stock (in) | Full sheet (mm) | Usable area (mm, inches) | Sheets |
| --- | --- | --- | --- |
| 6 × 12 | 304.8 × 152.4 | 291.8 × 126.6 (11.49 × 4.98 in) | 3 |
| 8 × 12 | 304.8 × 203.2 | 291.8 × 177.4 (11.49 × 6.98 in) | 2 |
| 12 × 12 | 304.8 × 304.8 | 291.8 × 279 (11.49 × 10.98 in) | 2 |
| 12 × 20 | 508 × 304.8 | 495 × 279 (19.49 × 10.98 in) | 1 |

Outputs are numbered `sheet-1.svg`, `sheet-2.svg`, and so on, with matching PNG previews.

## The pieces

| Piece                | Qty    | What it is                                                                                                    |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| Top strip            | 1      | Roof (black), windshield (cut out) and hood with two headlights (cut out), the nose. A joint tab at each end. |
| Underside strip      | 1      | The nose bottom, the wheel-well steps, the black rocker, the rear with its back window (cut out).             |
| Driver side panel    | 1      | The profile: the door window (cut out), the racing stripes stepping up in an S behind the door, markers.      |
| Passenger side panel | 1      | The mirror picture, facing left, with the charge port at the rear.                                            |
| Tire, Wheel          | 4 each | Black tire disc; a white wheel disc with a chrome cap glues on its middle.                                    |
| Bumper               | 2      | A plain square black box as wide as the car.                                                                  |

## How it goes together

The two strips are the car's width and each has one segment per edge of the side-view outline, so folding along the
dashed lines wraps the outline. Tuck the top strip's joint tabs under the underside strip's ends (nose bottom, roof back
corner). Then glue each side panel over the tabs on its long edge, the driver's on the bottom edge of the strip, the
passenger's on the top edge. Glue a bumper box against the nose and the rear. Last, glue each wheel on the outside of the
side panel with the top of the tire tucked about 4 mm up behind the flat bottom of the quarter.

The car follows the project's rules for it: only the door window from the side (no rear quarter window), a back window
from behind, one wiper, no hood opening, white wheels, square bumpers, two charcoal stripes with red between and white
pinstripes, and the charge port at the rear passenger side. There is no antenna.

Proofgrade sheet selection, packing and fitting tables implemented with OpenAI Codex (GPT-6), directed by Lewis Moten.
