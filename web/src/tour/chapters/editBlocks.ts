// The tour's "Blocks, background and character" chapter: Joe, KEEP IT BRIEF!'s night librarian,
// shelves through the background block editor on Ohm Sweet Ohm's kitchen blocks (the picker, an
// optional name, the paint tools, mirror, the palette and its preview, flip and rotate, the
// Walking, Touch and Time tabs, groups), then crosses to Watt's character blocks for the frames
// panel and the live character. Read-only and in memory: it points and never paints. Checked
// against editors/blocks/ (blocks.ts, characterFramesPanel.ts, animPlayer.ts, groupsPanel.ts),
// widgets/colorChoice.ts and widgets/filePicker.ts.
import type { Chapter, Target } from '../steps';

/** A button of the paint toolbar (Pencil, Flip, Replace colors…), by its text. */
const paint = (text: string, label: string): Target => ({ label, css: '.blk-paint .toolbar button', text });

export const editBlocksChapter: Chapter = {
  id: 'edit-blocks',
  title: 'Background and character blocks',
  place: 'Editor',
  page: 'editor',
  hash: '#/p/look:logic/kitchen.bbl',
  ready: '.blk-picker .block-picker',
  always: true,
  actor: 'joe',
  speaker: 'joe',
  music: 'briefLibrary',
  steps: [
    {
      id: 'edit-blocks-hello',
      action: 'enter',
      say: 'Joe, the night librarian, speaking softly. Blocks are the little pictures every level is built from. Let’s browse a shelf.',
      sound: 'shhh',
    },
    {
      id: 'edit-blocks-picker',
      action: 'point',
      target: { label: 'the list of blocks', css: '.blk-picker .block-picker' },
      say: 'Each file is a set of blocks. Pick one here to edit it. The arrow keys move along the shelf.',
    },
    {
      id: 'edit-blocks-name',
      action: 'point',
      target: { label: 'the block’s name box', css: '.blk-head .field' },
      say: 'A name is only for you, so you can tell block 40 is the door. The game never sees it.',
    },
    {
      id: 'edit-blocks-tools',
      action: 'point',
      target: paint('Pencil', 'the Pencil tool'),
      say: 'Pencil, Shade, Fill, Pick color, Line and Box paint the picture. Right-drag erases, and Shade lightens along the palette.',
    },
    {
      id: 'edit-blocks-mirror',
      action: 'point',
      target: { label: 'the Mirror list', css: '.blk-paint .toolbar label.field', text: 'Mirror' },
      say: 'Mirror repeats each stroke on the other side of the picture, left to right or top to bottom, for tidy symmetry.',
    },
    {
      id: 'edit-blocks-colors',
      action: 'point',
      target: { label: 'the palette colors', css: '.blk-colors .swatches' },
      say: 'Click a color to paint with it. Bigger colors, below, shows larger swatches.',
    },
    {
      id: 'edit-blocks-preview',
      action: 'point',
      target: { label: 'the Show with palette button', css: '[title="Choose show with palette"]' },
      say: 'Show with palette previews the blocks in another palette, such as the night one, before you commit.',
    },
    {
      id: 'edit-blocks-flip',
      action: 'point',
      target: paint('Flip', 'the Flip button'),
      say: 'Flip and Rotate turn the whole picture. The arrows nudge it a pixel, and Replace colors swaps one color, here or in every block.',
    },
    {
      id: 'edit-blocks-behave',
      action: 'point',
      target: { label: 'the Walking tab', css: '.blk-side .panel-tabs-list button', text: 'Walking' },
      say: 'Walking, Touch and Time set how a block acts: which sides are solid, what touching does, and what it changes into.',
    },
    {
      id: 'edit-blocks-groups',
      action: 'point',
      target: { label: 'the Groups section', css: '.blk-groups summary', text: 'Groups' },
      say: 'Shift-click or Ctrl-click blocks to pick several. Groups lets you paint them as one big picture.',
    },
    {
      id: 'edit-blocks-frames',
      action: 'point',
      go: { hash: '#/p/look:logic/watt.cbl', ready: '.character-frame-controls' },
      target: { label: 'the Character frames panel', css: '.character-frame-controls' },
      say: 'Character blocks are the hero’s frames. This panel picks an animation and steps through its frames; dashed outlines mark the blocks it uses.',
    },
    {
      id: 'edit-blocks-live',
      action: 'point',
      target: { label: 'the Live character panel', css: '.character-frame-preview' },
      say: 'Live character plays the animation as you paint, on any background you like, so you see each touch-up in motion.',
    },
    {
      id: 'edit-blocks-bye',
      action: 'exit',
      say: 'Quiet, now. Next the monsters, and the hero who meets them.',
    },
  ],
};
