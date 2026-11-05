// The tour's "Getting around the editor" chapter, the first of the editor's sub-chapters (after
// the overview): Watt shows the file list and its filter, the Game assets overview and a file's
// way back to its kind, Used by, Undo and Redo, the map's zoom, the Play Level menu, the
// keyboard shortcuts and where help is. It runs on Ohm Sweet Ohm as released (read-only, in
// memory), so Undo has nothing to undo and the Play Level menu is only opened, never used.
// Checked against editor/shell/workspace.ts, playButtons.ts, assetBrowser.ts, usedBy.ts,
// hintFold.ts, widgets/shortcuts.ts and editors/map/map.ts (its zoom and Undo).
import type { Chapter, Opener } from '../steps';
import { headerLink } from './targets';

/** The Play Level split button's menu of ways into a level (its arrow opens and shuts it). */
const playMenu: Opener = {
  label: 'the Play Level menu',
  by: '.sidebar .pb-arrow',
  shown: '.sidebar .pb-menu:not([hidden])',
  close: '.sidebar .pb-arrow',
};

/** The keyboard shortcuts list. */
const keys: Opener = {
  label: 'the keyboard shortcuts',
  by: '.keys-btn[aria-label="Keyboard shortcuts"]',
  shown: '.modal',
  close: '.modal .modal-close',
};

export const editAroundChapter: Chapter = {
  id: 'edit-around',
  title: 'Getting around the editor',
  place: 'Editor',
  page: 'editor',
  hash: '#/p/look:logic/kitchen.map',
  ready: '.mt-toolset .mt-tool',
  always: true,
  actor: 'watt',
  speaker: 'watt',
  music: 'ohmGarage',
  steps: [
    {
      id: 'edit-around-hello',
      action: 'enter',
      say: 'Beep beep! Watt here again. Let’s find our way around: files, undo, play-testing and help.',
      sound: 'clack',
    },
    {
      id: 'edit-around-files',
      action: 'point',
      target: { label: 'the list of the game’s files', css: ['.sidebar .side-files', '.sidebar .files-toggle'] },
      say: 'Files sit in this list by kind, with how many of each. Press a kind’s heading to fold it away or open it again.',
    },
    {
      id: 'edit-around-find',
      action: 'point',
      target: { label: 'the Find a file box', css: '.sidebar input[type="search"]', reveal: '.sidebar .files-toggle' },
      say: 'Type part of a name here and the list narrows to match. Handy in a game with a hundred files.',
      optional: true,
    },
    {
      id: 'edit-around-quick',
      action: 'point',
      target: { label: 'the Open a file by name button', css: '.keys-btn[aria-label="Open a file by name"]' },
      say: 'The magnifier opens any file by its name. Ctrl+P does the same, from anywhere in the editor.',
      optional: true,
    },
    {
      id: 'edit-around-assets',
      action: 'point',
      go: { hash: '#/p/look:logic', ready: '.asset-grid' },
      target: { label: 'the Game assets button', css: ['.sidebar .asset-home', '.sidebar .files-toggle'] },
      say: 'In the file list, Game assets shows the whole game at once: a card for each kind of file. Press a card to browse those files as pictures.',
    },
    {
      // still on the overview: the cards sit under six group headings (editor/shell/assetGroups.ts)
      id: 'edit-around-groups',
      action: 'point',
      target: { label: 'the first group heading', css: '.asset-grid .asset-group' },
      say: 'The cards sit under headings: Levels, Heroes, Monsters, Pictures and movies, Sounds and music, and Words and screens.',
      optional: true,
    },
    {
      // the line shows when some scene uses the kind (assetUsedBy.ts); a short form on a phone
      id: 'edit-around-card-used',
      action: 'point',
      target: { label: 'a card’s used-by line', css: '.asset-category .used-full, .asset-category .used-short' },
      say: 'A card also says how many scenes use its files, so you can see what matters before you open it.',
      optional: true,
    },
    {
      id: 'edit-around-assets-back',
      action: 'point',
      go: { hash: '#/p/look:logic/kitchen.map', ready: '.mt-toolset .mt-tool' },
      target: { label: 'the Assets button', css: '[title="Browse this file category"]' },
      say: 'Back in a file, Assets jumps to that kind’s gallery, so you can try another map or block set.',
    },
    {
      id: 'edit-around-used',
      action: 'point',
      target: { label: 'the Used by links', css: '.used-by-link' },
      say: 'Here is every scene that uses this file. Press one to open it in the game’s own scene list.',
      optional: true,
    },
    {
      id: 'edit-around-undo',
      action: 'point',
      target: { label: 'the Undo button', css: '.mt-modes [title^="Undo"]' },
      say: 'Undo and Redo step back and forward through your edits in this file. Ctrl+Z and Ctrl+Y work too. Nothing to undo here.',
    },
    {
      id: 'edit-around-zoom',
      action: 'point',
      target: { label: 'the Zoom list', css: 'main.editor .toolbar select' },
      say: 'Zoom sets how big the map looks, from 10% to 200%. The mouse wheel zooms around the pointer; Shift and wheel scrolls.',
    },
    {
      id: 'edit-around-playmenu',
      action: 'press',
      target: { label: 'the arrow beside Play Level', css: '.sidebar .pb-arrow' },
      opens: playMenu,
      say: 'Play-test a level without the title screen. This arrow opens every way the game’s links bring the hero in; pick one to start there.',
      optional: true,
    },
    {
      id: 'edit-around-keys',
      action: 'press',
      target: { label: 'the Keyboard shortcuts button', css: keys.by },
      opens: keys,
      say: 'The keyboard button lists every shortcut: B, L, R and F choose map tools, G shows the grid. The question mark key shows it anywhere.',
      optional: true,
    },
    {
      id: 'edit-around-hint',
      action: 'point',
      target: { label: 'the note about this editor', css: '.hint', reveal: '.hint.folded .hint-toggle' },
      say: 'Every editor opens with a short note on what it does. On a phone it folds to a line; More opens it.',
    },
    {
      id: 'edit-around-guide',
      action: 'point',
      target: headerLink('the Guide link', '#/help'),
      say: 'And the Guide up here holds the whole manual, whenever you are stuck.',
    },
    {
      id: 'edit-around-bye',
      action: 'exit',
      say: 'Next, the map editor’s tools. Beep!',
    },
  ],
};
