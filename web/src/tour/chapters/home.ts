// The tour's Home chapter: Teddy runs to each part of the game list and the header while his
// big sister Gwinn says what it does, pressing each collection's tab in turn (Imported's ratings
// and notes shown when it has games; homeRatings.ts) and putting the visitor's own tab back at
// the end. Every line was checked against what the control does (home.ts, homeCategories.ts,
// homeLibraryCards.ts, homeDrop.ts).
import type { Chapter } from '../steps';
import { headerLink, setting } from './targets';

/** One of the buttons under the game at the top. */
const action = (text: string) => ({ label: `the ${text} button`, css: '.showcase .sc-actions > *', text });

/** A collection's tab, pressed to show its games (the tour puts the visitor's own tab back at the end). */
const tab = (id: string, name: string) => ({ label: `the ${name} tab`, css: `.lib-cats .lib-cat[id="lib-tab-${id}"]` });

/** Shown only while Imported has games (the rating picker shows with them). */
const withImports = '.home:has(.lib-about .lib-rating:not([hidden]))';

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
  // the tabs are really pressed: the visitor's own tab, and what it remembered, come back at the end
  keep: { storage: ['gm-home-category'], selected: '.lib-cats [role=tab][aria-selected="true"]', params: ['tab'] },
  steps: [
    {
      id: 'home-hello',
      action: 'enter',
      actor: 'gwinn',
      say: 'Hi! I’m Gwinn. This little guy is my brother Teddy. He and I will show you around.',
      sound: 'gwinnBark',
    },
    { id: 'home-teddy', action: 'enter', speaker: 'teddy', say: 'Woof!', caption: 'Teddy: Woof! (That means “follow me.”)', sound: 'teddyBark', ms: 2200 },
    {
      // the game up top was picked at random (featured): Another shows while it is, so before Teddy picks a tile
      id: 'home-another',
      action: 'press',
      target: { label: 'the Another button', css: '.showcase .sc-label button.sc-another' },
      click: true,
      say: 'Another picks a different game at random. Ooh, good one.',
      sound: 'boing',
      optional: true,
    },
    {
      // Teddy picks his own game (or the first tile, if it isn't on this tab), so it's up top for the demo
      id: 'home-tiles',
      action: 'press',
      target: { label: 'a game tile', css: ['.lib-tiles .game-tile[data-key="cd:teddy"] .tile-select', '.lib-tiles .game-tile .tile-select'] },
      click: true,
      say: 'Pick any tile and its game moves up top.',
    },
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
      say: 'Walkthrough plays the whole game for you, or lets the bot make one, and you can play parts of it yourself.',
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
      id: 'home-tabs',
      action: 'point',
      target: { label: 'the collection tabs', css: '.lib-cats' },
      say: 'These tabs are the collections: your games, ones you bring in, and shelves of games ready to play.',
      prop: { id: 'chicken', run: 'across' },
      sound: 'squeak',
    },
    {
      id: 'home-tab-mine',
      action: 'press',
      target: tab('mine', 'My games'),
      click: true,
      say: 'My games: the ones you make here, or copy from a shelf to change. They stay in this browser.',
      sound: 'boing',
    },
    {
      id: 'home-tab-imported',
      action: 'press',
      target: tab('imported', 'Imported'),
      click: true,
      say: 'Imported holds games you bring in: a folder, some files, a .zip, or a one-page export.',
      sound: 'boing',
    },
    {
      // a visitor with nothing imported yet
      id: 'home-imported-none',
      action: 'point',
      target: { label: 'the import tile', css: '.lib-tiles:not(:has(.game-tile)) .lib-drop-tile' },
      say: 'Nothing here yet? Drop game files on this tile, or click it to pick them.',
      optional: true,
    },
    {
      id: 'home-rate',
      action: 'point',
      target: { label: 'the rating stars of the imported game up top', css: `${withImports} .showcase .sc-rate .rating-stars` },
      say: 'Up top is one of them. Give it one to five stars: your rating saves at once.',
      sound: 'pop',
      optional: true,
    },
    {
      id: 'home-note',
      action: 'point',
      target: { label: 'the Add a note button', css: `${withImports} .showcase .sc-rate button.sc-another` },
      say: 'Add a note keeps a few words about a game, just for you.',
      optional: true,
    },
    {
      id: 'home-stars',
      action: 'point',
      target: { label: 'a rated tile’s stars', css: `${withImports} .lib-tiles .tile-stars` },
      say: 'Rated games wear their stars on their tiles.',
      optional: true,
    },
    {
      id: 'home-show',
      action: 'point',
      target: { label: 'the Show rating picker', css: `${withImports} .lib-about .lib-rating` },
      say: 'Show narrows the list to one rating, or to the games you haven’t rated yet.',
      optional: true,
    },
    {
      id: 'home-sort',
      action: 'point',
      target: { label: 'the Sort by picker', css: `${withImports} .lib-about .lib-sort:not(.lib-rating)` },
      say: 'Sort by Rating puts your five-star games first, with the unrated ones last.',
      optional: true,
    },
    {
      id: 'home-notes-search',
      action: 'point',
      target: { label: 'the Find a game box', css: `${withImports} .lib-search` },
      say: 'And the search box finds the words in your notes, too.',
      sound: 'sniff',
      optional: true,
    },
    {
      id: 'home-tab-sandbox',
      action: 'press',
      target: tab('sandbox', 'Sandbox'),
      click: true,
      say: 'Sandbox: new games made with Game-Maker in its original formats, so they play in real DOS too.',
      sound: 'boing',
    },
    {
      // the tab shows once the Bard of Bizarre has enough games
      id: 'home-tab-bizarre',
      action: 'press',
      target: tab('bizarre', 'Bizarre'),
      click: true,
      say: 'Bizarre: big, heartfelt songs about all the wrong things, each one made into a game.',
      sound: 'boing',
      optional: true,
    },
    {
      id: 'home-tab-gameware',
      action: 'press',
      target: tab('gameware', 'Gameware'),
      click: true,
      say: 'Gameware: the free games that came with Game-Maker. Play one, or edit a copy to see how it works.',
      sound: 'boing',
    },
    {
      id: 'home-tab-shareware',
      action: 'press',
      target: tab('shareware', 'Shareware'),
      click: true,
      say: 'Shareware: games other people made with Game-Maker, from the CD and the BBSes.',
      sound: 'boing',
    },
    {
      id: 'home-shareware-what',
      action: 'point',
      target: { label: 'the shareware games', css: '.lib-tiles' },
      say: 'Shareware meant try it free. If you kept playing, you sent the author a fee. Games got around on floppy disks and BBSes.',
      sound: 'coin',
    },
    {
      id: 'home-shareware-notice',
      action: 'point',
      target: { label: 'the shareware games', css: '.lib-tiles' },
      say: 'They’re other people’s games, so most just play here, exactly as released. Each keeps its author’s notice.',
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
      // the whole tour shows the Settings menu on its own page
      pageOnly: true,
      say: 'Settings has Play offline, which saves the whole site so it works with no connection.',
      // Kokoro's "has" after "Settings" was heard as "is"
      spoken: 'Settings hass Play offline, which saves the whole site so it works with no connection.',
      sound: 'pop',
    },
    { id: 'home-theme', action: 'point', target: setting('Theme'), pageOnly: true, say: 'Theme switches between dark, light, or whatever your computer uses.' },
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
