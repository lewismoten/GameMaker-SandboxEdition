// The store: a mail-order catalog page of the Sandbox mugs and tumblers. They are the desk
// mug's (desk/mug/): its sizes (mugSizes.ts MUG_SIZES), its pictures (mugArt.ts MUG_DESIGNS:
// the BBS's ANSI art and the Sandbox Software games' title screens) and its colors inside.
// Nothing is sold: the store prints a sublimation wrap free, so the page shows no prices.
// Each size links go:store/<size id> (the print page with it); the mug viewer is go:store.
import { MUG_SIZES } from '../../../desk/mug/mugSizes';
import { card, grid, head, note, p, rows, shot } from '../blocks';
import type { Go } from '../go';
import type { ListingRow, MagContext, MagSection } from '../types';

/** What each size is good for, in the catalog's words. */
const SIZE_WORDS: Record<string, string> = {
  '11oz': 'The classic, for cocoa after shoveling.',
  '15oz': 'The big one, for all-night sessions.',
  '12oz': 'Enamel, for the campsite or the club.',
  '20oz': 'The picture wraps all the way round.',
};

/** The Sandbox Software games whose title screens go on a mug (desk/mug/gameMugArt.ts GAME_MUGS). */
const GAME_MUGS = ['teddy', 'sandcast', 'logic', 'snowbound', 'maximus', 'year2000', 'blaster', 'sleuth'];
/** The ones pictured on the page. */
const PICTURED = ['teddy', 'sandcast', 'logic', 'snowbound'];
/** The BBS's own pictures (mugArt.ts). */
const BBS_PICTURES = ['the logon screen', 'the SANDBOX logo', 'the BBS banner', 'the Game-Maker SE title'];

const sizeRow = (s: (typeof MUG_SIZES)[number], i: number): ListingRow => ({
  title: s.name,
  go: `go:store/${s.id}` as Go,
  by: `Item SB-${String(i + 1).padStart(2, '0')}`,
  kind: `${s.handle ? 'Handle' : 'No handle'} · ${s.wrapW} × ${s.wrapH} in wrap`,
  price: 'Free to print',
  blurb: SIZE_WORDS[s.id] ?? '',
});

function storePage(ctx: MagContext) {
  const games = GAME_MUGS.filter((id) => ctx.game(id));
  const titles = games.map((id) => `*${ctx.game(id)!.title}*`);
  return [
    {
      kind: 'dept' as const,
      tone: 'yellow' as const,
      blocks: [
        head('THE SANDBOX STORE', {
          kicker: 'Mail-order catalog · Mugs & tumblers',
          deck: 'Your favorite game on your desk, full of pencils. Pick a size, pick a picture, and press your own.',
          size: 'l',
        }),
        rows(MUG_SIZES.map(sizeRow)),
        grid(
          PICTURED.filter((id) => ctx.game(id)).map((id) => [
            shot(id, 'title', `${ctx.game(id)!.title}, its title screen: the picture on its mug`, `[${ctx.game(id)!.title}](go:store)`),
          ]),
          0.18,
        ),
        p(
          `**THE PICTURES.** The Sandbox Software title screens, hero and all: ${titles.join(', ')}. Or the board’s own ANSI art from THE -= S A N D B O X =- BBS: ${BBS_PICTURES.join(', ')}. Put a different one on the back if you like.`,
        ),
        card(
          'MAIL-ORDER FORM',
          [
            'Size: ☐ 11 oz mug  ☐ 15 oz mug  ☐ 12 oz camp mug  ☐ 20 oz skinny tumbler',
            'Inside and handle: ☐ White  ☐ Black  ☐ Red  ☐ Blue  ☐ Yellow',
            'Left-handed? ☐ Yes, turn the picture round for me',
          ],
          { fields: ['Front picture', 'Back picture'], go: 'go:store', button: 'Open the mug store', tone: 'white' },
        ),
        note(
          'Nothing to mail and nothing to pay: the store turns the [mug on the desk](go:desk/mug) and prints its wrap at actual size, free, for a blank sublimation mug you press yourself.',
        ),
      ],
    },
  ];
}

export const STORE: MagSection = {
  id: 'store',
  title: 'The Sandbox Store',
  blurb: 'Mugs and tumblers with your favorite game on them',
  dept: 'THE STORE',
  pages: (ctx) => storePage(ctx),
};
