// Counts flashes in a run of 320x200 frames the way the W3C's WCAG 2.3.1 ("Three Flashes or
// Below Threshold") describes them, so a game maker can see whether a game flashes more than three
// times in any one second. Two tests, run on every pair of neighboring frames:
//   - general flash: a pixel whose relative luminance changes by 0.1 or more (the darker of the two
//     below 0.8) counts toward a transition; a transition is a flash change when those pixels cover
//     a tenth of the screen or more, net (WCAG's 341x256 pixel area on a 1024x768 screen is 11%;
//     pixels that got lighter cancel pixels that got darker, so a scroll across a textured picture,
//     which moves both ways at once, is not counted);
//   - red flash: the same, for a pixel to or from a saturated red (R/(R+G+B) of 0.8 or more) whose
//     (R-G-B)*320 changes by more than 20.
// A flash is a pair of opposing changes (lighter then darker, or the reverse); "more than three
// flashes in a second" is the failing line. It sees the whole picture; a fast scroll over a big
// one-sided pattern can still read as flashing, which is a suggestion to look at that spot, not a
// verdict. It can't see where the eye is, or how big the player's screen is.
import { vga8 } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';

const PIXELS = 320 * 200;
/** 341 x 256 of a 1024 x 768 screen. */
export const AREA = (341 * 256) / (1024 * 768);
const LUMA_STEP = 0.1;
const DARK_LIMIT = 0.8;
const RED_STEP = 20;
/** Flashes in one second above this fail (WCAG: more than three). */
export const MAX_FLASHES = 3;

interface Tables {
  luma: Float32Array;
  sat: Uint8Array;
  red: Float32Array;
}

function tables(palette: Uint8Array): Tables {
  const luma = new Float32Array(256);
  const sat = new Uint8Array(256);
  const red = new Float32Array(256);
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  for (let i = 0; i < 256; i++) {
    const [r, g, b] = [vga8(palette[i * 3]) / 255, vga8(palette[i * 3 + 1]) / 255, vga8(palette[i * 3 + 2]) / 255];
    luma[i] = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    sat[i] = r + g + b > 0 && r / (r + g + b) >= 0.8 ? 1 : 0;
    red[i] = Math.max(0, (r - g - b) * 320);
  }
  return { luma, sat, red };
}

/** What a series of changes did within the busiest second. */
export interface Worst {
  flashes: number;
  /** Seconds into the run where that second ended. */
  at: number;
  /** The biggest share of the screen one change moved. */
  area: number;
}

class Counter {
  worst: Worst = { flashes: 0, at: 0, area: 0 };
  private recent: { t: number; dir: number }[] = [];
  constructor(private readonly fps: number) {}
  add(t: number, dir: number, area: number): void {
    this.worst.area = Math.max(this.worst.area, area);
    this.recent.push({ t, dir });
    while (this.recent[0].t <= t - this.fps) this.recent.shift();
    let reversals = 0;
    for (let i = 1; i < this.recent.length; i++) if (this.recent[i].dir !== this.recent[i - 1].dir) reversals++;
    const flashes = Math.floor((reversals + 1) / 2);
    if (flashes > this.worst.flashes) this.worst = { ...this.worst, flashes, at: t / this.fps };
  }
}

export class FlashMeter {
  readonly general: Counter;
  readonly red: Counter;
  frames = 0;
  private prev?: Uint8Array;
  private palette?: Uint8Array;
  private tab?: Tables;
  private before?: Tables;

  constructor(readonly fps = 60) {
    this.general = new Counter(fps);
    this.red = new Counter(fps);
  }

  /** Forget the last frame (a new scene starts from black: its fade-in is not a flash). */
  reset(): void {
    this.prev = undefined;
  }

  /** The next frame: 64000 palette indices, and the 768-entry 6-bit palette showing with them. */
  push(pixels: Uint8Array, palette: Uint8Array): void {
    this.frames++;
    const same = this.palette && this.palette.every((v, i) => v === palette[i]);
    if (!same) {
      this.before = this.tab;
      this.tab = tables(palette);
      this.palette = Uint8Array.from(palette);
    }
    const prev = this.prev;
    this.prev = Uint8Array.from(pixels);
    if (!prev) return;
    const a = (this.before && !same ? this.before : this.tab)!;
    const b = this.tab!;
    let up = 0;
    let down = 0;
    let rup = 0;
    let rdown = 0;
    for (let i = 0; i < PIXELS; i++) {
      const p = prev[i];
      const q = pixels[i];
      if (p === q && same) continue;
      const d = b.luma[q] - a.luma[p];
      if (Math.abs(d) >= LUMA_STEP && Math.min(a.luma[p], b.luma[q]) < DARK_LIMIT) d > 0 ? up++ : down++;
      if (a.sat[p] | b.sat[q]) {
        const rd = b.red[q] - a.red[p];
        if (Math.abs(rd) > RED_STEP) rd > 0 ? rup++ : rdown++;
      }
    }
    // the area that moved the same way: a scroll moves as many pixels lighter as darker, so it nets out
    if (Math.abs(up - down) / PIXELS >= AREA) this.general.add(this.frames, up > down ? 1 : -1, Math.abs(up - down) / PIXELS);
    if (Math.abs(rup - rdown) / PIXELS >= AREA) this.red.add(this.frames, rup > rdown ? 1 : -1, Math.abs(rup - rdown) / PIXELS);
  }
}

const CELL = 20;
const STRIDE = 10;
const CELLS_X = (320 - CELL) / STRIDE + 1;
const CELLS_Y = (200 - CELL) / STRIDE + 1;

/** The worst small spot: flashes in its busiest second, and where. */
export interface LocalWorst {
  flashes: number;
  /** Seconds into the run. */
  at: number;
  /** Top-left pixel of the 20x20 spot. */
  x: number;
  y: number;
}

/**
 * A small patch blinking. The whole-screen test above needs a tenth of the screen to change, so a lantern
 * or a patch of fog that blinks on its own stays under it. This one looks at the mean luminance of
 * 20x20 spots (every 10 pixels) and counts each spot's own swings: a swing is a move of 0.1 or more from the
 * last high or low it reached (so a zigzag of small steps in one direction counts once, and a back-and-forth
 * counts every turn); two swings are a flash; more than three in a second is advice to look at that spot.
 * The WCAG area rule does not apply to it, so a small blink that WCAG lets through is also listed: a
 * suggestion, not a verdict.
 */
export class LocalFlashMeter {
  worst: LocalWorst = { flashes: 0, at: 0, x: 0, y: 0 };
  frames = 0;
  private level = new Float32Array(CELLS_X * CELLS_Y);
  private ext = new Float32Array(CELLS_X * CELLS_Y);
  private dir = new Int8Array(CELLS_X * CELLS_Y);
  private legs: number[][] = Array.from({ length: CELLS_X * CELLS_Y }, () => []);
  private started = false;

  constructor(readonly fps = 60) {}

  /** A new scene starts from a fade; forget what came before. */
  reset(): void {
    this.started = false;
  }

  push(pixels: Uint8Array, palette: Uint8Array): void {
    this.frames++;
    const luma = tables(palette).luma;
    const start = !this.started;
    this.started = true;
    for (let cy = 0; cy < CELLS_Y; cy++) {
      for (let cx = 0; cx < CELLS_X; cx++) {
        let sum = 0;
        for (let y = 0; y < CELL; y++) {
          const row = (cy * STRIDE + y) * 320 + cx * STRIDE;
          for (let x = 0; x < CELL; x++) sum += luma[pixels[row + x]];
        }
        const c = cy * CELLS_X + cx;
        const v = sum / (CELL * CELL);
        if (start) {
          this.ext[c] = v;
          this.dir[c] = 0;
          this.legs[c].length = 0;
        } else this.step(c, v, cx, cy);
      }
    }
  }

  private step(c: number, v: number, cx: number, cy: number): void {
    const ext = this.ext[c];
    const dir = this.dir[c];
    const swing = (to: number) => Math.abs(v - ext) >= LUMA_STEP && Math.min(v, ext) < DARK_LIMIT && (to > 0 ? v > ext : v < ext);
    if (dir <= 0 && swing(1)) this.leg(c, 1, v, cx, cy);
    else if (dir >= 0 && swing(-1)) this.leg(c, -1, v, cx, cy);
    else if ((dir === 1 && v > ext) || (dir === -1 && v < ext)) this.ext[c] = v;
  }

  private leg(c: number, dir: number, v: number, cx: number, cy: number): void {
    this.dir[c] = dir;
    this.ext[c] = v;
    const legs = this.legs[c];
    legs.push(this.frames);
    while (legs[0] <= this.frames - this.fps) legs.shift();
    const flashes = Math.floor(legs.length / 2);
    if (flashes > this.worst.flashes) this.worst = { flashes, at: this.frames / this.fps, x: cx * STRIDE, y: cy * STRIDE };
  }
}
