// STUB (section agent S3): gamers' reviews of the CD's shareware and gameware (and the new games),
// and the Shareware Game of the Month: a spotlight on one game, why it was chosen, and the game
// design practices it shows. Screenshots with shot(<id>, …); links go:play/<id>.
import { stubPage } from '../blocks';
import type { MagSection } from '../types';

export const REVIEWS: MagSection = {
  id: 'reviews',
  title: 'Reviews',
  blurb: 'Gamers rate the shareware, and the Shareware Game of the Month',
  dept: 'REVIEWS',
  pages: () => [
    stubPage('Shareware Game of the Month', ['The winner, in detail: why it was chosen', 'The good game design it shows']),
    stubPage('Game of the Month, continued', ['Screenshots and the design lessons']),
    stubPage('Gamers’ Reviews', ['Short reviews with star ratings']),
    stubPage('Gamers’ Reviews', ['Reviews, continued']),
  ],
};
