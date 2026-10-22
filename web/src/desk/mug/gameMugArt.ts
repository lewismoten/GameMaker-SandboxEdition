// Mug pictures for the Sandbox Software games: each game's own title screen (TITLE.GIF) over
// a band in its box colors, with its hero standing at both ends of the band (the first frame
// of the hero's .CHR, drawn from its .CBL blocks in the palette of a level the hero plays in).
import { fetchGameFile, loadGameList, type CatalogEntry } from '../../project/files';
import { decodeGif, isGif } from '../../formats/gif';
import { parseGame } from '../../formats/game';
import { parseCharacter } from '../../formats/character';
import { BLEN, CHARBL, parseBlocks } from '../../formats/blocks';
import { parsePalette } from '../../formats/palette';
import { paintIndexed } from '../../editor/core/draw';
import { FONT8X8 } from '../../gfx/font8x8';

/** The games, in the box's order, each with its hero's character file. */
export const GAME_MUGS: [game: string, hero: string][] = [
  ['maximus', 'courier'],
  ['teddy', 'teddy'],
  ['year2000', 'dex'],
  ['blaster', 'ship'],
  ['logic', 'watt'],
  ['sleuth', 'ada'],
  ['snowbound', 'kid'],
  ['sandcast', 'sandcast'],
];

/** The picture is a 320 x 200 title screen over a band this tall. */
export const GAME_ART_W = 320;
export const GAME_ART_H = 268;
const BAND = GAME_ART_H - 200;

/** Text in the 8 x 8 BIOS font. */
function text(g: CanvasRenderingContext2D, s: string, x: number, y: number, color: string): void {
  g.fillStyle = color;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    for (let row = 0; row < 8; row++) {
      const bits = FONT8X8[code * 8 + row];
      for (let col = 0; col < 8; col++) if (bits & (1 << col)) g.fillRect(x + i * 8 + col, y + row, 1, 1);
    }
  }
}

/** The hero, 20 x 40 (top and bottom block), or undefined. */
async function hero(entry: CatalogEntry, name: string): Promise<HTMLCanvasElement | undefined> {
  const [gam, chrB, cblB] = await Promise.all([
    entry.gam ? fetchGameFile(entry, entry.gam) : undefined,
    fetchGameFile(entry, `${name}.chr`),
    fetchGameFile(entry, `${name}.cbl`),
  ]);
  if (!gam || !chrB || !cblB) return undefined;
  // the palette of a level the hero plays in
  const scenes = parseGame(gam).scenes.filter((s) => s.gametype === 10);
  const scene = scenes.find((s) => s.files[5]?.toLowerCase() === `${name}.chr`) ?? scenes[0];
  const palB = scene?.files[0] ? await fetchGameFile(entry, scene.files[0]) : undefined;
  if (!palB) return undefined;
  const pal = parsePalette(palB);
  const frame = parseCharacter(chrB).sequences[0]?.frames[0];
  const blocks = parseBlocks(cblB, CHARBL);
  if (!frame) return undefined;
  const c = document.createElement('canvas');
  c.width = BLEN;
  c.height = 2 * BLEN;
  const g = c.getContext('2d')!;
  for (const [pic, y] of [
    [frame.pic1, 0],
    [frame.pic2, BLEN],
  ]) {
    const b = blocks[pic];
    if (!b) continue;
    const one = document.createElement('canvas');
    paintIndexed(one, b.pixels, BLEN, BLEN, pal, true);
    g.drawImage(one, 0, y);
  }
  return c;
}

/** The part of a sprite that isn't see-through, or undefined if it's empty. */
function trim(c: HTMLCanvasElement): HTMLCanvasElement | undefined {
  const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  let [x0, y0, x1, y1] = [c.width, c.height, -1, -1];
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3]) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  if (x1 < 0) return undefined;
  const out = document.createElement('canvas');
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext('2d')!.drawImage(c, -x0, -y0);
  return out;
}

/** A game's mug picture, GAME_ART_W x GAME_ART_H, or undefined if its files can't be had. */
export async function gameMugArt(game: string, heroName: string): Promise<HTMLCanvasElement | undefined> {
  const entry = (await loadGameList().catch(() => [])).find((c) => c.id === game);
  if (!entry) return undefined;
  const [titleB, sprite] = await Promise.all([fetchGameFile(entry, 'title.gif'), hero(entry, heroName).catch(() => undefined)]);
  if (!titleB || !isGif(titleB)) return undefined;
  const title = decodeGif(titleB);
  const shot = document.createElement('canvas');
  paintIndexed(shot, title.pixels, title.width, title.height, title.palette);
  const box = entry.original?.box as { background?: string; accent?: string; ink?: string } | undefined;
  const c = document.createElement('canvas');
  c.width = GAME_ART_W;
  c.height = GAME_ART_H;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.drawImage(shot, 0, 0, 320, 200);
  g.fillStyle = box?.background ?? '#000';
  g.fillRect(0, 200, GAME_ART_W, BAND);
  g.fillStyle = box?.accent ?? '#ff0';
  g.fillRect(0, 200, GAME_ART_W, 2);
  const fig = sprite && trim(sprite);
  if (fig) {
    // as large as fits the band in whole pixels, facing in from both ends
    const k = Math.max(1, Math.min(Math.floor((BAND - 8) / fig.height), Math.floor(64 / fig.width)));
    const [w, h] = [fig.width * k, fig.height * k];
    const y = 200 + 2 + Math.round((BAND - 2 - h) / 2);
    g.drawImage(fig, 8, y, w, h);
    g.save();
    g.translate(GAME_ART_W - 8, y);
    g.scale(-1, 1);
    g.drawImage(fig, 0, 0, w, h);
    g.restore();
  }
  const line = (s: string, y: number, color: string) => text(g, s, Math.round((GAME_ART_W - s.length * 8) / 2), y, color);
  line('SANDBOX SOFTWARE', 222, box?.accent ?? '#ff0');
  line('MADE WITH GAME-MAKER', 240, box?.ink ?? '#fff');
  return c;
}
