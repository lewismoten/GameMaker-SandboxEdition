// The spring issue's back cover: what the next months hold (the teaser covers, Vol. 1, No. 5 on)
// and a reader-service reminder. Nothing in it is a claim about a game that does not exist yet.
// ("Write to us" is a box on the PC News page, sections/spring93/pcNews.ts.)
import { adPage, adframe, button, covers } from '../../blocks';
import { MAG } from '../../masthead';
import type { MagSection } from '../../types';

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
