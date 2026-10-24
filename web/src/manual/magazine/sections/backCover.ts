// The back cover: a full-page ad for THE -= S A N D B O X =- BBS.
import { adPage, adframe, art, big, button, grid, list } from '../blocks';
import type { MagSection } from '../types';

export const BACK_COVER: MagSection = {
  id: 'back-cover',
  title: 'Back cover',
  toc: false,
  pages: () => [
    {
      ...adPage(
        'back-cover',
        'The Sandbox BBS',
        [
          adframe(
            'THE -= S A N D B O X =- BBS',
            [
              big('1-412-555-SAND', '14,400 baud'),
              list([
                'Every Sandbox Software game, free to download',
                'Message bases, bulletins from the SysOp and the GIF Gallery',
                'TIC-TAC-TOE BY MODEM: one move a call',
              ]),
              art('sandbox', 'The Sandbox Software mark'),
              grid([[button('go:bbs', 'Call the Sandbox BBS')], [button('go:desk/modem', 'Set the modem’s speed')]]),
            ],
            { burst: 'CALL TONIGHT!', sub: 'Pittsburgh’s board for games made with Game-Maker.', tone: 'black' },
          ),
        ],
        'black',
      ),
      kind: 'back',
    },
  ],
};
