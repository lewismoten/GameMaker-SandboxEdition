// Text-page ink audit: PLAYGAME draws a .txt page in RGBPurple (50,10,50) matched to the palette
// that is up (ShowGraphic in code/GM/PLAYGAME.C: `if (!NewCols) NewCols=colors; Pixel Purple =
// RGBPurple.Match(NewCols)`), nearest by squared distance, first entry wins. A palette with no
// purple near (50,10,50) shows the page in another color, or in black. This finds every place a
// game's text page can show and the palette it is matched in, as the engine does
// (web/packages/engine/src/engine/showGraphic.ts, game.ts, funcKeys.ts):
//   title 0:0 before any palette (all black), menu items 0:4, 0:6, 0:7 in the menu picture's
//   palette, F1 instructions 0:6 in each level's palette, a level's intro 9 in the palette of the
//   level played before (or its own, after a lost life), its ending 10 in its own, won 1:0 and lost
//   1:2 in the last level's; a page inside a slide list (.lst) in the list's `cols`: the palette
//   of the picture shown before it in that list, all zeros before any.
// Display_File never clears: the page is written over what is on the screen. In a list or from
// the menu that is the picture before it. A page with no picture before it lands on a screen
// filled with palette index 0 (PLAYGAME's clears are BoxFill(...,0), PLAYGAME.C:1121, 2038), so
// this measures it against entry 0 of the palette that is up; after a level it may still show the
// level's last frame, which this can't see. A blank palette slot keeps the scene before it in the
// .gam's order (the C's globals), which this stands in for. Used by textPurpleCheck.ts and, as an
// advisory line, checkGames.ts; never part of a disk.
import { join } from 'node:path';
import { decodeGif, isGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { parseBackdrop, parseSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parsePalette, vga8 } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { playerLook } from '@lewismoten/gamemaker-sandbox-engine/engine/playerLook';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/textfit';
import { readPlayer } from './player';

type RGB = [number, number, number];
const W = 320;
const H = 200;
/** Display_File's text area: lines at x 40, rows 5..20 of 8 pixels. */
const AREA = { x0: 40, y0: 40, x1: 288, y1: 168 };

export interface TextPurpleFinding {
  /** The .txt page and where it shows (e.g. "menu 0:4 story.lst > page1.txt"). */
  where: string;
  file: string;
  /** The picture or .pal file whose palette the ink is matched in. */
  palette: string;
  /** Palette index and 6-bit levels the ink lands on. */
  index: number;
  shown: RGB;
  /** The levels PLAYGAME asks for (50,10,50, or the game's player.json color.rgb.purple). */
  want: RGB;
  /** Euclidean distance in 6-bit levels between shown and want. */
  distance: number;
  /** The page's background (the most common color under the text area), 6-bit levels. */
  paper: RGB;
  /** True when nothing of the game's is known to be behind the page (palette entry 0 assumed). */
  paperGuessed: boolean;
  /** WCAG contrast ratio of the ink on the paper. */
  contrast: number;
}

const lum = (c: RGB) => {
  const ch = c.map((v) => {
    const s = vga8(v) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};
export const contrastOf = (a: RGB, b: RGB): number => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** RGBdata::Match: nearest by squared distance, the first entry wins a tie. */
function matchIn(pal: Uint8Array, c: RGB): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < 256; i++) {
    const d = (pal[i * 3] - c[0]) ** 2 + (pal[i * 3 + 1] - c[1]) ** 2 + (pal[i * 3 + 2] - c[2]) ** 2;
    if (d < bestD) [best, bestD] = [i, d];
  }
  return best;
}

const rgbAt = (pal: Uint8Array, i: number): RGB => [pal[i * 3], pal[i * 3 + 1], pal[i * 3 + 2]];
const ext = (name: string) => (/\.[^.]*$/.exec(name)?.[0] ?? '').toLowerCase();

/** The screen as shown: its pixels and the DAC's palette. */
interface Screen {
  pixels: Uint8Array;
  dac: Uint8Array;
  /** The file the `colors` or `cols` palette came from. */
  from: string;
  /** Nothing of this game's own is known to be on it (a level's last frame). */
  unknown: boolean;
}

function paperOf(s: Screen): RGB {
  if (s.unknown) return rgbAt(s.dac, 0);
  const n = new Map<number, number>();
  for (let y = AREA.y0; y < AREA.y1; y++) for (let x = AREA.x0; x < AREA.x1; x++) n.set(s.pixels[y * W + x], (n.get(s.pixels[y * W + x]) ?? 0) + 1);
  const top = [...n.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return rgbAt(s.dac, top);
}

function drawImage(s: Screen, px: Uint8Array, w: number, h: number, x0: number, y0: number): void {
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [sx, sy] = [x + x0, y + y0];
      if (sx >= 0 && sx < W && sy >= 0 && sy < H) s.pixels[sy * W + sx] = px[y * w + x];
    }
  s.unknown = false;
}

interface Walk {
  files: Map<string, Uint8Array>;
  want: RGB;
  out: TextPurpleFinding[];
}

/** ShowGraphic on `file`: `cols` is the NewCols passed in (undefined: the game's `colors`). */
function walk(k: Walk, file: string, s: Screen, colors: Uint8Array, where: string, cols?: Uint8Array): void {
  const bytes = k.files.get(file.toLowerCase());
  if (!bytes) return;
  const e = ext(file);
  if (e === '.gif' || e === '.bkd') {
    let [name, x, y] = [file, 0, 0];
    if (e === '.bkd') {
      const b = parseBackdrop(bytes);
      [name, x, y] = [b.gif, b.x, b.y];
    }
    const g = k.files.get(name.toLowerCase());
    if (!g || !isGif(g)) return;
    const img = decodeGif(g);
    drawImage(s, img.pixels, img.width, img.height, x, y);
    s.dac = img.palette.slice();
    if (cols) [s.from] = [name.toLowerCase()];
    cols?.set(img.palette);
  } else if (e === '.fli') {
    if (!isFli(bytes)) return;
    const anim = parseFli(bytes);
    const c = newFliCanvas(anim);
    c.palette.set(s.dac);
    for (let f = 0; f < anim.frameCount; f++) applyFliFrame(anim, f, c);
    drawImage(s, c.pixels, anim.width, anim.height, 0, 0);
    s.dac = c.palette.slice();
    if (cols) s.from = file.toLowerCase();
    cols?.set(c.palette);
  } else if (e === '.txt') {
    const pal = cols ?? colors;
    const index = matchIn(pal, k.want);
    const shown = rgbAt(s.dac, index);
    const paper = paperOf(s);
    k.out.push({
      where: `${where}${file}`,
      file: file.toLowerCase(),
      palette: s.from,
      index,
      shown,
      want: k.want,
      distance: Math.hypot(shown[0] - k.want[0], shown[1] - k.want[1], shown[2] - k.want[2]),
      paper,
      paperGuessed: s.unknown,
      contrast: contrastOf(shown, paper),
    });
  } else if (e === '.lst') {
    // A list called without NewCols makes its own (zeroed here, as the engine does).
    const c = cols ?? new Uint8Array(768);
    if (!cols) s.from = '(a zeroed list palette)';
    for (const entry of parseSlideList(bytes)) walk(k, entry.name, s, colors, `${where}${file} > `, c);
  }
}

const blankScreen = (dac: Uint8Array, unknown: boolean, from: string): Screen => ({ pixels: new Uint8Array(W * H), dac: dac.slice(), unknown, from });

/** Every text page the game can show, with the ink it lands on. */
export function textPurpleOfGame(id: string, gamesDir: string): TextPurpleFinding[] {
  const files = readDisk(join(gamesDir, id, 'disk'));
  const gam = [...files.keys()].find((f) => f.endsWith('.gam'));
  if (!gam) return [];
  const game = parseGame(files.get(gam)!);
  const look = playerLook(readPlayer(id));
  const k: Walk = { files, want: look.rgb(`color.rgb.${String(readPlayer(id)['color.select.textPages'] ?? 'purple')}`), out: [] };
  const slot = (scene: number, n: number) => game.scenes[scene]?.files[n]?.toLowerCase() || undefined;

  // The title shows before any palette: `colors` is still all zeros.
  const zero = new Uint8Array(768);
  if (slot(0, 0)) walk(k, slot(0, 0)!, blankScreen(zero, false, '(no palette yet)'), zero, 'title 0:0 ');

  // The menu picture: its palette becomes `colors` for the menu's pages.
  const menu = blankScreen(zero, false, '(no menu picture)');
  const menuCols = new Uint8Array(768);
  if (slot(0, 2)) walk(k, slot(0, 2)!, menu, menuCols, 'menu ', menuCols);
  for (const n of [4, 6, 7]) {
    const f = slot(0, n);
    if (f) walk(k, f, { ...menu, pixels: menu.pixels.slice(), dac: menuCols.slice() }, menuCols, `menu 0:${n} `);
  }

  // Each level's palette (a blank slot keeps the one before).
  const pals: Uint8Array[] = [];
  const palNames: string[] = [];
  let last: Uint8Array = menuCols;
  let lastName = menu.from;
  game.scenes.forEach((_, i) => {
    const p = i > 1 ? slot(i, 0) : undefined;
    const b = p && files.get(p);
    if (b) [last, lastName] = [parsePalette(b), p];
    pals[i] = last;
    palNames[i] = lastName;
  });
  const levels = game.scenes.map((_, i) => i).filter((i) => i > 1);
  const before = (i: number) => {
    const from = game.scenes.flatMap((sc, j) => (j !== 1 && sc.links.some((l) => l.toScene === i) ? [j] : []));
    return [...new Set([...from, i])];
  };
  for (const i of levels) {
    const intro = slot(i, 9);
    if (intro)
      for (const j of before(i))
        walk(
          k,
          intro,
          blankScreen(j === 0 ? menuCols : pals[j], j !== 0, j === 0 ? menu.from : palNames[j]),
          j === 0 ? menuCols : pals[j],
          `level ${i} intro 9 (after ${j === 0 ? 'the menu' : `level ${j}`}) `,
        );
    const outro = slot(i, 10);
    if (outro) walk(k, outro, blankScreen(pals[i], true, palNames[i]), pals[i], `level ${i} ending 10 `);
    const help = slot(0, 6);
    if (help) walk(k, help, blankScreen(pals[i], true, palNames[i]), pals[i], `level ${i} F1 0:6 `);
  }
  const won = slot(1, 0);
  if (won)
    for (const i of levels.filter((j) => game.scenes[j].links.some((l) => l.toScene === 1)))
      walk(k, won, blankScreen(pals[i], true, palNames[i]), pals[i], `won 1:0 (from level ${i}) `);
  const lost = slot(1, 2);
  if (lost) for (const i of levels) walk(k, lost, blankScreen(pals[i], true, palNames[i]), pals[i], `lost 1:2 (in level ${i}) `);
  return k.out;
}
