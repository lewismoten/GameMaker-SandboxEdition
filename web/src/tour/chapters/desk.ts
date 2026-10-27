// The tour's Desk 1994 chapter: teenage Lewie, from Snowbound: The $89 Shovel, shows his room
// and its PC (#/desk). The room is drawn in HTML (desk/deskScene.ts), so every part is a real
// element a selector finds. The only real press is Power, and only while the PC is off (it
// never switches it off); the rest is pointed at, so the disk in drive A:, what the PC runs and
// what has been found stay as the visitor left them. On a phone the room is a column without the
// wall (no shelf, poster, clock or phone): those steps are left out there. Checked against
// desk/deskScene.ts, desk.ts, deskPc.ts, disks/, pc/ (keyboard, gamePad, modem), boxes/shelf.ts,
// room/ (paperStack, wallClock, phone/calls) and props/propKit.ts.
import type { Chapter } from '../steps';

export const deskChapter: Chapter = {
  id: 'desk',
  title: 'The 1994 desk',
  place: 'Desk',
  page: 'desk',
  hash: '#/desk',
  ready: '.desk-scene .case-btn.power',
  actor: 'lewie',
  speaker: 'lewie',
  music: 'snowTitle',
  steps: [
    {
      id: 'desk-hello',
      action: 'enter',
      say: 'Hey, I’m Lewie. Welcome to my room! It’s December 1994, and this PC is where the games get made.',
      sound: 'crunch',
    },
    {
      id: 'desk-power',
      action: 'press',
      target: { label: 'the Power button', css: '.desk-scene .case-btn.power' },
      // switched on only while it is off: the tour never switches the visitor's PC off
      click: '[aria-pressed="false"]',
      say: 'Power switches the PC on. It boots DOS, just like a real one.',
      sound: 'blip',
    },
    {
      id: 'desk-screen',
      action: 'point',
      target: { label: 'the screen', css: '.desk-scene .crt' },
      say: 'Everything runs on this screen: the DOS prompt, Game-Maker, the games, even the BBS.',
    },
    {
      id: 'desk-enlarge',
      action: 'point',
      target: { label: 'the Enlarge screen button', css: '.desk-scene .monitor .enlarge' },
      say: 'This little button fills the window with the screen. Back to the desk brings the room back.',
    },
    {
      id: 'desk-turbo',
      action: 'point',
      target: { label: 'the Turbo button', css: '.desk-scene .case-btn[aria-label="Turbo"]' },
      say: 'Turbo runs it at full speed. Switch it off and games crawl along like on an old 286.',
    },
    {
      id: 'desk-diskbox',
      action: 'point',
      target: { label: 'the disk box', css: '.desk-scene .disk-box' },
      say: 'The disk box has a floppy for every game. Pick one and it goes in drive A: and starts.',
      sound: 'pop',
    },
    {
      id: 'desk-drive',
      action: 'point',
      target: { label: 'drive A:', css: '.desk-scene .drive.fdd' },
      say: 'That’s drive A:. With a disk in, buttons beside it play it, design it, or open it in today’s web.',
    },
    {
      id: 'desk-gmbox',
      action: 'point',
      target: { label: 'the Game-Maker box', css: '.desk-scene .gm-box' },
      say: 'The Game-Maker box: turn it over, read the Owner’s Guide, or put the CD in and start Game-Maker.',
    },
    {
      id: 'desk-keyboard',
      action: 'point',
      target: { label: 'the keyboard', css: ['.desk-scene .keyboard', '.desk-scene .key-strip'] },
      say: 'Type on your own keyboard, or click the keys here to press them on the PC.',
    },
    {
      id: 'desk-pad',
      action: 'point',
      target: { label: 'the game pad', css: '.desk-scene .game-pad' },
      say: 'The GRAVITAS pad is the PC’s joystick. A real gamepad works too, and a click opens big buttons.',
    },
    {
      id: 'desk-shelf',
      action: 'point',
      target: { label: 'the shelf of game boxes', css: '.desk-scene .game-shelf' },
      say: 'My shelf has a box for every game. Take one down to turn it over, read its manual, or play it.',
      optional: true,
    },
    {
      id: 'desk-papers',
      action: 'point',
      target: { label: 'the catalog and the magazine', css: '.desk-scene .ps-toggle' },
      say: 'The shareware catalog and TURBO BUTTON magazine. Read either one; the catalog can even call the BBS.',
    },
    {
      id: 'desk-modem',
      action: 'point',
      target: { label: 'the modem', css: '.desk-scene .modem' },
      say: 'The modem calls the BBS, where you can download more games. Click its speed to change it.',
    },
    {
      id: 'desk-phone',
      action: 'point',
      target: { label: 'the wall phone', css: '.desk-scene .prop-cover[aria-label^="Wall telephone"]' },
      say: 'The phone really dials. Try the numbers on Mom’s notes, or call for the time and the weather.',
      optional: true,
    },
    {
      id: 'desk-clock',
      action: 'point',
      target: { label: 'the wall clock', css: '.desk-scene .wall-clock' },
      say: 'A giant wristwatch makes a fine wall clock. Turn the lights off and its hands glow.',
      optional: true,
    },
    {
      id: 'desk-poster',
      action: 'point',
      target: { label: 'the poster', css: '.desk-scene .poster' },
      say: 'My big plan: shovel snow all winter to buy Game-Maker. Eighty-nine dollars, plus four for shipping!',
      sound: 'scoop',
      optional: true,
    },
    {
      id: 'desk-sticky',
      action: 'point',
      target: { label: 'the Too retro? sticky note', css: '.desk-scene .monitor .sticky' },
      say: 'Too retro? This note takes you to today’s web, with all the same games.',
    },
    {
      id: 'desk-switch',
      action: 'point',
      target: { label: 'the Desk, DOS and Web switch', css: '.desk-bar .view-switch' },
      say: 'Desk, DOS and Web switch views. DOS is this same PC, filling the whole window.',
    },
    {
      id: 'desk-guides',
      action: 'point',
      target: { label: 'the ? Guides button', css: '.desk-bar .tour-btn' },
      say: 'Press the question mark any time to see this tour again.',
      optional: true,
    },
    {
      id: 'desk-bye',
      action: 'exit',
      say: 'That’s my room. Now, who wants to make a game?',
      prop: { id: 'chez', run: 'across' },
      sound: 'ahooga',
    },
  ],
};
