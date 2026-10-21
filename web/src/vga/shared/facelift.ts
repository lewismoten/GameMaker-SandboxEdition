// Game-Maker's graphic "face": the grey surfaces, sunken borders, red buttons and green
// LCD text boxes every designer draws, ported from code/GM/FACELIFT.C and PALC.C.
import { type RGBdata, type Vga, SIZEX, SIZEY } from './vga';

export const BLEN = 20;
export const MAXFACECOL = 9;
export const GREY1 = 0;
export const RED1 = 1;
export const RED2 = 2;
export const BLACK = 3;
export const GREY2 = 4;
export const GREY3 = 5;
export const GREY4 = 6;
export const RED3 = 7;
export const GREEN = 8;

export const NONE = 0;
export const LEFT = 1;
export const RIGHT = 2;

/** The screen colors found in the current palette (FaceCols) and button highlights (HiCols). */
export class Face {
  readonly cols = new Uint8Array(MAXFACECOL);
  readonly hi = new Uint8Array(4);
  constructor(readonly v: Vga) {}

  get bkg(): number {
    return this.cols[BLACK];
  }

  /** SetCols: the nearest palette entries to Game-Maker's greys, reds, black and green. */
  setCols(colors: RGBdata[]): void {
    const c = this.cols;
    c[GREY1] = palFindCol(33, 33, 33, colors);
    c[GREY2] = palFindCol(28, 28, 28, colors);
    c[GREY3] = palFindCol(23, 23, 23, colors);
    c[GREY4] = palFindCol(18, 18, 18, colors);
    c[RED1] = palFindCol(43, 0, 0, colors);
    c[RED2] = palFindCol(28, 0, 0, colors);
    c[RED3] = palFindCol(53, 0, 0, colors);
    c[BLACK] = palFindCol(0, 0, 0, colors);
    c[GREEN] = palFindCol(8, 48, 24, colors);
    this.hi.set([c[GREY1], c[RED3], c[GREY1], c[GREEN]]);
  }

  /** BoxWithText: green LCD text on a sunken edge. */
  boxWithText(x: number, y: number, str: string): void {
    const { v, cols } = this;
    const lp = str.length;
    v.line(x - 1, y - 1, x + lp * 8, y - 1, cols[GREY4]);
    v.line(x - 1, y, x - 1, y + 8, cols[GREY3]);
    v.boxFill(x, y, x + lp * 8, y + 8, cols[GREEN]);
    v.write(x + 1, y + 1, cols[BLACK], str);
  }

  /** drawborder: a raised grey frame AROUND the object at x,y of size xlen,ylen. */
  drawborder(x: number, y: number, xlen: number, ylen: number, xthick: number, ythick: number): void {
    const { v, cols } = this;
    v.box(x - xthick - 3, y - ythick - 3, x + xlen + xthick + 1, y + ythick + ylen + 1, cols[GREY3]);
    v.box(x - xthick - 2, y - ythick - 2, x + xlen + xthick, y + ythick + ylen, cols[GREY2]);
    v.boxFill(x - xthick - 1, y - ythick - 1, x - 1, y + ylen + ythick - 1, cols[GREY1]);
    v.boxFill(x + xlen, y - ythick - 1, x + xlen + xthick - 1, y + ylen + ythick - 1, cols[GREY1]);
    if (xlen > 0) {
      v.boxFill(x, y - ythick - 1, x + xlen, y - 2, cols[GREY1]);
      v.boxFill(x, y + ylen, x + xlen, y + ylen + ythick - 1, cols[GREY1]);
      v.line(x - 1, y - 1, x + xlen - 1, y - 1, cols[GREY4]);
    }
    if (ylen > 0) v.line(x - 1, y, x - 1, y + ylen - 1, cols[GREY3]);
  }

  drawsurface(x: number, y: number, xlen: number, ylen: number): void {
    const { v, cols } = this;
    v.box(x - 2, y - 2, x + xlen + 1, y + ylen + 1, cols[GREY3]);
    v.box(x - 1, y - 1, x + xlen, y + ylen, cols[GREY2]);
    v.boxFill(x, y, x + xlen - 1, y + ylen - 1, cols[GREY1]);
  }

  /** DrawArrows: the red scroll arrows either side of a list of blocks. */
  drawArrows(x: number, y: number, blnum: number, selected: number): void {
    const { v, cols } = this;
    let left1, left2, left3, right1, right2, right3;
    switch (selected) {
      case LEFT:
        left1 = cols[GREY1];
        left2 = left3 = cols[RED3];
        right1 = right2 = cols[RED1];
        right3 = cols[RED2];
        break;
      case RIGHT:
        right1 = cols[GREY1];
        right2 = right3 = cols[RED3];
        left1 = left2 = cols[RED1];
        left3 = cols[RED2];
        break;
      default:
        left1 = right1 = left2 = right2 = cols[RED1];
        left3 = right3 = cols[RED2];
    }
    for (let lp = 0; lp < 7; lp++) {
      v.line(lp + x - 11, y + BLEN / 2 - lp, lp + x - 11, y + BLEN / 2 + lp, left2);
      v.line(x + blnum * BLEN + 10 - lp, y + BLEN / 2 - lp, x + blnum * BLEN + 10 - lp, y + BLEN / 2 + lp, right2);
      v.point(lp + x - 11, y + BLEN / 2 - lp, left1);
      v.point(lp + x - 11, y + BLEN / 2 + lp, left1);
      v.point(x + blnum * BLEN + 10 - lp, y + BLEN / 2 - lp, right1);
      v.point(x + blnum * BLEN + 10 - lp, y + BLEN / 2 + lp, right1);
    }
    v.line(x - 4, y + BLEN / 2 - 6, x - 4, y + BLEN / 2 + 6, left3);
    v.line(x + blnum * BLEN + 3, y + BLEN / 2 - 6, x + blnum * BLEN + 3, y + BLEN / 2 + 6, right3);
  }

  drawlistframe(x: number, y: number, blnum: number): void {
    this.drawborder(x, y, BLEN * blnum + 1, BLEN, 12, 1);
    this.v.line(x + BLEN * blnum, y, x + BLEN * blnum, y + BLEN - 1, this.cols[GREY3]);
    this.drawArrows(x, y, blnum, 0);
  }

  helpb(x: number, y: number, col: ArrayLike<number> = this.facePen()): void {
    this.v.draw4dat(x, y, HELPAR, 35, 10, col);
  }

  menub(x: number, y: number, col: ArrayLike<number> = this.facePen()): void {
    this.v.draw4dat(x, y, MENUAR, 35, 10, col);
  }

  noneb(x: number, y: number, col: ArrayLike<number> = this.facePen()): void {
    this.v.draw4dat(x, y, NONEAR, 35, 10, col);
  }

  doneb(x: number, y: number, col: ArrayLike<number> = this.facePen()): void {
    this.v.draw4dat(x, y, DONEAR, 35, 10, col);
  }

  /** draw4dat with FaceCols: the first four face colors, as the C code passed FaceCols. */
  facePen(): Uint8Array {
    return this.cols.subarray(0, 4);
  }

  /** Clears the whole screen to the background color. */
  clear(): void {
    this.v.boxFill(0, 0, SIZEX - 1, SIZEY - 1, this.bkg);
  }
}

/** PalFindCol: the nearest of colors 0..254 (255 is "clear"). */
export function palFindCol(red: number, green: number, blue: number, colors: RGBdata[]): number {
  let min = 12288;
  let best = 0;
  for (let k = 0; k < 255; k++) {
    const c = colors[k];
    const sum = (red - c.red) ** 2 + (green - c.green) ** 2 + (blue - c.blue) ** 2;
    if (sum < min) {
      min = sum;
      best = k;
      if (sum === 0) break;
    }
  }
  return best;
}

/** RainbowCols: the spectrum Game-Maker starts new palettes with. */
export function rainbowCols(): RGBdata[] {
  const colors: RGBdata[] = [];
  const add = 2;
  let red = 0,
    green = 0,
    blue = 0;
  let rdir = 0,
    gdir = 0,
    bdir = 0;
  for (let l = 0; l < 256; l++) {
    if (l === 0) bdir = 1;
    if (l === 64 / add) rdir = 1;
    if (l === 128 / add) {
      gdir = 1;
      bdir = 1;
    }
    if (l === 192 / add) bdir = 1;
    if (l === 226 / add) {
      rdir = 1;
      gdir = 1;
    }
    if (l === 272 / add) {
      rdir = 0;
      bdir = 1;
    }
    if (l === 336 / add) {
      rdir = 1;
      bdir = 0;
    }
    if (l === 400 / add) {
      bdir = 1;
      gdir = 1;
    }
    if (rdir === 1) red += add;
    if (gdir === 1) green += add;
    if (bdir === 1) blue += add;
    if (rdir === 2) red -= add;
    if (gdir === 2) green -= add;
    if (bdir === 2) blue -= add;
    if (red >= 63) {
      rdir = 2;
      red = 63;
    }
    if (blue >= 63) {
      bdir = 2;
      blue = 63;
    }
    if (green >= 63) {
      gdir = 2;
      green = 63;
    }
    if (red < 0) {
      red = 0;
      rdir = 0;
    }
    if (green < 0) {
      green = 0;
      gdir = 0;
    }
    if (blue < 0) {
      blue = 0;
      bdir = 0;
    }
    colors.push({ red, green, blue });
  }
  return colors;
}

/** InitStartCols: the rainbow with Game-Maker's screen colors in 246..254. */
export function initStartCols(): RGBdata[] {
  const colors = rainbowCols();
  const face: [number, number, number][] = [
    [33, 33, 33],
    [43, 0, 0],
    [28, 0, 0],
    [0, 0, 0],
    [28, 28, 28],
    [23, 23, 23],
    [18, 18, 18],
    [48, 0, 0],
    [8, 48, 24],
  ];
  face.forEach(([red, green, blue], i) => (colors[246 + i] = { red, green, blue }));
  return colors;
}

// The buttons, as 2-bit pictures (36 x 11 pixels), from FACELIFT.C.
const HELPAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 93, 85, 85, 85, 87, 85, 84, 21, 85, 221, 253, 117, 95, 215, 85, 84, 85, 85, 221, 213,
  117, 93, 119, 85, 85, 85, 85, 253, 245, 117, 95, 215, 85, 85, 85, 85, 221, 213, 117, 93, 85, 85, 85, 149, 85, 221, 255, 127, 221, 87, 85, 86, 21, 85, 93, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
const MENUAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 85, 213, 223, 247, 93, 215, 85, 84, 85, 85, 247, 221,
  87, 221, 215, 85, 85, 85, 85, 255, 223, 215, 253, 215, 85, 85, 85, 85, 221, 221, 87, 125, 215, 85, 85, 149, 85, 213, 223, 247, 93, 125, 85, 86, 21, 85, 85,
  85, 85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
const NONEAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 85, 215, 95, 93, 119, 253, 85, 84, 85, 85, 247, 117,
  223, 119, 85, 85, 85, 85, 85, 255, 117, 223, 247, 245, 85, 85, 85, 85, 223, 117, 221, 247, 85, 85, 85, 149, 85, 215, 95, 93, 119, 253, 85, 86, 21, 85, 85, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
const DONEAR = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 85, 85, 85, 85, 85, 85, 85, 64, 21, 85, 85, 85, 85, 85, 85, 85, 84, 21, 85, 253, 95, 93, 119, 253, 85, 84, 85, 85, 215, 117,
  223, 119, 85, 85, 85, 85, 85, 215, 117, 223, 247, 245, 85, 85, 85, 85, 215, 117, 221, 247, 85, 85, 85, 149, 85, 253, 95, 93, 119, 253, 85, 86, 21, 85, 85, 85,
  85, 85, 85, 85, 84, 41, 85, 85, 85, 85, 85, 85, 85, 104, 2, 170, 170, 170, 170, 170, 170, 170, 128,
];
