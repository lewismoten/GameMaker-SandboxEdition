// The Game-Maker box's sticker sheet: Game-Maker's own badge, every Sandbox game's hero cut out
// round its pixel art, the regulars who turn up across the games (Teddy, Gwinn, Doc Leo, the
// rubber chicken, THE CHEZ, the tin heart, the painted egg), the Sandbox BBS and Sandbox Software.
import type { CatalogEntry } from '../../project/files';
import type { PrintContext } from './kit';
import type { MixedSticker } from './stickers';

/** Who turns up across the games, and which game's blocks each is drawn from. */
const REGULARS: (MixedSticker & { game: string })[] = [
  {
    game: 'teddy',
    text: 'THE CHEZ',
    sub: '1976½ CITICAR',
    shape: 'cut',
    color: '#d6362a',
    ink: '#ffffff',
    px: 5,
    noMini: true,
    sprite: { blocks: 'backyard.bbl', pal: 'backyard.pal', grid: [[91, 92]], under: [[12, 12]] },
  },
  {
    game: 'teddy',
    text: 'TIN HEART',
    sub: 'ONE IN EVERY GAME',
    shape: 'cut',
    color: '#6b7280',
    ink: '#ffffff',
    sprite: { blocks: 'backyard.bbl', pal: 'backyard.pal', grid: [[99]], under: 34 },
  },
  {
    game: 'teddy',
    text: 'ZIGZAGS!',
    sub: 'FIND THE PAINTED EGGS',
    shape: 'cut',
    color: '#e0569a',
    ink: '#ffffff',
    sprite: { blocks: 'park.bbl', pal: 'park.pal', grid: [[101]], under: 93 },
  },
  {
    game: 'teddy2',
    text: 'BAWK!',
    sub: 'THE RUBBER CHICKEN',
    shape: 'burst',
    color: '#ffd23f',
    ink: '#2a1408',
    sprite: { blocks: 'river.mbl', pal: 'river.pal', grid: [[45]] },
  },
  {
    game: 'brief',
    text: 'DOC LEO',
    sub: 'FRIENDLIEST CLOWN IN TOWN',
    shape: 'cut',
    color: '#7a2bbf',
    ink: '#ffffff',
    sprite: { blocks: 'clown.mbl', pal: 'brief.pal', grid: [[2]] },
  },
  {
    game: 'realm',
    text: 'TEDDY',
    sub: 'VERY GOOD BOY',
    shape: 'cut',
    color: '#e8862a',
    ink: '#ffffff',
    sprite: { blocks: 'people.mbl', pal: 'world.pal', grid: [[56]] },
  },
  {
    game: 'sandcast',
    text: 'GWINN',
    sub: 'ZOOMIES!',
    shape: 'cut',
    color: '#f6a9c8',
    ink: '#3a1a20',
    sprite: { blocks: 'sandcast.mbl', pal: 'sandcast.pal', grid: [[38]] },
  },
];

/** Every Sandbox game's hero (its first hero sticker, else its first character), the regulars, Game-Maker's and Sandbox's own. */
export function gmStickerSpecs(family: CatalogEntry[], contextFor: (g: CatalogEntry) => PrintContext): MixedSticker[] {
  const heroes: MixedSticker[] = family.flatMap((g) => {
    const list = g.original?.printables?.stickers ?? [];
    const s = list.find((x) => x.hero) ?? list.find((x) => x.sprite && x.shape === 'cut');
    return s ? [{ ...s, shape: 'cut' as const, px: undefined, from: contextFor(g) }] : [];
  });
  const regulars = REGULARS.flatMap(({ game, ...s }) => {
    const g = family.find((x) => x.id === game);
    return g ? [{ ...s, from: contextFor(g) }] : [];
  });
  return [
    { text: '', special: 'gm' },
    ...heroes,
    ...regulars,
    { text: 'I MADE THIS', sub: 'WITH GAME-MAKER', shape: 'burst', color: '#f2e600', ink: '#0b0b0b' },
    { text: '', special: 'bbs' },
    { text: '', special: 'sandbox' },
  ];
}
