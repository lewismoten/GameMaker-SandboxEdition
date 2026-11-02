// Doc Leo's balloon dogs, drawn as the Teddy trilogy drew them: the poodle he twists for fun
// (games/teddy/src/sprites/fx.ts, pink with an ink outline, bobbing) and the long dog he rides
// up from under his shoes (games/teddy3/src/sprites/fx3.ts, sky blue, so it never looks like
// one to collect), with the POP it ends in. Same rows as there, in this game's fixed colors.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { P } from '../art/palette';

const c = P.c;

const POODLE = [
  '.oo.oo..............',
  'oPPoPPo.............',
  'oPpoPpo.............',
  '.oPPPpo.............',
  'oPsPPPpo............',
  'oPPPPPPpo.......oo..',
  '.oppppppo......oPPo.',
  '..oPPpo........oPpo.',
  '..oPPpo..oooooopPpo.',
  '..oPPpooPPPPPPPPppo.',
  '...oPpPsPPPPPPPPppo.',
  '....oopppppppppppo..',
  '.....oPpo....oPpo...',
  '.....oPpo....oPpo...',
  '.....oPpo....oPpo...',
  '.....oooo....oooo...',
];

const RIDE = [
  '.nn.nn..............',
  'nBBnBBn.............',
  'nBsnBbn.............',
  '.nBBBbn.............',
  'nBsBBBbn............',
  'nBBBBBBbn.......nn..',
  '.nbbbbbbn......nBBn.',
  '..nBBbnnnnnnnnnbBbn.',
  '.nBBBBBBBBBBBBBBBbbn',
  'nBsBBBBBBBBBBBBBBBbn',
  'nBBBBBBBBBBBBBBBBbbn',
  '.nbbbbbbbbbbbbbbbbn.',
  '..nBbn........nBbn..',
  '..nBbn........nBbn..',
  '..nnnn........nnnn..',
];

const POPS = [
  [
    '....w.....w....',
    '.....w...w.....',
    '..w..wB.Bw..w..',
    '...w.B...B.w...',
    '.....B.n.B.....',
    '..ww...n...ww..',
    '.....B.n.B.....',
    '...w.B...B.w...',
    '..w..wB.Bw..w..',
    '.....w...w.....',
    '....w.....w....',
  ],
  [
    '..w.........w..',
    '...............',
    '....b.....b....',
    '...............',
    '.w.....b.....w.',
    '...............',
    '....b.....b....',
    '...............',
    '..w.........w..',
  ],
];

const KEY = (): Record<string, number> => ({
  o: c('ink', 0),
  p: c('pink', 2),
  P: c('pink', 3),
  s: c('paint', 3),
  w: c('paint', 3),
  n: c('blue', 1),
  b: c('blue', 2),
  B: c('blue', 3),
});

/** A pink balloon poodle over `bg` (a block's own background), bobbed up a pixel when `bob`. */
export function poodle(bg: Pixels, bob: boolean): Pixels {
  return bg.draw(0, bob ? 2 : 3, POODLE, KEY());
}

/** The balloon dog Doc Leo rides (a monster picture: 255 is clear), its tail wagging on `f`. */
export function rideDog(f: number): Pixels {
  const rows = f ? RIDE.map((r, y) => (y === 5 ? 'nBBBBBBbn......nn...' : y === 6 ? '.nbbbbbbn.....nBBn..' : r)) : RIDE;
  return new Pixels(20, 20, 255).draw(0, 5, rows, KEY());
}

/** The POP, two frames. */
export function popPic(f: number): Pixels {
  return new Pixels(20, 20, 255).draw(2, f ? 6 : 5, POPS[f], KEY());
}
