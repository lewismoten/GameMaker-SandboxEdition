// The animation maker's side panel: the scene's length, speed and fades; the chosen
// background (a picture, a map view or a color, from which frame); or the chosen item: a
// text (words, size, colors, how it moves, and a warning when it runs off the frame), a
// character or monster (which one, its size and facing, the keys of its path), or a block.
import { h, numberField, selectField, checkField, debounce } from '../../../core/ui';
import { paletteCss } from '../../../../formats/palette';
import { colorChoice } from '../../../widgets/colorChoice';
import { blockButton } from '../../../widgets/blockChooser';
import { BACKBL, parseBlocks } from '../../../../formats/blocks';
import { SEQUENCE_NAMES, parseCharacter, frameCount } from '../../../../formats/character';
import {
  actorAt,
  backgroundEnd,
  sortBackgrounds,
  MAX_FRAMES,
  type ActorItem,
  type Background,
  type BlockItem,
  type Item,
  type TextItem,
  type TextMotion,
} from './sceneModel';
import { fitText, textWarnings } from './sceneText';
import { findItem, monstersWithPictures, partnerFile, type SceneCtx } from './sceneCtx';

const MOTIONS: [TextMotion, string][] = [
  ['still', 'Still'],
  ['type', 'Types out'],
  ['slide-down', 'Slides down in'],
  ['slide-up', 'Slides up in'],
  ['slide-right', 'Slides in from the left'],
  ['slide-left', 'Slides in from the right'],
  ['scroll-up', 'Rolls up (credits)'],
  ['scroll-left', 'Scrolls across (ticker)'],
];

const RATE_LABEL: Partial<Record<TextMotion, string>> = {
  type: 'Frames per letter',
  'slide-down': 'Frames to slide',
  'slide-up': 'Frames to slide',
  'slide-left': 'Frames to slide',
  'slide-right': 'Frames to slide',
};

const files = (ctx: SceneCtx, ...exts: string[]): [string, string][] => exts.flatMap((e) => ctx.project.files.byExtension(e)).map((n) => [n, n.toUpperCase()]);

/** A color of the palette shown at the item's start: a swatch, the number box and Bigger colors. */
function colorField(ctx: SceneCtx, label: string, at: number, get: () => number, set: (i: number) => void, allowNone = false): HTMLElement {
  const pal = ctx.paletteAt(at);
  const swatch = h('span', { class: 'scn-swatch', 'aria-hidden': 'true' });
  const paint = () => {
    const v = get();
    swatch.style.background = v < 0 ? 'transparent' : paletteCss(pal, v);
    swatch.classList.toggle('none', v < 0);
  };
  const choice = colorChoice({ get: () => Math.max(0, get()), set: (i) => (set(i), paint()), css: (i) => paletteCss(pal, i) });
  const none = allowNone
    ? checkField(
        'None',
        () => get() < 0,
        (v) => (set(v ? -1 : 0), paint(), choice.refresh()),
      )
    : null;
  paint();
  return h('div', { class: 'scn-color', role: 'group', 'aria-label': label }, h('span', { class: 'scn-color-label' }, label), swatch, choice.el, none);
}

function itemFields(ctx: SceneCtx, item: Item, track: number): HTMLElement[] {
  const id = item.id;
  const edit = <T extends Item>(fn: (it: T) => void, rebuild = false) =>
    ctx.change((s) => {
      const f = findItem(s, id);
      if (f) fn(f.item as T);
    }, rebuild);
  const s = ctx.scene();
  const common = h(
    'div',
    { class: 'grid-fields' },
    numberField(
      'From frame',
      () => item.start + 1,
      (v) => edit((it) => ((it.start = v - 1), (it.end = Math.max(it.end, it.start + 1)))),
      { min: 1, max: s.frames },
    ),
    numberField(
      'To frame',
      () => item.end,
      (v) => edit((it) => ((it.end = v), (it.start = Math.min(it.start, v - 1)))),
      { min: 1, max: s.frames },
    ),
    selectField(
      'Track',
      s.tracks.map((t, i): [number, string] => [i, `${i + 1}. ${t.name}`]),
      () => track,
      (to) =>
        ctx.change((sc) => {
          const f = findItem(sc, id);
          if (!f) return;
          sc.tracks[f.track].items = sc.tracks[f.track].items.filter((x) => x.id !== id);
          sc.tracks[to].items.push(f.item);
        }, true),
    ),
  );
  if (item.kind === 'text') return [textFields(ctx, item, edit), common];
  if (item.kind === 'block') return [blockFields(ctx, item, edit), common];
  return [actorFields(ctx, item, edit), common];
}

type Edit = <T extends Item>(fn: (it: T) => void, rebuild?: boolean) => void;

function textFields(ctx: SceneCtx, it: TextItem, edit: Edit): HTMLElement {
  const area = h('textarea', { rows: 3, class: 'scn-text', spellcheck: false });
  area.value = it.text;
  const warn = h('div', { class: 'scn-warn', role: 'status' });
  const showWarnings = () => {
    const cur = findItem(ctx.scene(), it.id)?.item as TextItem | undefined;
    const w = cur ? textWarnings(cur) : [];
    warn.replaceChildren(
      ...(w.length
        ? [
            h('strong', null, '⚠ This text ', w.join(', '), '.'),
            h('button', { type: 'button', onclick: () => edit<TextItem>((t) => Object.assign(t, fitText(t)), true) }, 'Fit it inside'),
          ]
        : []),
    );
    warn.hidden = !w.length;
  };
  const typed = debounce(() => edit<TextItem>((t) => (t.text = area.value)), 250);
  area.addEventListener('input', () => (typed(), setTimeout(showWarnings, 300)));
  const after = (fn: (t: TextItem) => void, rebuild = false) => (edit<TextItem>(fn, rebuild), showWarnings());
  showWarnings();
  const rate = RATE_LABEL[it.motion];
  return h(
    'div',
    { class: 'stack' },
    h('label', { class: 'field' }, h('span', null, 'Words (Enter starts a new line)'), area),
    warn,
    h(
      'div',
      { class: 'grid-fields' },
      selectField(
        'Moves',
        MOTIONS,
        () => it.motion,
        (v) => after((t) => (t.motion = v), true),
      ),
      rate
        ? numberField(
            rate,
            () => it.rate,
            (v) => after((t) => (t.rate = v)),
            { min: 1, max: 200 },
          )
        : null,
      selectField<number>(
        'Size',
        [1, 2, 3, 4].map((n): [number, string] => [n, `${n}× (${8 * n} px letters)`]),
        () => it.scale,
        (v) => after((t) => (t.scale = v)),
      ),
      selectField<'left' | 'center'>(
        'Lines',
        [
          ['center', 'Centered on x'],
          ['left', 'From x'],
        ],
        () => it.align,
        (v) => after((t) => (t.align = v)),
      ),
      numberField(
        'x',
        () => it.x,
        (v) => after((t) => (t.x = v)),
        { min: -999, max: 999, title: 'Where it rests: its middle (centered) or left edge, in pixels' },
      ),
      numberField(
        'y',
        () => it.y,
        (v) => after((t) => (t.y = v)),
        { min: -999, max: 999, title: 'Where it rests: its top, in pixels' },
      ),
    ),
    colorField(
      ctx,
      'Letters',
      it.start,
      () => it.color,
      (v) => after((t) => (t.color = v)),
    ),
    colorField(
      ctx,
      'Outline',
      it.start,
      () => it.outline,
      (v) => after((t) => (t.outline = v)),
      true,
    ),
  );
}

function blockFields(ctx: SceneCtx, it: BlockItem, edit: Edit): HTMLElement {
  const blocks = () => {
    const b = ctx.project.files.get(it.bbl);
    return b ? parseBlocks(b, BACKBL) : [];
  };
  return h(
    'div',
    { class: 'stack' },
    h(
      'div',
      { class: 'grid-fields' },
      selectField(
        'Block set',
        files(ctx, 'bbl'),
        () => it.bbl,
        (v) => edit<BlockItem>((b) => (b.bbl = v), true),
      ),
      h(
        'div',
        { class: 'field' },
        h('span', null, 'Block'),
        blockButton(
          blocks,
          () => ctx.project.paletteFor(it.bbl).palette,
          () => it.block,
          (n) => edit<BlockItem>((b) => (b.block = n), true),
          { title: 'Choose a block' },
        ),
      ),
      selectField<number>(
        'Size',
        [1, 2, 3, 4].map((n): [number, string] => [n, `${n}×`]),
        () => it.scale,
        (v) => edit<BlockItem>((b) => (b.scale = v)),
      ),
      numberField(
        'x',
        () => it.x,
        (v) => edit<BlockItem>((b) => (b.x = v)),
        { min: -999, max: 999 },
      ),
      numberField(
        'y',
        () => it.y,
        (v) => edit<BlockItem>((b) => (b.y = v)),
        { min: -999, max: 999 },
      ),
    ),
  );
}

function sequenceOptions(ctx: SceneCtx, chr: string): [number, string][] {
  const out: [number, string][] = [[-1, 'Its walk (found for you)']];
  const b = ctx.project.files.get(chr);
  if (!b) return out;
  try {
    parseCharacter(b).sequences.forEach((s, i) => {
      const n = frameCount(s);
      if (n) out.push([i, `${i + 1}. ${SEQUENCE_NAMES[i] ?? 'Sequence'} (${n} frame${n === 1 ? '' : 's'})`]);
    });
  } catch {
    /* only the walk */
  }
  return out;
}

function actorFields(ctx: SceneCtx, it: ActorItem, edit: Edit): HTMLElement {
  const src = it.source;
  const which =
    src.type === 'chr'
      ? [
          selectField(
            'Character',
            files(ctx, 'chr'),
            () => src.chr,
            (v) =>
              edit<ActorItem>((a) => {
                a.source = { type: 'chr', chr: v, cbl: partnerFile(ctx.project, v, 5, 6, 'cbl'), seq: -1 };
              }, true),
          ),
          selectField(
            'Its blocks',
            files(ctx, 'cbl'),
            () => src.cbl,
            (v) => edit<ActorItem>((a) => a.source.type === 'chr' && (a.source.cbl = v)),
          ),
          selectField(
            'Moves with',
            sequenceOptions(ctx, src.chr),
            () => src.seq,
            (v) => edit<ActorItem>((a) => a.source.type === 'chr' && (a.source.seq = v)),
          ),
        ]
      : [
          selectField(
            'Monsters',
            files(ctx, 'mon'),
            () => src.mon,
            (v) =>
              edit<ActorItem>((a) => {
                a.source = { type: 'mon', mon: v, mbl: partnerFile(ctx.project, v, 3, 4, 'mbl'), index: monstersWithPictures(ctx.project, v)[0] ?? 0 };
              }, true),
          ),
          selectField(
            'Its blocks',
            files(ctx, 'mbl'),
            () => src.mbl,
            (v) => edit<ActorItem>((a) => a.source.type === 'mon' && (a.source.mbl = v)),
          ),
          selectField<number>(
            'Monster',
            monstersWithPictures(ctx.project, src.mon).map((i): [number, string] => [i, `Monster ${i}`]),
            () => src.index,
            (v) => edit<ActorItem>((a) => a.source.type === 'mon' && (a.source.index = v)),
          ),
        ];
  const keys = h('table', { class: 'scn-keys' });
  keys.append(
    h('caption', null, 'Path: where its top-left is at each key frame (it moves in a straight line between them)'),
    h('tr', null, h('th', null, 'Frame'), h('th', null, 'x'), h('th', null, 'y'), h('th', null, 'Remove')),
  );
  it.path.forEach((k, i) => {
    const cell = (label: string, get: () => number, set: (v: number) => void, min: number, max: number) => {
      const input = h('input', { type: 'number', value: String(get()), min, max, 'aria-label': `Key ${i + 1} ${label}` });
      input.addEventListener('change', () => set(Math.max(min, Math.min(max, Math.round(Number(input.value) || 0)))));
      return h('td', null, input);
    };
    keys.append(
      h(
        'tr',
        null,
        cell(
          'frame',
          () => it.start + k.f + 1,
          (v) => edit<ActorItem>((a) => ((a.path[i].f = v - 1 - a.start), a.path.sort((p, q) => p.f - q.f)), true),
          1,
          MAX_FRAMES,
        ),
        cell(
          'x',
          () => k.x,
          (v) => edit<ActorItem>((a) => (a.path[i].x = v)),
          -999,
          999,
        ),
        cell(
          'y',
          () => k.y,
          (v) => edit<ActorItem>((a) => (a.path[i].y = v)),
          -999,
          999,
        ),
        h(
          'td',
          null,
          it.path.length > 1
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'scn-icon',
                  'aria-label': `Remove key ${i + 1}`,
                  title: 'Remove this key',
                  onclick: () => edit<ActorItem>((a) => a.path.splice(i, 1), true),
                },
                '×',
              )
            : null,
        ),
      ),
    );
  });
  const addKey = () =>
    edit<ActorItem>((a) => {
      const f = Math.max(0, Math.min(a.end - a.start - 1, ctx.frame() - a.start));
      if (a.path.some((k) => k.f === f)) return;
      const at = actorAt(a.path, f);
      a.path.push({ f, x: at.x, y: at.y });
      a.path.sort((p, q) => p.f - q.f);
    }, true);
  return h(
    'div',
    { class: 'stack' },
    h(
      'div',
      { class: 'grid-fields' },
      ...which,
      selectField<number>(
        'Size',
        [1, 2, 3, 4].map((n): [number, string] => [n, `${n}×`]),
        () => it.scale,
        (v) => edit<ActorItem>((a) => (a.scale = v)),
      ),
      selectField<'right' | 'left'>(
        'Its pictures face',
        [
          ['right', 'Right'],
          ['left', 'Left'],
        ],
        () => it.faces,
        (v) => edit<ActorItem>((a) => (a.faces = v)),
      ),
    ),
    checkField(
      'Turn round (mirror it) when it moves the other way',
      () => it.mirror,
      (v) => edit<ActorItem>((a) => (a.mirror = v)),
    ),
    keys,
    h(
      'div',
      { class: 'toolbar' },
      h('button', { type: 'button', onclick: addKey, title: 'A key at the frame shown, where it is now; then drag it on the picture' }, '+ Key at this frame'),
    ),
  );
}

function backgroundFields(ctx: SceneCtx, index: number): HTMLElement {
  const s = ctx.scene();
  const bg = s.backgrounds[index];
  const edit = (fn: (b: Background) => void, rebuild = false) =>
    ctx.change((sc) => {
      const b = sc.backgrounds[index];
      if (b) fn(b);
      sc.backgrounds = sortBackgrounds(sc.backgrounds);
    }, rebuild);
  const kind = selectField<Background['kind']>(
    'Shows',
    [
      ['picture', 'A picture (.GIF or .BKD)'],
      ['map', 'A view of a map'],
      ['color', 'One color'],
    ],
    () => bg.kind,
    (k) =>
      ctx.change((sc) => {
        const start = sc.backgrounds[index].start;
        sc.backgrounds[index] =
          k === 'picture'
            ? { start, kind: 'picture', file: files(ctx, 'gif', 'bkd')[0]?.[0] ?? '' }
            : k === 'map'
              ? { start, kind: 'map', map: files(ctx, 'map')[0]?.[0] ?? '', x: 0, y: 0 }
              : { start, kind: 'color', palette: '', color: 0 };
      }, true),
  );
  const fields: (HTMLElement | null)[] = [kind];
  if (bg.kind === 'picture')
    fields.push(
      selectField(
        'Picture',
        [['', '(choose)'], ...files(ctx, 'gif', 'bkd')],
        () => bg.file,
        (v) => edit((b) => b.kind === 'picture' && (b.file = v)),
      ),
    );
  if (bg.kind === 'map')
    fields.push(
      selectField(
        'Map',
        [['', '(choose)'], ...files(ctx, 'map')],
        () => bg.map,
        (v) => edit((b) => b.kind === 'map' && (b.map = v)),
      ),
      numberField(
        'Left block',
        () => bg.x,
        (v) => edit((b) => b.kind === 'map' && (b.x = v)),
        { min: 0, max: 84, title: 'The map column at the left edge (16 blocks show)' },
      ),
      numberField(
        'Top block',
        () => bg.y,
        (v) => edit((b) => b.kind === 'map' && (b.y = v)),
        { min: 0, max: 90, title: 'The map row at the top (10 blocks show)' },
      ),
    );
  if (bg.kind === 'color')
    fields.push(
      selectField(
        'Palette',
        [['', 'The first level’s'], ...files(ctx, 'pal')],
        () => bg.palette,
        (v) => edit((b) => b.kind === 'color' && (b.palette = v), true),
      ),
    );
  if (index > 0)
    fields.push(
      numberField(
        'From frame',
        () => bg.start + 1,
        (v) => edit((b) => (b.start = v - 1), true),
        { min: 2, max: s.frames },
      ),
    );
  return h(
    'div',
    { class: 'stack' },
    h(
      'p',
      { class: 'hint' },
      index === 0
        ? `Shown from the first frame${s.backgrounds.length > 1 ? ` to frame ${backgroundEnd(s, 0)}` : ''}.`
        : `Shown from frame ${bg.start + 1} to ${backgroundEnd(s, index)}.`,
      ' Each background brings its own colors; the fades hide the change.',
    ),
    h('div', { class: 'grid-fields' }, ...fields),
    bg.kind === 'color'
      ? colorField(
          ctx,
          'Color',
          bg.start,
          () => bg.color,
          (v) => edit((b) => b.kind === 'color' && (b.color = v)),
        )
      : null,
    index > 0
      ? h(
          'div',
          { class: 'toolbar' },
          h(
            'button',
            {
              type: 'button',
              class: 'danger',
              onclick: () => {
                ctx.change((sc) => sc.backgrounds.splice(index, 1), true);
                ctx.select({ kind: 'scene' });
              },
            },
            '🗑 Remove this background',
          ),
        )
      : null,
  );
}

function sceneFields(ctx: SceneCtx): HTMLElement {
  const s = ctx.scene();
  const secs = (s.frames * s.speed) / 70;
  return h(
    'div',
    { class: 'stack' },
    h('p', { class: 'hint' }, `${s.frames} frames, ${s.speed}/70 s each: ${secs.toFixed(1)} s. Every change is written to the .FLI the game plays.`),
    h(
      'div',
      { class: 'grid-fields' },
      numberField(
        'Frames',
        () => s.frames,
        (v) => ctx.change((sc) => (sc.frames = v), true),
        { min: 1, max: MAX_FRAMES, title: 'How long the animation is' },
      ),
      numberField(
        'Speed (1/70 s a frame)',
        () => s.speed,
        (v) => ctx.change((sc) => (sc.speed = v), true),
        { min: 1, max: 1000, title: '5 is 14 frames a second' },
      ),
      numberField(
        'Fade in (frames)',
        () => s.fadeIn,
        (v) => ctx.change((sc) => (sc.fadeIn = v)),
        { min: 0, max: 200, title: 'Each background fades in from black over this many frames' },
      ),
      numberField(
        'Fade out (frames)',
        () => s.fadeOut,
        (v) => ctx.change((sc) => (sc.fadeOut = v)),
        { min: 0, max: 200, title: 'Each background fades out to black over this many frames' },
      ),
    ),
  );
}

/** The panel for what is chosen now. */
export function inspector(ctx: SceneCtx): HTMLElement {
  const sel = ctx.selection();
  const s = ctx.scene();
  if (sel.kind === 'item') {
    const f = findItem(s, sel.id);
    if (f) {
      const kindName = f.item.kind === 'text' ? 'Text' : f.item.kind === 'block' ? 'Block' : f.item.source.type === 'chr' ? 'Character' : 'Monster';
      return h('section', { class: 'scn-inspector', 'aria-label': `${kindName} settings` }, h('h2', null, kindName), ...itemFields(ctx, f.item, f.track));
    }
  }
  if (sel.kind === 'bg' && s.backgrounds[sel.index]) {
    return h(
      'section',
      { class: 'scn-inspector', 'aria-label': 'Background settings' },
      h('h2', null, `Background ${sel.index + 1}`),
      backgroundFields(ctx, sel.index),
    );
  }
  return h(
    'section',
    { class: 'scn-inspector', 'aria-label': 'Scene settings' },
    h('h2', null, 'Scene'),
    sceneFields(ctx),
    h('p', { class: 'hint' }, `Choose a bar on the timeline, or something on the picture, to change it; drag it on the picture to move it.`),
  );
}
