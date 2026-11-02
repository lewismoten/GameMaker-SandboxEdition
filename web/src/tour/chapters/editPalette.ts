// The tour's "The palette editor" chapter: Watt goes through the palette editor on his own
// palette (read-only, in memory): the 256 swatches, the Color, Vision and Backgrounds tabs, the
// red, green and blue boxes, the HSV picker (opened and shut, nothing confirmed), the ramp tools,
// reducing a picture's colors to fit a range (the Colors from picture box, opened and shut), the
// reserved color ranges and the night, dusk and underwater variants. Checked against
// editors/palette/ (palette.ts, colorPicker.ts, pictureColors.ts, paletteReservations.ts,
// paletteTools.ts, visionPanel.ts, colorZeroScreens.ts) and widgets/colorChoice.ts.
import type { Chapter, Opener, Target } from '../steps';

/** A tab of the palette editor's side panel (Color, Vision, Backgrounds). */
const tab = (text: string): Target => ({ label: `the ${text} tab`, css: '.pal-tab', text });

/** The hue, saturation and brightness picker, opened by the big color swatch. */
const picker: Opener = {
  label: 'the color picker',
  by: '[aria-label="Choose color"]',
  shown: '.modal',
  close: '.modal .modal-close',
};

/** Reducing a picture's colors into the selected range of the palette. */
const fromPicture: Opener = {
  label: 'the Colors from picture box',
  by: '.file-field + button',
  shown: '.modal',
  close: '.modal .modal-close',
};

export const editPaletteChapter: Chapter = {
  id: 'edit-palette',
  title: 'The palette editor',
  place: 'Editor',
  page: 'editor',
  hash: '#/p/look:logic/watt.pal',
  ready: '.pal-swatches',
  always: true,
  actor: 'watt',
  speaker: 'watt',
  music: 'ohmGarage',
  steps: [
    {
      id: 'edit-palette-hello',
      action: 'enter',
      say: 'Beep beep! This is the palette: all 256 colors a DOS game can show at once.',
      sound: 'clack',
    },
    {
      id: 'edit-palette-swatches',
      action: 'point',
      target: { label: 'the palette’s colors', css: '.pal-swatches' },
      say: 'Click a color to edit it. Shift-click a second one to pick a whole range.',
    },
    {
      id: 'edit-palette-tabs',
      action: 'point',
      target: tab('Color'),
      say: 'Three tabs. Color edits the one you chose. Vision and Backgrounds check how the palette looks in play.',
    },
    {
      id: 'edit-palette-rgb',
      action: 'point',
      target: { label: 'the red box', css: '[aria-label="Red (0 to 63)"]' },
      say: 'Red, green and blue each run from 0 to 63, like a real VGA card. Slide them or type a number.',
    },
    {
      id: 'edit-palette-picker',
      action: 'press',
      target: { label: 'the big color swatch', css: picker.by },
      opens: picker,
      say: 'The big swatch opens a picker with hue, saturation and brightness, a friendlier way to find a color.',
    },
    {
      id: 'edit-palette-square',
      action: 'point',
      target: { label: 'the color picker', css: '.modal', in: picker },
      say: 'Drag in the square, or use the arrow keys. Nothing changes until you press Confirm color; Cancel keeps things as they were.',
    },
    {
      id: 'edit-palette-ramp',
      action: 'point',
      target: { label: 'the Spread range button', css: '[title^="Blend the colors"]' },
      say: 'Spread range blends the colors between your two ends. Make a shade ramp turns a range into shades of the first color.',
    },
    {
      id: 'edit-palette-reduce',
      action: 'press',
      target: { label: 'the Copy button for colors from a picture', css: fromPicture.by },
      opens: fromPicture,
      say: 'Copy brings colors in from a picture, shrunk to fit. Pick a range first, and it reduces the picture to that many.',
      optional: true,
    },
    {
      id: 'edit-palette-reduced',
      action: 'point',
      target: { label: 'the Colors from picture box', css: '.modal', in: fromPicture },
      say: 'Colors are chosen from the pixels the picture really uses, the common ones first. Nothing lands until you press the Apply colors button.',
      optional: true,
    },
    {
      id: 'edit-palette-reserved',
      action: 'point',
      target: { label: 'the Reserved color ranges section', css: 'summary', text: 'Reserved color ranges' },
      say: 'Reserve ranges for characters, monsters or backgrounds, so one kind never takes another’s colors. Only the editor keeps this.',
    },
    {
      id: 'edit-palette-vision',
      action: 'press',
      target: tab('Vision'),
      click: true,
      say: 'Vision shows a level as players who see color differently would, and lists colors that look alike.',
    },
    {
      id: 'edit-palette-backgrounds',
      action: 'press',
      target: tab('Backgrounds'),
      click: true,
      say: 'Backgrounds previews the game’s own screens, drawn on color 0: high scores, status, help and about.',
    },
    {
      id: 'edit-palette-variants',
      action: 'point',
      target: { label: 'the Night, dusk, underwater section', css: 'summary', text: 'Night, dusk, underwater' },
      say: 'Night, dusk, underwater: versions of this palette for other times of day. Glowing colors keep lamps and stars bright.',
    },
    {
      id: 'edit-palette-bye',
      action: 'exit',
      say: 'That is the editor, top to bottom. Happy making! Beep.',
      prop: { id: 'ship', run: 'across' },
    },
  ],
};
