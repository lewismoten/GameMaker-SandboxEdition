// The reader service card: in a 1990s magazine you circled an advertiser's number and mailed
// the card for free information. Here each number is a link to that advertiser's real page.
import { adPage, card, grid, head, note, p } from '../blocks';
import type { Go } from '../go';
import type { MagSection } from '../types';

const ENTRIES: [label: string, go: Go][] = [
  ['Game-Maker: Sandbox Edition', 'go:editor'],
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
];

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
          card(
            'FREE PRODUCT INFORMATION',
            ENTRIES.map(([label, go], i) => `[${String(i + 1).padStart(3, '0')}](${go}) ${label}`),
            { fields: ['Name', 'Age', 'Computer', 'Favorite game'] },
          ),
          grid([[p('☐ I own a modem  ☐ I call BBSes  ☐ I make my own games')], [p('☐ 286  ☐ 386  ☐ 486  ☐ Sound Blaster  ☐ VGA')]]),
          note('Nothing to mail: the card is part of the story.'),
        ],
        'cyan',
      ),
    },
  ],
};
