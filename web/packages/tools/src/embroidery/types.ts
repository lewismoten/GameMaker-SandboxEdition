// The shared shapes of the embroidery generator: points in millimeters (x right, y UP, the way the machine
// formats count), the stitch list a pattern compiles to, and the vector design it compiles from.

export type Pt = [number, number];
/** A closed outline (the last point joins the first). */
export type Poly = Pt[];
export type RGB = [number, number, number];

export interface Thread {
  /** A generic color name ("midnight navy"), not a brand. */
  name: string;
  rgb: RGB;
  /** Brother PEC thread-chart index (1-64) for the PES file; the machine shows its own color for it. */
  pec?: number;
}

/** What the needle does next: sew to the point, move without sewing, cut the thread then move, change thread, or finish. */
export type Cmd = 'stitch' | 'jump' | 'trim' | 'color' | 'end';

export interface Stitch {
  x: number;
  y: number;
  cmd: Cmd;
}

export interface Pattern {
  name: string;
  threads: Thread[];
  stitches: Stitch[];
}

/** A shape filled with tatami (rows of stitches), under an optional underlay. */
export interface FillItem {
  kind: 'fill';
  polys: Poly[];
  /** Direction of the rows, degrees. Regions should alternate it. */
  angle: number;
}

/** A column of satin zigzag along a line, `width` mm wide (split into lanes beyond 7 mm). */
export interface SatinItem {
  kind: 'satin';
  path: Pt[];
  width: number;
  closed?: boolean;
}

/** A plain line of running stitches. */
export interface RunItem {
  kind: 'run';
  path: Pt[];
  closed?: boolean;
}

export type Item = FillItem | SatinItem | RunItem;

/** Everything sewn in one thread, in order; a color change comes between blocks. */
export interface Block {
  thread: Thread;
  items: Item[];
}

export interface Design {
  name: string;
  /** The hoop's sewing field in mm. */
  hoop: [number, number];
  /** Blocks in sewing order. */
  blocks: Block[];
}

/** The tuning numbers of the generator, in mm. */
export interface Params {
  fillSpacing: number;
  fillLength: number;
  satinDensity: number;
  /** Extra satin width (total) so the thread draws in and still covers its shape. */
  pullComp: number;
  /** Outline growth of fills for the same reason. */
  fillGrow: number;
  maxStitch: number;
  underlayRun: number;
  maxSatin: number;
}

export const DEFAULTS: Params = {
  fillSpacing: 0.4,
  fillLength: 3.5,
  satinDensity: 0.4,
  pullComp: 0.3,
  fillGrow: 0.15,
  maxStitch: 7,
  underlayRun: 2.5,
  maxSatin: 7,
};
