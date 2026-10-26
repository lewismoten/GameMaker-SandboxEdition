// Text-fit audit: finds every screen where PLAYGAME draws text over a game's own pictures
// (text pages in slide shows, the menu, the high score table, the load and save screens) and
// checks that the text sits on plain paper: no painted border, frame, title lettering or art
// within a few pixels of a letter, and enough contrast to read. Used by `textfitCheck.ts`
// (cd web && npx vite-node ../games/kit/textfitCheck.ts <id>) and by any build that wants to
// assert it; never part of a disk.
//
// Where the text goes is PLAYGAME's (web/src/engine): Display_File writes 16 lines a page at
// x 40, rows 5..20 of 8 pixels, "MORE..." at (224, 168) between pages, in RGBPurple matched
// to the picture's palette; the menu writes the start scene's name at (96, 104) and its six
// items at x 80 from row 15, with a 6x5 marker at x 70; ShowHighScores writes "Top Ten
// Scores" at (104, 0), rows at x 20 from y 27 and "Hit any key" at (116, 192); the load and
// save screens list ten names at x 80, y 40 + 14i, with the marker at x 60 and messages at y 185.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeGif, isGif } from '../../web/src/formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '../../web/src/formats/fli';
import { parseBackdrop, parseSlideList, textLines } from '../../web/src/formats/graphicScripts';
import { parseGame, type Game } from '../../web/src/formats/game';
import { matchColor, parsePalette } from '../../web/src/formats/palette';
import { FONT8X8 } from '../../web/src/gfx/font8x8';

export const W = 320;
export const H = 200;

type RGB = [number, number, number];
const RED: RGB = [63, 10, 10];
const BLUE: RGB = [10, 10, 63];
const YELLOW: RGB = [63, 63, 0];

/** A string PLAYGAME writes, in a palette index, at a pixel position. */
interface TextItem {
  x: number;
  y: number;
  col: number;
  text: string;
  /** The color PLAYGAME asked for (RGBRed and friends); flagged when the screen shows something else. */
  want?: RGB;
  /** Marker boxes (menu cursors) are solid fills, not glyphs. */
  box?: { w: number; h: number };
}

/** One screen as shown: the picture under the text, the palette on the DAC and the text. */
export interface TextScreen {
  /** Where it comes from, e.g. "help.lst > help.txt p1". */
  name: string;
  kind: 'page' | 'menu' | 'scores' | 'load' | 'save';
  pixels: Uint8Array;
  palette: Uint8Array;
  texts: TextItem[];
}

export interface TextFitIssue {
  screen: string;
  text: string;
  x: number;
  y: number;
  /** Background pixels near the letters that are not the paper under them. */
  artPixels: number;
  /** WCAG contrast ratio of the text color against its paper. */
  contrast: number;
  problems: string[];
}

interface TextFitOptions {
  /** Pixels around each line that must be plain paper (default 2). */
  margin?: number;
  /** RGB distance (8-bit) from the paper that counts as art (default 72). */
  artDistance?: number;
  /** Art pixels tolerated per line (default 0). */
  allowArt?: number;
  /** Lowest contrast ratio allowed (default 3). */
  minContrast?: number;
}

const PAPER_PALETTE_SIZE = 768;
const PURPLE: RGB = [50, 10, 50];

export function readDisk(dir: string): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>();
  for (const f of readdirSync(dir)) files.set(f.toLowerCase(), new Uint8Array(readFileSync(join(dir, f))));
  return files;
}

const ext = (name: string) => (/\.[^.]*$/.exec(name)?.[0] ?? '').toLowerCase();
const match = (pal: Uint8Array, c: RGB) => matchColor(pal, c[0], c[1], c[2]);

class Shown {
  pixels = new Uint8Array(W * H);
  palette = new Uint8Array(PAPER_PALETTE_SIZE);
  /** The `cols` a slide list hands from entry to entry (the last picture's palette). */
  cols = new Uint8Array(PAPER_PALETTE_SIZE);
  clone(): Shown {
    const s = new Shown();
    s.pixels.set(this.pixels);
    s.palette.set(this.palette);
    s.cols.set(this.cols);
    return s;
  }
}

function drawImage(s: Shown, px: Uint8Array, w: number, h: number, x0 = 0, y0 = 0): void {
  for (let y = 0; y < h; y++) {
    const sy = y + y0;
    if (sy < 0 || sy >= H) continue;
    for (let x = 0; x < w; x++) {
      const sx = x + x0;
      if (sx >= 0 && sx < W) s.pixels[sy * W + sx] = px[y * w + x];
    }
  }
}

/** Walks a graphic file as ShowGraphic would, collecting each text page it draws. */
function walk(files: Map<string, Uint8Array>, file: string, s: Shown, gamePal: Uint8Array, out: TextScreen[], from: string, cols?: Uint8Array): void {
  const bytes = files.get(file.toLowerCase());
  if (!bytes) return;
  const e = ext(file);
  if (e === '.gif' || e === '.bkd') {
    let name = file;
    let x = 0;
    let y = 0;
    if (e === '.bkd') {
      const b = parseBackdrop(bytes);
      [name, x, y] = [b.gif, b.x, b.y];
    }
    const g = files.get(name.toLowerCase());
    if (!g || !isGif(g)) return;
    const img = decodeGif(g);
    drawImage(s, img.pixels, img.width, img.height, x, y);
    s.cols.set(img.palette);
    s.palette.set(img.palette);
  } else if (e === '.fli') {
    if (!isFli(bytes)) return;
    const anim = parseFli(bytes);
    const c = newFliCanvas(anim);
    c.palette.set(s.palette);
    c.pixels.set(s.pixels.subarray(0, c.pixels.length));
    for (let f = 0; f < anim.frameCount; f++) applyFliFrame(anim, f, c);
    drawImage(s, c.pixels, anim.width, anim.height);
    s.palette.set(c.palette);
    s.cols.set(c.palette);
  } else if (e === '.txt') {
    const col = match(cols ?? gamePal, PURPLE);
    const red = match(gamePal, RED);
    const lines = textLines(bytes);
    for (let p = 0; p * 16 < lines.length; p++) {
      const texts: TextItem[] = lines.slice(p * 16, p * 16 + 16).map((t, i) => ({ x: 40, y: (5 + i) * 8, col, text: t }));
      if (lines.length > (p + 1) * 16) texts.push({ x: 224, y: 168, col: red, text: 'MORE...', want: RED });
      out.push({ name: `${from}${file}${lines.length > 16 ? ` p${p + 1}` : ''}`, kind: 'page', pixels: s.pixels.slice(), palette: s.palette.slice(), texts });
    }
  } else if (e === '.lst') {
    for (const entry of parseSlideList(bytes)) walk(files, entry.name, s, gamePal, out, `${from}${file} > `, s.cols);
  }
}

function sceneFile(game: Game, scene: number, slot: number): string | undefined {
  const f = game.scenes[scene]?.files[slot];
  return f ? f.toLowerCase() : undefined;
}

/** The picture a graphic file leaves on the screen (for the menu, scores, load and save screens). */
function picture(files: Map<string, Uint8Array>, file: string): Shown {
  const s = new Shown();
  walk(files, file, s, s.palette, [], '');
  return s;
}

/** Every screen where PLAYGAME draws text over this game's pictures. */
export function textScreens(files: Map<string, Uint8Array>): TextScreen[] {
  const gam = [...files.keys()].find((f) => f.endsWith('.gam'));
  if (!gam) throw new Error('no .gam on the disk');
  const game = parseGame(files.get(gam)!);
  const out: TextScreen[] = [];
  const menuFile = sceneFile(game, 0, 2);
  const menu = menuFile ? picture(files, menuFile) : new Shown();

  // Every graphic slot that can show a text page: walk it from a black screen.
  const seen = new Set<string>();
  game.scenes.forEach((_, i) => {
    const slots = i === 0 ? [0, 4, 6, 7] : i === 1 ? [0, 2] : [9, 10];
    let gamePal: Uint8Array = menu.palette;
    if (i > 1) {
      const pal = sceneFile(game, i, 0);
      const b = pal && files.get(pal);
      if (b) gamePal = parsePalette(b);
    }
    for (const slot of slots) {
      const f = sceneFile(game, i, slot);
      if (!f || seen.has(f)) continue;
      seen.add(f);
      const s = i === 0 && slot !== 0 ? menu.clone() : new Shown();
      walk(files, f, s, gamePal, out, '');
    }
  });

  if (menuFile) {
    const blue = match(menu.palette, BLUE);
    const texts: TextItem[] = [{ x: 96, y: 104, col: blue, text: game.scenes[0].desc }];
    ['Play', 'Read Instructions', 'Read Storyline', 'See Credits', 'See Highest Scores', 'Quit'].forEach((t, i) => {
      texts.push({ x: 80, y: (15 + i) * 8, col: blue, text: t });
      texts.push({ x: 70, y: 121 - 8 + (i + 1) * 8, col: blue, text: '', box: { w: 6, h: 5 } });
    });
    out.push({ name: `menu ${menuFile}`, kind: 'menu', pixels: menu.pixels, palette: menu.palette, texts });
  }

  const scoresFile = sceneFile(game, 0, 8);
  if (scoresFile) {
    const s = picture(files, scoresFile);
    const red = match(s.palette, RED);
    const blue = match(s.palette, BLUE);
    const texts: TextItem[] = [{ x: 104, y: 0, col: red, text: 'Top Ten Scores' }];
    let space = 22;
    let y = 27;
    for (let j = 0; j < 10; j++) {
      // The widest row there can be: ten digits and a 22 letter name.
      texts.push({ x: 20, y, col: blue, text: `${String(1234567890 - j)} ${'M'.repeat(22)}` });
      y += space;
      if (j % 2 === 0) space--;
      space--;
    }
    texts.push({ x: 20, y, col: blue, text: `${'1234'.padStart(10)} Your Latest Score` });
    texts.push({ x: 116, y: 192, col: red, text: 'Hit any key' });
    out.push({ name: `scores ${scoresFile}`, kind: 'scores', pixels: s.pixels, palette: s.palette, texts });
  }

  for (const [slot, kind] of [
    [9, 'load'],
    [10, 'save'],
  ] as const) {
    const f = sceneFile(game, 0, slot);
    if (!f) continue;
    const s = picture(files, f);
    const yellow = match(s.palette, YELLOW);
    const red = match(s.palette, RED);
    const blue = match(s.palette, BLUE);
    const texts: TextItem[] = [];
    for (let i = 0; i < 10; i++) {
      texts.push({ x: 80, y: 40 + i * 14, col: yellow, text: 'M'.repeat(20) });
      texts.push({ x: 60, y: 35 - 8 + (i + 1) * 14, col: red, text: '', box: { w: 6, h: 5 } });
    }
    if (kind === 'load') texts.push({ x: 40, y: 185, col: blue, text: 'This game has not been saved!' });
    else texts.push({ x: 112, y: 185, col: blue, text: 'Game Saved!' });
    out.push({ name: `${kind} ${f}`, kind, pixels: s.pixels, palette: s.palette, texts });
  }
  return out;
}

/** The pixels a text item sets (GPutChar's transparent 8x8 glyphs, or a marker box). */
function glyphPixels(t: TextItem): [number, number][] {
  const out: [number, number][] = [];
  if (t.box) {
    for (let y = 0; y < t.box.h; y++) for (let x = 0; x < t.box.w; x++) out.push([t.x + x, t.y + y]);
    return out;
  }
  for (let i = 0; i < t.text.length; i++) {
    const base = (t.text.charCodeAt(i) & 0xff) * 8;
    for (let row = 0; row < 8; row++) {
      const bits = FONT8X8[base + row];
      for (let b = 0; b < 8; b++) if (bits & (1 << b)) out.push([t.x + i * 8 + b, t.y + row]);
    }
  }
  return out;
}

const rgb8 = (pal: Uint8Array, c: number): RGB => [0, 1, 2].map((k) => (pal[c * 3 + k] << 2) | (pal[c * 3 + k] >> 4)) as RGB;
const lin = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const lum = (c: RGB) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const contrastRatio = (a: RGB, b: RGB) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** The area a line of text needs: its letters' cells, from the first to the last letter, plus a margin. */
function zoneOf(t: TextItem, margin: number): { x0: number; y0: number; x1: number; y1: number } | undefined {
  const px = glyphPixels(t);
  if (!px.length) return undefined;
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of px) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  return { x0: x0 - margin, y0: y0 - margin, x1: x1 + margin, y1: y1 + margin };
}

/** The paper under a screen's text: the per-channel median color under all its zones. */
function paperOf(s: TextScreen, margin: number): RGB {
  const ch: number[][] = [[], [], []];
  for (const t of s.texts) {
    const z = zoneOf(t, margin);
    if (!z) continue;
    for (let y = Math.max(0, z.y0); y <= Math.min(H - 1, z.y1); y++)
      for (let x = Math.max(0, z.x0); x <= Math.min(W - 1, z.x1); x++) {
        const c = rgb8(s.palette, s.pixels[y * W + x]);
        for (let k = 0; k < 3; k++) ch[k].push(c[k]);
      }
  }
  return ch.map((a) => (a.sort((p, q) => p - q), a[a.length >> 1] ?? 0)) as RGB;
}

/** Marks every art pixel (not paper) inside a text zone; returns the issues. */
export function checkTextScreen(s: TextScreen, opts: TextFitOptions = {}, marks?: Uint8Array): TextFitIssue[] {
  const margin = opts.margin ?? 2;
  const dist = opts.artDistance ?? 72;
  const allow = opts.allowArt ?? 0;
  const minContrast = opts.minContrast ?? 3;
  const issues: TextFitIssue[] = [];
  for (const t of s.texts) {
    const z = zoneOf(t, margin);
    if (!z) continue;
    const problems: string[] = [];
    if (z.x0 + margin < 0 || z.y0 + margin < 0 || z.x1 - margin >= W || z.y1 - margin >= H) problems.push('off the screen');
    // The paper is what most of this line's own zone shows.
    const local: TextScreen = { ...s, texts: [t] };
    const paper = paperOf(local, margin);
    let art = 0;
    for (let y = Math.max(0, z.y0); y <= Math.min(H - 1, z.y1); y++)
      for (let x = Math.max(0, z.x0); x <= Math.min(W - 1, z.x1); x++) {
        const c = rgb8(s.palette, s.pixels[y * W + x]);
        const d = Math.hypot(c[0] - paper[0], c[1] - paper[1], c[2] - paper[2]);
        if (d > dist) {
          art++;
          if (marks) marks[y * W + x] = 1;
        }
      }
    if (art > allow) problems.push(`${art} art pixels within ${margin}px`);
    const contrast = contrastRatio(rgb8(s.palette, t.col), paper);
    if (contrast < minContrast) problems.push(`contrast ${contrast.toFixed(2)}`);
    // A palette that lacks the color (or a text page whose ink was matched in another palette) shows another one.
    if (t.want) {
      const shown = [0, 1, 2].map((k) => s.palette[t.col * 3 + k]);
      if (Math.hypot(shown[0] - t.want[0], shown[1] - t.want[1], shown[2] - t.want[2]) > 30)
        problems.push(`ink shows as rgb(${shown.join(',')}), not rgb(${t.want.join(',')})`);
    }
    if (problems.length) issues.push({ screen: s.name, text: t.box ? '[marker]' : t.text, x: t.x, y: t.y, artPixels: art, contrast, problems });
  }
  return issues;
}

/** The screen as the player sees it, as 8-bit RGB, with art pixels near text tinted magenta when `marks` is given. */
export function renderRgb(s: TextScreen, marks?: Uint8Array): Uint8Array {
  const out = new Uint8Array(W * H * 3);
  const px = s.pixels.slice();
  for (const t of s.texts) for (const [x, y] of glyphPixels(t)) if (x >= 0 && y >= 0 && x < W && y < H) px[y * W + x] = t.col;
  for (let i = 0; i < W * H; i++) {
    let c = rgb8(s.palette, px[i]);
    if (marks?.[i] && px[i] === s.pixels[i]) c = [255, 0, 255];
    out.set(c, i * 3);
  }
  return out;
}
