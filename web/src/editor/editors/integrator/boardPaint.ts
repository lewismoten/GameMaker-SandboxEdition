// What the integrator shows on one of the editor's boards (boardLayout.ts): a card per scene or
// group on that board, arrows between them, and labeled stubs ("→ Act Two: Green Room") for
// links that lead to or come from another board. Clicking a stub switches to that board.
import { NOSCENE } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { fromCp437 } from '@lewismoten/gamemaker-sandbox-engine/text/cp437';
import type { Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { drawCard, drawEdges, rectAt, roundRect, usedScenes, type BoardView, type Edge, type Rect } from './board';
import { layNodes, type BoardDef, type BoardNode, type BoardsData } from './boardLayout';

/** A link to or from a scene on another board. */
export interface Stub extends Rect {
  label: string;
  /** The scene to show on arriving (the first it leads to / comes from). */
  scene: number;
  board: string;
  /** The card on this board it hangs on. */
  node: BoardNode;
}

export interface BoardsModel {
  data: BoardsData;
  active: BoardDef;
  /** The cards on the active board. */
  nodes: BoardNode[];
  /** Every scene's card, on any board. */
  nodeOf: Map<number, BoardNode>;
  stubs: Stub[];
}

export const nodeRect = (n: BoardNode): Rect => rectAt(n.pos);
const FONT = 'ui-monospace, Menlo, Consolas, monospace';

/** The model of board `activeId` (the first board when it is unknown). */
export function buildModel(game: Game, data: BoardsData, activeId: string, measure: (t: string) => number): BoardsModel {
  const active = data.boards.find((b) => b.id === activeId) ?? data.boards[0];
  const used = usedScenes(game);
  const { nodes: all, nodeOf } = layNodes(data, used, (i) => game.scenes[i].pos);
  const nodes = all.filter((n) => n.board === active.id);
  const nameOf = (n: BoardNode) => (n.group ? `${n.group.name} (${n.scenes.length})` : fromCp437(game.scenes[n.scenes[0]].desc) || 'scene');
  const boardName = (id: string) => data.boards.find((b) => b.id === id)?.name ?? id;
  const wanted = new Map<string, { node: BoardNode; other: BoardNode; scene: number; incoming: boolean }>();
  for (const i of used) {
    const from = nodeOf.get(i);
    if (!from) continue;
    for (const l of game.scenes[i].links) {
      const to = l.toScene === NOSCENE ? undefined : nodeOf.get(l.toScene);
      if (!to || to.board === from.board) continue;
      if (from.board === active.id)
        wanted.set(`${from.key}>${to.key}`, wanted.get(`${from.key}>${to.key}`) ?? { node: from, other: to, scene: l.toScene, incoming: false });
      else if (to.board === active.id)
        wanted.set(`${to.key}<${from.key}`, wanted.get(`${to.key}<${from.key}`) ?? { node: to, other: from, scene: i, incoming: true });
    }
  }
  const row = new Map<string, number>();
  const stubs: Stub[] = [];
  for (const w of wanted.values()) {
    const label = `${w.incoming ? '←' : '→'} ${boardName(w.other.board)}: ${nameOf(w.other)}`;
    const width = Math.min(210, measure(label) + 16);
    const r = nodeRect(w.node);
    const side = `${w.node.key}${w.incoming}`;
    const k = row.get(side) ?? 0;
    row.set(side, k + 1);
    stubs.push({
      x: r.x,
      y: w.incoming ? r.y - 24 - k * 21 : r.y + r.h + 8 + k * 21,
      w: width,
      h: 18,
      label,
      scene: w.scene,
      board: w.other.board,
      node: w.node,
    });
  }
  return { data, active, nodes, nodeOf, stubs };
}

/** Draws the model's cards, arrows and stubs. */
export function paintModel(ctx: CanvasRenderingContext2D, forExport: boolean, v: BoardView, m: BoardsModel): void {
  const sel = m.nodeOf.get(v.selected);
  const pairs = new Map<string, Edge>();
  for (const i of usedScenes(v.game)) {
    const a = m.nodeOf.get(i);
    if (a?.board !== m.active.id) continue;
    for (const l of v.game.scenes[i].links) {
      const b = l.toScene === NOSCENE ? undefined : m.nodeOf.get(l.toScene);
      if (b?.board !== m.active.id || (a === b && a.group)) continue;
      const k = `${a.key}>${b.key}`;
      const e = pairs.get(k);
      if (e) e.n++;
      else pairs.set(k, { a: nodeRect(a), b: nodeRect(b), n: 1, out: a === sel && !forExport, inn: b === sel && !forExport, self: a === b });
    }
  }
  ctx.save();
  drawEdges(ctx, [...pairs.values()], forExport);
  ctx.restore();
  for (const s of m.stubs) {
    const r = nodeRect(s.node);
    ctx.strokeStyle = 'rgba(143,170,255,.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const up = s.y < r.y;
    ctx.moveTo(s.x + 12, up ? s.y + s.h : s.y);
    ctx.lineTo(s.x + 12, up ? r.y : r.y + r.h);
    ctx.stroke();
  }
  const order = [...m.nodes].sort((a, b) => Number(a === sel) - Number(b === sel));
  for (const n of order) {
    const rep = n.group && n.scenes.includes(v.selected) ? v.selected : n.scenes[0];
    drawCard(ctx, rep, forExport, v, nodeRect(n), n.group ? { name: n.group.name, count: n.scenes.length, selected: n === sel } : undefined);
  }
  ctx.font = `10px ${FONT}`;
  for (const s of m.stubs) {
    ctx.setLineDash([3, 2]);
    ctx.fillStyle = '#12152b';
    ctx.strokeStyle = '#8fa0ff';
    roundRect(ctx, s, 9);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#cfd6ff';
    ctx.fillText(s.label, s.x + 8, s.y + 13, s.w - 14);
  }
}
