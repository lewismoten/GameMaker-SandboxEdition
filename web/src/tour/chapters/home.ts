// The tour's Home chapter: Teddy runs to each part of the game list and the header while his
// big sister Gwinn says what it does. Every line was checked against what the control does.
import type { Chapter } from '../steps';

/** A header link, or the ⋯ menu that holds it on a narrow window. */
const headerLink = (label: string, href: string) => ({ label, css: [`.topbar-nav a[href="${href}"]`, '.topbar-more > summary'] });

/** An item of the ⚙ Settings menu, or of the ⋯ menu on a narrow window, opened to show it. */
const setting = (text: string) => ({
  label: `${text} in the Settings menu`,
  css: ['#settings-menu > *', '.topbar-more .topbar-menu > *'],
  text,
  reveal: ['.topbar-settings .topbar-gear', '.topbar-more > summary'],
});

/** One of the buttons under the game at the top. */
const action = (text: string) => ({ label: `the ${text} button`, css: '.showcase .sc-actions > *', text });

export const homeChapter: Chapter = {
  id: 'home',
  title: 'The game list',
  place: 'Home',
  page: 'home',
  hash: '#/',
  ready: '.lib-cats [role=tab]',
  actor: 'teddy',
  speaker: 'gwinn',
  music: 'teddyTitle',
  steps: [
    {
      id: 'home-hello',
      action: 'enter',
      actor: 'gwinn',
      say: 'Hi! I’m Gwinn. This little guy is my brother Teddy. He and I will show you around.',
      sound: 'yip',
    },
    { id: 'home-teddy', action: 'enter', speaker: 'teddy', say: 'Woof!', caption: 'Teddy: Woof! (That means “follow me.”)', sound: 'woof', ms: 2200 },
    {
      id: 'home-showcase',
      action: 'point',
      target: { label: 'the big game picture at the top', css: '.showcase .sc-screen' },
      say: 'Up top is one game, shown big. Its picture plays a short demo of the game.',
      demo: 'play',
    },
    {
      id: 'home-play',
      action: 'press',
      target: { label: 'the Play button', css: '.showcase .sc-actions a.button.primary' },
      say: 'Play starts it right here in your browser, with the keyboard or a gamepad.',
      sound: 'boing',
    },
    {
      id: 'home-look',
      action: 'point',
      target: action('Look inside'),
      say: 'Look inside opens its files in the editor, just as they shipped. Change something and you get a copy of your own.',
      optional: true,
    },
    {
      id: 'home-walkthrough',
      action: 'point',
      target: action('Walkthrough'),
      say: 'Stuck? Walkthrough plays the whole game for you, start to finish.',
      optional: true,
    },
    {
      id: 'home-download',
      action: 'point',
      target: action('Download'),
      say: 'Download makes a copy to play on Windows, a Mac, Linux, the web, or real DOS.',
      optional: true,
    },
    {
      id: 'home-another',
      action: 'press',
      target: { label: 'the Another button', css: '.showcase button.sc-another:not(.sc-link)' },
      click: true,
      say: 'Another picks a different game at random. Ooh, good one.',
      sound: 'boing',
      optional: true,
    },
    {
      id: 'home-tabs',
      action: 'point',
      target: { label: 'the collection tabs', css: '.lib-cats' },
      say: 'These tabs are the collections: your games, ones you bring in, and shelves of games ready to play.',
      prop: { id: 'chicken', run: 'across' },
      sound: 'squeak',
    },
    {
      id: 'home-tiles',
      action: 'point',
      target: { label: 'a game tile', css: '.lib-tiles .game-tile .tile-select' },
      say: 'Pick any tile and its game moves up top.',
    },
    {
      id: 'home-search',
      action: 'point',
      target: { label: 'the Find a game box', css: '.lib-search' },
      say: 'Looking for one game? Type part of its name here.',
      sound: 'sniff',
    },
    {
      id: 'home-new',
      action: 'press',
      target: { label: 'the New game button', css: '.lib-new' },
      say: 'New game starts one of your own: ready to play, empty, or described in words for your own AI to build.',
      sound: 'boing',
    },
    {
      id: 'home-games',
      action: 'point',
      target: { label: 'Games in the header', css: '.topbar-nav .nav-games' },
      say: 'Games, up in the bar, always brings you back here.',
    },
    { id: 'home-guide', action: 'point', target: headerLink('Guide in the header', '#/help'), say: 'The Guide explains making games, one part at a time.' },
    {
      id: 'home-library',
      action: 'point',
      target: headerLink('Library in the header', '#/library'),
      say: 'The Library has things to read and print: manuals, maps, sticker sheets and a magazine.',
    },
    {
      id: 'home-achievements',
      action: 'point',
      target: headerLink('Achievements in the header', '#/achievements'),
      say: 'Achievements keeps track of what you’ve done, here and on the 1994 desk.',
    },
    {
      id: 'home-cast',
      action: 'point',
      target: headerLink('Cast in the header', '#/cast'),
      say: 'The Cast page is where you meet Teddy, me, and everyone else from the new games.',
    },
    {
      id: 'home-views',
      action: 'point',
      target: { label: 'the Desk, DOS and Web switch', css: '.topbar .view-switch' },
      say: 'Desk, DOS and Web: a 1994 desk with its PC, DOS Game-Maker on its own, or this page.',
    },
    {
      id: 'home-offline',
      action: 'point',
      target: setting('Play offline'),
      say: 'Settings has Play offline, which saves the whole site so it works with no connection.',
      sound: 'pop',
    },
    { id: 'home-theme', action: 'point', target: setting('Theme'), say: 'Theme switches between dark, light, or whatever your computer uses.' },
    {
      id: 'home-guides',
      action: 'point',
      target: { label: 'the ? Guides button', css: '.tour-btn' },
      say: 'Press this button any time to see this tour again, or to have Teddy and me wait on a page for you.',
      prop: { id: 'prop:hat', run: 'drop' },
    },
    { id: 'home-bye', action: 'exit', actor: 'gwinn', say: 'That’s the tour! Now go play something.', sound: 'tada' },
  ],
};
