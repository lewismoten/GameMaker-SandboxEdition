// Block set editor (BLOCEDIT.EXE): 20x20 pictures plus each block's game behavior.
import { rovingGrid } from '../rovingGrid';
import './blocks.css';
import { registerEditor } from './index';
import { fileField } from '../filePicker';
import { TEXTURES, paintTexture } from '../tools/textures';
import { h, clear, numberField, checkField, selectField, debounce } from '../ui';
import { blockCanvas, paintBlock, lut } from '../draw';
import type { Project } from '../project';
import {
  BLEN,
  BLOCK_COUNTS,
  BLOCK_SIZE,
  SOLBOT,
  SOLLEF,
  SOLRIG,
  SOLTOP,
  TRANSPARENT,
  parseBlocks,
  serializeBlocks,
  type Block,
  type BlockKind,
} from '../../formats/blocks';
import { paletteCss, parsePalette, type Palette } from '../../formats/palette';
import { LASTMON } from '../../formats/monster';

export const EFFECTS: [number, string][] = [
  [0, 'Nothing'],
  [1, 'Character lives'],
  [3, 'Character money'],
  ...Array.from({ length: 15 }, (_, i) => [i + 5, `Repetition count ${i + 1} (sequence ${i + 5})`] as [number, string]),
  ...Array.from({ length: 5 }, (_, i) => [i + 20, `Special counter ${i + 1}`] as [number, string]),
];

const SIDES: [number, string][] = [
  [SOLTOP, 'Top'],
  [SOLRIG, 'Right'],
  [SOLBOT, 'Bottom'],
  [SOLLEF, 'Left'],
];

type Tool = 'draw' | 'fill' | 'pick' | 'line' | 'rect';

export function paletteChooser(project: Project, file: string, onChange: (p: Palette) => void): { el: HTMLElement; palette: Palette } {
  const found = project.paletteFor(file);
  let choice = '';
  const state = { palette: found.palette };
  const el = fileField(
    project,
    'Show with palette',
    ['pal'],
    () => choice,
    (v) => {
      choice = v;
      state.palette = v ? parsePalette(project.files.get(v)!) : project.paletteFor(file).palette;
      onChange(state.palette);
    },
    { noneLabel: ['Scene palette', `the palette of the scene that uses it (${found.source})`] },
  );
  return {
    el,
    get palette() {
      return state.palette;
    },
  };
}

registerEditor(['bbl', 'mbl', 'cbl'], (host, project, file) => {
  const kind = file.split('.').pop() as BlockKind;
  const raw = project.files.get(file)!;
  const blocks = parseBlocks(raw, Math.max(BLOCK_COUNTS[kind], Math.ceil(raw.length / BLOCK_SIZE)));
  const sprites = kind !== 'bbl';
  let current = 0;
  let color = sprites ? 0 : 1;
  let tool: Tool = 'draw';
  const undo: Uint8Array[][] = blocks.map(() => []);
  let clipboard: Block | undefined;
  const save = debounce(() => project.files.set(file, serializeBlocks(blocks)), 250);

  const chooser = paletteChooser(project, file, () => {
    renderPicker();
    renderSwatches();
    renderBlock();
  });
  const pal = () => chooser.palette;

  // ---- block picker -------------------------------------------------------
  const picker = rovingGrid(h('div', { class: 'block-picker' }), 'Blocks');
  const pickerCanvases: HTMLCanvasElement[] = [];
  function renderPicker(): void {
    pickerCanvases.length = 0;
    clear(
      picker,
      ...blocks.map((b, i) => {
        const c = blockCanvas(b.pixels, pal(), { transparent: sprites, className: sprites ? 'checker' : '' });
        pickerCanvases.push(c);
        return h(
          'button',
          { class: i === current ? 'selected' : '', title: `Block ${i}`, 'aria-label': `Block ${i}`, onclick: () => select(i) },
          c,
          h('small', null, i),
        );
      }),
    );
  }
  function select(i: number): void {
    current = i;
    [...picker.children].forEach((b, j) => b.classList.toggle('selected', j === i));
    renderBlock();
    renderProps();
  }

  // ---- pixel canvas -------------------------------------------------------
  const SCALE = 16;
  const canvas = h('canvas', {
    class: `pixel blk-canvas ${sprites ? 'checker' : ''}`,
    width: BLEN * SCALE,
    height: BLEN * SCALE,
    role: 'img',
    'aria-label': 'Block painting area, 20 by 20 pixels: drag to paint, right-drag to erase',
  });
  const ctx = canvas.getContext('2d')!;
  let lineStart: { x: number; y: number } | undefined;
  let before: Uint8Array | undefined;

  function renderBlock(preview?: Uint8Array): void {
    const px = preview ?? blocks[current].pixels;
    const l = lut(pal());
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < BLEN; y++)
      for (let x = 0; x < BLEN; x++) {
        const v = px[y * BLEN + x];
        if (sprites && v === TRANSPARENT) continue;
        const c = l[v];
        ctx.fillStyle = `rgb(${c & 255},${(c >> 8) & 255},${(c >> 16) & 255})`;
        ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
      }
    ctx.strokeStyle = 'rgba(128,128,128,0.25)';
    for (let i = 1; i < BLEN; i++) {
      ctx.beginPath();
      ctx.moveTo(i * SCALE + 0.5, 0);
      ctx.lineTo(i * SCALE + 0.5, canvas.height);
      ctx.moveTo(0, i * SCALE + 0.5);
      ctx.lineTo(canvas.width, i * SCALE + 0.5);
      ctx.stroke();
    }
    if (!preview && pickerCanvases[current]) paintBlock(pickerCanvases[current], blocks[current].pixels, pal(), { transparent: sprites });
  }

  const cell = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(BLEN - 1, Math.floor(((e.clientX - r.left) / r.width) * BLEN))),
      y: Math.max(0, Math.min(BLEN - 1, Math.floor(((e.clientY - r.top) / r.height) * BLEN))),
    };
  };

  function shapePixels(a: { x: number; y: number }, b: { x: number; y: number }, src: Uint8Array): Uint8Array {
    const out = src.slice();
    if (tool === 'rect') {
      for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) {
        out[a.y * BLEN + x] = color;
        out[b.y * BLEN + x] = color;
      }
      for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) {
        out[y * BLEN + a.x] = color;
        out[y * BLEN + b.x] = color;
      }
      return out;
    }
    const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y), 1);
    for (let i = 0; i <= n; i++) out[Math.round(a.y + ((b.y - a.y) * i) / n) * BLEN + Math.round(a.x + ((b.x - a.x) * i) / n)] = color;
    return out;
  }

  function fill(x: number, y: number): void {
    const px = blocks[current].pixels;
    const target = px[y * BLEN + x];
    if (target === color) return;
    const stack = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      if (cx < 0 || cy < 0 || cx >= BLEN || cy >= BLEN || px[cy * BLEN + cx] !== target) continue;
      px[cy * BLEN + cx] = color;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
  }

  function pushUndo(): void {
    undo[current].push(blocks[current].pixels.slice());
    if (undo[current].length > 50) undo[current].shift();
  }

  function changed(): void {
    renderBlock();
    save();
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const p = cell(e);
    if (tool === 'pick' || e.altKey) {
      color = blocks[current].pixels[p.y * BLEN + p.x];
      renderSwatches();
      return;
    }
    pushUndo();
    if (tool === 'fill') {
      fill(p.x, p.y);
      changed();
      return;
    }
    if (tool === 'line' || tool === 'rect') {
      lineStart = p;
      before = blocks[current].pixels.slice();
      return;
    }
    blocks[current].pixels[p.y * BLEN + p.x] = e.button === 2 ? (sprites ? TRANSPARENT : 0) : color;
    renderBlock();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!canvas.hasPointerCapture(e.pointerId)) return;
    const p = cell(e);
    if (lineStart && before) {
      renderBlock(shapePixels(lineStart, p, before));
      return;
    }
    if (tool === 'draw' && !e.altKey) {
      blocks[current].pixels[p.y * BLEN + p.x] = e.buttons === 2 ? (sprites ? TRANSPARENT : 0) : color;
      renderBlock();
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (lineStart && before) blocks[current].pixels.set(shapePixels(lineStart, cell(e), before));
    lineStart = before = undefined;
    changed();
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  function transform(fn: (x: number, y: number, src: Uint8Array) => number): void {
    pushUndo();
    const src = blocks[current].pixels.slice();
    for (let y = 0; y < BLEN; y++) for (let x = 0; x < BLEN; x++) blocks[current].pixels[y * BLEN + x] = fn(x, y, src);
    changed();
  }
  const L = BLEN - 1;
  const tools = h(
    'div',
    { class: 'toolbar' },
    ...(['draw', 'fill', 'pick', 'line', 'rect'] as Tool[]).map((t) =>
      h(
        'button',
        { class: t === tool ? 'active primary' : '', dataset: { tool: t }, onclick: () => setTool(t) },
        { draw: 'Pencil', fill: 'Fill', pick: 'Pick color', line: 'Line', rect: 'Box' }[t],
      ),
    ),
  );
  function setTool(t: Tool): void {
    tool = t;
    tools.querySelectorAll('button').forEach((b) => b.classList.toggle('primary', b.dataset.tool === t));
  }
  const actions = h(
    'div',
    { class: 'toolbar' },
    h('button', { onclick: () => transform((x, y, s) => s[y * BLEN + (L - x)]) }, 'Flip ↔'),
    h('button', { onclick: () => transform((x, y, s) => s[(L - y) * BLEN + x]) }, 'Flip ↕'),
    h('button', { onclick: () => transform((x, y, s) => s[(L - x) * BLEN + y]) }, 'Rotate ↻'),
    h('button', { onclick: () => transform((x, y, s) => s[y * BLEN + ((x + 1) % BLEN)]) }, 'Shift ←'),
    h('button', { onclick: () => transform((x, y, s) => s[((y + 1) % BLEN) * BLEN + x]) }, 'Shift ↑'),
    h('button', { onclick: () => (clipboard = structuredClone(blocks[current])) }, 'Copy'),
    h(
      'button',
      {
        onclick: () => {
          if (!clipboard) return;
          pushUndo();
          blocks[current].pixels.set(clipboard.pixels);
          changed();
        },
      },
      'Paste picture',
    ),
    h('button', { onclick: () => transform(() => (sprites ? TRANSPARENT : color)) }, 'Clear'),
    h(
      'button',
      {
        onclick: () => {
          const prev = undo[current].pop();
          if (prev) {
            blocks[current].pixels.set(prev);
            changed();
          }
        },
      },
      'Undo',
    ),
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
              blocks[current].pixels.set(paintTexture(t, textureSeed++ * 7919, pal()));
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
  const colorLabel = h('div', { class: 'meta' });
  function renderSwatches(): void {
    clear(
      swatches,
      ...Array.from({ length: 256 }, (_, i) =>
        h('button', {
          class: i === color ? 'selected' : '',
          style: `background:${sprites && i === TRANSPARENT ? 'transparent' : paletteCss(pal(), i)}`,
          title: sprites && i === TRANSPARENT ? '255: transparent' : `Color ${i}`,
          onclick: () => {
            color = i;
            renderSwatches();
          },
        }),
      ),
    );
    colorLabel.textContent = `Drawing with color ${color}${sprites && color === TRANSPARENT ? ' (transparent)' : ''}. Right-drag erases; Alt-click picks.`;
  }

  // ---- properties -----------------------------------------------------------
  const props = h('div', { class: 'panel stack' });
  function renderProps(): void {
    const b = blocks[current];
    const edit = (fn: () => void) => {
      fn();
      save();
    };
    const sides = (labelText: string, get: () => number, set: (v: number) => void, title: string) =>
      h(
        'fieldset',
        { class: 'row', style: 'border:1px solid var(--border);border-radius:6px;gap:8px', title },
        h('legend', null, labelText),
        ...SIDES.map(([bit, name]) =>
          checkField(
            name,
            () => !!(get() & bit),
            (on) => edit(() => set(on ? get() | bit : get() & ~bit)),
          ),
        ),
      );
    const blockNum = (labelText: string, get: () => number, set: (v: number) => void, title: string) =>
      numberField(labelText, get, (v) => edit(() => set(v)), { min: 0, max: 255, title });
    const touch = [
      numberField(
        'Score points',
        () => b.scorePts,
        (v) => edit(() => (b.scorePts = v)),
        { min: -32768, max: 32767, title: 'Added to the score when touched' },
      ),
      numberField(
        'Hit points',
        () => b.chHitPt,
        (v) => edit(() => (b.chHitPt = v)),
        { min: -32768, max: 32767, title: 'Added to the character’s hit points when touched; negative hurts' },
      ),
      selectField(
        'Changes counter',
        EFFECTS,
        () => b.effect,
        (v) => edit(() => (b.effect = v)),
        'Which counter is changed when touched',
      ),
      numberField(
        'by',
        () => b.eamt,
        (v) => edit(() => (b.eamt = v)),
        { min: -32768, max: 32767 },
      ),
    ];
    if (kind === 'cbl') {
      clear(props, h('p', { class: 'hint' }, 'Character blocks are only pictures; the character file decides how they are used.'));
      return;
    }
    if (kind === 'mbl') {
      clear(
        props,
        h('h3', null, `Block ${current}: when a monster showing this picture touches the character`),
        sides(
          'Solid (pushes the character)',
          () => b.solid,
          (v) => (b.solid = v),
          'Sides of the monster the character cannot pass through',
        ),
        h('div', { class: 'grid-fields' }, ...touch),
      );
      return;
    }
    clear(
      props,
      h('h3', null, `Block ${current}`),
      sides(
        'Solid sides',
        () => b.solid,
        (v) => (b.solid = v),
        'The character cannot pass through these sides',
      ),
      sides(
        'Gravity pulls',
        () => b.grav,
        (v) => (b.grav = v),
        'While on this block the character accelerates in these directions',
      ),
      h(
        'div',
        { class: 'row' },
        checkField(
          'Can be picked up (object)',
          () => !!b.obj,
          (on) => edit(() => (b.obj = on ? 1 : 0)),
          'Goes into the inventory with the pick-up sequence',
        ),
      ),
      h('h4', null, 'When touched'),
      h(
        'div',
        { class: 'grid-fields' },
        ...touch,
        blockNum(
          'Becomes block',
          () => b.touchBl,
          (v) => (b.touchBl = v),
          'Set to this block’s own number to stay the same',
        ),
      ),
      h('h4', null, 'Over time'),
      h(
        'div',
        { class: 'grid-fields' },
        blockNum(
          'Changes into block',
          () => b.nextBl,
          (v) => (b.nextBl = v),
          'Animation: set to its own number for no animation',
        ),
        numberField(
          'after ticks (1/18 s)',
          () => b.ntime,
          (v) => edit(() => (b.ntime = v)),
          { min: 0, max: 32767 },
        ),
        numberField(
          'Gives birth to monster',
          () => b.birthMon,
          (v) => edit(() => (b.birthMon = v)),
          { min: 0, max: LASTMON - 1 },
        ),
        numberField(
          'every ticks (0 = never)',
          () => b.birthTime,
          (v) => edit(() => (b.birthTime = v)),
          { min: 0, max: 16383 },
        ),
      ),
    );
  }

  clear(
    host,
    h(
      'div',
      { class: 'blk-head' },
      h(
        'p',
        { class: 'hint' },
        sprites ? 'Color 255 is transparent. ' : '',
        'Pick a block on the left, paint it in the middle, and set how it behaves on the right.',
      ),
      chooser.el,
    ),
    h(
      'div',
      { class: 'blk' },
      h('div', { class: 'blk-picker' }, picker),
      h('div', { class: 'blk-paint stack' }, tools, canvas, actions, sprites ? null : textures),
      h('div', { class: 'blk-side' }, h('div', { class: 'blk-colors stack' }, swatches, colorLabel), props),
    ),
  );
  renderPicker();
  renderSwatches();
  renderBlock();
  renderProps();

  const onKey = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !(e.target instanceof HTMLInputElement)) {
      e.preventDefault();
      const prev = undo[current].pop();
      if (prev) {
        blocks[current].pixels.set(prev);
        changed();
      }
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
});
