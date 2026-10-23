// A level's block sets. Every scene has two: NEAR.BBL and FAR.BBL share their block numbers
// (the maps are the same), but a block is drawn and behaves as it is in that focus plane: a
// near cube is solid and sharp in one and an out-of-focus ghost you roll through in the other.
// Blocks are made as the map asks for them: a cell's kind plus what its neighbors do to it
// (shadows, a pit's inner wall), so only the variants a level uses take up its 150 numbers.
import { emptyBlock, SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '../../../../web/src/formats/blocks';
import type { Picture } from '../render/image';
import { KINDS, PLANES, renderCell, type CellKey, type Ctx, type Plane } from './cells';
import type { ThemeId } from './themes';

const ALL = SOLTOP | SOLRIG | SOLBOT | SOLLEF;

/** What a block does when touched, in one plane. */
export interface Behavior {
  solid?: number;
  hp?: number;
  score?: number;
  /** The kind it becomes when touched (same neighbors). */
  touch?: string;
  effect?: number;
  eamt?: number;
  obj?: boolean;
  grav?: number;
  birth?: { mon: number; time: number };
  /** Shown as this kind after `time` ticks (all of them at once), and back. */
  next?: { kind: string; time: number };
}

export type Rules = (kind: string, plane: Plane, part: number) => Behavior;

export const ctxKey = (c: Ctx) => `${+c.w}${+c.n}${+c.nw}${+c.nPit}`;

export class TileBook {
  readonly keys: CellKey[] = [];
  private readonly index = new Map<string, number>();
  /** Block numbers kept for special blocks (the felt egg is always the same number). */
  readonly reserved = new Map<number, CellKey>();

  constructor(
    readonly theme: ThemeId,
    readonly rules: Rules,
    readonly limit = 150,
  ) {}

  /** Only the parts of the neighborhood that change how this kind looks, per plane. */
  canonical(key: CellKey): CellKey {
    const kind = KINDS[key.kind];
    if (!kind) throw new Error(`No cell kind ${key.kind}`);
    const ctx = {} as Record<Plane, Ctx>;
    for (const p of PLANES) {
      const c = key.ctx[p];
      const pit = kind.ground(p) === 'pit';
      // a cube in focus covers its whole cell; a pit only shows the wall north of it
      const fills = kind.tall(p) || kind.span !== undefined;
      ctx[p] = fills ? { w: false, n: false, nw: false, nPit: false } : pit ? { w: false, n: c.n, nw: false, nPit: c.nPit } : { ...c, nPit: false };
    }
    return { kind: key.kind, part: key.part ?? 0, variant: key.variant ?? 0, ctx };
  }

  static id(k: CellKey): string {
    return `${k.kind}:${k.part ?? 0}:${k.variant ?? 0}|${ctxKey(k.ctx.near)}|${ctxKey(k.ctx.far)}`;
  }

  private readonly pins = new Map<string, number>();

  /** Gives every cell of `kind` this block number (one look only: the felt egg). */
  pin(kind: string, n: number): void {
    this.pins.set(kind, n);
  }

  /** The block number for this cell (made on first use). */
  get(key: CellKey): number {
    const k = this.canonical(key);
    const id = TileBook.id(k);
    let n = this.index.get(id);
    const pinned = this.pins.get(k.kind);
    if (pinned !== undefined && n === undefined) {
      if (this.keys[pinned]) throw new Error(`Block ${pinned} (${k.kind}) is already ${TileBook.id(this.keys[pinned])}`);
      this.reserve(pinned, k);
      return pinned;
    }
    if (n === undefined) {
      n = 0;
      while (this.keys[n]) n++;
      if (n >= this.limit) throw new Error(`${this.theme}: more than ${this.limit} blocks`);
      this.keys[n] = k;
      this.index.set(id, n);
    }
    return n;
  }

  /** Puts a cell at a fixed block number. */
  reserve(n: number, key: CellKey): number {
    const k = this.canonical(key);
    this.reserved.set(n, k);
    this.keys[n] = k;
    this.index.set(TileBook.id(k), n);
    return n;
  }

  /** The same cell as another kind (what a block becomes when touched), made if needed. */
  as(n: number, kind: string): number {
    const k = this.keys[n];
    return this.get({ ...k, kind });
  }

  get used(): number {
    return this.keys.filter(Boolean).length;
  }

  /** Every block's attributes for one plane (pictures are filled in later). */
  blocks(plane: Plane): Block[] {
    // touch targets and animation frames may add blocks; settle them first
    for (let pass = 0; pass < 3; pass++)
      for (let n = 0; n < this.keys.length; n++) {
        const k = this.keys[n];
        if (!k) continue;
        for (const p of PLANES) {
          const b = this.rules(k.kind, p, k.part ?? 0);
          if (b.touch) this.as(n, b.touch);
          if (b.next) this.as(n, b.next.kind);
        }
      }
    const out = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
    for (let n = 0; n < this.keys.length; n++) {
      const k = this.keys[n];
      if (!k) continue;
      const b = this.rules(k.kind, plane, k.part ?? 0);
      const blk = out[n];
      blk.solid = b.solid ?? 0;
      blk.chHitPt = b.hp ?? 0;
      blk.scorePts = b.score ?? 0;
      blk.effect = b.effect ?? 0;
      blk.eamt = b.eamt ?? 0;
      blk.obj = b.obj ? 1 : 0;
      blk.grav = b.grav ?? 0;
      if (b.touch) blk.touchBl = this.as(n, b.touch);
      if (b.birth) {
        blk.birthMon = b.birth.mon;
        blk.birthTime = b.birth.time;
      }
      if (b.next) {
        blk.nextBl = this.as(n, b.next.kind);
        blk.ntime = b.next.time;
      }
    }
    return out;
  }

  /** Renders every block in both planes (linear RGB, 20x20). */
  renderAll(seed = 1): Record<Plane, (Picture | undefined)[]> {
    const out = { near: [] as (Picture | undefined)[], far: [] as (Picture | undefined)[] };
    this.keys.forEach((k, n) => {
      if (!k) return;
      for (const p of PLANES) out[p][n] = renderCell(k, p, this.theme, seed + n * 31);
    });
    return out;
  }
}

export const SOLID = ALL;
