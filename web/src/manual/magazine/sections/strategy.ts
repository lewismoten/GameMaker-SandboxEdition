// STUB (section agent S1): the strategy guide. Hints for every game that has a hint book (ctx.games
// with `hints`), an ad for each hint book (go:hints/<id>), and the newsletter back-order page:
// every box's Sandbox Scoop (go:newsletter/<id>). Replace these pages; keep the section's id.
import { stubPage } from '../blocks';
import type { MagSection } from '../types';

export const STRATEGY: MagSection = {
  id: 'strategy',
  title: 'The Strategy Guide',
  blurb: 'Hints for every game, the hint books, and back issues of every box’s newsletter',
  dept: 'STRATEGY GUIDE',
  pages: () => [
    stubPage('The Strategy Guide', ['Hints for every Sandbox Software game, answers printed upside down', 'One hint for each Bard of Bizarre song-game']),
    stubPage('More hints', ['Hints for the CD’s gameware and shareware']),
    stubPage('More hints', ['Hints, continued']),
    stubPage('More hints', ['Hints, continued']),
    stubPage('More hints', ['Hints, continued']),
    stubPage('Hint books', ['Ads for each game’s hint book, opening the hint book itself']),
    stubPage('Hint books', ['Hint book ads, continued']),
    stubPage('Newsletter back-orders', ['Every box’s Sandbox Scoop newsletter, one click away']),
  ],
};
