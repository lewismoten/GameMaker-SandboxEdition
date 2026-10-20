// Where scenes sit in the Game Integrator. Positions are the .GAM's own integrator
// coordinates (GRATOR.C: a scene is a 5x5 box at Pos, inside the 310x165 world at 5,29),
// so whatever the web editor arranges still loads in the DOS integrator.
import { NOSCENE, STARTTYPE, ENDTYPE, type Game, type Point } from '../formats/game';

/** The integrator world (WX, WORLDTOP, WLEN, WWID) and the range movescene() lets Pos take. */
export const WORLD = { x: 5, y: 29, w: 310, h: 165 };
export const POS_MIN = { x: WORLD.x + 1, y: WORLD.y + 1 };
export const POS_MAX = { x: WORLD.x + WORLD.w - 8, y: WORLD.y + WORLD.h - 8 };

/** The room a scene card needs, in integrator units, so cards never touch after Auto-arrange. */
export const CARD_UNITS = { w: 23, h: 19 };

export function clampPos(p: Point): Point {
  return {
    x: Math.round(Math.max(POS_MIN.x, Math.min(POS_MAX.x, p.x))),
    y: Math.round(Math.max(POS_MIN.y, Math.min(POS_MAX.y, p.y))),
  };
}

/** Breadth-first depth of each used scene from the start scene; the end scene comes last. */
export function sceneLayers(game: Game): number[][] {
  const used = game.scenes.map((s, i) => (s.gametype === NOSCENE ? -1 : i)).filter((i) => i >= 0);
  const start = game.scenes.findIndex((s) => s.gametype === STARTTYPE);
  const ends = new Set(used.filter((i) => game.scenes[i].gametype === ENDTYPE));
  const depth = new Map<number, number>();
  const visit = (root: number, d0: number) => {
    const queue = [root];
    depth.set(root, d0);
    while (queue.length) {
      const i = queue.shift()!;
      for (const l of game.scenes[i].links) {
        const t = l.toScene;
        if (t === NOSCENE || !game.scenes[t] || game.scenes[t].gametype === NOSCENE || ends.has(t) || depth.has(t)) continue;
        depth.set(t, depth.get(i)! + 1);
        queue.push(t);
      }
    }
  };
  if (start >= 0) visit(start, 0);
  // Scenes nothing reaches: their own little chains after the reachable ones.
  for (const i of used) {
    if (depth.has(i) || ends.has(i)) continue;
    const max = Math.max(-1, ...depth.values());
    visit(i, max + 1);
  }
  const layers: number[][] = [];
  for (const [i, d] of depth) (layers[d] ??= []).push(i);
  const out = layers.filter((l) => l?.length).map((l) => l.sort((a, b) => a - b));
  if (ends.size) out.push([...ends].sort((a, b) => a - b));
  return out;
}

/** Orders each layer by the average place of the scenes linking into it (fewer crossings). */
function orderLayers(game: Game, layers: number[][]): number[][] {
  const place = new Map<number, number>();
  layers[0]?.forEach((s, k) => place.set(s, k));
  return layers.map((layer, li) => {
    if (li === 0) return layer;
    const score = (s: number) => {
      const from: number[] = [];
      game.scenes.forEach((o, oi) => {
        if (place.has(oi) && o.links.some((l) => l.toScene === s)) from.push(place.get(oi)! / Math.max(1, layers[0].length));
      });
      return from.length ? from.reduce((a, b) => a + b, 0) / from.length : 1e9 + s;
    };
    const sorted = [...layer].sort((a, b) => score(a) - score(b) || a - b);
    sorted.forEach((s, k) => place.set(s, k));
    return sorted;
  });
}

const spread = (count: number, k: number, lo: number, hi: number) => (count <= 1 ? (lo + hi) / 2 : lo + ((hi - lo) * k) / (count - 1));

/**
 * New positions for every used scene, laid out as a readable graph without overlaps:
 * the start on the left, then each step further from it in a column, the end on the right.
 * When there are too many steps or too many scenes in one step, the scenes are set out in
 * reading order on a grid instead. Positions stay inside the DOS integrator's world.
 */
export function autoArrange(game: Game): Map<number, Point> {
  const layers = orderLayers(game, sceneLayers(game));
  const out = new Map<number, Point>();
  const x0 = POS_MIN.x + 2;
  const x1 = POS_MAX.x - 2;
  const y0 = POS_MIN.y + 2;
  const y1 = POS_MAX.y - 2;
  const maxCols = Math.floor((x1 - x0) / CARD_UNITS.w) + 1;
  const maxRows = Math.floor((y1 - y0) / CARD_UNITS.h) + 1;
  const tallest = Math.max(0, ...layers.map((l) => l.length));
  // centres → Pos (the box's top left; its centre is Pos + 2)
  const put = (s: number, cx: number, cy: number) => out.set(s, clampPos({ x: cx - 2, y: cy - 2 }));
  if (layers.length <= maxCols && tallest <= maxRows) {
    // Columns no wider than they need to be, centred in the world.
    const w = Math.min(x1 - x0, (layers.length - 1) * CARD_UNITS.w * 1.6);
    const h = Math.min(y1 - y0, (tallest - 1) * CARD_UNITS.h * 1.5);
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    layers.forEach((layer, li) => {
      const x = spread(layers.length, li, cx - w / 2, cx + w / 2);
      const lh = Math.min(h, (layer.length - 1) * CARD_UNITS.h * 1.5);
      layer.forEach((s, k) => put(s, x, spread(layer.length, k, cy - lh / 2, cy + lh / 2)));
    });
    return out;
  }
  // Too big for columns: each step of the game in rows of its own, top to bottom (small
  // steps share a row when there isn't room for one row each).
  const rowsFor = (share: boolean) => {
    const rows: number[][] = [];
    let cur: number[] = [];
    for (const layer of layers) {
      if (cur.length && !(share && cur.length + 1 + layer.length <= maxCols)) rows.push((cur = []));
      else if (cur.length) cur.push(-1); // a gap between steps
      if (!rows.length) rows.push(cur);
      for (const s of layer) {
        if (cur.length >= maxCols) rows.push((cur = []));
        cur.push(s);
      }
    }
    return rows;
  };
  let rows = rowsFor(false);
  if (rows.length > maxRows) rows = rowsFor(true);
  if (rows.length > maxRows) {
    // still too many: plain reading order on the roomiest grid
    const order = layers.flat();
    let best = { cols: maxCols, rows: Math.ceil(order.length / maxCols), room: -1 };
    for (let cols = 1; cols <= maxCols; cols++) {
      const r = Math.ceil(order.length / cols);
      const room = Math.min((x1 - x0) / Math.max(1, cols - 1) / CARD_UNITS.w, (y1 - y0) / Math.max(1, r - 1) / CARD_UNITS.h);
      if (r <= maxRows && room > best.room) best = { cols, rows: r, room };
    }
    rows = [];
    order.forEach((s, k) => (k % best.cols ? rows[rows.length - 1].push(s) : rows.push([s])));
  }
  const cols = Math.max(...rows.map((r) => r.length));
  const dx = cols > 1 ? Math.min((x1 - x0) / (cols - 1), CARD_UNITS.w * 1.6) : 0;
  const h = Math.min(y1 - y0, (rows.length - 1) * CARD_UNITS.h * 1.5);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  rows.forEach((row, ri) => {
    const y = spread(rows.length, ri, cy - h / 2, cy + h / 2);
    row.forEach((s, k) => s >= 0 && put(s, cx + (k - (row.length - 1) / 2) * dx, y));
  });
  return out;
}

/**
 * Keeps the author's arrangement but moves cards apart so none hides another: the
 * layout is stretched over the world and each scene takes the nearest free spot on a
 * grid of card-sized cells.
 */
export function spreadOut(game: Game): Map<number, Point> {
  const used = game.scenes.map((s, i) => (s.gametype === NOSCENE ? -1 : i)).filter((i) => i >= 0);
  const x0 = POS_MIN.x + 2;
  const x1 = POS_MAX.x - 2;
  const y0 = POS_MIN.y + 2;
  const y1 = POS_MAX.y - 2;
  const cols = Math.floor((x1 - x0) / CARD_UNITS.w) + 1;
  const rows = Math.floor((y1 - y0) / CARD_UNITS.h) + 1;
  if (used.length > cols * rows) return autoArrange(game);
  const ps = used.map((i) => game.scenes[i].pos);
  const bx0 = Math.min(...ps.map((p) => p.x));
  const by0 = Math.min(...ps.map((p) => p.y));
  const bw = Math.max(...ps.map((p) => p.x)) - bx0 || 1;
  const bh = Math.max(...ps.map((p) => p.y)) - by0 || 1;
  const pairs: [number, number, number][] = [];
  used.forEach((s, k) => {
    const tx = ((ps[k].x - bx0) / bw) * (cols - 1);
    const ty = ((ps[k].y - by0) / bh) * (rows - 1);
    for (let c = 0; c < cols * rows; c++) pairs.push([(tx - (c % cols)) ** 2 + (ty - Math.floor(c / cols)) ** 2, s, c]);
  });
  pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  const out = new Map<number, Point>();
  const taken = new Set<number>();
  for (const [, s, c] of pairs) {
    if (out.has(s) || taken.has(c)) continue;
    taken.add(c);
    out.set(s, clampPos({ x: spread(cols, c % cols, x0, x1) - 2, y: spread(rows, Math.floor(c / cols), y0, y1) - 2 }));
  }
  return out;
}
