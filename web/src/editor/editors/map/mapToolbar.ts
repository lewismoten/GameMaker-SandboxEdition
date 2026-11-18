// Map grid, wrap, links, play and block replacement controls.
import type { parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, MWID, type parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import type { Project } from '../../core/project';
import { h, modal, toast } from '../../core/ui';
import { blockButton } from '../../widgets/blockChooser';
import type { paletteChooser } from '../../widgets/paletteChooser';
import { blockLabel } from '../blocks/blockNames';
import type { linkMarkers } from './links/linkMarkers';
import type { mapViewport } from './mapViewport';
import { rememberWrap } from './mapWrapPref';
import { playSpot } from './playSpot';
import { findBlock, replaceAll } from './tools/cellOps';
import type { OverlayState } from './tools/overlay';
import type { MapTools } from './tools/toolController';
interface Context {
  readonly project: Project;
  readonly file: string;
  readonly set: { scenes: number[] };
  readonly viewport: ReturnType<typeof mapViewport>;
  readonly markers: ReturnType<typeof linkMarkers>;
  showLinks: boolean;
  placingExit: boolean;
  readonly tools: MapTools;
  painting: boolean;
  lastPaint: { x: number; y: number } | undefined;
  wrapping: boolean;
  readonly overlay: OverlayState;
  readonly redrawOverlay: () => void;
  readonly writePref: (key: string, on: boolean) => void;
  finding: boolean;
  readonly brush: number;
  readonly map: ReturnType<typeof parseMap>;
  readonly bg: ReturnType<typeof parseBlocks>;
  readonly chooser: ReturnType<typeof paletteChooser>;
  readonly bblName: string;
  readonly remember: () => void;
  readonly draw: () => void;
  readonly save: () => void;
}
export function mapToolbar(editor: Context) {
  const linksBtn = h(
    'button',
    {
      type: 'button',
      class: 'mt-tool',
      'aria-label': 'Links',
      title: 'Show the ways in (cyan) and exits (gold) to drag or open',
      onclick: () => {
        editor.showLinks = !editor.showLinks;
        editor.writePref('gm-map-links', editor.showLinks);
        editor.markers.setShown(editor.showLinks);
        syncToggles();
      },
    },
    '⛓',
    h('span', { class: 'mt-label' }, 'Links'),
  );
  const exitBtn = h(
    'button',
    {
      type: 'button',
      class: 'mt-tool',
      'aria-label': 'Add an exit',
      title: editor.set.scenes.length ? 'Add an exit in the middle of the view: touching it takes the hero to another scene' : 'No scene plays this map yet',
      disabled: !editor.set.scenes.length || !!editor.project.readOnly,
      onclick: () => {
        if (!editor.showLinks) linksBtn.click();
        const at = editor.viewport.at();
        editor.markers.addExit({ x: Math.min(MLEN - 1, Math.floor(at.x)), y: Math.min(MWID - 1, Math.floor(at.y)) });
        editor.placingExit = true;
        toast('Tap the map where the exit goes, or drag the gold marker. Esc cancels.');
      },
    },
    '＋',
    h('span', { class: 'mt-label' }, 'Exit'),
  );
  // Test the level from where you are looking: a play test that starts in the middle of the view, leaving the game's links alone.
  const hereBtn = h(
    'button',
    {
      type: 'button',
      class: 'mt-tool',
      'aria-label': 'Play from here',
      title: editor.set.scenes.length
        ? 'Play test this level starting in the middle of the view (the game’s start does not change)'
        : 'No scene plays this map yet',
      disabled: !editor.set.scenes.length || !editor.project.playAt,
      onclick: () => {
        const at = editor.viewport.at();
        editor.project.playAt?.(editor.set.scenes[0], playSpot(at, MLEN, MWID));
      },
    },
    '▶',
    h('span', { class: 'mt-label' }, 'Play here'),
  );
  const pressed = (on: boolean) => ({ 'aria-pressed': String(on) });
  const gridBtn = h(
    'button',
    { type: 'button', class: 'mt-tool', 'aria-label': 'Grid', title: 'Show the block grid (G)', onclick: () => toggleGrid() },
    '#',
    h('span', { class: 'mt-label' }, 'Grid'),
  );
  const wrapBtn = h(
    'button',
    {
      type: 'button',
      class: 'mt-tool',
      'aria-label': 'Wrap scrolling',
      title: 'Keep scrolling through the map edges; the opposite side follows',
      onclick: () => {
        editor.tools.cancel();
        if (editor.painting) editor.save();
        editor.painting = false;
        editor.lastPaint = undefined;
        editor.wrapping = !editor.wrapping;
        editor.overlay.wrap = editor.wrapping;
        editor.redrawOverlay();
        editor.viewport.setWrapped(editor.wrapping);
        editor.writePref('gm-map-wrap', editor.wrapping);
        rememberWrap(editor.project, editor.file, editor.wrapping);
        syncToggles();
      },
    },
    '∞',
    h('span', { class: 'mt-label' }, 'Wrap'),
  );
  const findBtn = h(
    'button',
    {
      type: 'button',
      class: 'mt-tool',
      'aria-label': 'Find block',
      title: 'Find block: highlight every use of the chosen block on the map',
      onclick: () => toggleFind(),
    },
    '◎',
    h('span', { class: 'mt-label' }, 'Find'),
  );
  const replaceBtn = h(
    'button',
    { type: 'button', class: 'mt-tool', 'aria-label': 'Replace…', title: 'Replace every use of one block with another', onclick: () => void replaceDialog() },
    '⇄',
    h('span', { class: 'mt-label' }, 'Replace…'),
  );
  function syncToggles(): void {
    for (const [b, on] of [
      [gridBtn, editor.overlay.grid],
      [wrapBtn, editor.wrapping],
      [findBtn, editor.finding],
      [linksBtn, editor.showLinks],
    ] as const)
      Object.entries(pressed(on)).forEach(([k, v]) => b.setAttribute(k, v));
  }
  function toggleGrid(): void {
    editor.overlay.grid = !editor.overlay.grid;
    editor.writePref('gm-map-grid', editor.overlay.grid);
    syncToggles();
    editor.redrawOverlay();
  }
  function toggleFind(): void {
    editor.finding = !editor.finding;
    syncToggles();
    editor.redrawOverlay();
    if (editor.finding) toast(`Block ${editor.brush} is used ${editor.overlay.found.length} time${editor.overlay.found.length === 1 ? '' : 's'} on this map.`);
  }
  async function replaceDialog(): Promise<void> {
    let from = editor.brush;
    let to = editor.brush;
    const go = await modal<boolean>('Replace a block everywhere', (close) => {
      const count = h('p', { class: 'meta', 'aria-live': 'polite' });
      const sync = () => (count.textContent = `Block ${from} is used ${findBlock(editor.map.blocks, from).length} times on this map.`);
      const pick = (label: string, get: () => number, set: (v: number) => void) => {
        const b = blockButton(
          () => editor.bg,
          () => editor.chooser.palette,
          get,
          (v) => (set(v), sync()),
          { title: label, transparent: false, name: (index) => blockLabel(editor.project, editor.bblName, index) },
        );
        b.setAttribute('aria-label', `${label}: ${blockLabel(editor.project, editor.bblName, get())}`);
        return h('div', { class: 'field' }, h('span', null, label), b);
      };
      sync();
      return h(
        'div',
        { class: 'stack' },
        h(
          'div',
          { class: 'toolbar' },
          pick(
            'Replace block',
            () => from,
            (v) => (from = v),
          ),
          h('span', { 'aria-hidden': 'true' }, '→'),
          pick(
            'With block',
            () => to,
            (v) => (to = v),
          ),
        ),
        count,
        h(
          'div',
          { class: 'buttons' },
          h('button', { type: 'button', onclick: () => close(false) }, 'Cancel'),
          h('button', { type: 'button', class: 'primary', onclick: () => close(true) }, 'Replace all'),
        ),
      );
    });
    if (!go || from === to) return;
    editor.remember();
    const n = replaceAll(editor.map.blocks, from, to);
    editor.draw();
    editor.save();
    toast(`Replaced block ${from} with block ${to} in ${n} place${n === 1 ? '' : 's'}.`);
  }
  syncToggles();

  return { linksBtn, exitBtn, hereBtn, gridBtn, wrapBtn, findBtn, replaceBtn, toggleGrid };
}
