// Pictures of Game-Maker's design tools for the magazine's `shot` block, drawn on a 320 x 200
// VGA screen from a game's first level (its palette, blocks, monsters and map): the palette
// grid, the block editor, monster animation strips and a whole-map overview. They show what
// the tools work on, with the game's own pixels; loaded only when a page with one is drawn.
import { Screen } from '../../gfx/screen';
import { firstLevels } from '../../gfx/levelPicture';
import { parseGame } from '../../formats/game';
import { BACKBL, BLEN, MONBL, TRANSPARENT, parseBlocks, type Block } from '../../formats/blocks';
import { MLEN, MWID, parseMap } from '../../formats/map';
import { parseMonsters } from '../../formats/monster';
import { defaultPalette, matchColor, parsePalette, type Palette } from '../../formats/palette';
import { fetchGameFile, type CatalogEntry } from '../../project/files';

export type Tool = 'palette' | 'blocks' | 'monsters' | 'map';

interface Level {
  pal: Palette;
  bbl: Block[];
  mbl: Block[];
  mons: ReturnType<typeof parseMonsters>;
  map?: ReturnType<typeof parseMap>;
  /** Where the hero arrives. */
  at: { x: number; y: number };
}

/** The files of the game's first level (palette, map, blocks, monsters). */
async function firstLevel(entry: CatalogEntry): Promise<Level | undefined> {
  const gam = entry.gam && (await fetchGameFile(entry, entry.gam));
  if (!gam) return undefined;
  const game = parseGame(gam);
  const [first] = [...firstLevels(game, 1)];
  const scene = first && game.scenes[first[0]];
  if (!scene) return undefined;
  const get = (k: number) => (scene.files[k] ? fetchGameFile(entry, scene.files[k]) : Promise.resolve(undefined));
  const [pal, map, bbl, mon, mbl] = await Promise.all([0, 1, 2, 3, 4].map(get));
  return {
    pal: pal ? parsePalette(pal) : defaultPalette(),
    map: map ? parseMap(map) : undefined,
    bbl: bbl ? parseBlocks(bbl, BACKBL) : [],
    mbl: mbl ? parseBlocks(mbl, MONBL) : [],
    mons: mon ? parseMonsters(mon) : [],
    at: first[1],
  };
}

/** How many colors a block uses (to pick lively ones). */
const colors = (b: Block | undefined) => new Set(b?.pixels ?? []).size;

/** The panel colors: the palette's nearest black, gray, white and a highlight. */
function inks(pal: Palette) {
  return {
    black: matchColor(pal, 0, 0, 0),
    dark: matchColor(pal, 14, 14, 18),
    gray: matchColor(pal, 40, 40, 44),
    white: matchColor(pal, 63, 63, 63),
    hi: matchColor(pal, 63, 52, 0),
  };
}

/** A block drawn `k` times bigger (transparent pixels skipped when `sprite`). */
function bigBlock(s: Screen, x: number, y: number, px: Uint8Array, k: number, sprite = false): void {
  for (let yy = 0; yy < BLEN; yy++)
    for (let xx = 0; xx < BLEN; xx++) {
      const c = px[yy * BLEN + xx];
      if (!sprite || c !== TRANSPARENT) s.boxFill(x + xx * k, y + yy * k, x + xx * k + k - 1, y + yy * k + k - 1, c);
    }
}

function palette(s: Screen, lv: Level): void {
  const ink = inks(lv.pal);
  s.clear(ink.dark);
  const k = 11;
  for (let i = 0; i < 256; i++) {
    const x = 10 + (i % 16) * k;
    const y = 12 + Math.floor(i / 16) * k;
    s.boxFill(x, y, x + k - 2, y + k - 2, i);
  }
  // the color most used by the level's blocks is the one being edited
  const count = new Uint32Array(256);
  for (const b of lv.bbl) for (const c of b.pixels) count[c]++;
  let pick = 1;
  for (let i = 1; i < 256; i++) if (count[i] > count[pick] && i !== ink.black) pick = i;
  const px = 10 + (pick % 16) * k;
  const py = 12 + Math.floor(pick / 16) * k;
  s.box(px - 2, py - 2, px + k - 1, py + k - 1, ink.white);
  s.box(206, 12, 309, 92, ink.white);
  s.boxFill(208, 14, 307, 90, pick);
  const rgb: [string, number][] = [
    ['RED', lv.pal[pick * 3]],
    ['GREEN', lv.pal[pick * 3 + 1]],
    ['BLUE', lv.pal[pick * 3 + 2]],
  ];
  rgb.forEach(([name, v], n) => {
    const y = 104 + n * 22;
    s.write(206, y, ink.white, name);
    s.write(286, y, ink.white, String(v & 63).padStart(2, ' '));
    s.box(206, y + 10, 309, y + 16, ink.gray);
    s.boxFill(207, y + 11, 207 + Math.round(((v & 63) / 63) * 101), y + 15, matchColor(lv.pal, n === 0 ? 63 : 0, n === 1 ? 63 : 0, n === 2 ? 63 : 0));
  });
  s.write(206, 176, ink.hi, `COLOR ${pick}`);
}

function blocks(s: Screen, lv: Level): void {
  const ink = inks(lv.pal);
  s.clear(ink.dark);
  const set = lv.bbl.map((b, i) => [b, i] as const).filter(([b]) => colors(b) > 1);
  if (!set.length) return;
  const [edit, num] = set.reduce((a, b) => (colors(b[0]) > colors(a[0]) ? b : a));
  // the block being drawn, 8 times its size, with a pixel grid
  bigBlock(s, 8, 14, edit.pixels, 8);
  for (let g = 0; g <= BLEN; g += 5) {
    s.line(8 + g * 8, 14, 8 + g * 8, 14 + 160, ink.black);
    s.line(8, 14 + g * 8, 8 + 160, 14 + g * 8, ink.black);
  }
  s.write(8, 182, ink.white, `BLOCK #${num}`);
  // the block set beside it, the one being drawn outlined
  const cols = 6;
  set.slice(0, cols * 7).forEach(([b, i], n) => {
    const x = 182 + (n % cols) * 22;
    const y = 14 + Math.floor(n / cols) * 22;
    s.drawBlock(x, y, b.pixels);
    if (i === num) s.box(x - 1, y - 1, x + BLEN, y + BLEN, ink.hi);
  });
  s.write(182, 182, ink.gray, 'BLOCK SET');
}

function monsters(s: Screen, lv: Level): void {
  const ink = inks(lv.pal);
  s.clear(ink.dark);
  const strips = lv.mons
    .filter((m) => m.used)
    .map((m) => m.pic.filter(([b]) => b < MONBL && lv.mbl[b]).map(([b]) => lv.mbl[b]))
    .filter((frames) => frames.length > 1 && frames.some((f) => colors(f) > 2))
    // one strip per different animation
    .filter((frames, i, all) => all.findIndex((o) => o[0].pixels.join() === frames[0].pixels.join()) === i)
    .slice(0, 4);
  strips.forEach((frames, row) => {
    const y = 10 + row * 46;
    s.write(8, y, ink.gray, `MONSTER ${row + 1}`);
    frames.slice(0, 6).forEach((f, n) => {
      const x = 8 + n * 52;
      s.boxFill(x, y + 10, x + 41, y + 51 - 10, ink.black);
      bigBlock(s, x + 1, y + 11, f.pixels, 2, true);
      s.box(x, y + 10, x + 41, y + 41, n === 0 ? ink.hi : ink.gray);
    });
  });
}

function map(s: Screen, lv: Level): void {
  const ink = inks(lv.pal);
  s.clear(ink.dark);
  if (!lv.map) return;
  // each block as its average color, two pixels a block
  const avg = lv.bbl.map((b) => {
    let r = 0;
    let g = 0;
    let bl = 0;
    for (const c of b.pixels) ((r += lv.pal[c * 3]), (g += lv.pal[c * 3 + 1]), (bl += lv.pal[c * 3 + 2]));
    const n = b.pixels.length || 1;
    return matchColor(lv.pal, r / n, g / n, bl / n);
  });
  const rows = Math.min(MWID, 94);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < MLEN; x++) {
      const c = avg[lv.map.blocks[y * MLEN + x]] ?? ink.black;
      s.boxFill(10 + x * 2, 6 + y * 2, 11 + x * 2, 7 + y * 2, c);
    }
  // one screen's worth (16 x 10 blocks) of it, outlined where the level starts
  const sx = Math.max(0, Math.min(MLEN - 16, lv.at.x - 8));
  const sy = Math.max(0, Math.min(rows - 10, lv.at.y - 5));
  s.box(10 + sx * 2, 6 + sy * 2, 10 + (sx + 16) * 2, 6 + (sy + 10) * 2, ink.hi);
  s.write(222, 12, ink.white, 'MAP');
  s.write(222, 28, ink.gray, '100 X 100');
  s.write(222, 38, ink.gray, 'BLOCKS');
  s.boxFill(222, 60, 230, 66, ink.hi);
  s.write(236, 60, ink.gray, 'SCREEN');
}

const DRAW: Record<Tool, (s: Screen, lv: Level) => void> = { palette, blocks, monsters, map };

/** The tool's picture for this game, as a PNG data URL, or undefined when it has no level. */
export async function toolShot(entry: CatalogEntry, tool: Tool): Promise<string | undefined> {
  const lv = await firstLevel(entry);
  if (!lv) return undefined;
  const canvas = document.createElement('canvas');
  const s = new Screen(canvas);
  s.setPalette(lv.pal);
  DRAW[tool](s, lv);
  s.present();
  return canvas.toDataURL();
}
