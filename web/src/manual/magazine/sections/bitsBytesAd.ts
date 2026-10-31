// The Bits & Bytes Software spread: two facing pages from the 1990s store that sells the whole
// Sandbox Software shelf and the Bard of Bizarre song-games, with Teddy's Little Biggest
// Adventure (the last of the Teddy trilogy) on the left and Game-Maker: Sandbox Edition, to build
// your own games, on the right. The store is made up and the store speaks as itself, as a 1990s
// shop's ad would. Prices are the boxes' own price stickers (desk/boxes: $4.99) and the Game-Maker
// box's sale price (printables/gmInserts.ts GM_PRICE). It names no game it does not show and
// never counts the shelf. The look is bnbAd.css; the pictures are bnbArt.ts. The left page
// is an even folio, so the two face each other (viewer.ts spreads): bitsBytes.test.ts checks.
import { adPage, adframe, art, button, grid, list, p, side } from '../blocks';
import type { MagSection } from '../types';

const STORE = 'Bits & Bytes Software';

const left = () =>
  adPage(
    'bnb-ad',
    STORE,
    [
      adframe(
        'COMPLETE THE TRILOGY!',
        [
          art('bnb-tab-left', 'Sandbox plus Bizarre'),
          art('bnb-teddy3', 'The box of Teddy’s Little Biggest Adventure, turned at an angle, with the Bits & Bytes $4.99 price sticker'),
          art('bnb-title', 'Sandbox Software presents Teddy’s Little Biggest Adventure, the last of the trilogy'),
          p(
            '**Little Big. Little Bigger. Now Little Biggest!** The littlest dog. The biggest day. A birthday party, a big cake and Gwinn too: come see how it ends.',
          ),
          grid(
            [
              [art('bnb-price-teddy', 'Only $4.99')],
              [
                side(
                  'THE WHOLE SHELF',
                  [
                    list([
                      'The **complete Sandbox Software collection**, every box with its disks.',
                      'The **full Bard of Bizarre collection**, song-games from *A Fly Named Carl* to *Veni, Vidi, Risi!*',
                      'Try it first, then register: it is shareware.',
                    ]),
                  ],
                  'white',
                ),
              ],
            ],
            0.3,
          ),
          button('go:play/teddy3', 'Play Teddy’s Little Biggest Adventure'),
        ],
        {
          burst: 'NEW!',
          small: `${STORE} is made up and nothing is sold here: the games are free to play. Prices are part of the story.`,
          tone: 'white',
        },
      ),
    ],
    'white',
  );

const right = () => ({
  ...adPage(
    'bnb-ad-2',
    STORE,
    [
      adframe(
        'BUILD YOUR OWN GAMES!',
        [
          art('bnb-tab-right', 'Build plus play'),
          art('bnb-pair', 'The Game-Maker: Sandbox Edition box, turned, with Snowbound: The $89 Shovel beside it, both with Bits & Bytes price stickers'),
          p(
            '**Game-Maker™: Sandbox Edition.** Draw the blocks, the monsters and the hero. Lay out the map, add the sounds and music, and play it. No programming! Then give your game a box of its own.',
          ),
          grid(
            [
              [art('bnb-price-gm', 'Sale price $48.00, was $59.95')],
              [
                side(
                  'IN THE BOX',
                  [list(['The Owner’s Guide, to read start to finish', 'The CD, with Game-Maker on it', 'Everything you need to make a game of your own'])],
                  'yellow',
                ),
              ],
            ],
            0.3,
          ),
          grid([[button('go:editor', 'Start a game now')], [button('go:desk/gmbox', 'See the box on the desk')]], 0.28),
          art('bnb-logo', 'Bits & Bytes Software. Call 1-412-555-0147 for the store nearest you'),
        ],
        {
          burst: 'SAVE $11.95!',
          small: `${STORE} and its phone number are made up. The tools are free: [start a game in the editor](go:editor).`,
          tone: 'white',
        },
      ),
    ],
    'white',
  ),
});

export const BITS_BYTES_AD: MagSection = {
  id: 'bnb-ad',
  title: STORE,
  toc: false,
  pages: () => [left(), right()],
};
