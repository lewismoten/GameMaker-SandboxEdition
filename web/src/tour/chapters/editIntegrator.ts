// The tour's "The Integrator" chapter: Inspector Penn goes through the editor that links a game's
// scenes together (the .GAM file) on Ohm Sweet Ohm: the board of scene cards, its tools, the key
// to the arrows, zoom, the selected scene's details, its files and links, the Screens and Music
// tabs and the DOS player button. Read-only and in memory; it presses only the side panel's two
// tabs (a remembered choice, put back through `keep`). Checked against editors/integrator/
// (integrator.ts, sceneLinks.ts, sideLists.ts, sceneSlots.ts).
import type { Chapter, Target } from '../steps';

/** A tab of the Integrator's side panel (Screens, Music). */
const sideTab = (text: string): Target => ({ label: `the ${text} tab`, css: '.grator-tabs .grator-tab', text });

export const editIntegratorChapter: Chapter = {
  id: 'edit-integrator',
  title: 'The Integrator',
  place: 'Editor',
  page: 'editor',
  hash: '#/p/look:logic/ohmsweet.gam?scene=2',
  ready: '.grator-board',
  always: true,
  actor: 'ada',
  speaker: 'ada',
  music: 'sleuthParlor',
  keep: { storage: ['gm-grator-tab'], params: ['side'] },
  steps: [
    {
      id: 'edit-integrator-hello',
      action: 'enter',
      say: 'A game is a case with many scenes. The Integrator is the board where I pin them all up and see how they connect.',
      sound: 'hmm',
    },
    {
      id: 'edit-integrator-board',
      action: 'point',
      target: { label: 'the board of scene cards', css: '.grator-board' },
      say: 'Each card is a scene, as the player first sees it: the start with its title and menu, every level, and the ending. Drag a card to move it.',
    },
    {
      id: 'edit-integrator-tools',
      action: 'point',
      target: { label: 'the board’s tools', css: '.grator-tools' },
      say: 'Add level scene starts a new level beside the last. Auto-arrange tidies the cards. PNG saves a picture of the whole board.',
    },
    {
      id: 'edit-integrator-key',
      action: 'point',
      target: { label: 'the question mark key', css: '.grator-tips summary' },
      say: 'The question mark explains the board. The arrows are links: gold ones leave the chosen scene, green ones lead into it.',
    },
    {
      id: 'edit-integrator-zoom',
      action: 'point',
      target: { label: 'the zoom buttons', css: '.grator-zoombar' },
      say: 'Zoom in and out, or Fit to see every scene. Scroll or pinch works too, and the arrow keys step from one scene to the next.',
    },
    {
      id: 'edit-integrator-scene',
      action: 'point',
      target: { label: 'the chosen scene’s panel', css: '.grator-panel' },
      say: 'Click a card to work on that scene. Rename it here, play from it, make its level card, or delete it.',
    },
    {
      id: 'edit-integrator-files',
      action: 'point',
      target: { label: 'the scene’s files', css: '.grator-panel .grid-fields' },
      say: 'A level’s files: palette, map, block sets, monsters, hero, sounds, music, and the pictures shown before and after it.',
    },
    {
      id: 'edit-integrator-links',
      action: 'point',
      target: { label: 'the links table', css: '.grator-links' },
      say: 'Links are the exits. Each goes to another scene, from a block on this map to a block on the next. Point one at the winning ending and the game is won.',
    },
    {
      id: 'edit-integrator-screens',
      action: 'press',
      target: sideTab('Screens'),
      click: true,
      say: 'Screens lists every title, menu and between-level picture. Click one to jump to the scene that uses it.',
      optional: true,
    },
    {
      id: 'edit-integrator-music',
      action: 'press',
      target: sideTab('Music'),
      click: true,
      say: 'Music lists each scene’s song, with a play button when its file is in the game.',
      optional: true,
    },
    {
      id: 'edit-integrator-player',
      action: 'point',
      target: { label: 'the DOS player button', css: '[aria-label="DOS player"]' },
      say: 'And this button opens the DOS player, the program that runs the game on a real computer. That is the last stop.',
      sound: 'chime',
    },
    {
      id: 'edit-integrator-bye',
      action: 'exit',
      say: 'Case closed. Every scene is where it should be.',
    },
  ],
};
