// "Screenshots" for the Game-Maker box on the desk, drawn from the free sample games'
// real maps: the area where each game's first level starts.
import type { CatalogEntry } from '../project/files';
import { parseGame, NOSCENE } from '../formats/game';
import { parseMap, MLEN, MWID } from '../formats/map';
import { BACKBL, BLEN, MONBL, TRANSPARENT, parseBlocks } from '../formats/blocks';
import { parseMonsters } from '../formats/monster';
import { parsePalette } from '../formats/palette';
import { paintIndexed } from '../editor/draw';

async function fetchFile(entry: CatalogEntry, name: string): Promise<Uint8Array | undefined> {
  const n = name.toLowerCase();
  if (!entry.files.includes(n)) return undefined;
  const r = await fetch(`./${entry.path}${n}`).catch(() => undefined);
  return r?.ok ? new Uint8Array(await r.arrayBuffer()) : undefined;
}

/** Renders `cols` x `rows` blocks around the first level's starting point. */
export async function renderShot(entry: CatalogEntry, canvas: HTMLCanvasElement, cols = 8, rows = 6): Promise<boolean> {
  if (!entry.gam) return false;
  const gam = await fetchFile(entry, entry.gam);
  if (!gam) return false;
  const game = parseGame(gam);
  const start = game.scenes[0]?.links.find((l) => l.toScene !== NOSCENE);
  const scene = start ? game.scenes[start.toScene] : game.scenes.find((s) => s.gametype === 10);
  if (!scene) return false;
  const [palB, mapB, bblB] = await Promise.all([0, 1, 2].map((i) => (scene.files[i] ? fetchFile(entry, scene.files[i]) : undefined)));
  if (!palB || !mapB || !bblB) return false;
  const pal = parsePalette(palB);
  const map = parseMap(mapB);
  const blocks = parseBlocks(bblB, BACKBL);
  const cx = (start?.to.x ?? 50) - Math.floor(cols / 2);
  const cy = (start?.to.y ?? 50) - Math.floor(rows / 2);
  const w = cols * BLEN;
  const pixels = new Uint8Array(w * rows * BLEN);
  for (let by = 0; by < rows; by++)
    for (let bx = 0; bx < cols; bx++) {
      const mx = (((cx + bx) % MLEN) + MLEN) % MLEN;
      const my = (((cy + by) % MWID) + MWID) % MWID;
      const b = blocks[map.blocks[my * MLEN + mx]] ?? blocks[0];
      for (let y = 0; y < BLEN; y++) pixels.set(b.pixels.subarray(y * BLEN, y * BLEN + BLEN), (by * BLEN + y) * w + bx * BLEN);
    }
  paintIndexed(canvas, pixels, w, rows * BLEN, pal);
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
