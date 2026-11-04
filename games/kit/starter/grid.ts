// A blank level to paint in code before it becomes rows of text for StarterMap: fill a
// rectangle with a character, put one block, or lay a row. Coordinates count blocks from the
// level's top-left corner.
export class Grid {
  private readonly cells: string[][];

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.cells = Array.from({ length: height }, () => Array<string>(width).fill(' '));
  }

  /** One block. */
  put(x: number, y: number, ch: string): this {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) throw new Error(`Grid: (${x}, ${y}) is outside ${this.width}x${this.height}`);
    this.cells[y][x] = ch;
    return this;
  }

  /** A rectangle of `ch`, w blocks wide and h high. */
  fill(x: number, y: number, w: number, h: number, ch: string): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.put(xx, yy, ch);
    return this;
  }

  /** Blocks `x0` to `x1` (both included) along row `y`. */
  row(y: number, x0: number, x1: number, ch: string): this {
    return this.fill(x0, y, x1 - x0 + 1, 1, ch);
  }

  /** Blocks `y0` to `y1` (both included) down column `x`. */
  col(x: number, y0: number, y1: number, ch: string): this {
    return this.fill(x, y0, 1, y1 - y0 + 1, ch);
  }

  /** The level as rows of text, for StarterMap. */
  rows(): string[] {
    return this.cells.map((r) => r.join(''));
  }
}
