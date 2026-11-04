// The tour's What's in the box chapter, on the 1994 desk (#/desk) after its own: Inspector Ada
// Penn, from Final Curtain, takes a game's box down off the shelf and goes through what came in
// it, as the box viewer lays it out: the disks, the manual and the list of printed pieces (a
// world map, a key card, a registration card, a newsletter, a catalog, stickers), then opens the
// hint book's postcard to show the red film that reads hidden answers. Every piece is optional:
// the list depends on the game (items.ts), and on a phone the room has no shelf, so the chapter
// is only its hello and goodbye there. Opening a piece shuts the box viewer and opens the
// contents viewer (showInBox), which puts the box viewer back when it closes. Checked against
// desk/boxes/ (shelf, boxViewer, gameBoxContents, boxList) and manual/printables/ (items, viewer).
import type { Chapter, Opener, TourStep } from '../steps';

/** The box standing face out on the shelf, taken down into the box viewer. */
const box: Opener = {
  label: 'the box viewer',
  by: '.desk-scene .game-shelf .shelf-box.face-out',
  shown: '.box-viewer .box-stage',
  close: '.box-viewer .box-viewer-bar button:last-child',
};

/** The hint book's postcard opened in the box's contents viewer (the box viewer steps aside). */
const hintCard: Opener = {
  label: 'the hint book postcard',
  by: '.box-viewer .bc-list li[data-id="hintoffer"] button',
  shown: '.gmb .gmb-stage',
  close: '.gmb .gmb-bar > button:last-child',
};

/** A piece in the box's list, pointed at. */
const piece = (id: string, label: string, say: string, extra: Partial<TourStep> = {}): TourStep => ({
  id: `box-${id}`,
  action: 'point',
  target: { label, css: `.box-viewer .bc-list li[data-id="${id}"]`, in: box },
  say,
  optional: true,
  ...extra,
});

export const boxChapter: Chapter = {
  id: 'box',
  title: 'What’s in the box',
  place: 'Box',
  page: 'desk',
  hash: '#/desk',
  ready: '.desk-scene .case-btn.power',
  actor: 'ada',
  speaker: 'ada',
  music: 'sleuthParlor',
  steps: [
    {
      id: 'box-hello',
      action: 'enter',
      say: 'Inspector Ada Penn, on a new case: what a 1994 software box held. Far more than a disk, as you’ll see.',
      sound: 'creak',
    },
    {
      id: 'box-shelf',
      action: 'press',
      target: { label: 'the box standing face out', css: box.by },
      opens: box,
      say: 'Take a box down off the shelf, and the whole thing turns up in your hands.',
      sound: 'pop',
      optional: true,
    },
    {
      id: 'box-outside',
      action: 'point',
      // the stage holds the box at any angle; the box itself changes size as it turns
      target: { label: 'the box, turning', css: '.box-viewer .box-stage .box3d', steady: true, in: box },
      say: 'Outside, art up front. The back sells the game with its features, reviews and pictures.',
      optional: true,
    },
    {
      id: 'box-feelies',
      action: 'point',
      // under the box, only for a game that has trinkets, laser kits or the phone kit
      target: { label: 'the Feelies under the box', css: '.box-viewer .bc-trinkets', in: box },
      say: 'The feelies: extras packed in a game box, a habit from Infocom. Some were copy protection, like a code wheel. Click one.',
      optional: true,
    },
    {
      id: 'box-disks',
      action: 'point',
      target: { label: 'the disks in the box', css: '.box-viewer .bc-disks', in: box },
      say: 'The disks, fanned out as a set. Click them and disk one goes in drive A: to play.',
      spoken: 'The disks, fanned out as a set. Click them and disk one goes in the A drive to play.',
      optional: true,
    },
    {
      id: 'box-manual',
      action: 'point',
      target: { label: 'the manual in the box', css: '.box-viewer .bc-manual', in: box },
      say: 'The manual, stapled, with a cover of its own. Click it to read.',
      optional: true,
    },
    {
      id: 'box-list',
      action: 'point',
      target: { label: 'the list of what else came in the box', css: '.box-viewer .bc-list', in: box },
      say: 'Then the paper. Each piece has a little picture; click one to look closer. So much, and on purpose!',
      sound: 'flutter',
      optional: true,
    },
    piece('worldmap', 'the World Map in the list', 'A fold-out World Map: every scene, and the ways between them.'),
    piece('levelmaps', 'the Level Maps in the list', 'Level Maps show each level’s real map, with the start and the ways out marked.'),
    piece('keycard', 'the Key card in the list', 'A key card, a quick reminder of your keyboard.'),
    piece('postcard', 'the Registration card in the list', 'A registration card: a postcard, already marked paid. Handy!'),
    piece('newsletter', 'The Sandbox Scoop in the list', 'The Sandbox Scoop, a newsletter about the next games.'),
    piece('catalog', 'the Sandbox Software catalog in the list', 'And the Sandbox Software catalog, with every game in the family.'),
    piece('bbs', 'the BBS ad in the list', 'An ad for the BBS. Call in and download more.', {
      spoken: 'An ad for the bee bee ess. Call in and download more.',
    }),
    piece('stickers', 'the Sticker sheet in the list', 'A sheet of stickers. Cut them out, if you dare.'),
    {
      id: 'box-buttons',
      action: 'point',
      target: { label: 'the box viewer’s buttons', css: '.box-viewer .box-viewer-bar', in: box },
      say: 'Below, buttons: put the disk in drive A:, read the manual, or close. The arrows pick the next box.',
      optional: true,
    },
    {
      id: 'box-hint-open',
      action: 'press',
      target: { label: 'the hint book postcard in the list', css: hintCard.by, in: box },
      opens: hintCard,
      say: 'Stuck? This postcard is about the hint book. Let’s have a look.',
      sound: 'hmm',
      optional: true,
    },
    {
      id: 'box-hint-answer',
      action: 'point',
      target: { label: 'the hidden answer on the postcard', css: '.gmb .rf-code', in: hintCard },
      say: 'A hint book answer, and all I see is a tangle of lines. I can’t read a word of it.',
      sound: 'hmm',
      optional: true,
    },
    {
      id: 'box-hint-film',
      action: 'press',
      target: { label: 'the Red film button', css: '.gmb .gmb-bar .gmb-film-btn', in: hintCard },
      say: 'So I press Red film. It lays a red sheet over the page.',
      sound: 'aha',
      click: true,
      act: { do: 'film-over' },
      optional: true,
    },
    {
      id: 'box-hint-read',
      action: 'point',
      target: { label: 'the answer, readable through the film', css: '.gmb .rf-code', in: hintCard },
      say: 'And there it is, as plain as print. The lines vanish and the answer shows.',
      optional: true,
    },
    {
      id: 'box-hint-film-off',
      action: 'press',
      target: { label: 'the Red film button', css: '.gmb .gmb-bar .gmb-film-btn', in: hintCard },
      say: 'Press it again and the film comes off.',
      click: true,
      optional: true,
    },
    {
      // the pause lets the box viewer come back by itself, before the next step looks for it
      id: 'box-back',
      action: 'say',
      say: 'Put the hint book down, and the box comes right back to you.',
      optional: true,
    },
    {
      id: 'box-close',
      action: 'press',
      target: { label: 'the box viewer’s Close button', css: box.close, in: box },
      click: true,
      say: 'Close, and the box goes back on the shelf, ready for the next curious player.',
      optional: true,
    },
    {
      id: 'box-bye',
      action: 'exit',
      say: 'Case closed. In 1994 a box held disks, a manual, maps, cards, a catalog and stickers!',
      sound: 'chime',
    },
  ],
};
