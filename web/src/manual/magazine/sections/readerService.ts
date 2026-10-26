// The reader service card: in a 1990s magazine you circled an advertiser's number and mailed
// the card for free information. Here each number is a link to that advertiser's real page.
// The card fills its page: the numbers and a reader survey side by side, then the tear line and
// the card's postage side (replyMail.ts), addressed to a box numbered all zeros.
import { adPage, card, grid, head, note, p, reply } from '../blocks';
import type { Go } from '../go';
import { MAG } from '../masthead';
import type { MagSection } from '../types';
import { DISC_GO } from './freeCd';

const ENTRIES: [label: string, go: Go][] = [
  ['Game-Maker™: Sandbox Edition', 'go:editor'],
  ['DOS Game-Maker', 'go:dos'],
  ['The Ultimate Owner’s Guide', 'go:ultimate'],
  ['The Sandbox Software catalog', 'go:catalog/sandbox'],
  ['The Bard of Bizarre catalog', 'go:catalog/bard'],
  ['The shareware catalog', 'go:catalog/shareware'],
  ['The Sandbox BBS', 'go:bbs'],
  ['The modem', 'go:desk/modem'],
  ['The disk box', 'go:desk/diskbox'],
  ['The speakers', 'go:desk/speakers'],
  ['Mugs and tumblers', 'go:store'],
  ['The cast', 'go:route/cast'],
  ['The free CD: the original Game-Maker source', DISC_GO],
];

/** An advertiser's number on the card, e.g. '#007', for the line under its ad; only one that is on the card. */
export function readerServiceNo(go: Go): string {
  const i = ENTRIES.findIndex(([, g]) => g === go);
  if (i < 0) throw new Error(`TURBO BUTTON: ${go} is not on the reader service card`);
  return `#${String(i + 1).padStart(3, '0')}`;
}

export const READER_SERVICE: MagSection = {
  id: 'reader-service',
  title: 'Reader Service',
  toc: false,
  pages: () => [
    {
      ...adPage(
        'reader-service',
        'Reader Service',
        [
          head('READER SERVICE CARD', { kicker: 'Free information', size: 'l', level: 2 }),
          p('Want to know more about something in this issue? Press its number. No stamp needed: every one opens right here.'),
          grid(
            [
              [
                card(
                  'FREE PRODUCT INFORMATION',
                  ENTRIES.map(([label, go], i) => `[${String(i + 1).padStart(3, '0')}](${go}) ${label}`),
                ),
              ],
              [
                card(
                  'TELL US ABOUT YOU',
                  [
                    '1. I own a: ☐ 286 ☐ 386 ☐ 486',
                    '2. My sound: ☐ Sound Blaster ☐ PC speaker',
                    '3. ☐ I own a modem ☐ I call BBSes',
                    '4. Games I have made: ☐ 0 ☐ 1–3 ☐ 4 or more',
                    `5. I read ${MAG.name}: ☐ cover to cover ☐ for the hints`,
                    '6. Next issue, more: ☐ hints ☐ reviews ☐ readers’ games',
                  ],
                  { fields: ['Name', 'Age', 'Computer', 'Favorite game'] },
                ),
              ],
            ],
            0.38,
          ),
          note('✂ Fold here and tear along the dotted line ✂'),
          reply([`${MAG.name} READER SERVICE`, 'P.O. BOX 000', 'PITTSBURGH, PA 15213']),
          note('Nothing to mail: the card is part of the story, and the box and permit numbers are made up.'),
        ],
        'cyan',
      ),
    },
  ],
};
