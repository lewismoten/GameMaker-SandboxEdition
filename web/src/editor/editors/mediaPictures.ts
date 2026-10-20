// Pictures of the between-scene graphics as the game shows them: backdrops as the 320x200
// window drawbkd draws, text screens as Display_File's pages, slide shows by their first
// slide. Used by the backdrop, text screen and slide show editors and their media bins.
import type { GameFiles } from '../../project/files';
import { decodeGif, isGif, type IndexedImage } from '../../formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '../../formats/fli';
import { parseBackdrop, parseSlideList, textLines } from '../../formats/graphicScripts';
import { defaultPalette, type Palette } from '../../formats/palette';
import { Screen, SIZEX, SIZEY } from '../../gfx/screen';
import { match, RGB_PURPLE, RGB_RED } from '../../engine/showGraphic';
import { paintIndexed } from '../draw';
import { fileThumb } from '../thumbs';
import { kindOf } from '../project';

/** A 320x200 screen of palette indices and the palette it is shown with. */
export interface ScreenPicture {
  pixels: Uint8Array;
  palette: Palette;
}

/** Display_File: 16 lines a page, 31 characters a line, from column 5 and row 5 (in 8x8 cells). */
export const TEXT_PAGE_LINES = 16;
export const TEXT_LINE_CHARS = 31;

const gifCache = new WeakMap<Uint8Array, IndexedImage | null>();
function gifOf(bytes: Uint8Array | undefined): IndexedImage | undefined {
  if (!bytes) return undefined;
  let g = gifCache.get(bytes);
  if (g === undefined) {
    try {
      g = isGif(bytes) ? decodeGif(bytes) : null;
    } catch {
      g = null;
    }
    gifCache.set(bytes, g);
  }
  return g ?? undefined;
}

export interface BackdropInfo {
  x: number;
  y: number;
  /** The name written in the .bkd. */
  gif: string;
  /** The game file it opens (maybe under the CD's underscore name), if any. */
  resolved?: string;
  image?: IndexedImage;
}

/** What drawbkd opens for a .bkd. */
export function backdropInfo(files: GameFiles, bytes: Uint8Array): BackdropInfo {
  const b = parseBackdrop(bytes);
  const resolved = files.resolve(b.gif);
  return { ...b, resolved, image: resolved ? gifOf(files.get(resolved)) : undefined };
}

/** The screen a .gif or .bkd puts up (DrawGif / drawbkd), or undefined when it can't be drawn. */
export function pictureScreen(files: GameFiles, name: string): ScreenPicture | undefined {
  const kind = kindOf(name);
  let x = 0;
  let y = 0;
  let img: IndexedImage | undefined;
  if (kind === 'gif') img = gifOf(files.get(name));
  else if (kind === 'bkd') {
    const bytes = files.get(name);
    if (!bytes) return undefined;
    const b = backdropInfo(files, bytes);
    ({ x, y } = b);
    img = b.image;
  } else if (kind === 'fli') {
    const bytes = files.get(name);
    if (!bytes || !isFli(bytes)) return undefined;
    const anim = parseFli(bytes);
    const c = newFliCanvas(anim);
    for (let f = 0; f < anim.frameCount; f++) applyFliFrame(anim, f, c);
    img = { pixels: c.pixels, width: anim.width, height: anim.height, palette: c.palette } as IndexedImage;
  }
  if (!img) return undefined;
  const pixels = new Uint8Array(SIZEX * SIZEY);
  for (let yy = 0; yy < SIZEY; yy++) {
    const iy = yy + y;
    if (iy < 0 || iy >= img.height) continue;
    for (let xx = 0; xx < SIZEX; xx++) {
      const ix = xx + x;
      if (ix >= 0 && ix < img.width) pixels[yy * SIZEX + xx] = img.pixels[iy * img.width + ix];
    }
  }
  return { pixels, palette: img.palette };
}

/** A black screen in a palette. */
export function blankScreen(palette: Palette = defaultPalette()): ScreenPicture {
  return { pixels: new Uint8Array(SIZEX * SIZEY), palette };
}

/** Paints a screen picture into a (new) canvas. */
export function screenCanvas(pic: ScreenPicture, className = 'pixel', canvas = document.createElement('canvas')): HTMLCanvasElement {
  canvas.className = className;
  paintIndexed(canvas, pic.pixels, SIZEX, SIZEY, pic.palette);
  return canvas;
}

let scratch: Screen | undefined;

/**
 * Display_File's pages over a picture: the lines in purple (matched in the picture's
 * palette), "MORE..." in red (matched in the game's palette) on every page but the last.
 */
export function textPages(lines: string[], over: ScreenPicture, gamePalette: Palette = over.palette): ScreenPicture[] {
  scratch ??= new Screen(document.createElement('canvas'));
  const s = scratch;
  const purple = match(over.palette, RGB_PURPLE);
  const red = match(gamePalette, RGB_RED);
  const pages: ScreenPicture[] = [];
  const count = Math.max(1, Math.ceil(lines.length / TEXT_PAGE_LINES));
  for (let p = 0; p < count; p++) {
    s.pixels.set(over.pixels);
    lines.slice(p * TEXT_PAGE_LINES, (p + 1) * TEXT_PAGE_LINES).forEach((line, i) => s.write(5 * 8, (5 + i) * 8, purple, line));
    if (p < count - 1) s.write(224, 168, red, 'MORE...');
    pages.push({ pixels: s.pixels.slice(), palette: over.palette });
  }
  return pages;
}

/**
 * A thumbnail of a slide show item as the game shows it: backdrops as their window, text
 * screens as their first page, slide shows as their first slide; others as fileThumb.
 */
export function mediaThumb(files: GameFiles, name: string, palette?: Palette, depth = 0): HTMLElement {
  const kind = kindOf(name);
  const bytes = files.get(name);
  const thumb = (pic: ScreenPicture) => screenCanvas(pic, 'thumb pixel');
  if (bytes && (kind === 'bkd' || kind === 'gif')) {
    const pic = pictureScreen(files, name);
    if (pic) return thumb(pic);
  }
  if (bytes && kind === 'txt') return thumb(textPages(textLines(bytes), blankScreen(palette ?? defaultPalette()))[0]);
  if (bytes && kind === 'lst' && depth < 3) {
    const first = parseSlideList(bytes).find((e) => files.has(e.name) && kindOf(e.name) !== 'txt');
    if (first) return mediaThumb(files, first.name, palette, depth + 1);
  }
  return fileThumb(name, bytes, { files, palette });
}
