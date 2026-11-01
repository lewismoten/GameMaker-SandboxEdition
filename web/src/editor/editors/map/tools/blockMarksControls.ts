// The map editor's "What blocks do" button and its panel of toggles (barriers, push and pull,
// touch, pickup, timed), each with a picture of its mark as the legend. Choices are remembered
// in this browser like the grid's.
import { h } from '../../../core/ui';
import { MARK_KINDS, markSample, type MarkKind } from './blockMarksDraw';

const LABELS: Record<MarkKind, [string, string]> = {
  barriers: [
    'Barriers',
    'Sides that stop the hero. White: a wall both ways. Amber with teeth: one-way, solid on the toothed side, so the hero can pass the other way. Blocks solid all round share one outline.',
  ],
  push: ['Push and pull', 'Gravity blocks: arrows move the way the block pulls the hero while the hero is over it.'],
  touch: ['Touch', 'Blocks that do something when touched: points, hit points, lives, money or counters, or turning into another block.'],
  pickup: ['Pickup', 'Blocks the hero can pick up.'],
  timed: ['Timed', 'Blocks that turn into another block after a while (every copy on the map at once).'],
};

const KEYS: Record<MarkKind | 'open', string> = {
  open: 'gm-map-marks-open',
  barriers: 'gm-map-mark-barriers',
  push: 'gm-map-mark-push',
  touch: 'gm-map-mark-touch',
  pickup: 'gm-map-mark-pickup',
  timed: 'gm-map-mark-timed',
};
const key = (k: MarkKind | 'open') => KEYS[k];

function read(k: MarkKind | 'open'): boolean {
  try {
    return localStorage.getItem(key(k)) === '1';
  } catch {
    return false;
  }
}

function write(k: MarkKind | 'open', on: boolean): void {
  try {
    localStorage.setItem(key(k), on ? '1' : '0');
  } catch {
    /* storage unavailable: the choice lasts this visit */
  }
}

export function blockMarksControls(layer: { set(kind: MarkKind, on: boolean): void }) {
  const panel = h('fieldset', { class: 'mt-marks', id: 'mt-marks-panel' }, h('legend', null, 'What blocks do'));
  panel.hidden = !read('open');
  for (const k of MARK_KINDS) {
    const on = read(k);
    layer.set(k, on);
    const [label, what] = LABELS[k];
    const box = h('input', {
      type: 'checkbox',
      checked: on,
      onchange: () => {
        write(k, box.checked);
        layer.set(k, box.checked);
      },
    });
    panel.append(h('label', { class: 'mt-mark', title: what }, box, markSample(k), h('span', null, label)));
  }
  panel.append(h('p', { class: 'meta mt-marks-note' }, 'As each block starts the level; timed and touched blocks change as it plays.'));
  const button = h(
    'button',
    {
      type: 'button',
      class: 'mt-tool',
      'aria-label': 'What blocks do',
      'aria-controls': 'mt-marks-panel',
      'aria-expanded': String(!panel.hidden),
      title: 'Show barriers, push and pull, touch, pickup and timed blocks on the map',
      onclick: () => {
        panel.hidden = !panel.hidden;
        button.setAttribute('aria-expanded', String(!panel.hidden));
        write('open', !panel.hidden);
      },
    },
    '◈',
    h('span', { class: 'mt-label' }, 'Blocks do'),
  );
  return { button, panel };
}
