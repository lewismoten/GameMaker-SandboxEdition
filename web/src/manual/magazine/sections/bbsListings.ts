// The BBS listings: the boards in TERMINAL's dialing directory on the desk (retro/bbs/bbs.ts,
// sofa.ts), as the era's BBS lists printed them (number, SysOp, speed, hours, what is on it),
// each with a link that dials it, and a "how to call a BBS" page for newcomers with the desk
// modem's speeds and how long a download takes at each.
import { NEW_USER_FILES, POINTS_PER_CALL, RATIO } from '../../../retro/bbs/ratio';
import { cps, DEFAULT_SPEED, LINE_SPEEDS, speedWords } from '../../../retro/bbs/lineSpeed';
import { button, grid, head, list, note, p, rows, side } from '../blocks';
import type { MagSection } from '../types';

/** The boards' numbers, as TERMINAL dials them (bbs.ts PHONE, sofa.ts SOFA_PHONE; a test keeps them in step). */
export const SANDBOX_PHONE = '1-412-555-SAND';
export const SOFA_PHONE = '1-412-555-SOFA';

/** Minutes a 100 KB ZIP takes to come down the line, rounded the way a BBS list would. */
function hundredK(speed: (typeof LINE_SPEEDS)[number]): string {
  const s = 100_000 / cps('file', speed);
  if (!Number.isFinite(s)) return 'no wait';
  return s < 90 ? `${Math.round(s)} sec` : `${Math.round(s / 60)} min`;
}

const SPEEDS = LINE_SPEEDS.filter((s) => s !== 'unlimited');

export const BBS_LISTINGS: MagSection = {
  id: 'bbs',
  title: 'BBS Listings',
  blurb: 'The boards to call in the 412, and how to call them',
  dept: 'BBS LISTINGS',
  pages: () => [
    {
      kind: 'dept',
      tone: 'news',
      blocks: [
        head('BBS List: Area Code 412', {
          kicker: 'Who to call tonight',
          deck: 'Fire up TERMINAL, pick a number and listen for the handshake. Every board here is in the dialing directory on the 1994 desk: press a board’s name to dial it.',
          size: 'l',
          level: 2,
        }),
        rows([
          {
            title: 'THE -= S A N D B O X =- BBS',
            go: 'go:bbs/sandbox',
            price: SANDBOX_PHONE,
            by: 'SysOp: Lewis · Renegade · 300–14,400 · 8-N-1 · Pittsburgh, PA',
            blurb: 'Game-Maker shareware and tips for designers. One phone line, a 1:5 ratio, and a door game.',
          },
          {
            title: 'The Sofa',
            go: 'go:bbs/sofa',
            price: SOFA_PHONE,
            by: 'The Major BBS · 8 lines · 8-N-1 · Pittsburgh, PA',
            blurb: 'Pittsburgh’s place to kick back. Teleconference all night, and free song-games in the file library.',
          },
        ]),
        grid(
          [
            [
              side(
                'THE -= S A N D B O X =- BBS',
                [
                  p(`**Phone** ${SANDBOX_PHONE} · **SysOp** Lewis · **Software** Renegade · **Modem** 14,400 bps V.32bis`),
                  p('**Hours** Any hour; 60 minutes a call. The board has one line, so be quick and be nice.'),
                  list([
                    '**The Sand Pile** (F): the Game-Maker CD’s shareware, every one with its FILE_ID.DIZ. **New Files Scan** (N) lists the newest uploads, Sandbox Software’s own games.',
                    '**Picture Gallery** (P): the SysOp’s GIF snapshots.',
                    '**Door Games** (D): TIC-TAC-TOE BY MODEM v1.2. You get one move a call against SCROLLMASTER from Highland Park, who calls in while you’re off the line.',
                    '**Bulletins** (B): new files, the ratio, about shareware, and news about Game-Maker.',
                  ]),
                  p(
                    `**Ratio** 1:${RATIO}. New callers get ${NEW_USER_FILES} files on the house, and every call earns ${POINTS_PER_CALL} more. The SysOp’s own uploads are FREE and never count. Leeches will be deleted!`,
                  ),
                  note('Word is, elite callers press a different letter. You didn’t hear it here.'),
                  button('go:bbs/sandbox', `Dial ${SANDBOX_PHONE}`),
                ],
                'white',
              ),
            ],
            [
              side(
                'The Sofa',
                [
                  p(`**Phone** ${SOFA_PHONE} · **SysOp** goat · **Software** The Major BBS · **Lines** 8, often all busy: keep trying!`),
                  p('**Hours** Teleconference is open all night. Log on with “new” for a User-ID of your own.'),
                  list([
                    '**Teleconference** (T): chat live with the regulars. COUCH POTATO, REMOTE CONTROL and CUSHION KING are usually on. No flooding the channel!',
                    '**Who’s on** (W): every line, and what each caller is doing.',
                    '**File library** (F): free downloads, no ratio. The song-games by Doc Leo, The Bard of Bizarre, and the six Latin songs of Veni, Vidi, Risi!',
                    '**GIF pictures** (P): THE CHEZ and The Bard of Bizarre’s logo.',
                  ]),
                  p('[Every song-game in the file library](go:mag/directory-3) is in the Game Directory.'),
                  button('go:bbs/sofa', `Dial ${SOFA_PHONE}`),
                ],
                'pink',
              ),
            ],
          ],
          0.4,
        ),
        note('Numbers, handles and boards are part of the story the 1994 desk tells. They dial only from the desk’s TERMINAL, never a real phone.'),
      ],
    },
    {
      kind: 'dept',
      tone: 'cyan',
      blocks: [
        head('How to Call a BBS', {
          kicker: 'For newcomers',
          deck: 'Never dialed a board before? It takes a modem, a phone line nobody else is using, and about five minutes to learn.',
          size: 'l',
          level: 2,
        }),
        grid(
          [
            [
              side(
                'Your first call, step by step',
                [
                  list(
                    [
                      'At the C:\\> prompt, type **TERMINAL** and press Enter. (Or type **TERMINAL SANDBOX** or **TERMINAL SOFA** to dial a board at once.)',
                      'Pick a board from the dialing directory by its number.',
                      'Listen: the dial tone, the number, then the squeal of two modems shaking hands. **CONNECT** means you’re in.',
                      'Log on. On the Sandbox, type **GUEST** or a handle; on The Sofa, type **new**.',
                      'Read the bulletins first. Every SysOp says so, and they mean it.',
                      'Log off from the menu (G on the Sandbox, X on The Sofa) instead of just hanging up. Then you’ll see **NO CARRIER**: the call is over.',
                    ],
                    true,
                  ),
                  button('go:bbs', 'Run TERMINAL'),
                ],
                'white',
              ),
            ],
            [
              side(
                'Pick your speed',
                [
                  p(
                    `Set the line speed on the [modem on the desk](go:desk/modem). It runs from ${speedWords(300)} to 56K, and comes set to ${speedWords(DEFAULT_SPEED)}. Here is how long a 100 KB ZIP takes at each:`,
                  ),
                  rows(SPEEDS.map((s) => ({ title: speedWords(s), price: hundredK(s) }))),
                  note('The modem’s UNLIMITED setting is today’s speed: no waiting at all.'),
                  button('go:desk/modem', 'Look at the modem'),
                ],
                'yellow',
              ),
            ],
          ],
          0.4,
        ),
        grid(
          [
            [
              side(
                'BBS lingo',
                [
                  list([
                    '**SysOp**: the system operator, who runs the board.',
                    '**Door**: a game or program the board runs for you, like TIC-TAC-TOE BY MODEM.',
                    '**Ratio**: how many files you may download for each one you upload.',
                    '**Leech**: a caller who only downloads. Don’t be one.',
                    '**FILE_ID.DIZ**: the short description packed inside a ZIP.',
                    '**Flood**: filling a chat with the same line over and over. Ask LUNCHMEAT.',
                  ]),
                ],
                'white',
              ),
            ],
            [
              side(
                'Phone line manners',
                [
                  p(
                    'A modem needs the phone line to itself. If someone in the house picks up an extension in the middle of a call, the call drops, upload and all.',
                  ),
                  p('**Tell your family before you upload.** The Sandbox’s bulletins say so too: the SysOp’s mom picks up the phone.'),
                ],
                'pink',
              ),
            ],
          ],
          0.4,
        ),
      ],
    },
  ],
};
