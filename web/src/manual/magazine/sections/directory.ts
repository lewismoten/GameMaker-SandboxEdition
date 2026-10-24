// STUB (section agent S2): the game directory. Every game in ctx.games, grouped: Sandbox Software,
// The Bard of Bizarre, the CD's gameware, the CD's shareware; each a `rows` listing linking to
// go:play/<id> (and go:manual/<id> for boxed games). Never the secret game (ctx.games leaves it out).
import { stubPage } from '../blocks';
import type { MagSection } from '../types';

export const DIRECTORY: MagSection = {
  id: 'directory',
  title: 'The Game Directory',
  blurb: 'Every Sandbox, Bizarre, gameware and shareware game, and where to play it',
  dept: 'GAME DIRECTORY',
  pages: () => [
    stubPage('The Game Directory', ['Sandbox Software’s games: title, price, blurb, play link']),
    stubPage('The Game Directory', ['Sandbox Software, continued']),
    stubPage('The Bard of Bizarre', ['The song-games from The Sofa BBS']),
    stubPage('Gameware', ['The samples that came on the Game-Maker CD']),
    stubPage('Shareware', ['The CD’s shareware, with their authors’ registration prices']),
    stubPage('Shareware', ['Shareware, continued']),
  ],
};
