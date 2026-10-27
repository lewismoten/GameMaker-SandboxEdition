// The tour's editor chapter: Watt, Ohm Sweet Ohm's repair robot, shows the editor on his own
// game, opened to look inside as it shipped (#/p/look:logic, read-only and in memory: nothing is
// saved, and no project of the visitor's is made or touched). The map editor first, then a
// palette. A tour of just this page takes the visitor back to the game they had open. Checked
// against editor/shell/workspace.ts, playButtons.ts, released.ts, editors/map/map.ts, its Level
// check panel (map/check/checkPanel.ts) and editors/palette/palette.ts.
import type { Chapter, Target } from '../steps';

/** A map tool's button, by its name. */
const tool = (name: string, label = `the ${name} tool`): Target => ({ label, css: `.mt-toolset .mt-tool[aria-label="${name}"]` });
const toggle = (name: string, label: string): Target => ({ label, css: `.mt-modes .mt-tool[aria-label="${name}"]` });

export const editorChapter: Chapter = {
  id: 'editor',
  title: 'The editor',
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
      id: 'editor-hello',
      action: 'enter',
      say: 'Beep! Watt here, from Ohm Sweet Ohm. This is the editor, open on my game just as it shipped.',
      sound: 'clack',
    },
    {
      id: 'editor-readonly',
      action: 'point',
      target: { label: 'the Read-only bar', css: '.released-bar' },
      say: 'Looking inside changes nothing. Edit a copy makes your own copy of the game to change.',
    },
    {
      id: 'editor-files',
      action: 'point',
      target: { label: 'the list of the game’s files', css: ['.sidebar .side-files', '.sidebar .files-toggle'] },
      say: 'Every file in the game, sorted by kind: palettes, blocks, monsters, maps, music and more.',
    },
    {
      id: 'editor-play',
      action: 'point',
      target: { label: 'the Play Game button', css: '.sidebar .side-play' },
      say: 'Play Game plays it from its title screen, right here, without leaving the editor.',
      prop: { id: 'ship', run: 'across' },
      sound: 'zap',
    },
    {
      id: 'editor-level',
      action: 'point',
      target: { label: 'the Play Level button', css: '.sidebar .pb-main' },
      say: 'Play Level jumps straight into a level. The arrow beside it picks which one, and where to start.',
    },
    {
      id: 'editor-map',
      action: 'point',
      target: { label: 'the map’s name', css: '.file-title' },
      say: 'This is a map: one level, laid out in blocks, a hundred by a hundred.',
    },
    {
      id: 'editor-blocks',
      action: 'point',
      target: { label: 'the Blocks list', css: '.mt-side-col .block-picker' },
      say: 'Pick a block from this list…',
    },
    {
      id: 'editor-paint',
      action: 'point',
      target: tool('Paint'),
      say: '…then paint with it. Line, Rectangle and Fill lay down lots at once.',
    },
    {
      id: 'editor-terrain',
      action: 'point',
      target: tool('Terrain'),
      say: 'Terrain paints grass, water or paths, and chooses the edges and corners for you.',
    },
    {
      id: 'editor-building',
      action: 'point',
      target: tool('Building'),
      say: 'Building drags out a whole house, any size, from its parts.',
    },
    {
      id: 'editor-monsters',
      action: 'point',
      target: tool('Monsters'),
      say: 'Monsters puts the game’s creatures on the map. A right-click takes one away.',
    },
    {
      id: 'editor-links',
      action: 'point',
      target: toggle('Links', 'the Links button'),
      say: 'Links shows the doors: gold marks are exits to other scenes, cyan marks are where the hero comes in.',
    },
    {
      id: 'editor-check',
      action: 'point',
      target: { label: 'the Level check panel', css: '.lc-panel', reveal: '.mt-modes .mt-tool[aria-label="Level check"]' },
      say: 'The Level check lets a bot play the level, then shows where it went and what players might mind.',
      sound: 'fizzle',
    },
    {
      id: 'editor-palette',
      action: 'point',
      go: { hash: '#/p/look:logic/watt.pal', ready: '.pal-swatches' },
      // a phone folds the editor's tip to one line: More opens it to show the note, and the tour folds it again
      target: { label: 'the note about color 0', css: '.hint .pal-zero-link', reveal: '.hint.folded .hint-toggle' },
      say: 'In a palette, mind color 0: the game draws its menus and text screens on it. Press backgrounds to see them.',
    },
    {
      id: 'editor-assistant',
      action: 'point',
      target: { label: 'the Assistant button', css: '.assistant-btn' },
      say: 'The Assistant lets your own AI look at a game and change it with you. Set it up in Settings first.',
    },
    {
      id: 'editor-copy',
      action: 'point',
      target: { label: 'the Edit a copy button', css: '.released-bar .primary' },
      say: 'Ready to make it yours? Edit a copy, and start changing things.',
      sound: 'clack',
    },
    {
      id: 'editor-bye',
      action: 'exit',
      say: 'Time to recharge. Happy making! Beep.',
      prop: { id: 'ship', run: 'across' },
    },
  ],
};
