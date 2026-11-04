// SAY SOMETHING's talkers: three friendly villagers (Pip, Moss and Dot), each two blocks tall
// like Kit, and the speech bubble that floats over one. They are ordinary scenery blocks the hero
// can walk into; what makes one talk is a scene link on its bottom block (game.ts).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Book } from '../../kit/starter/book';
import { PULL } from '../../kit/starter/book';
import { skyOf, type Pal } from '../../kit/starter/palette';

const T = 255;

export type TalkerName = 'pip' | 'moss' | 'dot';

/** How each talker is dressed: ramp names for the hat, the smock and the hair. */
const LOOKS: Record<TalkerName, { hat: string; smock: string; hair: string; beard: boolean }> = {
  pip: { hat: 'gold', smock: 'purple', hair: 'hair', beard: false },
  moss: { hat: 'teal', smock: 'blue', hair: 'stone', beard: true },
  dot: { hat: 'pink', smock: 'green', hair: 'orange', beard: false },
};

/** One talker, 20 wide and 40 high, on a transparent ground. */
export function talkerPicture(pal: Pal, who: TalkerName): Pixels {
  const { c, r } = pal;
  const look = LOOKS[who];
  const hat = r(look.hat);
  const smock = r(look.smock);
  const hair = r(look.hair);
  const skin = r('skin');
  const ink = c('ink', 0);
  const p = new Pixels(20, 40, T);
  // shoes and legs
  p.rect(5, 36, 4, 3, c('wood', 1)).rect(11, 36, 4, 3, c('wood', 1));
  p.rect(6, 33, 3, 3, c('ink', 2)).rect(11, 33, 3, 3, c('ink', 2));
  // the smock: a bell from the shoulders to the knees, with a pocket and a hem
  blob(p, 10, 29, 7.2, 7.4, smock, 0, 4);
  p.rect(3, 33, 14, 1, smock[1]).rect(3, 32, 14, 1, smock[4]);
  p.rect(7, 27, 6, 4, smock[3]).frame(7, 27, 6, 4, smock[1]);
  // arms: the left hangs, the right waves
  p.rect(2, 24, 3, 7, smock[3]).rect(2, 24, 1, 7, smock[4]).disc(3, 32, 1.8, skin[2]);
  p.rect(15, 18, 3, 7, smock[3]).rect(17, 18, 1, 7, smock[1]).disc(16, 17, 1.9, skin[2]).set(15, 16, skin[3]);
  // hair behind the head, then the face
  blob(p, 10, 14, 7.6, 6, hair, 0, 2);
  blob(p, 10, 15, 6, 5.6, skin, 0, 3);
  if (look.beard) blob(p, 10, 19, 4.6, 3.4, hair, 1, 4);
  p.rect(7, 14, 2, 2, ink).rect(12, 14, 2, 2, ink).set(7, 14, c('white', 3)).set(12, 14, c('white', 3));
  p.set(5, 17, c('pink', 2)).set(15, 17, c('pink', 2));
  if (!look.beard) p.set(8, 18, ink).set(9, 19, ink).set(10, 19, ink).set(11, 19, ink).set(12, 18, ink);
  else p.set(9, 18, c('pink', 1)).set(10, 18, c('pink', 1)).set(11, 18, c('pink', 1));
  // a straw-brim hat: a wide brim and a rounded crown with a band
  p.rect(2, 9, 16, 3, hat[3]).rect(2, 9, 16, 1, hat[4]).rect(2, 11, 16, 1, hat[1]);
  blob(p, 10, 6, 5.4, 4.4, hat, 0, 4);
  p.rect(5, 8, 10, 2, c('red', 2));
  return outline(p, ink, { transparent: T });
}

/** A talker on the sky, as the two 20x20 block pictures [top, bottom]. */
function blocksOf(pal: Pal, who: TalkerName): [Pixels, Pixels] {
  const bg = new Pixels(20, 40, skyOf(pal));
  bg.blit(talkerPicture(pal, who), 0, 0, T);
  return [bg.crop(0, 0, 20, 20), bg.crop(0, 20, 20, 20)];
}

/** The speech bubble block: a round white bubble with three dots, and a tail pointing down. */
function bubble(pal: Pal): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, skyOf(pal));
  p.disc(10, 8, 8.6, c('ink', 0)).disc(10, 8, 7.6, c('white', 3));
  p.rect(9, 14, 5, 5, c('ink', 0)).rect(10, 14, 3, 4, c('white', 3)).set(10, 18, c('ink', 0)).set(11, 18, c('ink', 0));
  for (const x of [6, 10, 14]) p.disc(x, 8, 1.3, c('ink', 0));
  return p;
}

/** The block names a talker's two halves have in the book. */
export const talkerBlocks = (who: TalkerName): [string, string] => [`${who}.top`, `${who}.bottom`];
export const BUBBLE = 'bubble';

/** Adds the three talkers and the bubble to `book` (scenery: the hero walks into them). */
export function addTalkers(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  for (const who of Object.keys(LOOKS) as TalkerName[]) {
    const [top, bottom] = blocksOf(pal, who);
    const [tn, bn] = talkerBlocks(who);
    book.add(tn, top, air);
    book.add(bn, bottom, air);
  }
  book.add(BUBBLE, bubble(pal), air);
}
