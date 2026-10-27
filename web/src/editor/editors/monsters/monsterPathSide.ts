// Beside the monster path's map: the notice (when playgame ignores the path, and the attack
// modes on the Attack path tab) and the corners, with the picked one's picture and speed.
import { h, clear } from '../../core/ui';
import { MAXMARCH } from '../../../formats/monster';
import { clearPath, corners, firstCorner } from './monsterPath';
import { kind, mon, path, type PathEd } from './monsterPathState';
import { deleteSelected, hidePop, insertHere, orientPicker, pictureCanvas, speedControl } from './monsterPathCorner';

export function renderNotice(ed: PathEd): void {
  const m = mon(ed);
  const msgs: (string | Node)[] = [];
  if (ed.tab === 0 && m.towards !== 0)
    msgs.push('This monster chases, flees or wanders (see Movement), so playgame ignores this path. It is kept in the file.');
  if (ed.tab === 1) {
    const modes: [number, string, string][] = [
      [0, 'Ignores the character', 'Never attacks; keeps to its path.'],
      [1, 'Attack path', 'Follows the attack path from wherever it is.'],
      [2, 'Attack around the character', 'Heads for spots around the character, following it.'],
    ];
    msgs.push(
      h(
        'div',
        { class: 'mpath-modes', role: 'radiogroup', 'aria-label': 'When the character comes within 8 × 5 blocks' },
        h('span', null, 'When the character comes within 8 × 5 blocks:'),
        ...modes.map(([v, label, title]) =>
          h(
            'button',
            {
              class: m.activate === v ? 'selected' : '',
              role: 'radio',
              'aria-checked': String(m.activate === v),
              title,
              onclick: () => {
                m.activate = v;
                ed.selected = corners(path(ed), kind(ed))[0]?.i ?? -1;
                ed.fitView();
                ed.o.onEdit();
                ed.restartWalker();
                ed.renderAll();
              },
            },
            label,
          ),
        ),
      ),
    );
    if (m.activate === 0) msgs.push('Choose an attack above to draw its path.');
    else if (m.activate === 1) {
      msgs.push('The attack starts wherever the monster is (S) and is drawn from there.');
      if (m.towards !== 0) msgs.push('Only monsters that follow their path use this attack path; this one chases, flees or wanders.');
    } else
      msgs.push(
        'Each corner is a spot around the character (☺); the monster heads for them in turn, even as the character moves. The dashed box is the attack range.',
      );
  }
  clear(ed.notice, ...msgs.map((x) => (typeof x === 'string' ? h('p', null, x) : x)));
}

export function renderSide(ed: PathEd): void {
  const list = corners(path(ed), kind(ed));
  if (!list.some((c) => c.i === ed.selected)) ed.selected = list[0]?.i ?? -1;
  const max = MAXMARCH - firstCorner(kind(ed));
  const disabled = ed.tab === 1 && mon(ed).activate === 0;
  const chips = h(
    'div',
    { class: 'mpath-chips' },
    ...list.map((c, n) =>
      h(
        'button',
        {
          class: c.i === ed.selected ? 'selected' : '',
          title: `Corner ${n + 1}: ${c.x}, ${c.y} at speed ${c.speed}`,
          onclick: () => {
            ed.selected = c.i;
            hidePop(ed);
            renderSide(ed);
            ed.dirty = true;
          },
        },
        pictureCanvas(ed, c.orient, 24),
        h('small', null, n + 1),
      ),
    ),
  );
  const cur = list.find((c) => c.i === ed.selected);
  clear(
    ed.side,
    h('div', { class: 'mpath-count' }, `${list.length} of ${max} corners`),
    disabled
      ? null
      : list.length
        ? chips
        : h(
            'p',
            { class: 'hint' },
            'Click blocks on the map to lay down corners. The monster walks from the start (S) to each in turn, then starts over from where it ended.',
          ),
    cur &&
      h(
        'div',
        { class: 'mpath-inspect' },
        h('h3', null, `Corner ${list.indexOf(cur) + 1}`, h('small', null, ` ${cur.x >= 0 ? '+' : ''}${cur.x}, ${cur.y >= 0 ? '+' : ''}${cur.y}`)),
        h('div', { class: 'meta' }, 'Picture on the way here'),
        orientPicker(ed, cur.i),
        speedControl(ed, cur.i),
        h(
          'div',
          { class: 'mpath-pop-actions' },
          h('button', { onclick: () => insertHere(ed, cur.i), disabled: list.length >= max }, '+ Corner before'),
          h('button', { class: 'danger', onclick: () => deleteSelected(ed) }, 'Delete'),
        ),
      ),
    !disabled &&
      list.length > 0 &&
      h(
        'button',
        {
          class: 'mpath-clear',
          onclick: () => {
            clearPath(path(ed));
            ed.selected = -1;
            ed.changed();
          },
        },
        'Clear path',
      ),
    !disabled &&
      h('p', { class: 'hint mpath-keys' }, 'Drag corners to move them · ←/→ pick a corner · ↑/↓ speed · R turn · S mirror · Delete / Backspace remove'),
  );
}
