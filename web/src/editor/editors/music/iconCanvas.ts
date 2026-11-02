// A tiny drawing kit for the preset icons: a 20x20 grid of palette letters ("." is clear) with
// outlined boxes and ellipses, lines, and small sprites, so each instrument is drawn in code
// rather than as a wall of letters. `rows()` hands back the 20 rows presetIcons.ts expects.

export const SIZE = 20;

export class Canvas {
  private g: string[][];
  constructor(base?: readonly string[]) {
    this.g = Array.from({ length: SIZE }, (_, y) => Array.from({ length: SIZE }, (_, x) => base?.[y]?.[x] ?? '.'));
  }
  px(x: number, y: number, c: string): this {
    if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) this.g[y][x] = c;
    return this;
  }
  /** Solid rectangle, no outline. */
  fill(x: number, y: number, w: number, h: number, c: string): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
    return this;
  }
  /** Rectangle with a 1px dark outline (w and h include the outline). */
  box(x: number, y: number, w: number, h: number, c: string, edge = 'k'): this {
    this.fill(x, y, w, h, edge);
    return this.fill(x + 1, y + 1, w - 2, h - 2, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string): this {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.px(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c);
    return this;
  }
  /** Ellipse centered at (cx, cy) with radii rx, ry (halves allowed), outlined. */
  ell(cx: number, cy: number, rx: number, ry: number, c: string, edge = 'k'): this {
    const inside = (x: number, y: number, a: number, b: number) => ((x - cx) / a) ** 2 + ((y - cy) / b) ** 2 <= 1;
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) if (inside(x, y, rx + 0.5, ry + 0.5)) this.px(x, y, inside(x, y, rx - 0.5, ry - 0.5) ? c : edge);
    return this;
  }
  /** Stamp a sprite; "." is see-through, "_" clears a pixel. */
  spr(x: number, y: number, rows: readonly string[]): this {
    rows.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && this.px(x + i, y + j, ch === '_' ? '.' : ch)));
    return this;
  }
  /** Swap colors everywhere (letter -> letter). */
  recolor(map: Record<string, string>): this {
    this.g = this.g.map((r) => r.map((ch) => map[ch] ?? ch));
    return this;
  }
  rows(): string[] {
    return this.g.map((r) => r.join(''));
  }
}

export const canvas = (base?: readonly string[]): Canvas => new Canvas(base);
