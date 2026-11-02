// Offscreen tiles of the piano roll's content, each TILE world pixels wide and the roll's full
// height. Showing a frame only copies the tiles in view; an edit repaints just the stretch it
// changed. Tiles far from the view are dropped (their canvases reused), so memory stays near
// (view width + 3 tiles) × height × 4 bytes × devicePixelRatio².
export const TILE = 256;

export type PaintFn = (g: CanvasRenderingContext2D, ox: number, a: number, b: number) => void;

export class Tiles {
  private tiles = new Map<number, HTMLCanvasElement>();
  private pool: HTMLCanvasElement[] = [];
  private dpr = 1;
  private hgt = 1;

  constructor(private paint: PaintFn) {}

  /** Forgets every tile (the next frame paints the ones it shows). */
  reset(dpr: number, hgt: number): void {
    this.dpr = dpr;
    this.hgt = hgt;
    for (const c of this.tiles.values()) this.pool.push(c);
    this.tiles.clear();
  }

  /** Repaints world pixels [x0, x1) in the tiles that are kept. */
  repaint(x0: number, x1: number): void {
    for (const [i, c] of this.tiles) {
      const ox = i * TILE;
      const a = Math.max(0, Math.floor(x0 - ox));
      const b = Math.min(TILE, Math.ceil(x1 - ox));
      if (b > a) this.paintInto(c, ox, a, b);
    }
  }

  /** The tiles from i0 to i1, painting any missing; drops tiles more than one away. */
  span(i0: number, i1: number): HTMLCanvasElement[] {
    for (const i of this.tiles.keys()) {
      if (i < i0 - 1 || i > i1 + 1) {
        this.pool.push(this.tiles.get(i)!);
        this.tiles.delete(i);
      }
    }
    const out: HTMLCanvasElement[] = [];
    for (let i = i0; i <= i1; i++) out.push(this.tile(i));
    return out;
  }

  /** Paints tile i ahead of time if it is not there yet. */
  prefetch(i: number): void {
    if (i >= 0) this.tile(i);
  }

  dispose(): void {
    this.reset(this.dpr, this.hgt);
    for (const c of this.pool) c.width = c.height = 0;
    this.pool = [];
  }

  private tile(i: number): HTMLCanvasElement {
    let c = this.tiles.get(i);
    if (c) return c;
    c = this.pool.pop() ?? document.createElement('canvas');
    const w = Math.round(TILE * this.dpr);
    const h = Math.round(this.hgt * this.dpr);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    this.tiles.set(i, c);
    this.paintInto(c, i * TILE, 0, TILE);
    return c;
  }

  private paintInto(c: HTMLCanvasElement, ox: number, a: number, b: number): void {
    const g = c.getContext('2d')!;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.paint(g, ox, a, b);
  }
}
