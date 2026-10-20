// Monster paths: editing the corners of a march[] list and walking it exactly as
// playgame does (moveallmons / MonEndPath / Bresenhams in PLAYGAME.C), for previews.
//
// A path is up to MAXMARCH corners; the first corner with a speed (pic) of 0 ends it.
// Corner x/y are block offsets measured from one fixed origin (not from the previous corner):
//  - normal path:                origin = where the monster was born; corners 1..n are used.
//  - attack path, activate = 1:  corner 1 is the origin (wherever the monster is when the
//                                character comes near); the walk starts toward corner 2.
//  - attack path, activate = 2:  origin = the character, followed live; corner 1 is skipped.
// The values beyond the end of a path are left untouched so files round-trip byte for byte.
import { BLEN, SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../../formats/blocks';
import { LASTSL, MAXMARCH, type March, type Monster } from '../../formats/monster';
import { MLEN, MWID } from '../../formats/map';

export type PathKind = 'normal' | 'attack' | 'chase';

/** Which path a monster uses for p (0 normal, 1 attack), by its activate mode. */
export function pathKind(m: Monster, p: 0 | 1): PathKind {
  return p === 0 ? 'normal' : m.activate === 2 ? 'chase' : 'attack';
}

/** First corner the user sees and edits (attack paths keep corner 1 as the anchor). */
export const firstCorner = (kind: PathKind): number => (kind === 'normal' ? 0 : 1);

/** The box the original path editor (MONEDIT makepath) lets you draw in, in blocks from the origin. */
export function pathBox(kind: PathKind): { x0: number; y0: number; w: number; h: number } {
  return kind === 'normal' ? { x0: -15, y0: -15, w: 30, h: 30 } : { x0: -16, y0: -10, w: 32, h: 20 };
}

/** Number of corners in use (up to the first speed of 0). */
export function pathLength(path: March[]): number {
  let n = 0;
  while (n < MAXMARCH && path[n].pic > 0) n++;
  return n;
}

/** Offset subtracted from stored corners to place them around the origin. */
function anchor(path: March[], kind: PathKind): { x: number; y: number } {
  return kind === 'attack' ? { x: path[0].x, y: path[0].y } : { x: 0, y: 0 };
}

export interface Corner {
  /** Index into the march list. */
  i: number;
  /** Blocks from the origin. */
  x: number;
  y: number;
  speed: number;
  orient: number;
}

/** The visible corners of a path, positioned in blocks from its origin. */
export function corners(path: March[], kind: PathKind): Corner[] {
  const a = anchor(path, kind);
  const out: Corner[] = [];
  const n = pathLength(path);
  for (let i = firstCorner(kind); i < n; i++) out.push({ i, x: path[i].x - a.x, y: path[i].y - a.y, speed: path[i].pic, orient: path[i].orient });
  return out;
}

/** Clamps a spot (blocks from the origin) to the drawing box. */
export function clampToBox(kind: PathKind, x: number, y: number): { x: number; y: number } {
  const b = pathBox(kind);
  return { x: Math.max(b.x0, Math.min(b.x0 + b.w - 1, x)), y: Math.max(b.y0, Math.min(b.y0 + b.h - 1, y)) };
}

/** Moves corner i to (x, y) blocks from the origin. */
export function moveCorner(path: March[], kind: PathKind, i: number, x: number, y: number): void {
  const a = anchor(path, kind);
  const c = clampToBox(kind, x, y);
  path[i].x = c.x + a.x;
  path[i].y = c.y + a.y;
}

const DEFAULT_SPEED = 4;

/** Adds a corner at the end; returns its index, or -1 when the path is full. */
export function addCorner(path: March[], kind: PathKind, x: number, y: number): number {
  let n = pathLength(path);
  if (kind !== 'normal' && n === 0) {
    path[0] = { x: 0, y: 0, pic: DEFAULT_SPEED, orient: 0 };
    n = 1;
  }
  if (n >= MAXMARCH) return -1;
  const prev = n > firstCorner(kind) ? path[n - 1] : undefined;
  path[n] = { x: 0, y: 0, pic: prev?.pic || DEFAULT_SPEED, orient: prev?.orient ?? 0 };
  moveCorner(path, kind, n, x, y);
  return n;
}

/** Inserts a corner before index i (halfway from the previous spot); returns its index, or -1. */
export function insertCorner(path: March[], kind: PathKind, i: number): number {
  const n = pathLength(path);
  if (n >= MAXMARCH || i < firstCorner(kind) || i >= n) return -1;
  const list = corners(path, kind);
  const at = list.findIndex((c) => c.i === i);
  const prev = at > 0 ? list[at - 1] : { x: 0, y: 0 };
  const cur = list[at];
  for (let k = n; k > i; k--) path[k] = { ...path[k - 1] };
  path[i] = { ...path[i + 1] };
  moveCorner(path, kind, i, Math.round((prev.x + cur.x) / 2), Math.round((prev.y + cur.y) / 2));
  return i;
}

/** Removes corner i, closing the gap (the freed slot is zeroed, as MONEDIT's backspace does). */
export function removeCorner(path: March[], kind: PathKind, i: number): void {
  const n = pathLength(path);
  if (i < firstCorner(kind) || i >= n) return;
  for (let k = i; k < n - 1; k++) path[k] = { ...path[k + 1] };
  path[n - 1] = { x: 0, y: 0, pic: 0, orient: 0 };
  // An attack path with no corners left drops its anchor too.
  if (kind !== 'normal' && n - 1 === 1) path[0] = { x: 0, y: 0, pic: 0, orient: 0 };
}

/** Removes every corner. */
export function clearPath(path: March[]): void {
  const n = pathLength(path);
  for (let k = 0; k < n; k++) path[k] = { x: 0, y: 0, pic: 0, orient: 0 };
}

/** MONEDIT's rotate button (R): turns the picture 90° keeping any mirror. */
export function rotateOrient(o: number): number {
  return o % 4 === 3 ? o & 4 : o + 1;
}

/** MONEDIT's mirror button (S): flips the picture left to right. */
export function mirrorOrient(o: number): number {
  return o ^ 4;
}

// ---- Walking a path like playgame ------------------------------------------------------

const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);
const NO_MARCH: March = { x: 0, y: 0, pic: 0, orient: 0 };

/** One monster walking its path. Positions are map blocks + pixels within the block. */
export class PathWalker {
  bx = 0;
  by = 0;
  px = 0;
  py = 0;
  orient = 0;
  /** Animation frame (index into mon.pic; -1 before the first tick), or LASTSL when it has none. */
  frame = -1;
  private dx = 0;
  private dy = 0;
  private offl = -1;
  private offs = 0;
  private dest = 0;
  private nextAni = 0;
  clock = 0;
  /** Laps finished since the start (the preview restarts after a while). */
  laps = 0;

  constructor(
    private mon: Monster,
    private p: 0 | 1,
    private start: { x: number; y: number },
    /** The character's block (chase paths aim at it). */
    private chr: { x: number; y: number },
    /** Solid sides of the map block at (x, y); monsters with thru set stop at walls. */
    private solidAt: (x: number, y: number) => number = () => 0,
  ) {
    this.reset();
  }

  reset(): void {
    this.bx = this.start.x;
    this.by = this.start.y;
    this.px = 0;
    this.py = 0;
    this.offl = -1;
    this.offs = 0;
    this.dest = this.p === 1 ? 1 : 0;
    this.orient = 0;
    this.frame = -1;
    this.nextAni = 0;
    this.clock = 0;
  }

  private march(i: number): March {
    return this.mon.march[this.p][i] ?? NO_MARCH;
  }

  private aim(x: number, y: number): void {
    let dx = x - this.bx;
    let dy = y - this.by;
    if (dx > MLEN / 2) dx -= MLEN;
    if (dx < -MLEN / 2) dx += MLEN;
    if (dy > MWID / 2) dy -= MWID;
    if (dy < -MWID / 2) dy += MWID;
    this.dx = dx * BLEN;
    this.dy = dy * BLEN;
  }

  private bresenhams(speed: number): { x: number; y: number } {
    const move = { x: 0, y: 0 };
    const ax = Math.abs(this.dx);
    const ay = Math.abs(this.dy);
    const major = Math.max(ax, ay);
    const minor = Math.min(ax, ay);
    for (let l = 0; l < speed; l++) {
      if (this.offl >= major) {
        this.offl = -1;
        break;
      }
      this.offl++;
      this.offs += minor;
      const bump = this.offs >= major;
      if (bump) this.offs -= major;
      if (ax >= ay) {
        move.x += sign(this.dx);
        if (bump) move.y += sign(this.dy);
      } else {
        move.y += sign(this.dy);
        if (bump) move.x += sign(this.dx);
      }
    }
    return move;
  }

  /** MonEndPath: aims at the next corner; returns false when the path ended (lap done). */
  private nextCorner(): void {
    const first = this.p === 1 ? 1 : 0;
    if (this.dest === MAXMARCH || this.march(this.dest).pic === 0) {
      this.laps++;
      if (this.p === 1) {
        // In the game the monster falls back to its normal path, then attacks again from where it is.
        this.dest = first;
      } else this.dest = 0;
    }
    const cur = this.march(this.dest);
    let tx = cur.x + this.bx;
    let ty = cur.y + this.by;
    if (this.dest !== 0) {
      const prev = this.march(this.dest - 1);
      tx -= prev.x;
      ty -= prev.y;
    }
    this.orient = cur.orient;
    this.aim(tx, ty);
    this.offl = 0;
    this.offs = 0;
    this.dest++;
  }

  /** Walls: playgame's ChkWalls, so walkers stop at solid map blocks like they do in the game. */
  private chkWalls(move: { x: number; y: number }): void {
    const t = { x: this.bx, y: this.by };
    const horiz = () => {
      let chk: number;
      if (this.px + move.x < 0) {
        t.x--;
        chk = SOLRIG;
      } else {
        t.x++;
        chk = SOLLEF;
      }
      let walls = this.solidAt(t.x, t.y);
      if (this.py + move.y > BLEN / 4) walls |= this.solidAt(t.x, t.y + 1);
      if (this.py + move.y < -BLEN / 4) walls |= this.solidAt(t.x, t.y - 1);
      if (walls & chk) {
        move.x = -this.px;
        t.x += chk === SOLRIG ? 1 : -1;
      }
    };
    const vert = () => {
      let chk: number;
      if (this.py + move.y < 0) {
        t.y--;
        chk = SOLBOT;
      } else {
        t.y++;
        chk = SOLTOP;
      }
      let walls = this.solidAt(t.x, t.y);
      if (this.px + move.x > BLEN / 4) walls |= this.solidAt(t.x + 1, t.y);
      if (this.px + move.x < -BLEN / 4) walls |= this.solidAt(t.x - 1, t.y);
      if (walls & chk) {
        move.y = -this.py;
        t.y += chk === SOLBOT ? 1 : -1;
      }
    };
    if (Math.abs(move.x) > Math.abs(move.y)) {
      horiz();
      if (move.y) vert();
    } else {
      if (move.y) vert();
      if (move.x) horiz();
    }
  }

  /** One game tick (1/18.2 s). */
  tick(): void {
    const mon = this.mon;
    if (this.clock >= this.nextAni) {
      this.frame++;
      if (this.frame >= LASTSL || mon.pic[this.frame][0] >= 100 || mon.pic[this.frame][0] < 0) this.frame = mon.pic[0][0] < 100 ? 0 : LASTSL;
      this.nextAni = this.frame < LASTSL ? this.clock + mon.pic[this.frame][1] : this.clock + 100000;
    }
    let move: { x: number; y: number };
    if (this.p === 1 && mon.activate === 2) {
      const c = this.march(this.dest);
      this.aim(c.x + this.chr.x, c.y + this.chr.y);
      this.offl = 0;
      move = this.bresenhams(c.pic);
      if (this.offl === -1) {
        this.dest++;
        this.offs = 0;
        if (this.dest === MAXMARCH || this.march(this.dest).pic === 0) {
          this.dest = 1;
          this.laps++;
        } else this.orient = this.march(this.dest).orient;
      }
    } else {
      if (this.offl === -1) this.nextCorner();
      move = this.bresenhams(this.march(this.dest - 1).pic);
    }
    if (mon.thru) this.chkWalls(move);
    this.px += move.x;
    this.py += move.y;
    while (this.px >= BLEN) ((this.px -= BLEN), this.bx++);
    while (this.px < 0) ((this.px += BLEN), this.bx--);
    while (this.py >= BLEN) ((this.py -= BLEN), this.by++);
    while (this.py < 0) ((this.py += BLEN), this.by--);
    this.clock++;
  }
}
