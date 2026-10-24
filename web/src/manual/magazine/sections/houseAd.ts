// House ads: the magazine's own, put in by issue.ts where the pages must come out to whole
// folded sheets (a multiple of four).
import { adPage, adframe, button, card, p } from '../blocks';
import { MAG } from '../masthead';
import type { MagPage } from '../types';

const HOUSE: (() => MagPage)[] = [
  () =>
    adPage('house-1', `${MAG.name} subscriptions`, [
      adframe(
        `SUBSCRIBE TO ${MAG.name}!`,
        [
          p('Twelve issues of hints, reviews and the newest shareware, delivered to your mailbox.'),
          card('SUBSCRIPTION CARD', ['☐ 1 year (12 issues) **$24.95**', '☐ 2 years (24 issues) **$44.95**', 'Nothing to mail: this issue is free here.'], {
            fields: ['Name', 'Address', 'City, State, ZIP'],
            go: 'go:mag/contents',
            button: 'Back to the contents',
            tone: 'yellow',
          }),
        ],
        { burst: 'SAVE 58%!', tone: 'yellow' },
      ),
    ]),
  () =>
    adPage('house-2', 'Make your own game', [
      adframe(
        'YOUR GAME COULD BE IN THESE PAGES',
        [p('Made a game with Game-Maker? Upload it to a BBS and tell your friends.'), button('go:editor', 'Start a new game')],
        {
          burst: 'BE A STAR!',
          tone: 'cyan',
        },
      ),
    ]),
  () =>
    adPage('house-3', 'Calling all game designers', [
      adframe(
        'LEARN FROM THE PROS',
        [p('Level design, sound, music and the tricks of the Sandbox games.'), button('go:ultimate', 'The Ultimate Owner’s Guide')],
        {
          burst: 'TIPS!',
          tone: 'pink',
        },
      ),
    ]),
];

/** The i-th house ad. */
export const houseAd = (i: number): MagPage => HOUSE[i % HOUSE.length]();
