// Where the labels sit on letter-size sticker paper, with their die lines (dieLines.ts):
// - 3.5" disk labels: the usual 2.75 in square wrap-around diskette label (Avery 5096, 5196, 5296,
//   Compulabel 311400 and the like), its front 2.75 x 2 in
//   (the face the desk's disks show), a 1/8 in fold over the disk's top edge and a 5/8 in strip on
//   the back; six to a sheet, two across and three down, 1/2 in apart so each label's bleed has
//   white paper round it. The grid is 6 x 9.25 in, inside a cutting machine's print-then-cut area.
// - CD labels: the usual two-up full-face sticker, 117 mm across with a 41 mm hole (the size
//   label sheets and applicators are made for: it clears the disc's clear hub).
import { BLEED, SAFE, rect, type DieLines, type Pt } from './dieLines';

export const LETTER: [number, number] = [8.5, 11];

/** The disk label, inches. */
export const DISK_LABEL = { w: 2.75, h: 2.75, back: 0.625, edge: 0.125, corner: 1 / 16 } as const;
/**
 * A 3.5" disk, inches, measured from a drawing of one (3.50 x 3.66 in, not square): the label's
 * recess on the front, open at the top edge between the two corner windows, and the shutter below
 * it. The label's 2 in front sits in the recess, centered, its top on the top edge; 1/8 in folds
 * over the edge (the case is about 3.3 mm thick); 5/8 in lies on the back, above the hub and the
 * shutter.
 */
export const DISK_CASE = {
  w: 3.5,
  h: 3.66,
  recess: { x: 0.31, w: 2.88, h: 2.12 },
  /** The write-protect and high-density windows, each this far in from its side. */
  window: { inset: 0.12, w: 0.16, y: 0.27, h: 0.15 },
  shutter: { x: 0.79, w: 1.86, y: 2.39 },
  /** The metal hub on the back, its center and radius. */
  hub: { x: 1.75, y: 1.83, r: 0.5 },
} as const;

/** The labels' grid on the sheet. */
export const DISK_GRID = { cols: 2, rows: 3, gap: 0.5 } as const;

/** The CD label: 117 mm across, a 41 mm hole. */
export const CD_LABEL = { outer: 117 / 25.4, hole: 41 / 25.4 } as const;
/** The two discs' centers on the sheet. */
export const CD_CENTERS: Pt[] = [
  [4.25, 2.875],
  [4.25, 8.125],
];

/** A label's top-left corner on the disk sheet, by its slot (across, then down). */
export function diskSlots(): Pt[] {
  const { cols, rows, gap } = DISK_GRID;
  const gw = cols * DISK_LABEL.w + (cols - 1) * gap;
  const gh = rows * DISK_LABEL.h + (rows - 1) * gap;
  const x0 = (LETTER[0] - gw) / 2;
  const y0 = (LETTER[1] - gh) / 2;
  const out: Pt[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push([x0 + c * (DISK_LABEL.w + gap), y0 + r * (DISK_LABEL.h + gap)]);
  return out;
}

/** The disk sheet's die lines; `bleed` false for none (the art stops at the cut). */
export function diskSheetDie(bleed: boolean): DieLines {
  const { w, h, back, edge, corner } = DISK_LABEL;
  const slots = diskSlots();
  return {
    w: LETTER[0],
    h: LETTER[1],
    bleed: bleed ? BLEED : 0,
    cuts: slots.map(([x, y]) => rect(x, y, w, h, corner)),
    slits: [],
    // over the disk's top edge: back strip | edge | front
    folds: slots.flatMap(([x, y]) => [
      [
        [x, y + back],
        [x + w, y + back],
      ],
      [
        [x, y + back + edge],
        [x + w, y + back + edge],
      ],
    ]),
    safe: slots.flatMap(([x, y]) => [
      rect(x + SAFE, y + SAFE, w - 2 * SAFE, back - 2 * SAFE),
      rect(x + SAFE, y + back + edge + SAFE, w - 2 * SAFE, h - back - edge - 2 * SAFE),
    ]),
  };
}

/** The CD sheet's die lines: each disc's edge and its hole are cut; the bleed runs past both. */
export function cdSheetDie(bleed: boolean): DieLines {
  const R = CD_LABEL.outer / 2;
  const r = CD_LABEL.hole / 2;
  return {
    w: LETTER[0],
    h: LETTER[1],
    bleed: bleed ? BLEED : 0,
    cuts: CD_CENTERS.flatMap(([cx, cy]) => [
      { kind: 'circle' as const, cx, cy, r: R },
      { kind: 'circle' as const, cx, cy, r },
    ]),
    slits: [],
    folds: [],
    safe: CD_CENTERS.flatMap(([cx, cy]) => [
      { kind: 'circle' as const, cx, cy, r: R - SAFE },
      { kind: 'circle' as const, cx, cy, r: r + SAFE },
    ]),
  };
}
