// The spring issue's Strategy Guide: Snowbound, in its own hint book's words (answers upside
// down, the hint blocks do that), one reader's trick, and the hint book's coupon. A felt-egg
// section of the book is never quoted (strategy.ts SECRET), so nothing here says where one hides.
import { cols, grid, head, hint, note, p, side } from '../../blocks';
import type { Block, MagContext, MagPage, MagSection } from '../../types';
import { bookCard, READER_TRICKS, SECRET } from '../strategy';

const GAME = 'snowbound';

/** The hint book's open sections as hint blocks, section by section. */
function sections(ctx: MagContext): { head: string; hints: Block[] }[] {
  const g = ctx.game(GAME);
  return (g?.hints ?? []).filter((s) => !SECRET.test(s.head)).map((s) => ({ head: s.head, hints: s.hints.map((x) => hint(x.q.trim(), x.a.trim(), GAME)) }));
}

export const TIPS_1: MagSection = {
  id: 'strategy',
  title: 'Strategy Guide: Snowbound',
  blurb: 'Money, the sled and Big Pete, from the hint book',
  dept: 'STRATEGY GUIDE',
  pages: (ctx): MagPage[] => {
    const g = ctx.game(GAME);
    const all = sections(ctx);
    const trick = READER_TRICKS.find((t) => t.game === GAME);
    const half = Math.ceil(all.length / 2);
    const part = (list: typeof all) =>
      cols(
        2,
        list.flatMap((s) => [head(s.head, { size: 's', level: 3 }), ...s.hints]),
      );
    return [
      {
        kind: 'dept',
        tone: 'white',
        blocks: [
          head('Stuck in the Snow?', {
            kicker: 'The Strategy Guide',
            size: 'xl',
            level: 2,
            deck: 'The official hint book for Snowbound: The $89 Shovel, printed upside down so you only read the answer you need.',
          }),
          part(all.slice(0, half)),
          note(`[Play it](go:play/${GAME}) · the whole book is in [${g?.hintBook ?? 'the hint book'}](go:hints/${GAME})`),
        ],
      },
      {
        kind: 'dept',
        tone: 'cyan',
        blocks: [
          head('More Snowbound', { kicker: 'The Strategy Guide', size: 'm', level: 2 }),
          part(all.slice(half)),
          ...(trick ? [side('Reader trick', [p(trick.text), p(`*— ${trick.from}*`)], 'yellow')] : []),
          ...(g ? [grid([[bookCard(g)]], 0.4)] : []),
        ],
      },
    ];
  },
};
