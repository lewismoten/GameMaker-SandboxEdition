// The tour's Library chapter: Mystery Robot Joe, KEEP IT BRIEF!'s night librarian, says what
// the shelves hold while teenage Lewie (Snowbound) runs to each part. Checked against
// library/libraryPage.ts, shelf.ts, siteShelf.ts, printShelf.ts and walkShelf.ts.
import type { Chapter } from '../steps';

/** A card on the shelves by its title (the name under its picture). */
const card = (title: string, label: string) => ({ label, css: '.lib-card .lib-name', text: title });

export const libraryChapter: Chapter = {
  id: 'library',
  title: 'The Library',
  place: 'Library',
  page: 'library',
  hash: '#/library',
  ready: '.lib-orders .lib-order',
  actor: 'lewie',
  speaker: 'joe',
  music: 'briefLibrary',
  steps: [
    {
      id: 'library-hello',
      action: 'enter',
      actor: 'joe',
      say: 'Good evening. I’m Joe, the night librarian. Everything on these shelves is to read, print or watch.',
      sound: 'shhh',
    },
    {
      id: 'library-lewie',
      action: 'enter',
      speaker: 'lewie',
      say: 'Hi, I’m Lewie! I shoveled a lot of snow to buy Game-Maker. All the paper from the game boxes is here.',
      sound: 'flutter',
    },
    {
      id: 'library-sort',
      action: 'point',
      target: { label: 'the By game and By type buttons', css: '.lib-orders' },
      say: 'Sort the shelves by game, or by type: every manual together, every map together.',
    },
    {
      id: 'library-pick',
      action: 'point',
      target: { label: 'the Game or Kind picker', css: '#lib-only' },
      say: 'Pick one game, or one kind, to see just that shelf.',
    },
    {
      // the Library opens on a game's own shelf just after that game was shown
      id: 'library-all',
      action: 'press',
      target: { label: 'the All games button', css: '.lib-showing .lib-show-all' },
      click: true,
      say: 'Showing just one game? This puts everything back on the shelves.',
      sound: 'flutter',
      optional: true,
    },
    {
      id: 'library-count',
      action: 'point',
      actor: 'joe',
      target: { label: 'the count of things on the shelves', css: '.lib-count' },
      say: 'This counts everything on the shelves. I counted them too. Twice.',
    },
    {
      id: 'library-card',
      action: 'point',
      target: { label: 'the first manual on the shelves', css: '.lib-shelf .lib-card' },
      // each kind of paper is shown with the Kind picker set to it, so it is at the top of the page
      go: { hash: '#/library?by=type&only=manual', ready: '.lib-shelf .lib-card' },
      say: 'Each card opens its piece on screen: a manual, a hint book, a map, a key card. Most can be printed, too.',
      sound: 'ding',
    },
    {
      id: 'library-print',
      action: 'point',
      target: card('Disk labels', 'a Disk labels card'),
      go: { hash: '#/library?by=type&only=labels', ready: '.lib-shelf .lib-card' },
      say: 'Disk labels and retail boxes open in the print shop, with lines to cut and fold along.',
      optional: true,
    },
    {
      id: 'library-walkthrough',
      action: 'point',
      target: card('Walkthrough', 'a Walkthrough card'),
      go: { hash: '#/library?by=type&only=walkthrough', ready: '.lib-shelf .lib-card' },
      say: 'Every game’s walkthrough is here too, played start to finish. Its length is on the card.',
      optional: true,
    },
    {
      id: 'library-magazine',
      action: 'point',
      target: card('TURBO BUTTON', 'the TURBO BUTTON card'),
      go: { hash: '#/library?by=type&only=magazine', ready: '.lib-shelf .lib-card' },
      say: 'TURBO BUTTON is the shareware gamer’s monthly: news, reviews, hints and every game.',
      sound: 'flutter',
      optional: true,
    },
    {
      id: 'library-guide',
      action: 'point',
      target: card('The Guide', 'the Guide card'),
      go: { hash: '#/library?by=type&only=guide', ready: '.lib-shelf .lib-card' },
      say: 'The Guide and the help for Mac, Windows and Linux are shelved here as well.',
      optional: true,
    },
    {
      id: 'library-bye',
      action: 'exit',
      actor: 'joe',
      say: 'Please return every word to its book. Exactly one hundred at a time.',
      sound: 'shhh',
    },
  ],
};
