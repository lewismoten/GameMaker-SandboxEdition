// The blocks of a diagonal leg (stages/diagTrack.ts), made as the map asks for them: every
// map cell is drawn from the track value t, so the slanted lanes join up across block edges.
// A block on the slant shows t from its corner value c to c + 2, one on the kink c to c + 1
// down the block. Blocks that look and act the same are one block.
import type { Pixels } from '../../../kit/pixels';
import type { BlockSet } from '../art/draw';
import type { DiagTrack } from '../stages/diagTrack';

/** One map cell of the track. */
export interface DiagCell {
  x: number;
  y: number;
  /** Its track value at the corner (0..99). */
  t: number;
  /** On the kink (flat), not the slant. */
  flat: boolean;
  /** Is lane k bare ground at this cell? */
  bare: (lane: number) => boolean;
  /** Is the cell solid ground (between the lanes, or a bare lane)? */
  ground: boolean;
}

/** The track value at pixel (px, py) of a cell. */
export const tAt = (cell: DiagCell, px: number, py: number): number => cell.t + (cell.flat ? (py + 0.5) / 20 + 0.5 : (px + py + 1) / 20);

type Props = Parameters<BlockSet['add']>[2];

export class DiagBlocks<M extends string> {
  private seen = new Map<string, string>();
  constructor(
    readonly bs: BlockSet,
    readonly track: DiagTrack,
    /** The picture of a cell, with an optional mark. */
    readonly paint: (cell: DiagCell, mark?: M) => Pixels,
    /** What a cell's block does (solid ground, births). */
    readonly props: (cell: DiagCell, mark?: M) => Props,
    readonly prefix: string,
  ) {}

  cell(x: number, y: number): DiagCell {
    const k = this.track;
    const t = k.tOf(x, y);
    const bare = (lane: number) => !k.hasLane(lane, x);
    return { x, y, t, flat: x >= k.kink, bare, ground: t % k.pitch < k.board || bare(Math.floor(t / k.pitch)) };
  }

  /** The block for map cell (x, y), with an optional mark. Returns its name. */
  name(x: number, y: number, mark?: M): string {
    const cell = this.cell(x, y);
    const pic = this.paint(cell, mark);
    const props = this.props(cell, mark);
    const key = `${JSON.stringify(props)}:${pic.px.join(',')}`;
    let name = this.seen.get(key);
    if (!name) {
      name = `${this.prefix}${this.seen.size}`;
      this.bs.add(name, pic, props);
      this.seen.set(key, name);
    }
    return name;
  }
}
