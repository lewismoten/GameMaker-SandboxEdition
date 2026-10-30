// The block painter's native tile addresses, empty cells, and repeated references in one canvas.
import { BLEN, orientIndex, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { joinGroup, splitGroup, type BlockGroup } from './blockGroups';

export class BlockSurface {
  readonly width: number;
  readonly height: number;
  readonly ids: number[];
  constructor(
    private blocks: Block[],
    private current: number,
    readonly group?: BlockGroup,
    private empty = 0,
    private orientations?: readonly number[],
  ) {
    this.width = (group?.cols ?? 1) * BLEN;
    this.height = (group?.rows ?? 1) * BLEN;
    this.ids = [...new Set(group?.cells.filter((id) => id >= 0) ?? [current])];
  }
  read(): Uint8Array {
    if (this.orientations) {
      const pixels = new Uint8Array(this.width * this.height).fill(this.empty);
      for (let y = 0; y < this.height; y++)
        for (let x = 0; x < this.width; x++) {
          const address = this.address(x, y);
          if (address !== undefined) pixels[y * this.width + x] = this.blocks[Math.floor(address / (BLEN * BLEN))].pixels[address % (BLEN * BLEN)];
        }
      return pixels;
    }
    return this.group ? joinGroup(this.group, this.blocks, this.empty) : this.blocks[this.current].pixels.slice();
  }
  /** One native pixel address, so mirrors and duplicate cells shade a native pixel only once. */
  address(x: number, y: number): number | undefined {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const cell = this.group ? Math.floor(y / BLEN) * this.group.cols + Math.floor(x / BLEN) : 0;
    const id = this.group ? this.group.cells[cell] : this.current;
    return id < 0 ? undefined : id * BLEN * BLEN + orientIndex(this.orientations?.[cell] ?? 0, x % BLEN, y % BLEN);
  }
  /** Repeated cells reference the same native picture; update every occurrence immediately. */
  plot(pixels: Uint8Array, x: number, y: number, value: number): void {
    const address = this.address(x, y);
    if (address === undefined) return;
    const id = Math.floor(address / (BLEN * BLEN));
    const group = this.group ?? { cols: 1, cells: [this.current] };
    if (!this.group && !this.orientations) {
      pixels[y * this.width + x] = value;
      return;
    }
    group.cells.forEach((block, cell) => {
      if (block !== id) return;
      const ox = (cell % group.cols) * BLEN,
        oy = Math.floor(cell / group.cols) * BLEN;
      const native = address % (BLEN * BLEN);
      const orientation = Math.min((this.orientations?.[cell] ?? 0) & 255, 7);
      const inverse = [0, 3, 2, 1, 4, 5, 6, 7][orientation];
      const local = orientIndex(inverse, native % BLEN, Math.floor(native / BLEN));
      pixels[(oy + Math.floor(local / BLEN)) * this.width + ox + (local % BLEN)] = value;
    });
  }
  /** Native pictures represented by a display image, also used for staged-stroke Undo. */
  parts(pixels: Uint8Array): Map<number, Uint8Array> {
    if (!this.orientations) return this.group ? splitGroup(this.group, pixels) : new Map([[this.current, pixels]]);
    const group = this.group ?? { cols: 1, cells: [this.current] };
    const parts = new Map<number, Uint8Array>();
    group.cells.forEach((id, cell) => {
      if (id < 0 || parts.has(id)) return;
      const picture = new Uint8Array(BLEN * BLEN),
        ox = (cell % group.cols) * BLEN,
        oy = Math.floor(cell / group.cols) * BLEN;
      for (let y = 0; y < BLEN; y++)
        for (let x = 0; x < BLEN; x++) picture[orientIndex(this.orientations![cell] ?? 0, x, y)] = pixels[(oy + y) * this.width + ox + x];
      parts.set(id, picture);
    });
    return parts;
  }
  /** Apply pictures only, leaving the native behavior bytes of every block intact. */
  write(pixels: Uint8Array): number[] {
    const parts = this.parts(pixels);
    const changed: number[] = [];
    for (const [id, picture] of parts) {
      if (picture.every((value, i) => value === this.blocks[id].pixels[i])) continue;
      this.blocks[id].pixels.set(picture);
      changed.push(id);
    }
    return changed;
  }
  /** A quarter turn moves the group cells too, keeping holes and repeated references intact. */
  turned(clockwise: boolean): BlockGroup | undefined {
    const g = this.group;
    if (!g) return;
    const cells = new Array<number>(g.cells.length);
    g.cells.forEach((id, i) => {
      const x = i % g.cols,
        y = Math.floor(i / g.cols);
      const nx = clockwise ? g.rows - 1 - y : y,
        ny = clockwise ? x : g.cols - 1 - x;
      cells[ny * g.rows + nx] = id;
    });
    return { name: g.name, cols: g.rows, rows: g.cols, cells };
  }
}
