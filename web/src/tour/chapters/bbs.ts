// The tour's BBS chapter, on the 1994 desk (#/desk) after its own: Dex Dynamo, from In The Year
// 2000!, calls THE -= S A N D B O X =- BBS on the desk's PC while teenage Lewie, its SysOp, says
// how his board works. The desk types for the tour (desk/deskTour.ts, asked with page acts):
// TERMINAL dials the board, GUEST logs in, N lists the newest files (the SysOp's own games, free
// under the ratio), V shows one's details, D starts its download at 14,400 baud, the modem's
// speed is switched to Unlimited partway through (a real click on its menu) so it finishes at
// once, and G logs off. When the chapter is left the desk puts back what the call changed: the
// line speed, the board's user file and door game, and the file it put on C: (achievements don't
// count while a tour plays). A PC busy with the visitor's own program isn't touched: the call's
// steps are left out and Dex says how to call instead. Checked against retro/bbs/ (bbs.ts,
// sandbox.ts, transfer.ts, lineSpeed.ts, ratio.ts) and desk/pc/modem.ts.
import type { Chapter, Target } from '../steps';

/** The PC's screen, while the tour's call is going as planned. */
const screen: Target = { label: 'the screen', css: '.desk[data-tour-bbs="on"] .desk-scene .crt' };

export const bbsChapter: Chapter = {
  id: 'bbs',
  title: 'Calling the BBS',
  place: 'BBS',
  page: 'desk',
  hash: '#/desk',
  ready: '.desk-scene .modem',
  actor: 'dex',
  speaker: 'dex',
  music: 'y2kTitle',
  leave: 'bbs-end',
  steps: [
    {
      id: 'bbs-hello',
      action: 'enter',
      say: 'Dex Dynamo, dialing in from the future! In 1994 you called a BBS: somebody’s own PC, answering the phone.',
      sound: 'oneup',
    },
    {
      id: 'bbs-sysop',
      action: 'enter',
      actor: 'lewie',
      speaker: 'lewie',
      say: 'And The Sandbox BBS runs on mine! I’m its SysOp. Go ahead, Dex, give it a call.',
      spoken: 'And The Sandbox bee bee ess runs on mine! I’m its sis-op. Go ahead, Dex, give it a call.',
      sound: 'blip',
    },
    {
      id: 'bbs-dial',
      action: 'point',
      target: { label: 'the modem', css: '.desk-scene .modem' },
      act: { do: 'bbs-call' },
      say: 'TERMINAL dials 1-412-555-SAND. That screech is two modems shaking hands.',
      spoken: 'Terminal dials one, four one two, five five five, sand. That screech is two modems shaking hands.',
    },
    {
      // the PC was busy with the visitor's own program: no call
      id: 'bbs-busy',
      action: 'point',
      target: { label: 'the modem', css: '.desk:not([data-tour-bbs]) .desk-scene .modem' },
      say: 'The PC is busy right now. Quit what’s running, then click the modem to call the BBS yourself.',
      optional: true,
    },
    {
      id: 'bbs-login',
      action: 'point',
      target: screen,
      act: { do: 'bbs-type', wait: 'Enter your handle', text: 'GUEST\n' },
      say: 'Connected! It asks for a handle. GUEST gets in without a password.',
      sound: 'kaching',
      optional: true,
    },
    {
      id: 'bbs-ratio',
      action: 'point',
      speaker: 'lewie',
      target: screen,
      act: { do: 'bbs-type', wait: 'to continue', text: '\n' },
      say: 'Last few callers, then my rule: upload one file for every five you take. Leeches get deleted!',
      optional: true,
    },
    {
      id: 'bbs-menu',
      action: 'point',
      target: screen,
      act: { do: 'bbs-type', wait: 'Time left', text: 'N' },
      say: 'The main menu. N scans the newest files: the Sandbox games, free to download.',
      optional: true,
    },
    {
      id: 'bbs-view',
      action: 'point',
      target: screen,
      act: { do: 'bbs-view', wait: 'V# to view' },
      say: 'V and a file’s number shows its details: what it is, how big, and its author’s notice.',
      optional: true,
    },
    {
      id: 'bbs-download',
      action: 'point',
      target: screen,
      act: { do: 'bbs-download', wait: 'V# to view' },
      say: 'D and the number downloads it. At 14,400 bits a second, this would take a few minutes.',
      spoken: 'D and the number downloads it. At fourteen thousand four hundred bits a second, this would take a few minutes.',
      optional: true,
    },
    {
      id: 'bbs-speed',
      action: 'press',
      target: {
        label: 'Unlimited in the modem’s speed menu',
        css: ':root:has(.desk[data-tour-bbs="on"]) .modem-menu .speed-choice',
        text: 'Unlimited',
        reveal: '.desk-scene .modem-speed',
      },
      click: true,
      say: 'Too slow? Change the modem’s speed, even mid-call. Unlimited is today’s speed: no waiting!',
      sound: 'zap',
      optional: true,
    },
    {
      id: 'bbs-done',
      action: 'point',
      speaker: 'lewie',
      target: screen,
      say: 'Downloaded and unzipped into C:\\DOWNLOAD. When the tour ends, it comes off again, so your drive stays yours.',
      spoken: 'Downloaded and unzipped into the download folder on drive C. When the tour ends, it comes off again, so your drive stays yours.',
      optional: true,
    },
    {
      id: 'bbs-bye',
      action: 'point',
      target: screen,
      act: { do: 'bbs-type', wait: 'V# to view', text: 'Q\n' },
      say: 'Back to the menu, G says goodbye, and the modem hangs up. NO CARRIER!',
      spoken: 'Back to the menu, G says goodbye, and the modem hangs up. No carrier!',
      optional: true,
    },
    {
      id: 'bbs-logoff',
      action: 'exit',
      act: { do: 'bbs-logoff', wait: 'Time left' },
      say: 'Thanks for calling. The modem on the desk dials it any time.',
      sound: 'oneup',
    },
  ],
};
