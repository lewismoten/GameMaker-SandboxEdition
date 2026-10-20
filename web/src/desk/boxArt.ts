// "Screenshots" for the Game-Maker box on the desk, drawn from the free sample games'
// real maps: the area where each game's first level starts.
import type { CatalogEntry } from '../project/files';
import { parseGame, NOSCENE } from '../formats/game';
import { parseMap, MLEN, MWID } from '../formats/map';
import { BACKBL, BLEN, parseBlocks } from '../formats/blocks';
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
