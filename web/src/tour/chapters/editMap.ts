// The tour's "The map editor, in depth" chapter: Dex Dynamo goes through the map editor's side
// tabs and tools one at a time on Ohm Sweet Ohm's kitchen map (read-only, in memory): painting
// and picking, Select, Terrain, Stamp, the grid, Wrap, the link markers for exits and ways in,
// and Find and Replace. It presses only the Select tool and a tab, which change nothing in the
// game (the grid, wrap and link switches are only pointed at). Checked against
// editors/map/map.ts (its tool list and titles), tools/ (their option panels) and
// links/linkMarkers.ts.
import type { Chapter, Target } from '../steps';

/** A map tool's button, by its name. */
const tool = (name: string, label = `the ${name} tool`): Target => ({ label, css: `.mt-toolset .mt-tool[aria-label="${name}"]` });

/** A tab of the side column (Blocks, Monsters, Tool options). */
const tab = (text: string): Target => ({ label: `the ${text} tab`, css: '.mt-side-col .panel-tabs-list button', text });

/** A toolbar switch beside the tools (the grid, wrap, links, find). */
const mode = (name: string, label: string): Target => ({ label, css: `.mt-modes .mt-tool[aria-label="${name}"]` });

export const editMapChapter: Chapter = {
  id: 'edit-map',
  title: 'The map editor, in depth',
  place: 'Editor',
  page: 'editor',
  hash: '#/p/look:logic/kitchen.map',
  ready: '.mt-toolset .mt-tool',
  always: true,
  actor: 'dex',
  speaker: 'dex',
  music: 'y2kTitle',
  steps: [
    {
      id: 'edit-map-hello',
      action: 'enter',
      say: 'Dex Dynamo here! Let’s get into the map editor and work through its tools, one by one.',
      sound: 'oneup',
    },
    {
      id: 'edit-map-blocks',
      action: 'point',
      target: tab('Blocks'),
      say: 'The side column has tabs. Blocks is the list of background blocks to paint with; Monsters lists the creatures to place.',
    },
    {
      id: 'edit-map-options',
      action: 'point',
      target: tab('Tool options'),
      say: 'Tool options shows the settings of whichever tool you chose: shapes, terrains, stamps and buildings.',
    },
    {
      id: 'edit-map-paint',
      action: 'point',
      target: tool('Paint'),
      say: 'Paint, Line, Rectangle and Fill lay down the chosen block; keys B, L, R and F pick them. Pick is an eyedropper: it takes a block from the map.',
    },
    {
      id: 'edit-map-select',
      action: 'press',
      target: tool('Select'),
      click: true,
      say: 'Select drags out a rectangle or a polygon. Then fill it, copy, cut and paste it, or save it as a stamp or a block group.',
    },
    {
      id: 'edit-map-terrain',
      action: 'point',
      target: tool('Terrain'),
      say: 'Terrain is for grass, water or paths. Make one from blocks you have: a fill, edges and corners. Then dragging picks the right piece for you.',
    },
    {
      id: 'edit-map-stamp',
      action: 'point',
      target: tool('Stamp'),
      say: 'A stamp is a saved patch of blocks, a house or a tree. Place it where you like, flipped or turned. Select makes new ones.',
    },
    {
      id: 'edit-map-grid',
      action: 'point',
      target: mode('Grid', 'the Grid button'),
      say: 'Grid draws lines between the blocks, so you can count them. The G key switches it on and off.',
    },
    {
      id: 'edit-map-wrap',
      action: 'point',
      target: mode('Wrap scrolling', 'the Wrap button'),
      say: 'Wrap shows the map repeated all around. Scroll through an edge and the opposite side follows.',
    },
    {
      id: 'edit-map-exits',
      action: 'point',
      target: { label: 'an exit marker', css: '.lk-mark:not(.lk-in)' },
      say: 'With Links on, gold arrows are exits to other scenes. Drag one to move it, or click it to see where it leads.',
      optional: true,
    },
    {
      id: 'edit-map-ways-in',
      action: 'point',
      target: { label: 'a way-in marker', css: '.lk-mark.lk-in' },
      say: 'Cyan marks are ways in: where the hero arrives. A number means several arrive at one spot; press it for the list.',
      optional: true,
    },
    {
      id: 'edit-map-find',
      action: 'point',
      target: mode('Find', 'the Find button'),
      say: 'Find lights up every use of the chosen block on the map. Replace, beside it, swaps one block for another everywhere.',
    },
    {
      id: 'edit-map-bye',
      action: 'exit',
      say: 'Now go make something big. Next up, the block editors!',
    },
  ],
};
