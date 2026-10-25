// One level drawn as a strategy guide or poster shows it, as a PNG: the map as the player goes
// through it (cropped to what the player sees, and unrolled past an edge it wraps over: see
// editor/check/unroll.ts), the Level Maps' marks for where you arrive and the ways out, its caption
// and a key. The map editor's "As players see it" picture (editor/editors/map/mapPoster.ts).
import type { Game } from '../../formats/game';
import type { GameFiles } from '../../project/files';
import { BLEN } from '../../formats/blocks';
import { el, SERIF } from './worldMapArt';
import type { Level } from './levelMapLayout';
import { captionSvg, COLORS, labelRoom, levelCanvas, levelSvg } from './levelMaps';

const MARGIN = 2;
const CAPTION = 3;
const KEY = 3;
/** The line saying what the dashed edges mean. */
const JOIN = 1.8;
/** Wide enough for the key's line. */
const LEAST_W = 56;

/** The poster's picture, `scale` x 20 pixels a block. */
export async function levelPoster(game: Game, files: GameFiles, title: string, l: Level, scale: number): Promise<Blob | undefined> {
  const room = labelRoom(game, l);
  const w = Math.max(l.area.w + 2 * MARGIN, LEAST_W);
  const mapY = MARGIN + 2.6 + CAPTION + room.above;
  const [lx, ly] = l.unrolled?.loops ?? [false, false];
  const joins = lx || ly;
  const ht = mapY + l.area.h + room.below + 2 + KEY + (joins ? JOIN : 0);
  const ox = (w - l.area.w) / 2;
  const key = { 'font-family': 'Arial, Helvetica, sans-serif', 'font-size': 1.2, fill: '#2b241c' };
  const svg = el(
    'svg',
    { xmlns: 'http://www.w3.org/2000/svg', viewBox: `0 0 ${w} ${ht}`, width: w * BLEN * scale, height: ht * BLEN * scale },
    el('rect', { x: 0, y: 0, width: w, height: ht, fill: '#fffdf7' }),
    el('text', { x: MARGIN, y: MARGIN + 1.6, 'font-family': SERIF, 'font-size': 2, 'font-style': 'italic', fill: '#2b241c' }, title),
    captionSvg(game, l, MARGIN, MARGIN + 2.6, w - 2 * MARGIN),
    levelSvg(game, l, levelCanvas(game, files, l).toDataURL(), ox, mapY, 1),
    el(
      'text',
      { ...key, x: MARGIN, y: ht - MARGIN - (joins ? JOIN : 0) },
      el('tspan', { fill: COLORS.start, 'font-weight': 700 }, '▶ 4'),
      ' where you arrive in scene 4   ',
      el('tspan', { fill: COLORS.exit, 'font-weight': 700 }, '→ 7'),
      ' the way to scene 7   ',
      el('tspan', { fill: COLORS.end, 'font-weight': 700 }, '⚑'),
      ' the way to the end',
    ),
    ...(joins
      ? [
          el(
            'text',
            { ...key, x: MARGIN, y: ht - MARGIN },
            el('tspan', { fill: COLORS.join, 'font-weight': 700 }, '- - -'),
            ' dashed edges join: go on through one and you come out at the other',
          ),
        ]
      : []),
  );
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * BLEN * scale);
    canvas.height = Math.round(ht * BLEN * scale);
    const g = canvas.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | undefined>((resolve) => canvas.toBlob((b) => resolve(b ?? undefined), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}
