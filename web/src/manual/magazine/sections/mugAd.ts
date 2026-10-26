// A full-page ad for collector's mugs with the Sandbox Software games on them, in the 1995
// magazine's voice: a gag. Kiln & Kilobyte is made up and its prices are part of the story;
// nothing is sold. The mugs wear the desk mug's own pictures (mugShelf.ts, from desk/mug/mugArt.ts),
// and the buttons go to the real thing, free: the mug on the desk and the store's print page
// (sections/store.ts is the store's catalog page; this ad sells the set).
import { adPage, adframe, card, grid, list, mugs, rows, side } from '../blocks';
import type { MagContext, MagSection } from '../types';

/** The games on the mugs, in the row's order (each a desk mug badge, mugArt.ts `game-<id>`). */
const GAMES = ['teddy', 'snowbound', 'sandcast', 'logic', 'year2000'];

function mugAd(ctx: MagContext) {
  const games = GAMES.flatMap((id) => {
    const g = ctx.game(id);
    return g ? [{ id, title: g.title }] : [];
  });
  const row = [
    ...games.map((g) => ({ design: `game-${g.id}`, name: `the ${g.title} badge on it: its title screen in a ring, its hero in front` })),
    { design: 'scene', name: 'the Sandbox BBS on it: its logon screen’s sand castle, pail and dunes in text-mode colors' },
  ];
  const n = row.length;
  return adPage(
    'mug-ad',
    'Kiln & Kilobyte',
    [
      adframe(
        'COLLECT ALL THE MUGS!',
        [
          mugs(row),
          grid(
            [
              [
                rows([
                  { title: 'Any one mug, 11 oz', price: '$7.95', blurb: 'Pick your game. Your cocoa never had it so good.' },
                  { title: 'The Night Owl, 15 oz', price: '$9.95', blurb: 'For the level that takes all night.' },
                  { title: `The whole set of ${n}`, price: '$39.95', blurb: `Save $${(n * 7.95 - 39.95).toFixed(2)}. Shelf not included.` },
                ]),
              ],
              [
                side(
                  'GENUINE STONEWARE',
                  [
                    list([
                      'The picture is **fired on** at 2,000 degrees: it won’t wash off in the sink',
                      'Holds coffee, cocoa or a fistful of pencils',
                      'Fits between your mouse pad and your monitor',
                      'Every mug hand-checked for a working handle',
                    ]),
                  ],
                  'yellow',
                ),
              ],
            ],
            0.38,
          ),
          card(
            'MUG ORDER FORM',
            [
              `Send me: ${[...games.map((g) => `☐ ${g.title}`), '☐ The BBS', `☐ All ${n}`].join('  ')}`,
              'Size: ☐ 11 oz  ☐ 15 oz · Shipping and handling ..... **$3.50** · Allow 6 to 8 weeks',
            ],
            { fields: ['Name', 'Address', 'City, State, ZIP'], go: 'go:desk/mug', button: 'Pick up the mug on the desk' },
          ),
        ],
        {
          burst: 'ONLY $7.95!',
          sub: 'From Kiln & Kilobyte: *your favorite game, baked in a kiln.*',
          small:
            'Just a gag: Kiln & Kilobyte is made up, no mugs are sold and nothing is mailed. The real thing is free: turn [the mug on the desk](go:desk/mug), or print a wrap for a blank mug of your own in [the mug store](go:store).',
          tone: 'white',
        },
      ),
    ],
    'pink',
  );
}

export const MUG_AD: MagSection = {
  id: 'mug-ad',
  title: 'Kiln & Kilobyte',
  toc: false,
  pages: (ctx) => [mugAd(ctx)],
};
