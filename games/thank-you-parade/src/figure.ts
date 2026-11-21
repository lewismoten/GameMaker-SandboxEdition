// Hero character blocks and whole figures, assembled in their original block order.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import type { Pal } from './print';
import { draw, type Outfit, type Pose } from './figureDrawing';
import { pennyOutfit, pennyPoses } from './pennyFigure';
import { margeOutfit, margePoses } from './margeFigure';

export type { Face, Pose } from './figureDrawing';

/** The (top, bottom) block names each pose fills, in the order the character file was always built in. */
const PAIRS: [string, string, string][] = [
  ['stand', 'stand.top', 'stand'],
  ['blink', 'blink.top', 'stand'],
  ['hurt', 'hurt.top', 'hurt'],
  ['jump', 'cheer.top', 'jump'],
  ['walk0', 'stand.top', 'walk0'],
  ['walk1', 'stand.top', 'walk1'],
  ['walk2', 'stand.top', 'walk2'],
  ['walk3', 'stand.top', 'walk3'],
  ['jumpup', 'up.top', 'jumpup'],
  ['fall', 'oh.top', 'fall'],
  ['cheer', 'cheer2.top', 'cheer'],
  ['look', 'look.top', 'stand'],
  ['dig0', 'stand.top', 'dig0'],
  ['dig1', 'stand.top', 'dig1'],
  ['throw0', 'stand.top', 'throw0'],
  ['throw1', 'cheer.top', 'throw1'],
  ['throw2', 'stand.top', 'throw2'],
  ['climb0', 'back.top', 'climb0'],
  ['climb1', 'back.top', 'climb1'],
];

function heroBook(pal: Pal, o: Outfit, poses: Record<string, Pose>): Book {
  const book = new Book('cbl');
  for (const [pose, top, bottom] of PAIRS) {
    const whole = draw(pal, o, poses[pose]);
    if (!book.has(top)) book.add(top, whole.crop(0, 0, 20, 20));
    if (!book.has(bottom)) book.add(bottom, whole.crop(0, 20, 20, 20));
  }
  return book;
}

/** Penny's character blocks (.CBL). */
export const buildPennyBlocks = (pal: Pal): Book => heroBook(pal, pennyOutfit(pal), pennyPoses());

/** Marge's character blocks (.CBL). */
export const buildMargeBlocks = (pal: Pal): Book => heroBook(pal, margeOutfit(pal), margePoses());

/** A pose drawn whole, 20x40 (for title screens and cartoons, where the walking top and the stride belong together). */
export function figure(pal: Pal, who: 'penny' | 'marge', pose: string): Pixels {
  return who === 'penny' ? draw(pal, pennyOutfit(pal), pennyPoses()[pose]) : draw(pal, margeOutfit(pal), margePoses()[pose]);
}
