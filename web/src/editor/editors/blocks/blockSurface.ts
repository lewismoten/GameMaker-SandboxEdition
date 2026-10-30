// The block painter's native tile addresses, empty cells, and repeated references in one canvas.
import { BLEN, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
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
  ) {
    this.width = (group?.cols ?? 1) * BLEN;
    this.height = (group?.rows ?? 1) * BLEN;
    this.ids = [...new Set(group?.cells.filter((id) => id >= 0) ?? [current])];
  }
  read(): Uint8Array {
    return this.group ? joinGroup(this.group, this.blocks, this.empty) : this.blocks[this.current].pixels.slice();
  }
  /** One native pixel address, so mirrors and duplicate cells shade a native pixel only once. */
  address(x: number, y: number): number | undefined {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const id = this.group ? this.group.cells[Math.floor(y / BLEN) * this.group.cols + Math.floor(x / BLEN)] : this.current;
    return id < 0 ? undefined : id * BLEN * BLEN + (y % BLEN) * BLEN + (x % BLEN);
  }
  /** Repeated cells reference the same native picture; update every occurrence immediately. */
  plot(pixels: Uint8Array, x: number, y: number, value: number): void {
    const address = this.address(x, y);
    if (address === undefined) return;
    const id = Math.floor(address / (BLEN * BLEN));
    const group = this.group;
    if (!group) {
      pixels[y * this.width + x] = value;
      return;
    }
    group.cells.forEach((block, cell) => {
      if (block !== id) return;
      const ox = (cell % group.cols) * BLEN,
        oy = Math.floor(cell / group.cols) * BLEN;
      pixels[(oy + (y % BLEN)) * this.width + ox + (x % BLEN)] = value;
    });
  }
  /** Apply pictures only, leaving the native behavior bytes of every block intact. */
  write(pixels: Uint8Array): number[] {
    const parts = this.group ? splitGroup(this.group, pixels) : new Map([[this.current, pixels]]);
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
