// What can be dragged on a DOS player preview, with no DOM: each screen's moveable words and
// frames as boxes in the player's 320 x 200 pixels, the patches each one's x and y come from,
// and the math of a drag: canvas pixels to screen pixels, which item a press lands on, and a
// move clamped so every patch it touches stays in its own range (patchTable.ts, patchRules.ts).
import { patchEntry, frameLimit, type PatchValue } from '../../../../dosPlayer/patchRules';
import type { PlayerLook } from '../../../../engine/playerLook';
import type { PreviewScreen } from './playerPreview';

/** x, y, width, height in screen pixels. */
export type Rect = [number, number, number, number];

/** Where a frame was taken: by its line (move) or by a corner (resize). */
export type Grip = 'move' | 'tl' | 'tr' | 'bl' | 'br';

/** One coordinate an item moves: a number patch, or one side of a frame patch (index 0-3). */
interface DragPart {
  id: string;
  index?: number;
  axis: 'x' | 'y';
}

export interface DragItem {
  key: string;
  label: string;
  rect: Rect;
  parts: DragPart[];
  /** A Box frame: taken by its line, and resized by its corners. */
  frame?: boolean;
}

/** What a preview drew that changes what can be dragged (playerPreview.ts). */
export interface PreviewDrawn {
  /** The game's name on the menu. */
  title: string;
  /** Load and save draw their heading only without their own picture. */
  heading: boolean;
}

const MENU_WORDS = ['play', 'instructions', 'storyline', 'credits', 'highScores', 'quit'];
const NO_FILE = ['noInstructions', 'noStoryline', 'noCredits'];

const textRect = (x: number, y: number, text: string): Rect => [x, y, Math.max(1, text.trimEnd().length) * 8, 8];

function union(rects: Rect[]): Rect {
  const x = Math.min(...rects.map((r) => r[0]));
  const y = Math.min(...rects.map((r) => r[1]));
  const r = Math.max(...rects.map((q) => q[0] + q[2]));
  const b = Math.max(...rects.map((q) => q[1] + q[3]));
  return [x, y, r - x, b - y];
}

const xy = (xId: string, yId: string): DragPart[] => [
  { id: xId, axis: 'x' },
  { id: yId, axis: 'y' },
];

function words(key: string, label: string, look: PlayerLook, xId: string, yId: string, text: string): DragItem {
  return { key, label, rect: textRect(look.num(xId), look.num(yId), text), parts: xy(xId, yId) };
}

function frames(look: PlayerLook, name: string): DragItem[] {
  return (['outer', 'inner'] as const).map((side) => {
    const id = `border.${name}.${side}`;
    const [l, t, r, b] = look.frame(id);
    return {
      key: id,
      label: side === 'outer' ? 'Outer frame' : 'Inner frame',
      rect: [l, t, r - l + 1, b - t + 1],
      parts: [0, 1, 2, 3].map((index) => ({ id, index, axis: index % 2 ? 'y' : 'x' })),
      frame: true,
    };
  });
}

function menuItems(look: PlayerLook, drawn: PreviewDrawn): DragItem[] {
  const m = (w: string) => `layout.menu.${w}`;
  const wordRects = MENU_WORDS.map((w) => textRect(look.num(m(`${w}.x`)), look.num(m(`${w}.y`)), look.text(`str.menu.${w}`)));
  const markerX = look.num(m('markerX'));
  const markerY = look.num(m('firstY'));
  const marker: Rect = [markerX, markerY, look.num('border.marker.width') + 1, 5];
  const longest = NO_FILE.map((k) => look.text(`str.menu.${k}`)).reduce((a, b) => (b.trimEnd().length > a.trimEnd().length ? b : a));
  return [
    {
      key: 'menu.block',
      label: 'Menu words and marker',
      rect: union([...wordRects, marker]),
      parts: [...MENU_WORDS.flatMap((w) => xy(m(`${w}.x`), m(`${w}.y`))), { id: m('markerX'), axis: 'x' }, { id: m('firstY'), axis: 'y' }],
    },
    words('menu.title', 'Game name', look, m('titleX'), m('titleY'), drawn.title),
    words('menu.noFile', '"No game-specific" lines', look, m('noFile.x'), m('noFile.y'), longest),
  ];
}

function hiscoreRows(look: PlayerLook): DragItem {
  const first = look.num('layout.hiscore.firstRowY');
  let y = first;
  let space = look.num('layout.hiscore.rowSpacing');
  for (let j = 0; j < look.num('layout.hiscore.rows'); j++) {
    y += space;
    if (j % 2 === 0) space--;
    space--;
  }
  // the rows and the latest score under them, at x 20 (fixed in the player)
  return { key: 'hiscore.rows', label: 'Score rows', rect: [20, first, 31 * 8, y + 8 - first], parts: [{ id: 'layout.hiscore.firstRowY', axis: 'y' }] };
}

/** The items a screen's preview can drag, as drawn with `look`. */
export function screenItems(which: PreviewScreen, look: PlayerLook, drawn: PreviewDrawn): DragItem[] {
  const hs = (k: string) => `layout.hiscore.${k}`;
  switch (which) {
    case 'menu':
      return menuItems(look, drawn);
    case 'hiscores':
      return [
        words('hiscore.title', 'Heading', look, hs('title.x'), hs('title.y'), look.text('str.hiscore.title')),
        hiscoreRows(look),
        words('hiscore.anyKey', 'Foot', look, hs('anyKey.x'), hs('anyKey.y'), look.text('str.hiscore.anyKey')),
      ];
    case 'newHiscore':
      return [
        words('hiscore.congrats', 'Congratulations', look, hs('congrats.x'), hs('congrats.y'), look.text('str.hiscore.congrats')),
        words('hiscore.enterName', 'Name prompt', look, hs('enterName.x'), hs('enterName.y'), look.text('str.hiscore.enterName')),
      ];
    case 'load':
    case 'save':
      return drawn.heading
        ? [words(`${which}.title`, 'Heading', look, `layout.${which}.title.x`, `layout.${which}.title.y`, look.text(`str.${which}.title`))]
        : [];
    case 'status':
      return frames(look, 'invent');
    case 'drop':
    case 'about':
    case 'missing':
      return frames(look, which);
    default:
      return [];
  }
}

/** A point on the canvas (CSS pixels from its top left, of a `width` x `height` box) in screen pixels. */
export function toScreen(px: number, py: number, width: number, height: number): [number, number] {
  const clamp = (v: number, max: number) => Math.min(max, Math.max(0, Math.floor(v)));
  return [clamp((px * 320) / width, 319), clamp((py * 200) / height, 199)];
}

/** How near a frame's line (in screen pixels) a press takes it, and how near a corner resizes it. */
const LINE = 3;
const CORNER = 6;

/** The item a press at screen (x, y) takes: the smallest words box it is in, else the nearest frame line. */
export function hitItem(items: DragItem[], x: number, y: number): { item: DragItem; grip: Grip } | undefined {
  const inside = items
    .filter((i) => !i.frame && x >= i.rect[0] - 1 && x < i.rect[0] + i.rect[2] + 1 && y >= i.rect[1] - 1 && y < i.rect[1] + i.rect[3] + 1)
    .sort((a, b) => a.rect[2] * a.rect[3] - b.rect[2] * b.rect[3]);
  if (inside.length) return { item: inside[0], grip: 'move' };
  let best: { item: DragItem; grip: Grip; d: number } | undefined;
  for (const item of items.filter((i) => i.frame)) {
    const [l, t, w, h] = item.rect;
    const r = l + w - 1;
    const b = t + h - 1;
    if (x < l - LINE || x > r + LINE || y < t - LINE || y > b + LINE) continue;
    const d = Math.min(Math.abs(x - l), Math.abs(x - r), Math.abs(y - t), Math.abs(y - b));
    if (d > LINE || (best && best.d <= d)) continue;
    const nearX = Math.abs(x - l) <= CORNER ? 'l' : Math.abs(x - r) <= CORNER ? 'r' : '';
    const nearY = Math.abs(y - t) <= CORNER ? 't' : Math.abs(y - b) <= CORNER ? 'b' : '';
    best = { item, grip: nearX && nearY ? (`${nearY}${nearX}` as Grip) : 'move', d };
  }
  return best && { item: best.item, grip: best.grip };
}

/** The smallest a frame resized by a corner gets, in screen pixels between its sides. */
const MIN_SIDE = 4;

interface HeldPart extends DragPart {
  start: number;
  lo: number;
  hi: number;
}

/** An item taken hold of: where each part started and how far it may go. */
export interface Held {
  parts: HeldPart[];
  /** Each frame's four sides when taken (a frame patch is written whole). */
  frames: Record<string, number[]>;
}

const GRIP_SIDES: Record<Exclude<Grip, 'move'>, number[]> = { tl: [0, 1], tr: [2, 1], bl: [0, 3], br: [2, 3] };

/** Takes hold of `item` by `grip`, reading each patch's value with `value`. */
export function grab(item: DragItem, grip: Grip, value: (id: string) => PatchValue): Held {
  const frames: Record<string, number[]> = {};
  const sides = grip === 'move' ? undefined : GRIP_SIDES[grip];
  const parts = item.parts
    .filter((p) => p.index === undefined || !sides || sides.includes(p.index))
    .map((p): HeldPart => {
      const e = patchEntry(p.id)!;
      if (e.kind === 'frame' && p.index !== undefined) {
        const v = (frames[p.id] ??= [...(value(p.id) as number[])]);
        let lo = 0;
        let hi = frameLimit(e, p.index);
        // a corner keeps its sides apart: left before right, top above bottom
        if (sides && p.index < 2) hi = Math.min(hi, v[p.index + 2] - MIN_SIDE);
        if (sides && p.index >= 2) lo = Math.max(lo, v[p.index - 2] + MIN_SIDE);
        return { ...p, start: v[p.index], lo, hi };
      }
      if (e.kind !== 'number') throw new Error(`${p.id} is not a position`);
      return { ...p, start: value(p.id) as number, lo: e.min, hi: e.max };
    });
  return { parts, frames };
}

/** How far the parts on `axis` can all move: `d` clamped so none leaves its range. */
function clampMove(parts: HeldPart[], axis: 'x' | 'y', d: number): number {
  const mine = parts.filter((p) => p.axis === axis);
  if (!mine.length) return 0;
  const lo = Math.max(...mine.map((p) => p.lo - p.start));
  const hi = Math.min(...mine.map((p) => p.hi - p.start));
  if (lo > hi) return 0;
  return Math.min(hi, Math.max(lo, Math.round(d)));
}

/** The patch values after moving what is held by (dx, dy) screen pixels from where it was taken. */
export function dragBy(held: Held, dx: number, dy: number): [string, PatchValue][] {
  const mx = clampMove(held.parts, 'x', dx);
  const my = clampMove(held.parts, 'y', dy);
  const out = new Map<string, PatchValue>();
  for (const p of held.parts) {
    const v = p.start + (p.axis === 'x' ? mx : my);
    if (p.index === undefined) out.set(p.id, v);
    else {
      const f = (out.get(p.id) as number[] | undefined) ?? [...held.frames[p.id]];
      f[p.index] = v;
      out.set(p.id, f);
    }
  }
  return [...out];
}

/** The item that moves a patch (for the field being edited), if any. */
export function itemFor(items: DragItem[], id: string): DragItem | undefined {
  return items.find((i) => i.parts.some((p) => p.id === id));
}

/** Where an item is, in words: "Heading: x 104, y 0", "Outer frame: 10, 10 to 310, 190". */
export function describeItem(item: DragItem): string {
  const [x, y, w, h] = item.rect;
  if (item.frame) return `${item.label}: ${x}, ${y} to ${x + w - 1}, ${y + h - 1}`;
  const axes = new Set(item.parts.map((p) => p.axis));
  return `${item.label}: ${[axes.has('x') ? `x ${x}` : '', axes.has('y') ? `y ${y}` : ''].filter(Boolean).join(', ')}`;
}
