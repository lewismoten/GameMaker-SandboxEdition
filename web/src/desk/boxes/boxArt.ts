// "Screenshots" for the Game-Maker box on the desk, drawn from the free sample games'
// real maps: the area where each game's first level starts.
import { GameFiles, fetchGameFile, type CatalogEntry } from '../../project/files';
import { parseGame } from '../../formats/game';
import {
  BUILT_SHOTS,
  builtMapShotPath,
  builtMapViews,
  builtShotPath,
  busiest,
  firstLevels,
  levelPixels,
  mapPixels,
  type MapView,
} from '../../gfx/levelPicture';
import { paintIndexed } from '../../editor/core/draw';

async function fetchFile(entry: CatalogEntry, name: string): Promise<Uint8Array | undefined> {
  // the CD stores A-J.BKD as a_j.bkd (ISO 9660 names); fetched once, shared
  return fetchGameFile(entry, name);
}

/** A picture the build drew (games/shots/), or undefined if it is not there. */
function loadImage(path: string): Promise<HTMLImageElement | undefined> {
  const img = new Image();
  img.src = `./${path}`;
  return img.decode().then(
    () => img,
    () => undefined,
  );
}

/** A picture on a canvas of its own size. */
function onCanvas(img: HTMLImageElement, canvas = document.createElement('canvas')): HTMLCanvasElement {
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext('2d')!.drawImage(img, 0, 0);
  return canvas;
}

/** The picture the build drew of a listed game at this size, if it drew one. */
function builtShot(entry: CatalogEntry, cols: number, rows: number): Promise<HTMLImageElement | undefined> {
  if (!entry.shots || !BUILT_SHOTS.some(([c, r]) => c === cols && r === rows)) return Promise.resolve(undefined);
  return loadImage(builtShotPath(entry.id, cols, rows));
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
  if (built) return !!onCanvas(built, canvas);
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
  const view: MapView = [mapName, x, y, w, h];
  const built =
    entry.shots && builtMapViews(entry.original?.box?.shots).some((v) => v.join() === view.join())
      ? await loadImage(builtMapShotPath(entry.id, view))
      : undefined;
  if (built) return onCanvas(built);
  const gamName = entry.gam;
  const gam = gamName ? await fetchFile(entry, gamName) : undefined;
  if (!gam) return undefined;
  const game = parseGame(gam);
  const scene = game.scenes.find((s) => s.gametype === 10 && s.files[1]?.toLowerCase() === mapName.toLowerCase());
  if (!scene) return undefined;
  const names = scene.files.slice(0, 5).filter(Boolean);
  const bytes = await Promise.all(names.map((n) => fetchFile(entry, n)));
  const files = new GameFiles(names.flatMap((n, k) => (bytes[k] ? [[n, bytes[k]!] as [string, Uint8Array]] : [])));
  const pic = mapPixels(files, game, mapName, x, y, w, h);
  if (!pic) return undefined;
  const canvas = document.createElement('canvas');
  paintIndexed(canvas, pic.pixels, pic.width, pic.height, pic.palette);
  return canvas;
}
