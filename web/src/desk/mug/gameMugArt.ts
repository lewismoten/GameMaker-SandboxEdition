// Mug pictures for the Sandbox Software games, each a badge (gameBadge.ts) made from the game's
// own files: a round medallion cut from its title screen (TITLE.GIF), the title's lettering on
// a ribbon across it, and its hero standing in front (the first frame of the hero's .CHR, drawn
// from its .CBL blocks in the palette of a level the hero plays in).
import { fetchGameFile, loadGameList, type CatalogEntry } from '../../project/files';
import { decodeGif, isGif } from '../../formats/gif';
import { parseGame } from '../../formats/game';
import { parseCharacter } from '../../formats/character';
import { BLEN, CHARBL, TRANSPARENT, parseBlocks } from '../../formats/blocks';
import { paletteToRGBA, parsePalette } from '../../formats/palette';
import { BADGE_H, BADGE_W, composeBadge, trimSprite, type BadgeLook, type Rgba } from './gameBadge';

/** A game's mug: its hero's character file, and where its title screen's lettering is (and the rest of its look). */
export interface GameMug extends BadgeLook {
  game: string;
  hero: string;
}

/** The games, in the box's order. */
export const GAME_MUGS: GameMug[] = [
  { game: 'maximus', hero: 'courier', title: [0, 16, 320, 94], centerX: 205 },
  { game: 'teddy', hero: 'teddy', title: [16, 0, 304, 82], centerX: 150 },
  { game: 'year2000', hero: 'dex', title: [8, 2, 312, 90], centerX: 160 },
  { game: 'blaster', hero: 'ship', title: [4, 6, 316, 90], centerX: 160 },
  { game: 'logic', hero: 'watt', title: [6, 10, 312, 86], centerX: 170, side: 'left', hide: [[0, 0, 112, 10]] },
  { game: 'sleuth', hero: 'ada', title: [36, 0, 286, 73], centerX: 160, hide: [[94, 64, 226, 73]] },
  { game: 'snowbound', hero: 'kid', title: [6, 10, 314, 82], centerX: 160 },
  {
    game: 'sandcast',
    hero: 'sandcast',
    title: [30, 9, 290, 96],
    centerX: 160,
    hide: [
      [0, 0, 320, 9],
      [0, 96, 66, 120],
      [244, 96, 320, 120],
    ],
  },
];

export const GAME_ART_W = BADGE_W;
export const GAME_ART_H = BADGE_H;

/** The hero, 20 x 40 (top and bottom block), or undefined. */
async function hero(entry: CatalogEntry, name: string): Promise<Rgba | undefined> {
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
  const lut = paletteToRGBA(parsePalette(palB));
  const frame = parseCharacter(chrB).sequences[0]?.frames[0];
  const blocks = parseBlocks(cblB, CHARBL);
  if (!frame) return undefined;
  const out: Rgba = { width: BLEN, height: 2 * BLEN, data: new Uint32Array(BLEN * 2 * BLEN) };
  [frame.pic1, frame.pic2].forEach((pic, i) => {
    const b = blocks[pic];
    if (b) for (let k = 0; k < BLEN * BLEN; k++) out.data[i * BLEN * BLEN + k] = b.pixels[k] === TRANSPARENT ? 0 : lut[b.pixels[k]];
  });
  return out;
}

/** A game's mug picture, GAME_ART_W x GAME_ART_H, see-through round the badge, or undefined if its files can't be had. */
export async function gameMugArt(mug: GameMug): Promise<HTMLCanvasElement | undefined> {
  const entry = (await loadGameList().catch(() => [])).find((c) => c.id === mug.game);
  if (!entry) return undefined;
  const [titleB, sprite] = await Promise.all([fetchGameFile(entry, 'title.gif'), hero(entry, mug.hero).catch(() => undefined)]);
  if (!titleB || !isGif(titleB)) return undefined;
  const badge = composeBadge(decodeGif(titleB), sprite && trimSprite(sprite), entry.original?.box ?? {}, mug);
  const c = document.createElement('canvas');
  c.width = badge.width;
  c.height = badge.height;
  const g = c.getContext('2d')!;
  const img = g.createImageData(badge.width, badge.height);
  new Uint32Array(img.data.buffer).set(badge.data);
  g.putImageData(img, 0, 0);
  return c;
}
