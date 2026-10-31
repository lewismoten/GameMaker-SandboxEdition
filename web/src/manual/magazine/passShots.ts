// Pictures for the "pass-through scene" feature (sections/passThrough.ts), drawn from a built
// game's own files: the moment the hero walks onto the trigger (`walk:<scene>`: the level that
// links to the scene, the hero standing on that link), and what the player is shown (`page:<scene>`:
// the scene's intro slide list, a picture and a text page written over it as PLAYGAME writes it).
// `<scene>` is the pass-through scene's name in the .GAM. Loaded only when a page with one is drawn.
import { parseGame, type Game, type Scene } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { decodeGif, isGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { parseBackdrop, parseSlideList, textLines } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';
import { FONT8X8 } from '@lewismoten/gamemaker-sandbox-engine/gfx/font8x8';
import { matchColor, parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { GameFiles, fetchGameFile, type CatalogEntry } from '../../project/files';
import { paintIndexed } from '../../editor/core/draw';
import { levelPixels } from '../../gfx/levelPicture';

const W = 320;
const H = 200;
/** The slot of a scene's intro graphic. */
const INTRO = 9;

/** The whole game's files, fetched by name as they are wanted. */
async function load(entry: CatalogEntry, names: string[]): Promise<GameFiles> {
  const bytes = await Promise.all(names.map((n) => fetchGameFile(entry, n)));
  return new GameFiles(names.flatMap((n, k) => (bytes[k] ? [[n, bytes[k]] as [string, Uint8Array]] : [])));
}

async function gameOf(entry: CatalogEntry): Promise<Game | undefined> {
  const gam = entry.gam && (await fetchGameFile(entry, entry.gam));
  return gam ? parseGame(gam) : undefined;
}

/** The level and link that lead into the pass-through scene called `name`. */
function walkIn(game: Game, name: string): { level: Scene; from: { x: number; y: number } } | undefined {
  const to = game.scenes.findIndex((s) => s.desc === name);
  if (to < 0) return undefined;
  for (const level of game.scenes) {
    const link = level.links.find((l) => l.toScene === to);
    if (link) return { level, from: link.from };
  }
  return undefined;
}

/** The moment the hero walks onto the link: the level, 16 x 10 blocks around him. */
async function walkShot(entry: CatalogEntry, name: string): Promise<HTMLCanvasElement | undefined> {
  const game = await gameOf(entry);
  const hit = game && walkIn(game, name);
  if (!hit) return undefined;
  const files = await load(entry, hit.level.files.slice(0, 7).filter(Boolean));
  const pic = levelPixels(files, hit.level, hit.from, 16, 10);
  if (!pic) return undefined;
  const canvas = document.createElement('canvas');
  paintIndexed(canvas, pic.pixels, pic.width, pic.height, pic.palette);
  return canvas;
}

/** The intro's picture and its first page of text, as ShowGraphic and Display_File draw them. */
async function pageShot(entry: CatalogEntry, name: string): Promise<HTMLCanvasElement | undefined> {
  const game = await gameOf(entry);
  const scene = game?.scenes.find((s) => s.desc === name);
  const intro = scene?.files[INTRO];
  if (!scene || !intro) return undefined;
  const first = await load(entry, [intro, scene.files[0]]);
  const slides = first.get(intro) ? parseSlideList(first.get(intro)!) : [];
  const files = await load(
    entry,
    slides.map((s) => s.name),
  );
  const gamePal = first.get(scene.files[0]) ? parsePalette(first.get(scene.files[0])!) : new Uint8Array(768);
  const pixels = new Uint8Array(W * H);
  const palette = new Uint8Array(768);
  const canvas = document.createElement('canvas');
  let drawn = false;
  for (const { name: file } of slides) {
    const bytes = files.get(file);
    if (!bytes) continue;
    if (/\.(gif|bkd)$/i.test(file)) {
      const b = /\.bkd$/i.test(file) ? parseBackdrop(bytes) : { gif: file, x: 0, y: 0 };
      const gif = files.get(b.gif) ?? (await fetchGameFile(entry, b.gif));
      if (!gif || !isGif(gif)) continue;
      const img = decodeGif(gif);
      for (let y = 0; y < img.height && y + b.y < H; y++)
        for (let x = 0; x < img.width && x + b.x < W; x++) if (x + b.x >= 0 && y + b.y >= 0) pixels[(y + b.y) * W + x + b.x] = img.pixels[y * img.width + x];
      palette.set(img.palette);
      drawn = true;
    } else if (/\.txt$/i.test(file)) {
      // text lands in the picture's color nearest purple; MORE... in the scene's own palette's red
      const ink = matchColor(palette, 50, 10, 50);
      const lines = textLines(bytes);
      const put = (x: number, y: number, col: number, text: string) => {
        for (let i = 0; i < text.length; i++) {
          const base = (text.charCodeAt(i) & 0xff) * 8;
          for (let row = 0; row < 8; row++) for (let b = 0; b < 8; b++) if (FONT8X8[base + row] & (1 << b)) pixels[(y + row) * W + x + i * 8 + b] = col;
        }
      };
      lines.slice(0, 16).forEach((t, i) => put(40, (5 + i) * 8, ink, t));
      if (lines.length > 16) put(224, 168, matchColor(gamePal, 63, 10, 10), 'MORE...');
      drawn = true;
    }
  }
  if (!drawn) return undefined;
  paintIndexed(canvas, pixels, W, H, palette);
  return canvas;
}

/** The picture for a `walk:` or `page:` view, as a data URL (undefined when the game lacks it). */
export async function passShot(entry: CatalogEntry, view: string): Promise<string | undefined> {
  const [kind, ...rest] = view.split(':');
  const name = rest.join(':');
  const canvas = kind === 'walk' ? await walkShot(entry, name) : await pageShot(entry, name);
  return canvas?.toDataURL();
}
