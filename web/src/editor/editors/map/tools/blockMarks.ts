// What each background block does to the hero, for the map editor's block behavior marks
// (editor-only; nothing here changes a game file). No DOM, so it is tested on its own.
//
// The engine's rules, from code/GM:
// - Solid sides (BLOC.H:42 `solid`, SOLTOP 1, SOLRIG 2, SOLBOT 4, SOLLEF 8): a side stops the hero
//   from coming into the block through that side. Moving left checks the block on the left's
//   SOLRIG, moving right its SOLLEF, and so on (PLAYGAME.C:3562 chklefts, 3593 chkrights, 3628
//   chkups, 3658 chkdowns; monsters the same in minfo::ChkHorizWalls/ChkVertWalls, PLAYGAME.C:2614).
//   So a side is one-way unless the neighbor's facing side is solid too. The map wraps
//   (Coord2d_Wrap, PLAYGAME.C:2626; GetTouchbl's wrap, PLAYGAME.C:3785).
// - Gravity (BLOC.H:49 `grav`, 1 up, 2 right, 4 down, 8 left): each tick the block the hero is
//   mostly on adds 1 to the hero's speed for each bit, so up and down together cancel
//   (MoveCharGrav, PLAYGAME.C:3729).
// - Pickup (BLOC.H:50 `obj`): PickupBloc takes a touched block with `obj` set (PLAYGAME.C:2128);
//   CheckTouch skips those (PLAYGAME.C:3521).
// - Touch (DoBlockTouchChar, PLAYGAME.C:3437; really_checktouch, 3526): hit points (`chhitpt`),
//   lives (effect 1), money and counters (effect > 2, `eamt`), score (`scorepts`), and turning
//   into `touchbl` when that isn't the block itself.
// - Timed (BLOC.H:46 `nextbl`, 47 `ntime`): every use of the block turns into `nextbl` after
//   `ntime` ticks when ntime > 0 and nextbl isn't itself (PLAYGAME.C:2333, 4718).
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

/** What one block does, worked out once per block (the cache the map's cells look up). */
export interface BlockBehavior {
  /** Solid sides, SOLTOP | SOLRIG | SOLBOT | SOLLEF. */
  solid: number;
  /** Net pull per tick: -1, 0 or 1 on each axis (screen y grows down). */
  pull: { x: number; y: number };
  /** Gravity bits that cancel: 'x' for left and right, 'y' for up and down. */
  cancels: ('x' | 'y')[];
  touch: boolean;
  pickup: boolean;
  timed: boolean;
}

export const CLOSED = SOLTOP | SOLRIG | SOLBOT | SOLLEF;

export function behaviorOf(b: Block, index: number): BlockBehavior {
  const g = b.grav & 15;
  const axis = (plus: number, minus: number) => (g & plus ? 1 : 0) - (g & minus ? 1 : 0);
  const cancels: ('x' | 'y')[] = [];
  if ((g & 10) === 10) cancels.push('x');
  if ((g & 5) === 5) cancels.push('y');
  const pickup = b.obj !== 0;
  const counter = (b.effect === 1 || b.effect > 2) && b.eamt !== 0;
  return {
    solid: b.solid & CLOSED,
    pull: { x: axis(2, 8), y: axis(4, 1) },
    cancels,
    pickup,
    touch: !pickup && (b.touchBl !== index || b.chHitPt !== 0 || b.scorePts !== 0 || counter),
    timed: b.ntime > 0 && b.nextBl !== index,
  };
}

export function behaviors(blocks: Block[]): BlockBehavior[] {
  return blocks.map(behaviorOf);
}

/** An edge between two cells: none, a wall both ways, or one-way (it stops the hero coming into the first or the second cell). */
export const Edge = { None: 0, Wall: 1, IntoFirst: 2, IntoSecond: 3 } as const;
export type Edge = (typeof Edge)[keyof typeof Edge];

/**
 * The barrier edges of a w×h wrapping map. `top[i]` is the edge above cell i (between the cell
 * above, the first, and cell i, the second); `left[i]` the edge to its left (the cell to the left
 * is the first). Cells solid on every side merge: no edge between two of them, so a group of them
 * gets one outline. Between a closed cell and an open one the edge is a wall.
 */
export function barrierEdges(cells: ArrayLike<number>, info: BlockBehavior[], w: number, h: number): { top: Uint8Array; left: Uint8Array } {
  const top = new Uint8Array(w * h);
  const left = new Uint8Array(w * h);
  const solid = (i: number) => info[cells[i]]?.solid ?? 0;
  const edge = (a: number, b: number, aFace: number, bFace: number): Edge => {
    const sa = solid(a),
      sb = solid(b);
    const ca = sa === CLOSED,
      cb = sb === CLOSED;
    if (ca && cb) return Edge.None;
    if (ca || cb) return Edge.Wall;
    const intoA = (sa & aFace) !== 0,
      intoB = (sb & bFace) !== 0;
    if (intoA && intoB) return Edge.Wall;
    if (intoA) return Edge.IntoFirst;
    if (intoB) return Edge.IntoSecond;
    return Edge.None;
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const up = ((y + h - 1) % h) * w + x;
      const lf = y * w + ((x + w - 1) % w);
      top[i] = edge(up, i, SOLBOT, SOLTOP);
      left[i] = edge(lf, i, SOLRIG, SOLLEF);
    }
  return { top, left };
}

const SIDES: [number, string][] = [
  [SOLTOP, 'top'],
  [SOLRIG, 'right'],
  [SOLBOT, 'bottom'],
  [SOLLEF, 'left'],
];

/** One block's behavior in words, for the map's status line. Empty when it does nothing. */
export function describeBehavior(b: Block, index: number): string {
  const k = behaviorOf(b, index);
  const parts: string[] = [];
  if (k.solid === CLOSED) parts.push('solid all round');
  else if (k.solid)
    parts.push(
      `solid ${SIDES.filter(([bit]) => k.solid & bit)
        .map(([, n]) => n)
        .join(', ')}`,
    );
  const dirs = [k.pull.y < 0 && 'up', k.pull.x > 0 && 'right', k.pull.y > 0 && 'down', k.pull.x < 0 && 'left'].filter(Boolean);
  if (dirs.length) parts.push(`pulls ${dirs.join(' and ')}`);
  if (k.cancels.length) parts.push(`${k.cancels.map((a) => (a === 'x' ? 'left and right' : 'up and down')).join(', ')} pulls cancel`);
  if (k.pickup) parts.push('can be picked up');
  if (k.touch) {
    const t: string[] = [];
    if (b.touchBl !== index) t.push(`becomes block ${b.touchBl}`);
    if (b.chHitPt) t.push(`${b.chHitPt > 0 ? '+' : ''}${b.chHitPt} hit points`);
    if (b.scorePts) t.push(`${b.scorePts > 0 ? '+' : ''}${b.scorePts} score`);
    if ((b.effect === 1 || b.effect > 2) && b.eamt)
      t.push(`${b.eamt > 0 ? '+' : ''}${b.eamt} ${b.effect === 1 ? 'lives' : b.effect === 3 ? 'money' : `counter ${b.effect}`}`);
    parts.push(`touch: ${t.join(', ')}`);
  }
  if (k.timed) parts.push(`becomes block ${b.nextBl} after ${b.ntime} ticks`);
  return parts.join(' · ');
}
