// Mug pictures for the Sandbox Software games, each a badge (gameBadge.ts) made from the game's
// own files: a round medallion cut from its title screen (TITLE.GIF), the title's lettering on
// a ribbon across it, and its hero standing in front (the first frame of the hero's .CHR, drawn
// from its .CBL blocks in the palette of a level the hero plays in).
import { fetchGameFile, loadGameList, type CatalogEntry } from '../../project/files';
import { decodeGif, isGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { BLEN, CHARBL, TRANSPARENT, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { paletteToRGBA, parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { BADGE_H, BADGE_W, composeBadge, trimSprite, type BadgeLook, type Rgba } from './gameBadge';

/** A game's mug: its hero's character file ('' for none: the hero would hide the title, or can't be drawn), and where its title screen's lettering is (and the rest of its look). */
export interface GameMug extends BadgeLook {
  game: string;
  hero: string;
  /** One of The Bard of Bizarre's (his own group, without a Sandbox box's colors). */
  bizarre?: boolean;
}

/** The games, in the box's order, except that the three "Teddy's Little ... Adventure" games (teddy, teddy2, teddy3) sit together; the viewer lists them in this order within their group. */
export const GAME_MUGS: GameMug[] = [
  { game: 'maximus', hero: 'courier', title: [0, 16, 320, 94], ink: [153, 155, 156, 157, 162, 163, 130, 131, 132, 133, 10, 167], centerX: 205 },
  { game: 'teddy', hero: 'teddy', title: [16, 0, 304, 82], centerX: 200, side: 'left' },
  { game: 'teddy2', hero: 'teddy', title: [6, 0, 314, 80], ink: [87, 83, 81, 70, 9], centerX: 212, strip: true, hide: [[40, 182, 290, 200]] },
  { game: 'teddy3', hero: 'teddy', title: [6, 0, 314, 80], ink: [87, 83, 81, 70, 9], centerX: 170, strip: true, hide: [[40, 182, 290, 200]] },
  { game: 'tuneup', hero: 'teddy', title: [44, 34, 276, 80], centerX: 160 },
  { game: 'year2000', hero: 'dex', title: [8, 2, 312, 90], centerX: 160 },
  { game: 'blaster', hero: 'ship', title: [4, 6, 316, 90], centerX: 160 },
  {
    game: 'logic',
    hero: 'watt',
    title: [6, 10, 312, 86],
    centerX: 170,
    side: 'left',
    hide: [
      [0, 0, 112, 10],
      // a stray bit of lightning right of the title's M
      [216, 52, 232, 76],
      // Ohm beside his own speech bubble would echo the hero in front
    ],
    mend: [{ box: [40, 102, 104, 170], from: [0, 40] }],
  },
  { game: 'sleuth', hero: 'ada', title: [36, 0, 286, 73], ink: [49, 111, 123, 47, 38, 108], centerX: 160, hide: [[94, 64, 226, 73]] },
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
  { game: 'brief', hero: 'joe', title: [96, 2, 312, 78], centerX: 212, side: 'left', hide: [[0, 0, 104, 14]] },
  {
    game: 'depth',
    hero: 'far',
    title: [56, 40, 264, 112],
    centerX: 160,
    hide: [[60, 176, 260, 200]],
    // the screen's own lettering mended out of the sky and the far floor; fresh lettering goes on a ribbon
    mend: [
      { box: [60, 46, 270, 114], from: [2, 26] },
      { box: [80, 148, 212, 168], from: [4, 28] },
    ],
    lettering: {
      lines: ['DEPTH', 'PERCEPTION'],
      scales: [5, 3],
      // blue chrome: bright sky, a dark horizon, a lighter reflection under it
      fill: ['#a8dcff', '#3d96f0', '#1a56c0', '#08246c', '#2a78d8', '#74bcff'],
      extrude: '#0a1c5a',
      centerY: 62,
    },
  },
  {
    game: 'realm',
    hero: 'pip',
    title: [8, 0, 308, 62],
    ink: [251, 253, 243, 237, 242, 235, 249, 197, 217, 198, 218, 201, 219, 55, 34],
    centerX: 160,
    strip: true,
    hide: [[0, 182, 320, 200]],
  },
  // The Bard of Bizarre's, in his collections' order (project/bizarre.ts); every title screen ends in a small-print line
  {
    game: 'goat',
    hero: 'goat',
    title: [28, 0, 292, 52],
    ink: [107, 105, 87, 86, 89, 88],
    centerX: 160,
    hide: [[0, 183, 320, 200]],
    maker: 'THE BARD OF BIZARRE',
    bizarre: true,
  },
  {
    game: 'mustard',
    hero: '',
    title: [4, 4, 316, 23],
    centerX: 160,
    centerY: 80,
    clearTop: [28, 124, 182],
    hide: [[0, 183, 320, 200]],
    maker: 'THE BARD OF BIZARRE',
    bizarre: true,
  },
  {
    game: 'needle',
    hero: '',
    title: [10, 134, 310, 180],
    centerX: 160,
    ink: [1, 2, 4],
    strip: true,
    hide: [[0, 183, 320, 200]],
    maker: 'THE BARD OF BIZARRE',
    bizarre: true,
  },
  {
    game: 'loaf',
    hero: 'loaf',
    title: [48, 4, 272, 50],
    centerX: 160,
    ink: [1, 2, 4],
    hide: [[0, 183, 320, 200]],
    maker: 'THE BARD OF BIZARRE',
    bizarre: true,
  },
  {
    game: 'carl',
    hero: 'carl',
    title: [30, 4, 290, 60],
    centerX: 160,
    ink: [1, 2, 4],
    hide: [[0, 183, 320, 200]],
    maker: 'THE BARD OF BIZARRE',
    bizarre: true,
  },
  {
    game: 'remote',
    hero: 'remote',
    title: [10, 4, 310, 60],
    ink: [1, 2],
    centerX: 160,
    strip: true,
    hide: [[0, 183, 320, 200]],
    maker: 'THE BARD OF BIZARRE',
    bizarre: true,
  },
  {
    game: 'reckoning',
    hero: 'leo',
    title: [16, 0, 304, 60],
    centerX: 160,
    ink: [1, 2, 4],
    hide: [[0, 183, 320, 200]],
    maker: 'THE BARD OF BIZARRE',
    bizarre: true,
  },
  { game: 'loofah', hero: 'loofah', title: [56, 0, 264, 52], centerX: 160, hide: [[0, 183, 320, 200]], maker: 'THE BARD OF BIZARRE', bizarre: true },
  { game: 'smirked', hero: 'smirked', title: [56, 4, 264, 46], centerX: 100, hide: [[0, 183, 320, 200]], maker: 'THE BARD OF BIZARRE', bizarre: true },
  {
    game: 'tickle',
    hero: 'leo',
    title: [24, 4, 296, 60],
    centerX: 160,
    ink: [1, 2, 4],
    strip: true,
    hide: [[0, 183, 320, 200]],
    maker: 'THE BARD OF BIZARRE',
    bizarre: true,
  },
  {
    game: 'sweats',
    hero: 'poet',
    title: [16, 2, 296, 56],
    ink: [39, 25, 80, 31, 32],
    centerX: 160,
    hide: [[0, 183, 320, 200]],
    maker: 'THE BARD OF BIZARRE',
    bizarre: true,
  },
  {
    game: 'risi',
    hero: 'felix',
    title: [10, 2, 310, 36],
    centerX: 160,
    ink: [1, 2, 3],
    strip: true,
    hide: [[0, 183, 320, 200]],
    maker: 'THE BARD OF BIZARRE',
    bizarre: true,
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
