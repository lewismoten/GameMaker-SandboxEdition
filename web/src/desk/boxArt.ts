// "Screenshots" for the Game-Maker box on the desk, drawn from the free sample games'
// real maps: the area where each game's first level starts.
import { GameFiles, cdName, type CatalogEntry } from '../project/files';
import { parseGame, NOSCENE, type Point } from '../formats/game';
import { levelShot } from '../editor/editors/integrator/integratorArt';
import { parseMap, MLEN, MWID } from '../formats/map';
import { BACKBL, BLEN, MONBL, TRANSPARENT, parseBlocks } from '../formats/blocks';
import { parseMonsters } from '../formats/monster';
import { parsePalette } from '../formats/palette';
import { paintIndexed } from '../editor/core/draw';

async function fetchFile(entry: CatalogEntry, name: string): Promise<Uint8Array | undefined> {
  // the CD stores A-J.BKD as a_j.bkd (ISO 9660 names)
  const n = [name.toLowerCase(), cdName(name)].find((x) => entry.files.includes(x));
  if (!n) return undefined;
  const r = await fetch(`./${entry.path}${n}`).catch(() => undefined);
  return r?.ok ? new Uint8Array(await r.arrayBuffer()) : undefined;
}

/** How interesting a picture is: plenty of colors, and not one color filling it. */
function busyness(c: HTMLCanvasElement): number {
  const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  const counts = new Map<number, number>();
  for (let i = 0; i < d.length; i += 16) {
    const k = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const total = d.length / 16;
  const top = Math.max(...counts.values());
  return Math.min(counts.size, 40) * (1 - top / total);
}

/**
 * Renders `cols` x `rows` blocks of a level, with its monsters and the hero where he
 * arrives: the most colorful of the first few levels the game reaches (some games begin
 * with an "intro" level of lettering, or a dark one).
 */
export async function renderShot(entry: CatalogEntry, canvas: HTMLCanvasElement, cols = 8, rows = 6): Promise<boolean> {
  if (!entry.gam) return false;
  const gam = await fetchFile(entry, entry.gam);
  if (!gam) return false;
  const game = parseGame(gam);
  // levels in the order the game reaches them, each with where the hero arrives
  const arrivals = new Map<number, Point>();
  const queue = [0];
  const seen = new Set(queue);
  while (queue.length && arrivals.size < 5) {
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
  let best: HTMLCanvasElement | undefined;
  let bestScore = -1;
  for (const [i, at] of arrivals) {
    const scene = game.scenes[i];
    const names = scene.files.slice(0, 7).filter(Boolean);
    const bytes = await Promise.all(names.map((n) => fetchFile(entry, n)));
    const files = new GameFiles(names.flatMap((n, k) => (bytes[k] ? [[n, bytes[k]!] as [string, Uint8Array]] : [])));
    const shot = levelShot(files, scene, at, cols, rows);
    if (!shot) continue;
    const score = busyness(shot);
    if (score > bestScore) (best = shot), (bestScore = score);
  }
  if (!best) return false;
  canvas.width = best.width;
  canvas.height = best.height;
  canvas.getContext('2d')!.drawImage(best, 0, 0);
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
