// Draw Level Map annotations and captions with their shared paper dimensions.
import { type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { type Level, markLabel } from './levelMapLayout';
import { el, SERIF } from './worldMapArt';
import { type Painter } from './levelMaps';

/** A printed page (landscape letter, tenths of an inch), its margin, header and footer. */
export const PAGE = { w: 105, h: 80 };

export const MARGIN = 2;

export const HEAD = 7;

export const FOOT = 6;

/** The space for maps on a page, and a level's caption over its map. */
export const AREA = { w: PAGE.w - 2 * MARGIN, h: PAGE.h - HEAD - FOOT };

export const CAPTION = 3;

export const GAP = 2.4;

export const OVERLAP = 3;

/** A block's size at full size: a tenth of an inch (a 16 x 10 screen is 1.6 x 1 inches). */
export const FULL = 1;

export const COLORS = { start: '#17762f', exit: '#1d4e9e', end: '#b3261e', join: '#7a3db8' };

/** Where a course's panels go on a page: under its caption, over the line about the dashed edges. */
export const COURSE_AREA = { w: AREA.w, h: AREA.h - CAPTION - 2 };

/** The scene numbers of a level, short: "3", "3, 11", "5–9". */
export const sceneList = (game: Game, l: Level) => markLabel(game, l.group.scenes);

/** A mark's words: ▶ and the scenes you arrive in, → and the scene a way out goes to, ⚑ the end. */
export const markText = (game: Game, m: Level['marks'][number]) =>
  `${m.kind === 'start' ? '▶' : m.kind === 'end' ? '⚑' : '→'}${m.kind === 'end' ? '' : (m.text ?? markLabel(game, m.scenes))}`;

/** A mark's label: its text and width, and where it sits (paper units, `s` a block from `ox`, `oy`). */
interface MarkLabel {
  text: string;
  /** Its middle, kept over the picture. */
  x: number;
  w: number;
  /** Arrivals' labels sit over the mark, the ways out under it. */
  up: boolean;
  /** 0 next to the mark; further out when it would cover another label. */
  lane: number;
  /** Its top in its first lane, from the picture's top (paper units). */
  top: number;
  /** Its mark. */
  at: Level['marks'][number];
}

const LANE = 1.8;

/** The labels of a level's marks, laid out so none covers another or runs off the picture. */
function markLabels(game: Game, l: Level, ox: number, s: number): MarkLabel[] {
  const left = ox;
  const right = ox + l.area.w * s;
  const labels = l.marks.map((m) => {
    const text = markText(game, m);
    const w = Math.min(14, text.length * 0.6 + 0.8);
    const mid = ox + (m.x + (m.w - 1) / 2 - l.area.x + 0.5) * s;
    const x = w >= right - left ? (left + right) / 2 : Math.min(Math.max(mid, left + w / 2), right - w / 2);
    // where the label's top sits in its first lane (as marksSvg draws it), from the picture's top
    const cy = (m.y + (m.h - 1) / 2 - l.area.y + 0.5) * s;
    const box = Math.max(m.h * s, 0.9);
    const top = m.kind === 'start' ? cy - box / 2 - 1.9 : cy + box / 2 + 0.25;
    return { text, x, w, up: m.kind === 'start', lane: 0, top, at: m };
  });
  // in order across, each label takes the first lane out where it covers no other: one going
  // the same way in that lane, or one going the other way where they meet (an arrival under a way out)
  const placed: { up: boolean; lane: number; from: number; to: number; y: number }[] = [];
  const yOf = (lb: { up: boolean; lane: number; top: number }) => lb.top + (lb.up ? -1 : 1) * lb.lane * LANE;
  // the states of one place on one map (levelStates.ts) bring marks close together: a label there
  // also keeps off the other marks' boxes, and off any label as near, whichever way it goes
  const boxes = l.states
    ? l.marks.map((m) => ({ m, x0: ox + (m.x - l.area.x) * s, x1: ox + (m.x + m.w - l.area.x) * s, y0: (m.y - l.area.y) * s, y1: (m.y + m.h - l.area.y) * s }))
    : [];
  for (const lb of [...labels].sort((a, b) => a.x - b.x)) {
    const from = lb.x - lb.w / 2 - 0.2;
    const to = lb.x + lb.w / 2 + 0.2;
    const covers = () => boxes.some((b) => b.m !== lb.at && b.x0 < to && from < b.x1 && b.y0 < yOf(lb) + 1.6 && yOf(lb) < b.y1);
    const hits = () =>
      covers() || placed.some((o) => o.from < to && from < o.to && (o.up === lb.up && !l.states ? o.lane === lb.lane : Math.abs(o.y - yOf(lb)) < 1.7));
    while (hits() && lb.lane < 12) lb.lane++;
    placed.push({ up: lb.up, lane: lb.lane, from, to, y: yOf(lb) });
  }
  return labels;
}

/** The room a level's labels need over and under its picture, past the first lane. */
export function labelRoom(game: Game, l: Level): { above: number; below: number } {
  const labels = markLabels(game, l, 0, FULL);
  const y = (x: MarkLabel) => x.top + (x.up ? -1 : 1) * x.lane * LANE;
  // (a label over the top row already reaches into the caption's last unit, and one under the
  // bottom row into the gap under the picture: only what goes past those needs room)
  const over = Math.max(0, ...labels.filter((x) => x.up).map((x) => -y(x) - 1.9));
  const under = Math.max(0, ...labels.filter((x) => !x.up).map((x) => y(x) - l.area.h * FULL - 0.25));
  return { above: over > 0.01 ? over + 1 : 0, below: under };
}

/** The marks of a level drawn over its picture, `s` paper units a block, from (`ox`, `oy`); sizes stay the same on paper. */
function marksSvg(game: Game, l: Level, ox: number, oy: number, s: number): SVGElement {
  const g = el('g', { class: 'lm-marks', 'font-family': 'Arial, Helvetica, sans-serif' });
  const px = (x: number) => ox + (x - l.area.x + 0.5) * s;
  const py = (y: number) => oy + (y - l.area.y + 0.5) * s;
  const labels = markLabels(game, l, ox, s);
  // the lines from moved labels back to their marks go under every label
  const leaders = el('g', { class: 'lm-leaders' });
  g.append(leaders);
  for (const [i, m] of l.marks.entries()) {
    // the middle of the mark, and its box (at least a block, and big enough to see)
    const x = px(m.x + (m.w - 1) / 2);
    const y = py(m.y + (m.h - 1) / 2);
    const bw = Math.max(m.w * s, 0.9);
    const bh = Math.max(m.h * s, 0.9);
    const box = bh;
    const color = COLORS[m.kind];
    const shape = (stroke: string, width: number) =>
      m.kind === 'start' && m.w === 1 && m.h === 1
        ? el('circle', { cx: x, cy: y, r: bw * 0.42, fill: 'none', stroke, 'stroke-width': width })
        : el('rect', { x: x - bw / 2, y: y - bh / 2, width: bw, height: bh, rx: m.kind === 'start' ? bh / 2 : 0, fill: 'none', stroke, 'stroke-width': width });
    g.append(shape('#fff', 0.42), shape(color, 0.24));
    const { text, x: lx, w: tw, lane } = labels[i];
    const ty = m.kind === 'start' ? y - box / 2 - 1.9 - lane * LANE : y + box / 2 + 0.25 + lane * LANE;
    // a label moved off its mark points back to it
    if (lane || Math.abs(lx - x) > tw / 2)
      leaders.append(
        el('line', {
          x1: x,
          y1: m.kind === 'start' ? y - box / 2 : y + box / 2,
          x2: Math.min(Math.max(x, lx - tw / 2 + 0.4), lx + tw / 2 - 0.4),
          y2: m.kind === 'start' ? ty + 1.6 : ty,
          stroke: color,
          'stroke-width': 0.2,
        }),
      );
    g.append(
      el('rect', { x: lx - tw / 2, y: ty, width: tw, height: 1.6, rx: 0.4, fill: color, stroke: '#fff', 'stroke-width': 0.15 }),
      el(
        'text',
        {
          x: lx,
          y: ty + 1.2,
          'font-size': 1.1,
          'font-weight': 700,
          fill: '#fff',
          'text-anchor': 'middle',
          ...(text.length * 0.6 > tw - 0.6 ? { textLength: tw - 0.6, lengthAdjust: 'spacingAndGlyphs' } : {}),
        },
        text,
      ),
    );
  }
  return g;
}

/** A level's picture and marks, `s` paper units a block, from (`ox`, `oy`). */
export function levelSvg(game: Game, l: Level, url: string, ox: number, oy: number, s: number): SVGElement {
  return el(
    'g',
    { class: 'lm-level' },
    el('rect', { x: ox - 0.15, y: oy - 0.15, width: l.area.w * s + 0.3, height: l.area.h * s + 0.3, fill: 'none', stroke: '#222', 'stroke-width': 0.3 }),
    el('image', { href: url, x: ox, y: oy, width: l.area.w * s, height: l.area.h * s, preserveAspectRatio: 'none', style: 'image-rendering:pixelated' }),
    ...joinedEdges(l, ox, oy, s),
    marksSvg(game, l, ox, oy, s),
  );
}

/** A room's cast panel (levelRooms.ts): its width, a person's row, and the title over them. */
const CAST = { w: 29, row: 3.7, head: 3.9, pic: 2.8, show: 0.8 };

/** The height of a level's cast panel, 0 when it has none. */
export const castHeight = (l: Level) => (l.cast ? CAST.head + l.cast.people.length * CAST.row : 0);

/** The room a level's picture and its cast panel take across. */
export const levelWidth = (l: Level) => l.area.w * FULL + (l.cast ? GAP + CAST.w : 0);

/** A small piece of a level's map (a portrait, a row of cards) to paint like a level. */
export type CropOf = (l: Level, r: { x: number; y: number; w: number; h: number }) => Level;

export function cropper(): CropOf {
  const made = new Map<string, Level>();
  return (l, r) => {
    const key = `${l.group.map}|${l.scene}|${r.x},${r.y},${r.w},${r.h}`;
    let c = made.get(key);
    if (!c) made.set(key, (c = { ...l, area: r, whole: r, marks: [], cast: undefined, note: undefined, unrolled: undefined, mapMarks: undefined }));
    return c;
  };
}

/** Who you meet in a room, beside its picture from (`x`, `y`): each one's picture, name, and the rooms they take you to drawn small, with their scenes. */
export async function castSvg(game: Game, l: Level, x: number, y: number, paint: Painter, crop: CropOf): Promise<SVGElement> {
  const cast = l.cast!;
  const g = el('g', { class: 'lm-cast', 'font-family': 'Arial, Helvetica, sans-serif', fill: '#2b241c' });
  const showX = (k: number) => x + CAST.pic + 9.8 + k * 6.4;
  g.append(
    el('rect', { x, y, width: CAST.w, height: castHeight(l), rx: 0.6, fill: '#f4eedf', stroke: '#2b241c', 'stroke-width': 0.15 }),
    el('text', { x: x + 0.8, y: y + 1.8, 'font-family': SERIF, 'font-size': 1.5, 'font-weight': 700 }, cast.title),
  );
  cast.people[0]?.visits.forEach(
    (v, k) =>
      v.show &&
      g.append(el('text', { x: showX(k) + (v.show.w * CAST.show) / 2, y: y + 3.3, 'font-size': 1, 'font-weight': 700, 'text-anchor': 'middle' }, v.label)),
  );
  for (const [i, p] of cast.people.entries()) {
    const ry = y + CAST.head + i * CAST.row;
    const [name, role] = p.name.split(', ');
    const pic = await paint(crop(l, p.picture));
    const ps = CAST.pic / Math.max(p.picture.w, p.picture.h);
    g.append(
      el('image', { href: pic, x: x + 0.8, y: ry, width: p.picture.w * ps, height: p.picture.h * ps, style: 'image-rendering:pixelated' }),
      el('text', { x: x + CAST.pic + 1.4, y: ry + 1.2, 'font-size': 1.2, 'font-weight': 700 }, name),
      el('text', { x: x + CAST.pic + 1.4, y: ry + 2.4, 'font-size': 1, 'font-style': 'italic' }, role ?? ''),
    );
    for (const [k, v] of p.visits.entries()) {
      const tag = `▶${markLabel(game, v.scenes)}`;
      if (!v.show) {
        g.append(el('text', { x: showX(k), y: ry + 2.4, 'font-size': 0.9 }, `${v.label} ${tag}`));
        continue;
      }
      const url = await paint(crop(l, v.show));
      g.append(
        el('image', { href: url, x: showX(k), y: ry, width: v.show.w * CAST.show, height: v.show.h * CAST.show, style: 'image-rendering:pixelated' }),
        el('rect', { x: showX(k), y: ry, width: v.show.w * CAST.show, height: v.show.h * CAST.show, fill: 'none', stroke: '#222', 'stroke-width': 0.12 }),
        el(
          'text',
          {
            x: showX(k) + (v.show.w * CAST.show) / 2,
            y: ry + v.show.h * CAST.show + 0.95,
            'font-size': 0.85,
            'font-weight': 700,
            fill: COLORS.start,
            'text-anchor': 'middle',
          },
          tag,
        ),
      );
    }
  }
  return g;
}

/** Edges that are the same place (the map goes round forever that way): dashed, with arrows going on through them. */
function joinedEdges(l: Level, ox: number, oy: number, s: number): SVGElement[] {
  const [lx, ly] = l.unrolled?.loops ?? [false, false];
  const w = l.area.w * s;
  const ht = l.area.h * s;
  const out: SVGElement[] = [];
  const edge = (x1: number, y1: number, x2: number, y2: number) =>
    out.push(
      el('line', { x1, y1, x2, y2, stroke: '#fff', 'stroke-width': 0.5 }),
      el('line', { x1, y1, x2, y2, stroke: COLORS.join, 'stroke-width': 0.3, 'stroke-dasharray': '1 0.6' }),
    );
  const arrow = (x: number, y: number, text: string) =>
    out.push(
      el(
        'text',
        {
          x,
          y,
          'font-family': 'Arial, Helvetica, sans-serif',
          'font-size': 1.6,
          'font-weight': 700,
          fill: COLORS.join,
          stroke: '#fff',
          'stroke-width': 0.25,
          'paint-order': 'stroke',
          'text-anchor': 'middle',
        },
        text,
      ),
    );
  if (lx) {
    edge(ox, oy, ox, oy + ht);
    edge(ox + w, oy, ox + w, oy + ht);
    arrow(ox + 0.9, oy + ht / 2 + 0.55, '⇠');
    arrow(ox + w - 0.9, oy + ht / 2 + 0.55, '⇢');
  }
  if (ly) {
    edge(ox, oy, ox + w, oy);
    edge(ox, oy + ht, ox + w, oy + ht);
    arrow(ox + w / 2, oy + 1.5, '⇡');
    arrow(ox + w / 2, oy + ht - 0.4, '⇣');
  }
  return out;
}

/** What a caption adds for a map whose edges join, so the dashed edges read. */
function joinNote(l: Level): string {
  const [lx, ly] = l.unrolled?.loops ?? [false, false];
  return lx && ly ? ' · all four edges join up' : lx ? ' · the left and right edges join up' : ly ? ' · the top and bottom edges join up' : '';
}

/** "Scene", or "Scenes" for the states of one place printed as one (levelStates.ts). */
export const sceneWord = (l: Level) => (l.states ? 'Scenes' : 'Scene');

/** About how wide a caption's letter is, on average (paper units). */
const CAPTION_EM = 0.92;

const captionText = (game: Game, l: Level) => `${sceneWord(l)} ${sceneList(game, l)} · ${l.name}${joinNote(l)}${l.note ? ` · ${l.note}` : ''}`;

/** The room a level's caption takes across at its own size (a narrow map's box widens for it). */
export const captionWidth = (game: Game, l: Level) => Math.min(AREA.w, captionText(game, l).length * CAPTION_EM);

/** A level's caption: its scene numbers and name. */
export function captionSvg(game: Game, l: Level, x: number, y: number, width: number): SVGElement {
  const t = captionText(game, l);
  return el(
    'text',
    {
      x,
      y: y + 2,
      'font-family': SERIF,
      'font-size': 1.7,
      'font-weight': 700,
      fill: '#2b241c',
      ...(t.length * CAPTION_EM > width ? { textLength: width, lengthAdjust: 'spacingAndGlyphs' } : {}),
    },
    t,
  );
}
