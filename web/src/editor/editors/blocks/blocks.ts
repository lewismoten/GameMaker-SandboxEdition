// Block set editor (BLOCEDIT.EXE): 20x20 pictures plus each block's game behavior.
import { rovingGrid } from '../../widgets/rovingGrid';
import { panelTabs } from '../../widgets/panelTabs';
import { colorChoice } from '../../widgets/colorChoice';
import './blocks.css';
import { registerEditor } from '../registry';
import { viewState } from '../../../urlState';
import { TEXTURES, paintTexture } from '../../tools/textures';
import { h, clear, selectField, debounce, toast } from '../../core/ui';
import { blockCanvas, paintBlock, lut } from '../../core/draw';
import { paletteChooser } from '../../widgets/paletteChooser';
import { BLEN, BLOCK_COUNTS, BLOCK_SIZE, TRANSPARENT, parseBlocks, serializeBlocks, type BlockKind } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { paletteCss } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import type { Mirror } from './pixelOps';
import { Pixels, flipX, flipY, turn90, turn180, shiftPixels, mirrorAll, floodFill, line, box } from '@lewismoten/gamemaker-sandbox-tools/images';
import { BlockSurface } from './blockSurface';
import { BlockPaintHistory } from './blockPaintHistory';
import { splitGroup, type BlockGroup } from './blockGroups';
import { shade } from '../palette/ramps';
import { blockInsight } from './blockInsight';
import { openInEditor } from '../../core/uses';
import { applyRecolor, recolorDialog } from './recolorDialog';
import { edgeSetDialog } from './edgeSetDialog';
import { checkBadges } from '../../widgets/checkBadges';
import { normalize } from '../../../project/files';
import { fitToPane } from '../../core/fitPane';
import { groupsPanel } from './groupsPanel';
import { walkPathPanel } from './walkPathPanel';
import { readWalkPaths } from '../../check/walk/walkPaths';
import { blockProperties } from './blockProperties';

type Tool = 'draw' | 'shade' | 'fill' | 'pick' | 'line' | 'rect';

/** The painter's own settings, kept in the companion file (never in the block set). */
interface PainterExtras {
  mirror?: Mirror;
}

registerEditor(['bbl', 'mbl', 'cbl'], (host, project, file) => {
  const kind = file.split('.').pop() as BlockKind;
  const raw = project.files.get(file)!;
  const blocks = parseBlocks(raw, Math.max(BLOCK_COUNTS[kind], Math.ceil(raw.length / BLOCK_SIZE)));
  const sprites = kind !== 'bbl';
  // the address keeps the block being painted (…/NEBULA.BBL?block=12)
  const view = viewState(['p', project.id, file]);
  const urlBlock = view.num('block');
  let current = urlBlock !== undefined && urlBlock >= 0 && urlBlock < blocks.length ? urlBlock : 0;
  let color = sprites ? 0 : 1;
  /** The blocks picked in the list for a group (Shift- or Ctrl-click), in order; `anchor` starts a Shift run. */
  let picked: number[] = [current];
  let anchor = current;
  let tool: Tool = 'draw';
  const history = new BlockPaintHistory(blocks);
  let group: BlockGroup | undefined;
  let saveGroup: ((group: BlockGroup) => void) | undefined;
  let groupKeys = new WeakMap<BlockGroup, string>();
  let nextGroup = 0,
    groupKey = '';
  const scope = () => (group ? groupKey : `block:${current}`);
  const surface = () => new BlockSurface(blocks, current, group, sprites ? TRANSPARENT : 0);
  let clipboard: Pixels | undefined;
  const save = debounce(() => project.files.set(file, serializeBlocks(blocks)), 250);
  let mirror: Mirror = project.extras<PainterExtras>(file, 'painter', {}).mirror ?? 'none';
  /** Pixels already shaded in this stroke (each is lightened or darkened once a drag). */
  let shaded = new Set<number>();

  const chooser = paletteChooser(project, file, () => {
    renderPicker();
    renderSwatches();
    renderBlock();
  });
  const pal = () => chooser.palette;
  const insight = blockInsight({ project, file, blocks, current: () => current, pal, sprites, open: (f) => openInEditor(project, f) });
  // level check notes on this block: hazard art smaller than its cell, a hard-to-see monster picture…
  const groups = groupsPanel({
    project,
    file,
    kind,
    blocks,
    sprites,
    pal,
    current: () => current,
    select: (i) => {
      picked = [i];
      anchor = i;
      select(i);
    },
    picked: () => picked,
    edit: (value, update) => {
      finishStroke(false);
      group = value;
      saveGroup = update;
      if (!groupKeys.has(value)) groupKeys.set(value, `group:${nextGroup++}`);
      groupKey = groupKeys.get(value)!;
      picked = surface().ids;
      markPicker();
      renderBlock();
      refreshUndo();
      canvas.scrollIntoView({ block: 'nearest' });
    },
    layoutChanged: () => {
      groupKeys = new WeakMap();
      if (group) select(current);
    },
  });
  // background blocks: which are walking paths the walkthrough bot keeps to (companion file)
  const walkPaths = sprites ? undefined : walkPathPanel({ project, file, picked: () => picked, changed: () => markPicker() });
  const badges = checkBadges(project, file, (f) => f.where.block?.n === current && normalize(f.where.block.file) === normalize(file));

  // ---- block picker -------------------------------------------------------
  // Shift-click picks a run of blocks, Ctrl/Cmd-click one more (for a group); a click picks one
  const picker = rovingGrid(h('div', { class: 'block-picker' }), 'Blocks', { multiselect: true });
  const pickerCanvases: HTMLCanvasElement[] = [];
  function pick(i: number, e: MouseEvent): void {
    if (e.shiftKey) {
      const [a, b] = anchor <= i ? [anchor, i] : [i, anchor];
      picked = Array.from({ length: b - a + 1 }, (_, k) => a + k);
      if (anchor > i) picked.reverse();
    } else if (e.ctrlKey || e.metaKey) {
      picked = picked.includes(i) ? picked.filter((p) => p !== i) : [...picked, i];
      if (!picked.length) picked = [i];
      anchor = i;
    } else {
      picked = [i];
      anchor = i;
    }
    select(i);
  }
  function markPicker(): void {
    const paths = sprites ? undefined : new Set(readWalkPaths(project, file));
    [...picker.children].forEach((b, j) => {
      b.classList.toggle('selected', picked.includes(j) || j === current);
      b.classList.toggle('current', j === current);
      if (!paths) return;
      b.classList.toggle('walk-path', paths.has(j));
      b.setAttribute('aria-label', paths.has(j) ? `Block ${j}, walking path` : `Block ${j}`);
    });
    walkPaths?.refresh();
  }
  function renderPicker(): void {
    pickerCanvases.length = 0;
    clear(
      picker,
      ...blocks.map((b, i) => {
        const c = blockCanvas(b.pixels, pal(), { transparent: sprites, className: sprites ? 'checker' : '' });
        pickerCanvases.push(c);
        return h('button', { title: `Block ${i}`, 'aria-label': `Block ${i}`, onclick: (e: MouseEvent) => pick(i, e) }, c, h('small', null, i));
      }),
    );
    markPicker();
  }
  function select(i: number): void {
    finishStroke(false);
    group = undefined;
    saveGroup = undefined;
    groupKey = '';
    current = i;
    if (!picked.includes(i)) picked = [i];
    view.set({ block: i });
    markPicker();
    renderBlock();
    renderProps();
    refreshUndo();
    insight.refresh(true);
    groups.refresh(true);
    badges.refresh();
    mirrorBar?.refresh();
  }

  // ---- pixel canvas -------------------------------------------------------
  let scale = 16;
  const canvas = h('canvas', {
    class: `pixel blk-canvas ${sprites ? 'checker' : ''}`,
    width: BLEN * scale,
    height: BLEN * scale,
    role: 'img',
    'aria-label': 'Block painting area, 20 by 20 pixels: drag to paint, right-drag to erase',
  });
  const ctx = canvas.getContext('2d')!;
  let lineStart: { x: number; y: number } | undefined;
  let before: Uint8Array | undefined;
  let stroke: Uint8Array | undefined;
  const groupCaption = h('span', { class: 'meta' });
  const groupBar = h(
    'div',
    { class: 'toolbar blk-edit-group', hidden: true },
    groupCaption,
    h(
      'button',
      {
        type: 'button',
        onclick: () => {
          picked = [current];
          anchor = current;
          select(current);
        },
      },
      'Edit one block',
    ),
  );
  const write = (pixels: Uint8Array) => surface().write(pixels);
  const picture = () => {
    const s = surface(),
      p = new Pixels(s.width, s.height);
    p.px.set(s.read());
    return p;
  };
  const updateGroup = (next: BlockGroup) => {
    saveGroup?.(next);
    group = next;
  };

  function renderBlock(preview?: Uint8Array): void {
    const s = surface(),
      px = preview ?? s.read(),
      w = s.width,
      h = s.height;
    scale = Math.max(2, Math.min(16, Math.floor(320 / Math.max(w, h))));
    if (canvas.width !== w * scale || canvas.height !== h * scale) {
      canvas.width = w * scale;
      canvas.height = h * scale;
    }
    canvas.style.aspectRatio = `${w} / ${h}`;
    canvas.style.maxWidth = group ? `min(100%, 520px, max(${w * 2}px, calc((var(--ws-vh, 100dvh) - 350px) * ${w / h})))` : '';
    canvas.classList.toggle('checker', sprites || !!group?.cells.includes(-1));
    canvas.setAttribute('aria-label', `${group ? 'Group' : 'Block'} painting area, ${w} by ${h} pixels: drag to paint, right-drag to erase`);
    groupBar.hidden = !group;
    groupCaption.textContent = group ? `Editing “${group.name}” as one picture, ${w} × ${h} pixels. Properties apply to block ${current}.` : '';
    const colors = lut(pal());
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (s.address(x, y) === undefined) continue;
        const value = px[y * w + x];
        if (sprites && value === TRANSPARENT) continue;
        const c = colors[value];
        ctx.fillStyle = `rgb(${c & 255},${(c >> 8) & 255},${(c >> 16) & 255})`;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    for (let x = 1; x < w; x++) {
      ctx.strokeStyle = x % BLEN ? 'rgba(128,128,128,0.25)' : 'rgba(128,128,128,0.8)';
      ctx.beginPath();
      ctx.moveTo(x * scale + 0.5, 0);
      ctx.lineTo(x * scale + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 1; y < h; y++) {
      ctx.strokeStyle = y % BLEN ? 'rgba(128,128,128,0.25)' : 'rgba(128,128,128,0.8)';
      ctx.beginPath();
      ctx.moveTo(0, y * scale + 0.5);
      ctx.lineTo(canvas.width, y * scale + 0.5);
      ctx.stroke();
    }
    if (!preview) {
      for (const id of s.ids) if (pickerCanvases[id]) paintBlock(pickerCanvases[id], blocks[id].pixels, pal(), { transparent: sprites });
      insight?.refresh();
      groups?.refresh();
      mirrorBar?.refresh();
    }
  }

  function plot(px: Uint8Array, x: number, y: number, value: number): void {
    const s = surface();
    for (const [mx, my] of mirrorAll(x, y, s.width, s.height, mirror)) s.plot(px, mx, my, value);
  }
  function shadeAt(x: number, y: number, dir: 1 | -1): void {
    if (!stroke) return;
    const s = surface();
    for (const [mx, my] of mirrorAll(x, y, s.width, s.height, mirror)) {
      const address = s.address(mx, my),
        i = my * s.width + mx;
      if (address === undefined || shaded.has(address) || (sprites && stroke[i] === TRANSPARENT)) continue;
      shaded.add(address);
      s.plot(stroke, mx, my, shade(pal(), stroke[i], dir));
    }
    write(stroke);
  }
  const cell = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect(),
      s = surface();
    return {
      x: Math.max(0, Math.min(s.width - 1, Math.floor(((e.clientX - r.left) / r.width) * s.width))),
      y: Math.max(0, Math.min(s.height - 1, Math.floor(((e.clientY - r.top) / r.height) * s.height))),
    };
  };
  function shapePixels(a: { x: number; y: number }, b: { x: number; y: number }, src: Uint8Array): Uint8Array {
    const out = src.slice();
    (tool === 'rect' ? box : line)(a, b, (x, y) => plot(out, x, y, color));
    return out;
  }
  function fill(x: number, y: number): void {
    if (!stroke) return;
    const s = surface(),
      pixels = stroke;
    for (const [mx, my] of mirrorAll(x, y, s.width, s.height, mirror))
      floodFill(
        pixels,
        s.width,
        s.height,
        mx,
        my,
        color,
        (x, y) => s.address(x, y) !== undefined,
        (x, y, v) => s.plot(pixels, x, y, v),
      );
    write(pixels);
  }
  function pushUndo(ids = surface().ids): void {
    history.record(scope(), ids, group);
  }
  /** Cancelled strokes preserve both pixels and the existing Undo/Redo stacks. */
  function finishStroke(commit: boolean): void {
    if (!before) return;
    const s = surface(),
      original = before;
    if (commit && stroke) {
      write(stroke);
      if (stroke.some((value, i) => value !== original[i])) {
        const parts = group ? splitGroup(group, original) : new Map([[current, original]]);
        history.record(scope(), s.ids, group, parts);
        save();
      }
    } else write(original);
    lineStart = before = stroke = undefined;
    renderBlock();
    refreshUndo();
  }
  function changed(): void {
    renderBlock();
    save();
    refreshUndo();
  }

  function step(back: boolean): void {
    finishStroke(false);
    const snap = history.step(scope(), back, group);
    if (!snap) return;
    if (snap.group) updateGroup(snap.group);
    // A multi-block operation may include pictures outside the visible group.
    for (const [id, px] of snap.pixels) if (pickerCanvases[id]) paintBlock(pickerCanvases[id], px, pal(), { transparent: sprites });
    changed();
    markPicker();
  }
  const undoBtn = h('button', { title: 'Undo the last paint (Ctrl+Z)', disabled: true, onclick: () => step(true) }, '↶ Undo');
  const redoBtn = h('button', { title: 'Redo (Ctrl+Shift+Z or Ctrl+Y)', disabled: true, onclick: () => step(false) }, '↷ Redo');
  function refreshUndo(): void {
    const available = history.available(scope());
    undoBtn.disabled = !available.undo;
    redoBtn.disabled = !available.redo;
  }
  canvas.addEventListener('pointerdown', (e) => {
    const p = cell(e),
      s = surface();
    if (s.address(p.x, p.y) === undefined) return;
    if (tool === 'pick' || e.altKey) {
      color = s.read()[p.y * s.width + p.x];
      renderSwatches();
      return;
    }
    canvas.setPointerCapture(e.pointerId);
    before = s.read();
    stroke = before.slice();
    if (tool === 'shade') {
      shaded = new Set();
      shadeAt(p.x, p.y, e.button === 2 ? -1 : 1);
      renderBlock();
      return;
    }
    if (tool === 'fill') {
      fill(p.x, p.y);
      finishStroke(true);
      return;
    }
    if (tool === 'line' || tool === 'rect') {
      lineStart = p;
      return;
    }
    plot(stroke, p.x, p.y, e.button === 2 ? (sprites ? TRANSPARENT : 0) : color);
    write(stroke);
    renderBlock();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!canvas.hasPointerCapture(e.pointerId) || !stroke) return;
    const p = cell(e);
    if (lineStart && before) {
      renderBlock(shapePixels(lineStart, p, before));
      return;
    }
    if (tool === 'draw' && !e.altKey) {
      plot(stroke, p.x, p.y, e.buttons === 2 ? (sprites ? TRANSPARENT : 0) : color);
      write(stroke);
      renderBlock();
    }
    if (tool === 'shade') {
      shadeAt(p.x, p.y, e.buttons === 2 ? -1 : 1);
      renderBlock();
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (lineStart && before) stroke = shapePixels(lineStart, cell(e), before);
    finishStroke(true);
  });
  canvas.addEventListener('pointercancel', () => finishStroke(false));
  canvas.addEventListener('lostpointercapture', () => finishStroke(false));
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  function transform(fn: (src: Pixels) => Pixels): void {
    pushUndo();
    write(fn(picture()).px);
    changed();
  }
  function turn(clockwise: boolean): void {
    const source = picture(),
      next = clockwise ? turn90(source) : turn180(turn90(source)),
      layout = surface().turned(clockwise);
    pushUndo();
    if (layout) updateGroup(layout);
    write(next.px);
    changed();
    markPicker();
  }

  async function replaceColors(): Promise<void> {
    const r = await recolorDialog(pal(), color, color);
    if (!r) return;
    const which = r.everyBlock ? blocks.map((_, i) => i) : surface().ids;
    const parts = new Map<number, Uint8Array>();
    for (const id of which) {
      const next = applyRecolor(blocks[id].pixels, r);
      if (next.some((v, i) => v !== blocks[id].pixels[i])) parts.set(id, next);
    }
    if (parts.size) {
      pushUndo([...parts.keys()]);
      for (const [id, px] of parts) {
        blocks[id].pixels.set(px);
        if (pickerCanvases[id]) paintBlock(pickerCanvases[id], px, pal(), { transparent: sprites });
      }
      changed();
    }
    toast(parts.size ? `Recolored ${parts.size} block${parts.size === 1 ? '' : 's'}.` : 'No block used those colors.');
  }

  async function makeEdges(): Promise<void> {
    const r = await edgeSetDialog(blocks, current, pal());
    if (!r) return;
    pushUndo(r.pictures.map((_, k) => r.at + k));
    r.pictures.forEach((px, k) => {
      const i = r.at + k;
      blocks[i].pixels.set(px);
      if (pickerCanvases[i]) paintBlock(pickerCanvases[i], px, pal(), { transparent: sprites });
    });
    changed();
    toast(`Made blocks ${r.at} to ${r.at + r.pictures.length - 1}. Teach them to the map’s terrain brush to paint with them.`);
  }
  const mirrorSel = selectField<Mirror>(
    'Mirror',
    [
      ['none', 'Off'],
      ['h', 'Left ↔ right'],
      ['v', 'Top ↕ bottom'],
      ['both', 'All four corners'],
    ],
    () => mirror,
    (v) => {
      mirror = v;
      project.setExtras(file, 'painter', v === 'none' ? undefined : { mirror: v });
    },
    'Paint the mirror image too, for symmetric blocks (pencil, shade, fill, line and box)',
  );
  const tools = h(
    'div',
    { class: 'toolbar' },
    ...(['draw', 'shade', 'fill', 'pick', 'line', 'rect'] as Tool[]).map((t) =>
      h(
        'button',
        {
          class: t === tool ? 'active primary' : '',
          dataset: { tool: t },
          title: t === 'shade' ? 'Lighten a color one step along its palette ramp; right-drag darkens' : undefined,
          onclick: () => setTool(t),
        },
        { draw: 'Pencil', shade: 'Shade', fill: 'Fill', pick: 'Pick color', line: 'Line', rect: 'Box' }[t],
      ),
    ),
    mirrorSel,
  );
  function setTool(t: Tool): void {
    tool = t;
    tools.querySelectorAll('button').forEach((b) => b.classList.toggle('primary', b.dataset.tool === t));
  }
  const actions = h(
    'div',
    { class: 'toolbar' },
    h('button', { title: 'Flip left to right', onclick: () => transform(flipX) }, 'Flip ↔'),
    h('button', { title: 'Flip top to bottom', onclick: () => transform(flipY) }, 'Flip ↕'),
    h('button', { title: 'Turn a quarter clockwise', onclick: () => turn(true) }, 'Rotate ↻'),
    h('button', { title: 'Turn a quarter counterclockwise', onclick: () => turn(false) }, 'Rotate ↺'),
    h(
      'span',
      { class: 'blk-shift', role: 'group', 'aria-label': 'Shift a pixel, wrapping round' },
      h('span', { class: 'meta', 'aria-hidden': 'true' }, 'Shift'),
      ...(
        [
          ['←', 'left', -1, 0],
          ['→', 'right', 1, 0],
          ['↑', 'up', 0, -1],
          ['↓', 'down', 0, 1],
        ] as const
      ).map(([icon, word, dx, dy]) =>
        h(
          'button',
          {
            title: `Shift a pixel ${word}; what leaves one edge comes back on the other`,
            'aria-label': `Shift ${word}`,
            onclick: () => transform((s) => shiftPixels(s, dx, dy)),
          },
          icon,
        ),
      ),
    ),
    h('button', { title: 'Replace one color or a whole ramp, here or in every block', onclick: () => void replaceColors() }, 'Replace colors…'),
    sprites
      ? null
      : h(
          'button',
          {
            title: 'Paint the edges and corners round this block (grass meeting dirt…) into 12 blocks, for the map’s terrain brush',
            onclick: () => void makeEdges(),
          },
          'Make an edge set…',
        ),
    h('button', { onclick: () => (clipboard = picture()) }, 'Copy'),
    h(
      'button',
      {
        onclick: () => {
          if (!clipboard) return;
          const s = surface();
          if (clipboard.w !== s.width || clipboard.h !== s.height) return toast(`Copy a picture with the same dimensions (${s.width} × ${s.height}).`);
          pushUndo();
          write(clipboard.px);
          changed();
        },
      },
      'Paste picture',
    ),
    h('button', { onclick: () => transform((s) => s.map(() => (sprites ? TRANSPARENT : color))) }, 'Clear'),
    undoBtn,
    redoBtn,
  );

  // ---- textures (background blocks): a new take each click, in this palette ----
  let textureSeed = 1;
  const textures = h(
    'details',
    { class: 'textures' },
    h('summary', null, 'Make a texture'),
    h(
      'div',
      { class: 'sfx-grid' },
      ...TEXTURES.map((t) =>
        h(
          'button',
          {
            title: `Fill this block with ${t.name.toLowerCase()} (click again for another)`,
            onclick: () => {
              pushUndo();
              const texture = paintTexture(t, textureSeed++ * 7919, pal()),
                p = picture();
              p.map((x, y) => texture[(y % BLEN) * BLEN + (x % BLEN)]);
              write(p.px);
              changed();
            },
          },
          h('span', { class: 'sfx-icon' }, t.icon),
          t.name,
        ),
      ),
    ),
  );

  // ---- colors ---------------------------------------------------------------
  const swatches = rovingGrid(h('div', { class: 'swatches' }), 'Drawing color');
  const swatchCss = (i: number) =>
    sprites && i === TRANSPARENT ? 'repeating-conic-gradient(var(--checker-a) 0 25%, var(--checker-b) 0 50%) 0 0 / 8px 8px' : paletteCss(pal(), i);
  const colorLabel = h('div', { class: 'meta' });
  const colorBox = colorChoice({
    get: () => color,
    set: (i) => {
      color = i;
      renderSwatches();
    },
    css: swatchCss,
    name: (i) => (sprites && i === TRANSPARENT ? '255: transparent' : `Color ${i}`),
  });
  function renderSwatches(): void {
    clear(
      swatches,
      ...Array.from({ length: 256 }, (_, i) =>
        h('button', {
          class: i === color ? 'selected' : '',
          style: `background:${swatchCss(i)}`,
          title: sprites && i === TRANSPARENT ? '255: transparent' : `Color ${i}`,
          onclick: () => {
            color = i;
            renderSwatches();
          },
        }),
      ),
    );
    colorBox.refresh();
    colorLabel.textContent = `Drawing with color ${color}${sprites && color === TRANSPARENT ? ' (transparent)' : ''}. Right-drag erases; Alt-click picks.`;
  }

  // ---- properties -----------------------------------------------------------
  const {
    props,
    walkingProps,
    touchProps,
    timeProps,
    render: renderProps,
  } = blockProperties({
    project,
    file,
    kind,
    blocks,
    current: () => current,
    pal,
    walkPaths,
    changed: () => {
      save();
      insight.refresh(true);
    },
  });

  // character blocks: "Apply to the mirror too" for a block with a linked mirror (character/blockMirrorBar.ts)
  const mirrorSlot = h('div', { style: 'display:contents' });
  let mirrorBar: { el: HTMLElement; refresh(): void } | undefined;
  if (kind === 'cbl')
    void import('../character/blockMirrorBar').then((m) => {
      mirrorBar = m.blockMirrorBar({
        project,
        file,
        blocks,
        current: () => current,
        setPixels: (i, px) => {
          pushUndo([i]);
          blocks[i].pixels.set(px);
          if (pickerCanvases[i]) paintBlock(pickerCanvases[i], px, pal(), { transparent: sprites });
          changed();
        },
      });
      mirrorSlot.append(mirrorBar.el);
    });

  // the three columns each end at the window's bottom edge and scroll by themselves (blocks.css)
  const colorsPanel = h('div', { class: 'blk-colors stack' }, swatches, colorBox.el, colorLabel);
  const sideTabs = panelTabs(
    'Block settings',
    [
      { id: 'palette', label: 'Palette', panel: colorsPanel },
      ...(kind === 'bbl'
        ? [
            { id: 'walking', label: 'Walking', panel: walkingProps },
            { id: 'touch', label: 'Touch', panel: touchProps },
            { id: 'time', label: 'Time', panel: timeProps },
          ]
        : [{ id: 'properties', label: 'Properties', panel: props }]),
    ],
    view.get('tab') ?? undefined,
    (tab) => view.set({ tab }),
  );
  const columns = [
    h('div', { class: 'blk-picker' }, picker),
    h('div', { class: 'blk-paint stack' }, groupBar, tools, canvas, actions, mirrorSlot, groups.el, sprites ? null : textures, badges.el, insight.el),
    h('div', { class: 'blk-side' }, sideTabs),
  ];
  clear(
    host,
    h(
      'div',
      { class: 'blk-head' },
      h(
        'p',
        { class: 'hint' },
        sprites ? 'Color 255 is transparent. ' : '',
        'Pick a block, paint it, then set how it behaves. Shift- or Ctrl-click blocks to group them.',
      ),
      chooser.el,
    ),
    h('div', { class: 'blk' }, columns[0], columns[1], columns[2]),
  );
  fitToPane(...columns);
  renderPicker();
  renderSwatches();
  renderBlock();
  renderProps();
  insight.refresh(true);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && before) {
      e.preventDefault();
      finishStroke(false);
      return;
    }
    if (!(e.ctrlKey || e.metaKey) || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    const k = e.key.toLowerCase();
    if (k === 'z' || k === 'y') {
      e.preventDefault();
      step(k === 'z' && !e.shiftKey);
    }
  };
  window.addEventListener('keydown', onKey);
  return () => {
    finishStroke(false);
    window.removeEventListener('keydown', onKey);
    insight.dispose();
    groups.dispose();
  };
});
