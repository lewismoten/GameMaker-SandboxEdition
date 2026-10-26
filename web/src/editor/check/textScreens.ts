// The text pages a game shows, as PLAYGAME shows them (engine/showGraphic.ts Display_File): each
// page of 16 lines, its role (instructions, story, a level card…), the color its text is drawn in
// (the palette's nearest deep purple) and, where it can be known, the picture under it: a page
// that follows a picture or animation in a slide list, or a title-screen page over the menu.
import { decodeGif, isGif } from '../../formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '../../formats/fli';
import { ADVTYPE, type Game } from '../../formats/game';
import { parseBackdrop, parseSlideList, textLines } from '../../formats/graphicScripts';
import { PALETTE_SIZE } from '../../formats/palette';
import { match, RGB_PURPLE } from '../../engine/showGraphic';
import type { FileSource } from './sim';

export type TextRole = 'title' | 'menu' | 'story' | 'instructions' | 'credits' | 'scores' | 'won' | 'lost' | 'intro' | 'exit';

/** The screen under a page: 320 × 200 pixels and the palette showing. */
export interface Backdrop {
  pixels: Uint8Array;
  palette: Uint8Array;
}

export interface TextPage {
  file: string;
  role: TextRole;
  /** The scene whose slot shows it (0 the title, 1 the ending, a level). */
  scene: number;
  /** Which page of the file (from 0), and how many it has. */
  page: number;
  pages: number;
  /** The page's lines, as Display_File cuts them (31 characters at most). */
  lines: string[];
  /** The palette index the text is drawn in. */
  color: number;
  /** The picture under the page, when it is known. */
  under?: Backdrop;
}

/** Text lines per page (rows 5 to 20). */
export const PAGE_LINES = 16;

interface Screen {
  pixels: Uint8Array;
  palette: Uint8Array;
  /** Every pixel is known (a whole picture was drawn). */
  known: boolean;
}

const blank = (): Screen => ({ pixels: new Uint8Array(320 * 200), palette: new Uint8Array(PALETTE_SIZE), known: false });
const ext = (n: string) => n.toLowerCase().split('.').pop() ?? '';

function drawGif(s: Screen, bytes: Uint8Array | undefined, x = 0, y = 0): Uint8Array | undefined {
  if (!bytes || !isGif(bytes)) return undefined;
  try {
    const img = decodeGif(bytes);
    for (let r = 0; r < img.height && r + y < 200; r++)
      for (let c = 0; c < img.width && c + x < 320; c++) s.pixels[(r + y) * 320 + c + x] = img.pixels[r * img.width + c];
    s.palette = img.palette.slice();
    if (!x && !y && img.width >= 320 && img.height >= 200) s.known = true;
    return img.palette;
  } catch {
    return undefined;
  }
}

function drawFli(s: Screen, bytes: Uint8Array | undefined): boolean {
  if (!bytes || !isFli(bytes)) return false;
  try {
    const anim = parseFli(bytes);
    const canvas = newFliCanvas(anim);
    canvas.palette.set(s.palette);
    canvas.pixels.set(s.pixels.subarray(0, Math.min(canvas.pixels.length, s.pixels.length)));
    for (let f = 0; f < anim.frameCount; f++) applyFliFrame(anim, f, canvas);
    s.pixels.set(canvas.pixels.subarray(0, s.pixels.length));
    s.palette = canvas.palette.slice();
    if (anim.width >= 320 && anim.height >= 200) s.known = true;
    return true;
  } catch {
    return false;
  }
}

/** Shows one file onto `s` as showGraphic does, telling `page` about each text page. */
function show(
  files: FileSource,
  name: string,
  s: Screen,
  cols: Uint8Array | undefined,
  gamePalette: Uint8Array,
  page: (lines: string[], n: number, pages: number, color: number, s: Screen, file: string) => void,
  depth = 0,
): void {
  const e = ext(name);
  const bytes = files.get(name);
  if (e === 'gif') {
    const p = drawGif(s, bytes);
    if (p && cols) cols.set(p);
  } else if (e === 'bkd') {
    if (!bytes) return;
    try {
      const b = parseBackdrop(bytes);
      const p = drawGif(s, files.get(b.gif), b.x, b.y);
      if (p && cols) cols.set(p);
    } catch {
      /* not a backdrop */
    }
  } else if (e === 'fli') {
    if (drawFli(s, bytes) && cols) cols.set(s.palette);
  } else if (e === 'txt') {
    if (!bytes) return;
    const color = match(cols ?? gamePalette, RGB_PURPLE);
    const lines = textLines(bytes);
    const pages = Math.max(1, Math.ceil(lines.length / PAGE_LINES));
    for (let n = 0; n < pages; n++) page(lines.slice(n * PAGE_LINES, (n + 1) * PAGE_LINES), n, pages, color, s, name);
  } else if (e === 'lst' && bytes && depth < 3) {
    const own = cols ?? new Uint8Array(PALETTE_SIZE);
    for (const entry of parseSlideList(bytes)) show(files, entry.name, s, own, gamePalette, page, depth + 1);
  }
}

const TITLE_ROLES: [number, TextRole][] = [
  [4, 'story'],
  [6, 'instructions'],
  [7, 'credits'],
];

/** The menu picture as it stays behind the menu and the title screens' pages (shown with the `colors` global as its palette). */
function menuOf(game: Game, files: FileSource, page: Parameters<typeof show>[5] = () => undefined): Screen {
  const menu = blank();
  const colors = new Uint8Array(PALETTE_SIZE);
  const f = game.scenes[0]?.files[2];
  if (f) show(files, f, menu, colors, colors, page);
  return menu;
}

/** The menu screen, when the game has a menu picture the check can draw. */
export function menuScreen(game: Game, files: FileSource): Backdrop | undefined {
  const m = menuOf(game, files);
  return m.known ? { pixels: m.pixels, palette: m.palette } : undefined;
}

/** Every text page the game shows from its scene slots, in the order a player meets them. */
export function textPages(game: Game, files: FileSource): TextPage[] {
  const out: TextPage[] = [];
  const add = (role: TextRole, scene: number) => (lines: string[], page: number, pages: number, color: number, s: Screen, file: string) =>
    out.push({
      file,
      role,
      scene,
      page,
      pages,
      lines,
      color,
      under: s.known ? { pixels: s.pixels.slice(), palette: s.palette.slice() } : undefined,
    });
  const title = game.scenes[0];
  if (title) {
    const screen = blank();
    const colors = new Uint8Array(PALETTE_SIZE);
    if (title.files[0]) show(files, title.files[0], screen, undefined, colors, add('title', 0));
    const menu = menuOf(game, files, add('menu', 0));
    for (const [slot, role] of TITLE_ROLES) {
      if (!title.files[slot]) continue;
      const s: Screen = title.files[2] ? { pixels: menu.pixels.slice(), palette: menu.palette.slice(), known: menu.known } : blank();
      show(files, title.files[slot], s, undefined, menu.palette, add(role, 0));
    }
  }
  const end = game.scenes[1];
  if (end) {
    if (end.files[0]) show(files, end.files[0], blank(), undefined, new Uint8Array(PALETTE_SIZE), add('won', 1));
    if (end.files[2]) show(files, end.files[2], blank(), undefined, new Uint8Array(PALETTE_SIZE), add('lost', 1));
  }
  game.scenes.forEach((sc, n) => {
    if (n < 2 || sc.gametype !== ADVTYPE) return;
    if (sc.files[9]) show(files, sc.files[9], blank(), undefined, new Uint8Array(PALETTE_SIZE), add('intro', n));
    if (sc.files[10]) show(files, sc.files[10], blank(), undefined, new Uint8Array(PALETTE_SIZE), add('exit', n));
  });
  return out;
}
