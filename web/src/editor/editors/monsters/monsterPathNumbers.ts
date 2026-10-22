// The monster path editor's "Exact numbers": a table of the path's corners (across, down,
// speed and picture) to type instead of dragging. monsterPathEditor.ts redraws it after
// each change; a typed number calls changed() then draw(), a picture changed().
import { h, clear } from '../../core/ui';
import type { March } from '../../../formats/monster';
import { corners, moveCorner, pathBox, type PathKind } from './monsterPath';
import { MAX_SPEED, ORIENTS } from './monsterPathView';

export function renderPathNumbers(numbers: HTMLDetailsElement, p: March[], k: PathKind, changed: () => void, draw: () => void): void {
  const list = corners(p, k);
  const num = (get: () => number, set: (v: number) => void, min: number, max: number) => {
    const i = h('input', { type: 'number', value: String(get()), min, max });
    i.addEventListener('change', () => {
      const v = Math.max(min, Math.min(max, Math.round(Number(i.value) || 0)));
      i.value = String(v);
      set(v);
      changed();
      draw();
    });
    return i;
  };
  const b = pathBox(k);
  const open = numbers.open;
  clear(
    numbers,
    h('summary', null, 'Exact numbers'),
    list.length
      ? h(
          'table',
          { class: 'data' },
          h(
            'thead',
            null,
            h('tr', null, h('th', null, '#'), h('th', null, 'Across'), h('th', null, 'Down'), h('th', null, 'Speed'), h('th', null, 'Picture')),
          ),
          h(
            'tbody',
            null,
            ...list.map((c, n) => {
              const sel = h('select', null, ...ORIENTS.map(([v, l]) => h('option', { value: String(v), selected: v === c.orient }, l)));
              sel.addEventListener('change', () => {
                p[c.i].orient = Number(sel.value);
                changed();
              });
              return h(
                'tr',
                null,
                h('td', null, n + 1),
                h(
                  'td',
                  null,
                  num(
                    () => c.x,
                    (v) => moveCorner(p, k, c.i, v, corners(p, k).find((x) => x.i === c.i)!.y),
                    b.x0,
                    b.x0 + b.w - 1,
                  ),
                ),
                h(
                  'td',
                  null,
                  num(
                    () => c.y,
                    (v) => moveCorner(p, k, c.i, corners(p, k).find((x) => x.i === c.i)!.x, v),
                    b.y0,
                    b.y0 + b.h - 1,
                  ),
                ),
                h(
                  'td',
                  null,
                  num(
                    () => c.speed,
                    (v) => (p[c.i].pic = v),
                    1,
                    MAX_SPEED,
                  ),
                ),
                h('td', null, sel),
              );
            }),
          ),
        )
      : h('p', { class: 'hint' }, 'No corners yet.'),
  );
  numbers.open = open;
}
