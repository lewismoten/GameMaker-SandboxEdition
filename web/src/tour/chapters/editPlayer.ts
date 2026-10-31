// The tour's "The DOS player" chapter: Professor Fiddlesticks opens the Integrator's DOS player
// customizer on Ohm Sweet Ohm (look-only, so every box is locked), and goes through its presets,
// the tab per screen, the words, the live preview that words and frames can be dragged in, the
// nudge keys, and the High scores, Colors and Files tabs. The tab is shown and its
// tabs viewed; nothing is changed. Checked against editors/integrator/dosPlayer/ (playerPanel.ts,
// screenTabs.ts, screenFields.ts, playerFields.ts, dragStage.ts, fileFields.ts) and dosPlayer/presets.ts.
import type { Chapter, Target } from '../steps';

/** A tab of the DOS player (Overview's DOS player tab). */
const dpTab = (text: string): Target => ({ label: `the ${text} tab`, css: '.dp-tabs .dp-tab', text });

export const editPlayerChapter: Chapter = {
  id: 'edit-player',
  title: 'The DOS player',
  place: 'Editor',
  page: 'editor',
  hash: '#/p/look:logic/ohmsweet.gam',
  ready: '.grator-tools',
  always: true,
  actor: 'fiddle',
  speaker: 'fiddle',
  music: 'tuitMenu',
  steps: [
    {
      id: 'edit-player-hello',
      action: 'enter',
      say: 'Ah, my favorite invention yet: the player itself! Its words, colors and frames may be tinkered with, though not to bursting.',
      sound: 'kazoo',
    },
    {
      id: 'edit-player-open',
      action: 'press',
      target: { label: 'the DOS player button', css: '[aria-label="DOS player"]' },
      say: 'This button opens the DOS player. That is the program the DOS download uses to run a game outside the editor.',
    },
    {
      id: 'edit-player-intro',
      action: 'point',
      // the button opens Overview's DOS player tab; the tour shows it without pressing the button
      go: { hash: '#/p/look:logic?tab=player', ready: '.dp-intro' },
      target: { label: 'the box’s introduction', css: '.dp-intro' },
      say: 'The player’s own words, colors, frames and timings can change, screen by screen. This game is look-only, so every box is locked.',
    },
    {
      id: 'edit-player-presets',
      action: 'point',
      target: { label: 'the presets', css: '.dp-presets' },
      say: 'Presets are two classic tricks: blank the menu words, or rename the status words. Reset all puts everything back.',
    },
    {
      id: 'edit-player-tabs',
      action: 'point',
      target: { label: 'the screen tabs', css: '.dp-tabs' },
      say: 'One tab for each screen, in the order a player meets them: menu, text pages, high scores, status, save, load, help. Then keys, colors and files.',
    },
    {
      id: 'edit-player-words',
      action: 'point',
      target: { label: 'the first section of words', css: '.dp-section' },
      say: 'Words come first. Each line has to fit the room it has in the program, and takes plain letters, digits and punctuation.',
    },
    {
      id: 'edit-player-preview',
      action: 'point',
      target: { label: 'the preview screen', css: '.dp-stage' },
      say: 'The preview is drawn with your changes. Drag a word or a frame to move it, or a frame’s corner to resize it.',
    },
    {
      id: 'edit-player-nudge',
      action: 'point',
      target: { label: 'the Move controls', css: '.dp-move' },
      say: 'Prefer keys? Choose a word under Move, then press the arrows to nudge it a pixel. Hold Shift to move eight.',
    },
    {
      id: 'edit-player-hiscores',
      action: 'press',
      target: dpTab('High scores'),
      click: true,
      say: 'Every tab lists its screen’s changes by kind. High scores has words, positions, colors and how long it waits.',
    },
    {
      id: 'edit-player-colors',
      action: 'press',
      target: dpTab('Colors'),
      click: true,
      say: 'Colors are shared by every screen. Each is a color picker, and the number beside it is the VGA level, out of 63.',
    },
    {
      id: 'edit-player-files',
      action: 'press',
      target: dpTab('Files'),
      click: true,
      say: 'Files changes the three-letter endings of the files in the DOS download, and the program is patched to look for them.',
    },
    {
      id: 'edit-player-bye',
      action: 'exit',
      say: 'Splendid! A player of your own design. Now go and make something wonderful!',
      prop: { id: 'chez', run: 'across' },
    },
  ],
};
