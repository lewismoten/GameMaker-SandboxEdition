// The animation maker's timeline: a ruler to pick a frame, a lane of backgrounds, and a lane
// per track with a bar for each item from its first frame to its last. Click a bar to choose
// it; drag it to move it in time, or drag its right end to change how long it lasts. From the
// keyboard: ← → move a chosen bar a frame (Shift: ten), [ ] make it shorter or longer.
import { h, promptText } from '../../../core/ui';
import { backgroundEnd, itemLabel, type Item, type Scene } from './sceneModel';
import { findItem, type SceneCtx } from './sceneCtx';

const pct = (v: number, frames: number) => `${(v / frames) * 100}%`;

/** A bar: its place in the lane; drags report the frames moved. */
function bar(
  label: string,
  start: number,
  end: number,
  frames: number,
  selected: boolean,
  on: { select: () => void; shift?: (by: number, edge: boolean) => void },
  title: string,
): HTMLButtonElement {
  const b = h(
    'button',
    {
      type: 'button',
      class: `scn-bar${selected ? ' selected' : ''}`,
      style: `left:${pct(start, frames)};width:${pct(end - start, frames)}`,
      'aria-pressed': String(selected),
      title,
    },
    h('span', null, label),
  );
  b.addEventListener('click', (e) => {
    if ((b.dataset.dragged ?? '') === '1') return void (b.dataset.dragged = '');
    e.preventDefault();
    on.select();
  });
  if (!on.shift) return b;
  const shift = on.shift;
  b.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft') shift(-step, false);
    else if (e.key === 'ArrowRight') shift(step, false);
    else if (e.key === '[') shift(-step, true);
    else if (e.key === ']') shift(step, true);
    else return;
    e.preventDefault();
    e.stopPropagation();
  });
  b.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const lane = b.parentElement!;
    const box = b.getBoundingClientRect();
    const edge = e.clientX > box.right - 8;
    const x0 = e.clientX;
    const perFrame = lane.getBoundingClientRect().width / frames;
    let by = 0;
    b.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      by = Math.round((ev.clientX - x0) / perFrame);
      if (edge) b.style.width = pct(Math.max(1, end - start + by), frames);
      else b.style.left = pct(Math.max(0, start + by), frames);
    };
    const up = () => {
      b.removeEventListener('pointermove', move);
      b.removeEventListener('pointerup', up);
      b.removeEventListener('pointercancel', up);
      if (by) {
        b.dataset.dragged = '1';
        shift(by, edge);
      }
    };
    b.addEventListener('pointermove', move);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
  });
  return b;
}

function moveItem(it: Item, by: number, edge: boolean, frames: number): void {
  if (edge) it.end = Math.max(it.start + 1, Math.min(frames, it.end + by));
  else {
    const len = it.end - it.start;
    it.start = Math.max(0, Math.min(frames - len, it.start + by));
    it.end = it.start + len;
  }
}

export function timeline(ctx: SceneCtx): HTMLElement {
  const s: Scene = ctx.scene();
  const sel = ctx.selection();
  const frames = s.frames;
  const head = () => h('div', { class: 'scn-head', 'aria-hidden': 'true', style: `left:${pct(ctx.frame() + 0.5, frames)}` });
  const ruler = h('div', { class: 'scn-ruler', title: 'Click or drag to show a frame' });
  const step = frames > 400 ? 100 : frames > 120 ? 20 : 10;
  for (let f = 0; f < frames; f += step) ruler.append(h('span', { class: 'scn-tick', style: `left:${pct(f, frames)}` }, String(f + 1)));
  const seekAt = (e: PointerEvent) => {
    const r = ruler.getBoundingClientRect();
    ctx.seek(Math.max(0, Math.min(frames - 1, Math.floor(((e.clientX - r.left) / r.width) * frames))));
  };
  ruler.addEventListener('pointerdown', (e) => {
    ruler.setPointerCapture(e.pointerId);
    seekAt(e);
    const move = (ev: PointerEvent) => seekAt(ev);
    ruler.addEventListener('pointermove', move);
    ruler.addEventListener('pointerup', () => ruler.removeEventListener('pointermove', move), { once: true });
  });

  const bgLane = h(
    'div',
    { class: 'scn-bars' },
    s.backgrounds.map((b, i) =>
      bar(
        b.kind === 'picture' ? b.file.toUpperCase() || 'Picture' : b.kind === 'map' ? `${b.map.toUpperCase() || 'Map'} ${b.x},${b.y}` : `Color ${b.color}`,
        b.start,
        backgroundEnd(s, i),
        frames,
        sel.kind === 'bg' && sel.index === i,
        { select: () => ctx.select({ kind: 'bg', index: i }) },
        `Background ${i + 1}: frames ${b.start + 1}–${backgroundEnd(s, i)}`,
      ),
    ),
    head(),
  );
  const lanes = s.tracks.map((t, ti) => {
    const bars = h(
      'div',
      { class: 'scn-bars' },
      t.items.map((it) =>
        bar(
          itemLabel(it),
          it.start,
          it.end,
          frames,
          sel.kind === 'item' && sel.id === it.id,
          {
            select: () => ctx.select({ kind: 'item', id: it.id }),
            shift: (by, edge) =>
              ctx.change((sc) => {
                const f = findItem(sc, it.id);
                if (f) moveItem(f.item, by, edge, sc.frames);
              }, true),
          },
          `${itemLabel(it)}: frames ${it.start + 1}–${it.end}. Drag to move it, drag its right end to change its length; ← → and [ ] from the keyboard.`,
        ),
      ),
      head(),
    );
    const rename = async () => {
      const name = await promptText('Rename the track', 'Name', t.name);
      if (name) ctx.change((sc) => (sc.tracks[ti].name = name), true);
    };
    return h(
      'div',
      { class: 'scn-lane' },
      h(
        'div',
        { class: 'scn-lane-head' },
        h('button', { type: 'button', class: 'scn-lane-name', title: 'Rename this track', onclick: () => void rename() }, `${ti + 1}. ${t.name}`),
        h(
          'button',
          {
            type: 'button',
            class: 'scn-icon',
            'aria-label': `Draw track ${ti + 1} under the one before`,
            title: 'Draw this track sooner (under the others)',
            disabled: ti === 0,
            onclick: () => ctx.change((sc) => sc.tracks.splice(ti - 1, 0, ...sc.tracks.splice(ti, 1)), true),
          },
          '↑',
        ),
        h(
          'button',
          {
            type: 'button',
            class: 'scn-icon',
            'aria-label': `Remove track ${ti + 1} and its items`,
            title: 'Remove this track and everything on it',
            onclick: () => ctx.change((sc) => sc.tracks.splice(ti, 1), true),
          },
          '×',
        ),
      ),
      bars,
    );
  });
  return h(
    'div',
    { class: 'scn-timeline', role: 'group', 'aria-label': 'Timeline' },
    h(
      'div',
      { class: 'scn-lane scn-ruler-row' },
      h('div', { class: 'scn-lane-head' }, h('span', null, 'Frame')),
      h('div', { class: 'scn-bars' }, ruler, head()),
    ),
    h('div', { class: 'scn-lane' }, h('div', { class: 'scn-lane-head' }, h('span', null, 'Background')), bgLane),
    lanes,
    s.tracks.length ? null : h('p', { class: 'hint scn-empty' }, 'Add text, a character, a monster or a block, or Generate… a scene from the game.'),
  );
}

/** Moves the timeline's frame lines to frame `f` without redrawing it. */
export function moveHead(el: HTMLElement, f: number, frames: number): void {
  for (const x of el.querySelectorAll<HTMLElement>('.scn-head')) x.style.left = pct(f + 0.5, frames);
}
