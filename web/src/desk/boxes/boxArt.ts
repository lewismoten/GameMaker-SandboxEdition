// "Screenshots" for the Game-Maker box on the desk, drawn from the free sample games'
// real maps: the area where each game's first level starts.
import { GameFiles, fetchGameFile, type CatalogEntry } from '../../project/files';
import { parseGame } from '../../formats/game';
import { BUILT_SHOTS, builtShotPath, busiest, firstLevels, levelPixels } from '../../gfx/levelPicture';
import { parseMap, MLEN, MWID } from '../../formats/map';
import { BACKBL, BLEN, MONBL, TRANSPARENT, parseBlocks } from '../../formats/blocks';
import { parseMonsters } from '../../formats/monster';
import { parsePalette } from '../../formats/palette';
import { paintIndexed } from '../../editor/core/draw';

async function fetchFile(entry: CatalogEntry, name: string): Promise<Uint8Array | undefined> {
  // the CD stores A-J.BKD as a_j.bkd (ISO 9660 names); fetched once, shared
  return fetchGameFile(entry, name);
}

/** A picture the build drew of a listed game (games/shots/), if it drew this size. */
async function builtShot(entry: CatalogEntry, cols: number, rows: number): Promise<HTMLImageElement | undefined> {
  if (!entry.shots || !BUILT_SHOTS.some(([c, r]) => c === cols && r === rows)) return undefined;
  const img = new Image();
  img.src = `./${builtShotPath(entry.id, cols, rows)}`;
  return img.decode().then(
    () => img,
    () => undefined,
  );
}

/**
 * Renders `cols` x `rows` blocks of a level, with its monsters and the hero where he
 * arrives: the most colorful of the first few levels the game reaches (some games begin
 * with an "intro" level of lettering, or a dark one). A built site has the usual sizes
 * drawn already (one small picture instead of the game's files).
 */
export async function renderShot(entry: CatalogEntry, canvas: HTMLCanvasElement, cols = 8, rows = 6): Promise<boolean> {
  if (!entry.gam) return false;
  const built = await builtShot(entry, cols, rows);
  if (built) {
    canvas.width = built.naturalWidth;
    canvas.height = built.naturalHeight;
    canvas.getContext('2d')!.drawImage(built, 0, 0);
    return true;
  }
  const gam = await fetchFile(entry, entry.gam);
  if (!gam) return false;
  const game = parseGame(gam);
  const levels = [...firstLevels(game)];
  const pictures = await Promise.all(
    levels.map(async ([i, at]) => {
      const names = game.scenes[i].files.slice(0, 7).filter(Boolean);
      const bytes = await Promise.all(names.map((n) => fetchFile(entry, n)));
      const files = new GameFiles(names.flatMap((n, k) => (bytes[k] ? [[n, bytes[k]!] as [string, Uint8Array]] : [])));
      return levelPixels(files, game.scenes[i], at, cols, rows);
    }),
  );
  const best = busiest(pictures);
  if (!best) return false;
  paintIndexed(canvas, best.pixels, best.width, best.height, best.palette);
  return true;
}

/**
 * A screenshot of part of a map, as the game draws it: the background blocks in the
 * palette of the scene that uses the map, with its placed monsters on top (their first
 * animation frame). Returns a canvas `w` x `h` blocks large, or undefined.
 */
export async function mapShot(entry: CatalogEntry, mapName: string, x: number, y: number, w = 16, h = 10): Promise<HTMLCanvasElement | undefined> {
  const gamName = entry.gam;
  const gam = gamName ? await fetchFile(entry, gamName) : undefined;
  if (!gam) return undefined;
  const scene = parseGame(gam).scenes.find((s) => s.gametype === 10 && s.files[1]?.toLowerCase() === mapName.toLowerCase());
  if (!scene) return undefined;
  const get = (i: number) => (scene.files[i] ? fetchFile(entry, scene.files[i]) : Promise.resolve(undefined));
  const [palB, mapB, bblB, monB, mblB] = await Promise.all([0, 1, 2, 3, 4].map(get));
  if (!palB || !mapB || !bblB) return undefined;
  const pal = parsePalette(palB);
  const map = parseMap(mapB);
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
      paint((blocks[map.blocks[cell]] ?? blocks[0]).pixels, bx, by, false);
      const placed = map.monsters[map.mons[cell]];
      const mon = placed && mons[placed.monnum];
      const pic = mon?.pic[0]?.[0];
      if (pic !== undefined && pic >= 0 && mblocks[pic]) paint(mblocks[pic].pixels, bx, by, true);
    }
  const canvas = document.createElement('canvas');
  paintIndexed(canvas, pixels, W, h * BLEN, pal);
  return canvas;
}
