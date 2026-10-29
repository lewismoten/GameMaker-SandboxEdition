// The tour's DOS chapter: Professor Fiddlesticks, the inventor of Quest for the Round Tuit, shows
// the DOS page (dos.html), the desk's PC on its own. It is a page of its own, so the whole tour
// goes on there with a page load (tourEngine.ts handOff) and plays it last. The page boots
// straight into Game-Maker, whose copy check asks for a word from the Owner's Guide (the guide
// and the registration card open beside the screen); the tour types nothing and presses
// nothing: the ⋯ menu is opened to show its items and shut again. Checked against
// dosPage/dosPage.ts, diskMenu.ts, footer.ts, moreMenu.ts, lineSpeed.ts, retro/gm.ts (the menu
// bars), retro/gmReg/ (chk.ts, regSide.ts) and viewSwitch.ts.
import type { Chapter, Target } from '../steps';

/** A control in the bar, by the start of its tooltip. */
const control = (label: string, title: string): Target => ({ label, css: `.dos-controls .dos-btn[title^="${title}"]` });
/** An item of the ⋯ menu, opened to show it. */
const more = (text: string): Target => ({ label: `${text} in the ⋯ menu`, css: '.dos-menu > *', text, reveal: '.dos-more > summary' });

export const dosChapter: Chapter = {
  id: 'dos',
  title: 'DOS Game-Maker',
  place: 'DOS',
  page: 'dos',
  hash: '',
  file: 'dos.html',
  ready: '.dos-bar .dos-controls .dos-btn',
  actor: 'fiddle',
  speaker: 'fiddle',
  music: 'tuitMenu',
  steps: [
    {
      id: 'dos-hello',
      action: 'enter',
      say: 'Professor Fiddlesticks, at your service! This is the very same PC, minus the room, filling the window.',
      sound: 'fanfare',
    },
    {
      id: 'dos-check',
      action: 'point',
      target: { label: 'the screen', css: '.dos-crt' },
      say: 'Game-Maker may ask for a word from its Owner’s Guide. That was copy protection, back in 1994.',
    },
    {
      id: 'dos-guide',
      action: 'point',
      target: { label: 'the Owner’s Guide beside the screen', css: '.rs-panel.rs-manual' },
      say: 'The guide opens beside it, at the right page, the word marked. Type the word and you’re in.',
      optional: true,
    },
    {
      id: 'dos-card',
      action: 'point',
      target: { label: 'the registration card', css: '.rs-panel.rs-card' },
      say: 'Or mail the registration card. Once the reply comes, Game-Maker stops asking.',
      optional: true,
    },
    {
      id: 'dos-menus',
      action: 'point',
      target: { label: 'the screen', css: '.dos-crt' },
      say: 'Then its menus: Play runs a game in PLAYGAME, Design opens the tools that make one, Quit goes to DOS.',
    },
    {
      id: 'dos-prompt',
      action: 'say',
      say: 'At the DOS prompt, type GM to come back, or a game’s name on its disk to play it.',
    },
    {
      id: 'dos-power',
      action: 'point',
      target: control('the Power button', 'Switch the PC'),
      say: 'Power switches it on and off. Off is really off: the next start is a fresh boot.',
    },
    {
      id: 'dos-gm',
      action: 'point',
      target: { label: 'the Game-Maker button', css: '.dos-controls .dos-primary' },
      say: 'The Game-Maker button takes you back to it from anywhere, with its CD in drive D:.',
      sound: 'pickup',
    },
    {
      id: 'dos-disks',
      action: 'point',
      target: { label: 'the Disks button', css: '.dos-controls .dos-disks' },
      say: 'Disks is your disk box: Play, Design, or just Insert any game’s floppy in drive A:.',
    },
    {
      id: 'dos-turbo',
      action: 'point',
      target: control('the Turbo button', 'Turbo'),
      say: 'Turbo is sixty-six megahertz of pure speed. Off, it plods along like an old 286.',
    },
    {
      id: 'dos-sound',
      action: 'point',
      target: control('the Sound button', 'Sound on or off'),
      say: 'Sound switches the PC’s sound on and off.',
    },
    {
      id: 'dos-full',
      action: 'point',
      // on the narrowest phones it is in the ⋯ menu
      target: { label: 'the Full screen button', css: ['.dos-controls .dos-full', '.dos-menu > .dos-full-item'], reveal: '.dos-more > summary' },
      say: 'Full screen hides everything else, the browser too.',
      optional: true,
    },
    {
      id: 'dos-reset',
      action: 'point',
      target: more('Reset'),
      say: 'Reset restarts the PC, like the button on the front of the case.',
    },
    {
      id: 'dos-blaster',
      action: 'point',
      target: more('Sound Blaster card'),
      say: 'Without the Sound Blaster card, games beep their sounds on the PC speaker.',
    },
    {
      id: 'dos-bbs',
      action: 'point',
      target: more('BBS'),
      say: 'BBS dials the board with the modem. The line speed under it says how fast.',
      sound: 'kazoo',
    },
    {
      id: 'dos-manuals',
      action: 'point',
      target: more('Owner’s Guide'),
      say: 'The Owner’s Guide is Game-Maker’s manual. The Ultimate Guide has the advanced tips and tricks.',
    },
    {
      id: 'dos-keys',
      action: 'point',
      target: { label: 'the Keys button', css: '.dos-foot .dos-fold > summary', text: 'Keys' },
      say: 'No keyboard? Keys opens big on-screen keys for the PC.',
    },
    {
      id: 'dos-links',
      action: 'point',
      target: { label: 'the Links button', css: '.dos-foot .dos-fold > summary', text: 'Links' },
      say: 'Links lists addresses that open this page on a game, at the prompt, or on the BBS.',
    },
    {
      id: 'dos-switch',
      action: 'point',
      target: { label: 'the Desk, DOS and Web switch', css: '.dos-bar .view-switch' },
      say: 'Desk takes you back to the room around this PC, and Web to today’s site.',
    },
    {
      id: 'dos-bye',
      action: 'exit',
      say: 'That concludes the tour! Now, if you’ll excuse me, THE CHEZ needs charging.',
      prop: { id: 'chez', run: 'across' },
      sound: 'ahooga',
    },
  ],
};
