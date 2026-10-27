// The monster path editor's top: the Path and Attack path tabs, and the toolbar with the map, the
// start (picked from the monster's placed copies or anywhere on the whole map), play and restart.
import { h, clear, modal } from '../../core/ui';
import { MLEN, MWID } from '../../../formats/map';
import { corners, firstCorner, pathKind, pathLength } from './monsterPath';
import { kind, mon, path, placed, type PathEd } from './monsterPathState';
import { hidePop } from './monsterPathCorner';

export function renderTabs(ed: PathEd): void {
  const m = mon(ed);
  const t = (p: 0 | 1, label: string) =>
    h(
      'button',
      {
        role: 'tab',
        class: ed.tab === p ? 'selected' : '',
        'aria-selected': String(ed.tab === p),
        onclick: () => {
          ed.tab = p;
          ed.selected = corners(path(ed), kind(ed))[0]?.i ?? -1;
          hidePop(ed);
          ed.fitView();
          ed.renderAll();
        },
      },
      label,
      h('small', null, `${Math.max(0, pathLength(m.march[p]) - firstCorner(pathKind(m, p)))} corners`),
    );
  clear(ed.tabsEl, t(0, 'Path'), t(1, 'Attack path'));
}

export function renderToolbar(ed: PathEd): void {
  const { start } = ed;
  const sel = h('select', { 'aria-label': 'Map' }, ...ed.choices.map((c, i) => h('option', { value: String(i), selected: i === ed.mapIdx }, c.label)));
  sel.addEventListener('change', () => {
    ed.mapIdx = Number(sel.value);
    ed.loadMap();
    ed.defaultStart();
    ed.mapLayer = undefined;
    ed.renderAll();
  });
  const spots = placed(ed);
  const startSel = h(
    'select',
    { 'aria-label': kind(ed) === 'chase' ? 'Character at' : 'Starts at' },
    ...spots.map((p, i) => h('option', { value: String(i), selected: p.x === start.x && p.y === start.y }, `Placed #${i + 1} (${p.x}, ${p.y})`)),
    !spots.some((p) => p.x === start.x && p.y === start.y) && h('option', { value: '-1', selected: true }, `(${start.x}, ${start.y})`),
  );
  startSel.addEventListener('change', () => {
    const p = spots[Number(startSel.value)];
    if (p) setStart(ed, p);
  });
  clear(
    ed.toolbar,
    h('label', { class: 'field' }, h('span', null, 'Map'), sel),
    h(
      'label',
      { class: 'field' },
      h('span', null, kind(ed) === 'chase' ? 'Character at' : 'Starts at'),
      h(
        'div',
        { class: 'mpath-row' },
        startSel,
        ed.map && h('button', { onclick: () => void pickStart(ed), title: 'Pick the start block on the whole map' }, 'Pick…'),
      ),
    ),
    h(
      'button',
      { class: ed.playing ? 'primary mpath-play' : 'mpath-play', onclick: () => togglePlay(ed), title: 'Play or pause the preview (Space)' },
      ed.playing ? '❚❚ Pause' : '▶ Play',
    ),
    h('button', { onclick: () => ed.restartWalker(), title: 'Start the walk over', 'aria-label': 'Restart' }, '↺'),
  );
}

export function togglePlay(ed: PathEd): void {
  ed.playing = !ed.playing;
  renderToolbar(ed);
}

function setStart(ed: PathEd, p: { x: number; y: number }): void {
  ed.start = { x: p.x, y: p.y };
  ed.mapLayer = undefined;
  ed.restartWalker();
  renderToolbar(ed);
}

/** The whole map, small, to click where the monster starts (its placed copies in yellow). */
async function pickStart(ed: PathEd): Promise<void> {
  const { map, mapImgs, start } = ed;
  if (!map) return;
  const c = h('canvas', { class: 'pixel mpath-mini', width: MLEN * 4, height: MWID * 4 });
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < MWID; y++)
    for (let x = 0; x < MLEN; x++) if (mapImgs[map.blocks[y * MLEN + x]]) g.drawImage(mapImgs[map.blocks[y * MLEN + x]], x * 4, y * 4, 4, 4);
  g.lineWidth = 1;
  for (const p of placed(ed)) {
    g.strokeStyle = '#ffd400';
    g.strokeRect(p.x * 4 - 1.5, p.y * 4 - 1.5, 7, 7);
  }
  g.strokeStyle = '#40ff60';
  g.strokeRect(start.x * 4 - 2.5, start.y * 4 - 2.5, 9, 9);
  const p = await modal<{ x: number; y: number }>('Pick where the monster starts', (close) => {
    c.addEventListener('click', (e) => {
      const r = c.getBoundingClientRect();
      close({ x: Math.floor(((e.clientX - r.left) / r.width) * MLEN), y: Math.floor(((e.clientY - r.top) / r.height) * MWID) });
    });
    return [h('p', { class: 'hint' }, 'Click any block. Yellow squares are where this monster is placed on the map.'), c];
  });
  if (p) setStart(ed, p);
}
