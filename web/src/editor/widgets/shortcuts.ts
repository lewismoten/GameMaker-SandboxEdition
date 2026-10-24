// The keyboard shortcuts list: press ? anywhere in the workspace (or its ⌨ button) to see the
// keys the open editor understands, and the ones every editor shares.
import { h, modal } from '../core/ui';
import { KIND_LABELS, type FileKind } from '../core/project';

type Row = [keys: string[], what: string];
type Group = { title: string; rows: Row[] };

const MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = MAC ? '⌘' : 'Ctrl';

const UNDO: Row[] = [
  [[`${MOD}+Z`], 'Undo'],
  [[`${MOD}+Shift+Z`, `${MOD}+Y`], 'Redo'],
];

const GRID: Row = [['←', '→', '↑', '↓', 'Home', 'End'], 'Move through a list of blocks or monsters (choosing as you go)'];

/** Each editor's own keys, by the kind of file it edits. */
export const SHORTCUTS: Partial<Record<FileKind, Group[]>> = {
  gam: [
    { title: 'Scenes', rows: UNDO },
    {
      title: 'On the scene board',
      rows: [
        [['←', '→', '↑', '↓'], 'Select the nearest scene that way'],
        [['+', '−'], 'Zoom in or out'],
        [['0'], 'Fit every scene in view'],
        [['Double-click'], 'Play from that level'],
      ],
    },
    {
      title: 'On the side panel’s edge',
      rows: [
        [['←', '→'], 'Make the panel wider or narrower'],
        [['Page Up', 'Page Down'], 'Bigger steps'],
        [['Home', 'End'], 'Narrowest, widest'],
      ],
    },
  ],
  pal: [{ title: 'Palette', rows: UNDO }],
  bbl: [{ title: 'Blocks', rows: [...UNDO, GRID] }],
  mbl: [{ title: 'Blocks', rows: [...UNDO, GRID] }],
  cbl: [{ title: 'Blocks', rows: [...UNDO, GRID] }],
  mon: [
    { title: 'Monsters', rows: [...UNDO, GRID] },
    {
      title: 'On the path map',
      rows: [
        [['←', '→'], 'Pick the previous or next corner'],
        [['↑', '↓'], 'Faster or slower to that corner'],
        [['R'], 'Turn the picture on the way there'],
        [['S'], 'Mirror it'],
        [['Delete'], 'Remove the picked corner'],
        [['Backspace'], 'Remove the last corner'],
        [['Space'], 'Play or pause the monster'],
        [['Esc'], 'Close the corner’s menu'],
      ],
    },
  ],
  chr: [
    { title: 'Characters', rows: [...UNDO, [['←', '→'], 'Switch between At the start and Sequences (on the tabs)'], GRID] },
    { title: 'A sequence’s key', rows: [[['Click', 'any key'], 'Click the key button, then press the key that runs the sequence']] },
  ],
  map: [
    {
      title: 'Map',
      rows: [
        ...UNDO,
        [['B', 'L', 'R', 'F', 'I'], 'Paint, Line, Rectangle, Fill, Pick a block from the map'],
        [['S', 'T', 'P', 'H', 'M'], 'Select, Terrain, Stamp, Building, Monsters'],
        [['G'], 'Show or hide the block grid'],
        [[`${MOD}+C`, `${MOD}+X`, `${MOD}+V`], 'Copy, cut or paste the selected blocks (on any map)'],
        [['Delete'], 'Fill the selection with the chosen block'],
        [['Esc'], 'Drop the selection, or stop pasting'],
        [['Right-click'], 'Erase with a terrain; remove a monster'],
        GRID,
      ],
    },
  ],
  snd: [
    {
      title: 'Sound set',
      rows: [[['P'], 'Play the PC speaker sound'], [['V'], 'Play the .voc'], [['G'], 'Play it as the game would'], [['Esc'], 'Stop'], ...UNDO],
    },
  ],
  bkd: [{ title: 'Backdrop', rows: [...UNDO, [['←', '→', '↑', '↓'], 'Move the view on the backdrop (Shift: 20 pixels at a time)']] }],
  gif: [{ title: 'Picture', rows: UNDO }],
  his: [{ title: 'High scores', rows: UNDO }],
  fli: [
    {
      title: 'Animation',
      rows: [
        [['Space'], 'Play or pause'],
        [['←', '→'], 'Step a frame back or on (also , and .)'],
        [['Home', 'End'], 'First or last frame'],
        [['Delete'], 'Remove the frame (in the frame strip)'],
        ...UNDO,
      ],
    },
  ],
  lst: [
    {
      title: 'On the timeline',
      rows: [
        [['←', '→'], 'Select the previous or next slide'],
        [['Alt+←', 'Alt+→'], 'Move the slide earlier or later'],
        [['Delete'], 'Take the slide out'],
        [['Enter'], 'Play the show from that slide'],
      ],
    },
    { title: 'In the media', rows: [[['Enter', 'Space'], 'Add it after the selected slide']] },
    { title: 'Slide show', rows: UNDO },
  ],
  cmf: [
    { title: 'Music', rows: [[['Space'], 'Play or stop'], ...UNDO] },
    {
      title: 'On the piano roll',
      rows: [
        [['←', '→'], 'Move the chosen notes earlier or later'],
        [['↑', '↓'], 'Move them up or down (Shift: an octave)'],
        [['Alt+↑', 'Alt+↓'], 'Louder or softer (Shift: in bigger steps)'],
        [[`${MOD}+A`], 'Choose every note'],
        [[`${MOD}+C`, `${MOD}+X`, `${MOD}+V`], 'Copy, cut, paste'],
        [[`${MOD}+D`], 'Duplicate the chosen notes'],
        [['Delete'], 'Delete them'],
        [['Esc'], 'Choose none'],
      ],
    },
  ],
  voc: [
    {
      title: 'Digital sound',
      rows: [
        [['Space'], 'Play (on the waveform)'],
        [[`${MOD}+A`], 'Choose the whole sound'],
        [['Delete'], 'Cut out the chosen part'],
        [['Esc'], 'Choose none'],
        ...UNDO,
      ],
    },
  ],
  rec: [
    {
      title: 'On the timeline',
      rows: [
        [['←', '→'], 'Scroll'],
        [['+', '−'], 'Zoom in or out'],
        [[`${MOD}+wheel`], 'Zoom where the pointer is'],
      ],
    },
  ],
};

const COMMON: Group = {
  title: 'Everywhere',
  rows: [
    [['?'], 'Show this list'],
    [[`${MOD}+P`], 'Open a file by name (recent files first)'],
    [['Tab', 'Shift+Tab'], 'Move between controls'],
    [['Esc'], 'Close a dialog or the Files list'],
  ],
};

function table(g: Group): HTMLElement {
  return h(
    'section',
    { class: 'keys-group' },
    h('h3', null, g.title),
    h(
      'dl',
      null,
      ...g.rows.flatMap(([keys, what]) => [
        // two choices read "A or B"; a set of arrows just sits side by side
        h('dt', null, ...keys.flatMap((k, i) => [i ? h('span', { class: 'keys-or' }, keys.length > 2 ? ' ' : ' or ') : null, h('kbd', null, k)])),
        h('dd', null, what),
      ]),
    ),
  );
}

/** The ⌨ button's picture: a line-drawn keyboard. */
export function keyboardIcon(): SVGSVGElement {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  for (const d of ['M3 6.5h18v11H3z', 'M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M6.5 13.5h.01M17 13.5h.01M9.5 14h5']) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}

/** Opens the list for the editor of this kind of file (or just the shared keys). */
export function showShortcuts(kind?: FileKind): Promise<void> {
  const own = (kind && SHORTCUTS[kind]) || [];
  return modal<void>('Keyboard shortcuts', () =>
    h(
      'div',
      // it scrolls on small screens, so it takes focus for the arrow keys
      { class: 'keys-list', role: 'region', 'aria-label': 'Shortcuts', tabIndex: 0 },
      kind && kind !== 'other'
        ? h(
            'p',
            { class: 'hint' },
            own.length ? `${KIND_LABELS[kind]}, and every editor:` : `${KIND_LABELS[kind]} has no keys of its own; these work everywhere:`,
          )
        : null,
      ...own.map(table),
      table(COMMON),
    ),
  ).then(() => undefined);
}

/** Whether a ? key press should open the list (not while typing, capturing a key or playing). */
export function wantsShortcuts(e: KeyboardEvent): boolean {
  if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return false;
  const t = e.target as HTMLElement | null;
  if (t?.closest('input, textarea, select, [contenteditable], .chr-key, .player-host')) return false;
  return !document.querySelector('dialog[open]');
}
