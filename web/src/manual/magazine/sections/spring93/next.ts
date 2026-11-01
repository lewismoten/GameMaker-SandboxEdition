// The spring issue's last editorial page and its back cover: what the next months hold (the
// teaser covers, Vol. 1, No. 5 on) and a reader-service reminder. Nothing in them is a claim
// about a game that does not exist yet.
import { adPage, adframe, button, card, covers, grid, head, list, note, p } from '../../blocks';
import { MAG } from '../../masthead';
import type { MagSection } from '../../types';

export const NEXT_1: MagSection = {
  id: 'next-month',
  title: 'Next Month',
  blurb: 'Your letters, your games, and the swap meet',
  dept: 'NEXT MONTH',
  pages: () => [
    {
      kind: 'article',
      tone: 'yellow',
      blocks: [
        head('Write to Us', { kicker: 'Next month', size: 'l', level: 1, deck: 'This is a young magazine, and the mailbox is empty. Fill it.' }),
        p('Tell us what you are making with Game-Maker and where you got stuck. We print the best letters, and the best games readers send us, next month.'),
        list([
          '**Letters** about anything in this issue, with a handle and a town.',
          '**Games** on a disk, made with Game-Maker. Short and finished beats long and not.',
          '**Tricks** you found in Snowbound or any other game. We try every one before we print it.',
        ]),
        grid(
          [
            [
              card('WRITE TO TURBO BUTTON', [`${MAG.name} · P.O. Box 000 · Fort Ashby, W.Va.`, 'A fictional address: nothing to mail, it is all free here.'], {
                go: 'go:mag/disk',
                button: 'Back to the free disk',
                tone: 'white',
              }),
            ],
          ],
          0.4,
        ),
        note('Prices and addresses are part of the story. Everything this issue links to is free to play and read here.'),
      ],
    },
  ],
};

export const BACK_COVER_1: MagSection = {
  id: 'back-cover',
  title: 'Back cover',
  toc: false,
  pages: () => [
    {
      ...adPage(
        'back-cover',
        `${MAG.name} subscriptions`,
        [
          adframe(
            `SUBSCRIBE TO ${MAG.name}!`,
            [
              covers(`${MAG.name} covers fanned out: the next four issues`, [
                { issue: 'Vol. 1, No. 5 · Next month', line: 'Readers’ letters and games', tone: 'cyan' },
                { issue: 'Vol. 1, No. 6', line: 'The summer shareware pile', tone: 'pink' },
                { issue: 'Vol. 1, No. 7', line: 'Hints, tips and a new disk', tone: 'yellow' },
                { issue: 'Vol. 1, No. 8', line: 'Back to school: games on a budget', tone: 'news' },
              ]),
              button('go:mag/cover', 'Read this issue again'),
            ],
            { burst: 'TWELVE ISSUES', sub: 'Just a gag: it is free to read here, and nothing is mailed.', tone: 'black' },
          ),
        ],
        'black',
      ),
      kind: 'back',
    },
  ],
};
