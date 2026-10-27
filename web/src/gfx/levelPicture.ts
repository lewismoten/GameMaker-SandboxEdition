// A picture of a level as the player first sees it, as palette-indexed pixels: the map around
// the block the hero arrives on, with its placed monsters and the hero. No canvas, so the
// build draws the home page's game pictures with it too (scripts/gameShots.ts), exactly as
// the page would (integratorArt.ts levelShot, gameShots.ts renderShot).
import { NOSCENE, type Game, type Point, type Scene } from '../formats/game';
import { parseMap, MLEN, MWID } from '../formats/map';
import { BACKBL, BLEN, CHARBL, MONBL, TRANSPARENT, parseBlocks } from '../formats/blocks';
import { parseMonsters } from '../formats/monster';
import { parseCharacter } from '../formats/character';
import { defaultPalette, paletteToRGBA, parsePalette, type Palette } from '../formats/palette';

export interface LevelPicture {
  width: number;
  height: number;
  /** One palette index per pixel. */
  pixels: Uint8Array;
  palette: Palette;
}

/** A game's files by name (GameFiles fits). */
export interface FileSource {
  get(name: string): Uint8Array | undefined;
}

/**
 * `cols` x `rows` blocks of a level's map centered on `at`, drawn the way the game draws
 * them: background blocks in the level's palette, placed monsters (first frame) and the
 * hero (first frame) standing on `at`. Undefined when the level has no map.
 */
export function levelPixels(files: FileSource, scene: Scene, at: Point, cols = 8, rows = 5): LevelPicture | undefined {
  const get = (i: number) => (scene.files[i] ? files.get(scene.files[i]) : undefined);
  const mapB = get(1);
  if (!mapB) return undefined;
  try {
    const palB = get(0);
    const palette = palB ? parsePalette(palB) : defaultPalette();
    const map = parseMap(mapB);
    const bblB = get(2);
    const blocks = bblB ? parseBlocks(bblB, BACKBL) : [];
    const monB = get(3);
    const mblB = get(4);
    const mons = monB ? parseMonsters(monB) : [];
    const mblocks = mblB ? parseBlocks(mblB, MONBL) : [];
    const W = cols * BLEN;
    const pixels = new Uint8Array(W * rows * BLEN);
    const paint = (px: Uint8Array | undefined, bx: number, by: number, transparent: boolean) => {
      if (!px || bx < 0 || by < 0 || bx >= cols || by >= rows) return;
      for (let yy = 0; yy < BLEN; yy++)
        for (let xx = 0; xx < BLEN; xx++) {
          const c = px[yy * BLEN + xx];
          if (!transparent || c !== TRANSPARENT) pixels[(by * BLEN + yy) * W + bx * BLEN + xx] = c;
        }
    };
    const x0 = at.x - Math.floor(cols / 2);
    const y0 = at.y - Math.floor((rows - 1) / 2);
    for (let by = 0; by < rows; by++)
      for (let bx = 0; bx < cols; bx++) {
        const mx = (((x0 + bx) % MLEN) + MLEN) % MLEN;
        const my = (((y0 + by) % MWID) + MWID) % MWID;
        const cell = my * MLEN + mx;
        paint((blocks[map.blocks[cell]] ?? blocks[0])?.pixels, bx, by, false);
        const placed = map.monsters[map.mons[cell]];
        const pic = placed && mons[placed.monnum]?.pic[0]?.[0];
        if (pic !== undefined && pic >= 0) paint(mblocks[pic]?.pixels, bx, by, true);
      }
    // the hero
    const chrB = get(5);
    const cblB = get(6);
    if (chrB && cblB) {
      const frame = parseCharacter(chrB).sequences[0]?.frames[0];
      const cbl = parseBlocks(cblB, CHARBL);
      if (frame) {
        paint(cbl[frame.pic1]?.pixels, at.x - x0, at.y - y0, true);
        paint(cbl[frame.pic2]?.pixels, at.x - x0, at.y - y0 + 1, true);
      }
    }
    return { width: W, height: rows * BLEN, pixels, palette };
  } catch {
    return undefined;
  }
}

/**
 * The first few levels in the order the game reaches them, each with where the hero
 * arrives (some games begin with an "intro" level of lettering, or a dark one). A game
 * whose front end links nowhere: its first level, from the middle of the map.
 */
export function firstLevels(game: Game, max = 5): Map<number, Point> {
  const arrivals = new Map<number, Point>();
  const queue = [0];
  const seen = new Set(queue);
  while (queue.length && arrivals.size < max) {
    const from = game.scenes[queue.shift()!];
    for (const l of from?.links ?? []) {
      if (l.toScene === NOSCENE || !game.scenes[l.toScene]) continue;
      if (game.scenes[l.toScene].gametype === 10 && !arrivals.has(l.toScene)) arrivals.set(l.toScene, l.to);
      if (!seen.has(l.toScene)) (seen.add(l.toScene), queue.push(l.toScene));
    }
  }
  if (!arrivals.size) {
    const i = game.scenes.findIndex((s) => s.gametype === 10);
    if (i >= 0) arrivals.set(i, { x: 50, y: 50 });
  }
  return arrivals;
}

/** How interesting a picture is: plenty of colors, and not one color filling it (every 4th pixel looked at). */
export function busyness(pic: LevelPicture): number {
  const rgb = paletteToRGBA(pic.palette);
  const counts = new Map<number, number>();
  for (let i = 0; i < pic.pixels.length; i += 4) {
    const k = rgb[pic.pixels[i]] & 0xffffff;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const total = pic.pixels.length / 4;
  const top = Math.max(...counts.values());
  return Math.min(counts.size, 40) * (1 - top / total);
}

/** The most colorful of `pictures` (the first of equals), or undefined. */
export function busiest(pictures: (LevelPicture | undefined)[]): LevelPicture | undefined {
  let best: LevelPicture | undefined;
  let bestScore = -1;
  for (const p of pictures) {
    if (!p) continue;
    const score = busyness(p);
    if (score > bestScore) ((best = p), (bestScore = score));
  }
  return best;
}

/** The pictures the build draws for each listed game (scripts/gameShots.ts): a home page tile's (8 x 5 blocks) and a screen's (16 x 10). */
export const BUILT_SHOTS: readonly (readonly [number, number])[] = [
  [8, 5],
  [16, 10],
];

/** Where the build puts a game's picture of `cols` x `rows` blocks. */
export function builtShotPath(id: string, cols: number, rows: number): string {
  return `games/shots/${id}-${cols}x${rows}.png`;
}

/** A game's picture: the most colorful of the first levels it reaches (renderShot's choice). */
export function gamePicture(files: FileSource, game: Game, cols: number, rows: number): LevelPicture | undefined {
  return busiest([...firstLevels(game)].map(([i, at]) => levelPixels(files, game.scenes[i], at, cols, rows)));
}

/**
 * `w` x `h` blocks of a map from (`x`, `y`), as the game draws it: the background blocks in
 * the palette of the scene that uses the map, with its placed monsters on top (their first
 * animation frame). Undefined when no level uses the map, or its palette, map or blocks are missing.
 */
export function mapPixels(files: FileSource, game: Game, mapName: string, x: number, y: number, w = 16, h = 10): LevelPicture | undefined {
  const scene = game.scenes.find((s) => s.gametype === 10 && s.files[1]?.toLowerCase() === mapName.toLowerCase());
  return scene && scenePixels(files, scene, x, y, w, h);
}

/**
 * `w` x `h` blocks of a scene's map from (`x`, `y`) in its own palette and blocks, with its
 * placed monsters (first frame). `cells` stands in for the map's background blocks (the
 * printed Level Maps draw the ground over what they hide). Undefined when the palette, map
 * or blocks are missing.
 */
export function scenePixels(files: FileSource, scene: Scene, x: number, y: number, w = 16, h = 10, cells?: Uint8Array): LevelPicture | undefined {
  const get = (i: number) => (scene.files[i] ? files.get(scene.files[i]) : undefined);
  const [palB, mapB, bblB, monB, mblB] = [0, 1, 2, 3, 4].map(get);
  if (!palB || !mapB || !bblB) return undefined;
  const palette = parsePalette(palB);
  const map = parseMap(mapB);
  const back = cells ?? map.blocks;
  const blocks = parseBlocks(bblB, BACKBL);
  const mons = monB ? parseMonsters(monB) : [];
  const mblocks = mblB ? parseBlocks(mblB, MONBL) : [];
  const W = w * BLEN;
  const pixels = new Uint8Array(W * h * BLEN);
  const paint = (px: Uint8Array, bx: number, by: number, transparent: boolean) => {
    for (let yy = 0; yy < BLEN; yy++)
      for (let xx = 0; xx < BLEN; xx++) {
        const c = px[yy * BLEN + xx];
        if (!transparent || c !== TRANSPARENT) pixels[(by * BLEN + yy) * W + bx * BLEN + xx] = c;
      }
  };
  for (let by = 0; by < h; by++)
    for (let bx = 0; bx < w; bx++) {
      const mx = (((x + bx) % MLEN) + MLEN) % MLEN;
      const my = (((y + by) % MWID) + MWID) % MWID;
      const cell = my * MLEN + mx;
      paint((blocks[back[cell]] ?? blocks[0]).pixels, bx, by, false);
      const placed = map.monsters[map.mons[cell]];
      const mon = placed && mons[placed.monnum];
      const pic = mon?.pic[0]?.[0];
      if (pic !== undefined && pic >= 0 && mblocks[pic]) paint(mblocks[pic].pixels, bx, by, true);
    }
  return { width: W, height: h * BLEN, pixels, palette };
}

/** A view of a map: its name, the top-left block and the size in blocks. */
export type MapView = [map: string, x: number, y: number, w: number, h: number];

/**
 * The map views the build draws for an original game, from its box's screenshot spots: each
 * as a VGA screen (the box, the Game-Maker box, the manual cover) and the first as its disk
 * label's strip (desk/disks/diskLabel.ts).
 */
export function builtMapViews(shots: readonly [string, number, number][] | undefined): MapView[] {
  if (!shots?.length) return [];
  const [m, x, y] = shots[0];
  return [...shots.map(([map, sx, sy]): MapView => [map, sx, sy, 16, 10]), [m, x + 2, y + 3, 12, 4]];
}

/** Where the build puts a map view's picture. */
export function builtMapShotPath(id: string, [map, x, y, w, h]: MapView): string {
  return `games/shots/${id}-${map.toLowerCase().replace(/[^a-z0-9_.]/g, '_')}-${x}-${y}-${w}x${h}.png`;
}

/** A hero as a character file draws him: chr, cbl and pal file names, and which sequence (manual/printables Portrait). */
export interface HeroSpec {
  chr: string;
  cbl: string;
  pal: string;
  seq?: number;
}

/** The hero an original game's paper shows (its hero sticker, else its ID card's portrait): the disk label and manual cover draw him. */
export function heroOf(
  original: { printables?: { stickers?: { hero?: HeroSpec }[]; items?: { kind: string; portrait?: HeroSpec }[] } } | undefined,
): HeroSpec | undefined {
  const p = original?.printables;
  return p?.stickers?.find((s) => s.hero)?.hero ?? p?.items?.flatMap((i) => (i.kind === 'idcard' && i.portrait ? [i.portrait] : []))[0];
}

/** The hero as he stands in his first frame: top and bottom block, 20 x 40, TRANSPARENT around him. */
export function heroPixels(files: FileSource, p: HeroSpec): LevelPicture | undefined {
  const [chrB, cblB, palB] = [p.chr, p.cbl, p.pal].map((f) => files.get(f));
  if (!chrB || !cblB || !palB) return undefined;
  try {
    const frame = parseCharacter(chrB).sequences[p.seq ?? 0].frames[0];
    const blocks = parseBlocks(cblB, CHARBL);
    const pixels = new Uint8Array(BLEN * BLEN * 2).fill(TRANSPARENT);
    for (const [pic, y0] of [
      [frame.pic1, 0],
      [frame.pic2, BLEN],
    ] as const)
      if (blocks[pic]) pixels.set(blocks[pic].pixels, y0 * BLEN);
    return { width: BLEN, height: BLEN * 2, pixels, palette: parsePalette(palB) };
  } catch {
    return undefined;
  }
}

/** Where the build puts a game's hero (heroOf), when it drew him. */
export function builtHeroPath(id: string): string {
  return `games/shots/${id}-hero.png`;
}
