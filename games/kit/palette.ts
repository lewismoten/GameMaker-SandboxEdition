// Building a 256-color VGA palette (6-bit components) from named ramps, so block art can
// say "grass at shade 3" instead of a raw index.
export class PaletteBuilder {
  readonly pal = new Uint8Array(768);
  private next = 0;
  readonly ramps = new Map<string, number[]>();

  /** One color from 8-bit RGB; returns its index. */
  color(r: number, g: number, b: number): number {
    const i = this.next++;
    if (i > 254) throw new Error('Palette full (255 is "clear")');
    this.pal.set([r >> 2, g >> 2, b >> 2], i * 3);
    return i;
  }

  /** A ramp of n shades from dark to light (8-bit RGB stops); returns the indexes. */
  ramp(name: string, n: number, from: [number, number, number], to: [number, number, number], mid?: [number, number, number]): number[] {
    const out: number[] = [];
    for (let k = 0; k < n; k++) {
      const t = n === 1 ? 0 : k / (n - 1);
      const [a, b, u] = mid ? (t < 0.5 ? [from, mid, t * 2] : [mid, to, (t - 0.5) * 2]) : [from, to, t];
      out.push(this.color(...(a.map((v, j) => Math.round(v + (b[j] - v) * u)) as [number, number, number])));
    }
    this.ramps.set(name, out);
    return out;
  }

  get(name: string): number[] {
    const r = this.ramps.get(name);
    if (!r) throw new Error(`No ramp ${name}`);
    return r;
  }

  /**
   * Game-Maker's designers look for these grays, reds, black and LCD green; keep them. Black
   * comes first: PLAYGAME clears the screen to color 0 before the high score prompt.
   */
  designerColors(): void {
    for (const [r, g, b] of [
      [0, 0, 0],
      [33, 33, 33],
      [43, 0, 0],
      [28, 0, 0],
      [28, 28, 28],
      [23, 23, 23],
      [18, 18, 18],
      [53, 0, 0],
      [8, 48, 24],
    ])
      this.color(r * 4, g * 4, b * 4);
  }

  get used(): number {
    return this.next;
  }
}
