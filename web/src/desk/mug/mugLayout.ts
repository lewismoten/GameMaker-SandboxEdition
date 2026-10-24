// The sublimation page's layout, in inches: one strip a mug, its front and back pictures
// exactly half the mug's round apart and level with each other, each no wider than a third
// of the round (so it reads straight on), the strip cropped to the pictures plus a bleed,
// and the strips stacked down one page with room for the marks between them.
import { MARGIN, circumference, type MugSize, type Paper } from './mugSizes';

/** Paper left round the pictures, inches. */
export const BLEED = 0.125;
/** Above each strip, for the center ticks and the handle marks; below it, the label. */
export const TICK_BAND = 0.18;
export const LABEL_BAND = 0.36;
/** Clear at the wrap's own ends and edges, inches. */
const EDGE = 0.1;
/** A tumbler's pictures, middle up from the bottom of the cup: above the hand holding it. */
export const DEFAULT_LIFT = 5.5;

export type Side = 'front' | 'back';
export type Orientation = 'portrait' | 'landscape';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StripInput {
  size: MugSize;
  /** Each side's picture, width over height; left out, that side is blank. */
  front?: number;
  back?: number;
  /** A tumbler's pictures: their middle, inches up from the bottom of the cup. */
  lift?: number;
  /** The front faces out when the mug is held in the left hand. */
  leftHanded?: boolean;
}

/** One mug's strip, in the wrap's own inches: x from its left end as it sits on the mug (not mirrored), y down from its top. */
export interface StripLayout {
  size: MugSize;
  /** Once round the mug. */
  round: number;
  /** The most room a picture has: a third of the round across (less if the wrap or the paper is short), the wrap's height. */
  slot: { w: number; h: number };
  /** Each side's middle along the wrap. */
  centers: Record<Side, number>;
  /** The pictures' middle, down from the wrap's top. */
  centerY: number;
  art: Partial<Record<Side, Rect>>;
  /** Everything the pictures cover, or undefined for a blank mug. */
  content?: Rect;
  /** What is printed: the content and its bleed, kept inside the wrap. */
  crop?: Rect;
}

/**
 * Lays out one mug. The handle is in the middle of the gap between the wrap's ends, so the
 * mug's front (the side facing out when it is held in the right hand: the handle on the
 * left as you look at it) is a quarter of the round from the handle, the back three
 * quarters; `roomW` is how wide the paper can print, which the two pictures must fit across.
 */
export function stripLayout(input: StripInput, roomW: number): StripLayout {
  const { size } = input;
  const round = circumference(size);
  const mid = size.wrapW / 2;
  const quarter = round / 4;
  const centers: Record<Side, number> = input.leftHanded ? { front: mid + quarter, back: mid - quarter } : { front: mid - quarter, back: mid + quarter };
  const slot = {
    w: Math.max(0.5, Math.min(round / 3, size.wrapW - round / 2 - 2 * EDGE, roomW - round / 2)),
    h: size.wrapH - 2 * EDGE,
  };
  const fit = (aspect: number) => {
    const w = Math.min(slot.w, slot.h * aspect);
    return { w, h: w / aspect };
  };
  const sides = (['front', 'back'] as const).filter((s) => input[s] && input[s] > 0);
  const sized = new Map(sides.map((s) => [s, fit(input[s]!)]));
  const tallest = Math.max(0, ...[...sized.values()].map((p) => p.h));
  let centerY = size.wrapH / 2;
  if (!size.handle) {
    // measured from the bottom of the cup, the wrap standing in the middle of the body
    const wrapBottom = (size.height - size.wrapH) / 2;
    centerY = size.wrapH - ((input.lift ?? DEFAULT_LIFT) - wrapBottom);
  }
  centerY = Math.max(tallest / 2 + EDGE, Math.min(size.wrapH - tallest / 2 - EDGE, centerY));
  const art: Partial<Record<Side, Rect>> = {};
  for (const [s, p] of sized) art[s] = { x: centers[s] - p.w / 2, y: centerY - p.h / 2, w: p.w, h: p.h };
  const rects = Object.values(art);
  if (!rects.length) return { size, round, slot, centers, centerY, art };
  const content = union(rects);
  const x0 = Math.max(0, content.x - BLEED);
  const y0 = Math.max(0, content.y - BLEED);
  const x1 = Math.min(size.wrapW, content.x + content.w + BLEED);
  const y1 = Math.min(size.wrapH, content.y + content.h + BLEED);
  return { size, round, slot, centers, centerY, art, content, crop: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } };
}

function union(rects: Rect[]): Rect {
  const x0 = Math.min(...rects.map((r) => r.x));
  const y0 = Math.min(...rects.map((r) => r.y));
  const x1 = Math.max(...rects.map((r) => r.x + r.w));
  const y1 = Math.max(...rects.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export interface PlacedStrip {
  /** Which mug of the page's list. */
  index: number;
  strip: StripLayout & { crop: Rect };
  /** The strip's marks, art and label together on the page. */
  block: Rect;
  /** The page's y of the crop's top edge. */
  cropTop: number;
}

export interface PageLayout {
  pageW: number;
  pageH: number;
  /** Where the printer can print. */
  room: Rect;
  mirrored: boolean;
  strips: PlacedStrip[];
  /** Mugs that are blank on both sides (nothing to print). */
  blank: number[];
  /** Mugs that don't fit below the others. */
  overflow: number[];
  /** Paper left under the last strip, inches. */
  left: number;
}

export function pageSize(paper: Paper, orientation: Orientation): { w: number; h: number } {
  const [short, long] = [Math.min(paper.w, paper.h), Math.max(paper.w, paper.h)];
  return orientation === 'portrait' ? { w: short, h: long } : { w: long, h: short };
}

/** Stacks the mugs' strips down the page from the top, each across the page's middle. */
export function pageLayout(paper: Paper, orientation: Orientation, mugs: StripInput[], mirrored: boolean, margin = MARGIN): PageLayout {
  const { w: pageW, h: pageH } = pageSize(paper, orientation);
  const room = { x: margin, y: margin, w: pageW - 2 * margin, h: pageH - 2 * margin };
  const strips: PlacedStrip[] = [];
  const blank: number[] = [];
  const overflow: number[] = [];
  let y = room.y;
  mugs.forEach((m, index) => {
    const strip = stripLayout(m, room.w);
    if (!strip.crop) return void blank.push(index);
    const hh = TICK_BAND + strip.crop.h + LABEL_BAND;
    if (overflow.length || y + hh > room.y + room.h + 1e-9) return void overflow.push(index);
    strips.push({ index, strip: strip as PlacedStrip['strip'], block: { x: room.x, y, w: room.w, h: hh }, cropTop: y + TICK_BAND });
    y += hh;
  });
  return { pageW, pageH, room, mirrored, strips, blank, overflow, left: room.y + room.h - y };
}

/** The page's x of a point `x` along a strip's wrap: the wrap's middle on the page's middle, turned round when mirrored. */
export function pageX(page: Pick<PageLayout, 'pageW' | 'mirrored'>, strip: Pick<StripLayout, 'size'>, x: number): number {
  const d = x - strip.size.wrapW / 2;
  return page.pageW / 2 + (page.mirrored ? -d : d);
}

/** The page's y of a point `y` down a strip's wrap. */
export const pageY = (placed: Pick<PlacedStrip, 'cropTop' | 'strip'>, y: number): number => placed.cropTop + (y - placed.strip.crop.y);

/** A page's size in pixels at `ppi`: exactly the inches times the pixels an inch. */
export const pagePixels = (page: Pick<PageLayout, 'pageW' | 'pageH'>, ppi: number): { w: number; h: number } => ({
  w: Math.round(page.pageW * ppi),
  h: Math.round(page.pageH * ppi),
});

/** The printed page's SVG size: real inches, one user unit an inch, so the print needs no scaling. */
export const svgSize = (page: Pick<PageLayout, 'pageW' | 'pageH'>): { width: string; height: string; viewBox: string } => ({
  width: `${page.pageW}in`,
  height: `${page.pageH}in`,
  viewBox: `0 0 ${page.pageW} ${page.pageH}`,
});
