// Map editor (MAPMAKER.EXE): paint background blocks onto the 100x100 map and place monsters.
import { registerEditor } from './index';
import { h, clear, selectField, toast, debounce } from '../ui';
import { blockCanvas, blockImages } from '../draw';
import { paletteChooser } from './blocks';
import type { FileKind, Project } from '../project';
import { fileField, pickFile } from '../filePicker';
import { BACKBL, BLEN, MONBL, newBlockSet, parseBlocks } from '../../formats/blocks';
import { LASTMM, MLEN, MWID, parseMap, reindexMonsters, serializeMap } from '../../formats/map';
import { LASTMON, parseMonsters, type Monster } from '../../formats/monster';
import { normalize } from '../../project/files';

type Mode = 'paint' | 'rect' | 'fill' | 'pick' | 'monster';

/** The block set, monsters and monster blocks of the scene that uses this map. */
function sceneSet(project: Project, file: string): { bbl?: string; mon?: string; mbl?: string; scenes: number[] } {
  const game = project.game();
  const scenes = project.usesOf(file).filter((u) => u.slot === 1).map((u) => u.scene);
  const s = game.scenes[scenes[0]];
  return {
    bbl: s?.files[2] || project.files.byExtension('bbl')[0],
    mon: s?.files[3] || project.files.byExtension('mon')[0],
    mbl: s?.files[4] || project.files.byExtension('mbl')[0],
    scenes,
  };
}

registerEditor(['map'], (host, project, file) => {
  const map = parseMap(project.files.get(file)!);
  const set = sceneSet(project, file);
  let bblName = set.bbl ?? '';
  let mblName = set.mbl ?? '';
  let monName = set.mon ?? '';
  const loadBlocks = (n: string, kind: 'bbl' | 'mbl') => (n && project.files.has(n) ? parseBlocks(project.files.get(n)!, kind === 'bbl' ? BACKBL : MONBL) : newBlockSet(kind));
  let bg = loadBlocks(bblName, 'bbl');
  let mblk = loadBlocks(mblName, 'mbl');
  let mons: Monster[] = monName && project.files.has(monName) ? parseMonsters(project.files.get(monName)!) : [];
  let mode: Mode = 'paint';
  let brush = 0;
  let monBrush = 0;
  let zoom = 1;
  let bgImgs: HTMLCanvasElement[] = [];
  let monImgs: HTMLCanvasElement[] = [];
  const save = debounce(() => project.files.set(file, serializeMap(map)), 300);

  const chooser = paletteChooser(project, set.bbl ?? file, () => rebuild());

  const canvas = h('canvas', { class: 'pixel', style: 'cursor:crosshair;display:block' });
  const scroller = h('div', { style: 'overflow:auto;max-height:70vh;max-width:100%;border:1px solid var(--border);border-radius:6px;background:#000' }, canvas);
  const ctx = canvas.getContext('2d')!;
  const status = h('div', { class: 'meta' });
  const picker = h('div', { class: 'block-picker', style: 'max-height:260px' });
  const monPicker = h('div', { class: 'block-picker', style: 'max-height:200px' });
  const monCount = h('div', { class: 'meta' });

  // Links touching this map: where the character starts (to) and where scenes change (from).
  function linkMarks(): { x: number; y: number; kind: 'from' | 'to'; label: string }[] {
    const game = project.game();
    const marks: { x: number; y: number; kind: 'from' | 'to'; label: string }[] = [];
    const sceneIdx = new Set(set.scenes);
    game.scenes.forEach((s, i) =>
      s.links.forEach((l) => {
        if (l.toScene === 0xffff) return;
        if (sceneIdx.has(i)) marks.push({ ...l.from, kind: 'from', label: `to ${game.scenes[l.toScene]?.desc ?? l.toScene}` });
        if (sceneIdx.has(l.toScene)) marks.push({ ...l.to, kind: 'to', label: `start from ${s.desc}` });
      }),
    );
    return marks;
  }

  function rebuild(): void {
    bgImgs = blockImages(bg, chooser.palette);
    monImgs = blockImages(mblk, chooser.palette, true);
    clear(
      picker,
      ...bg.map((b, i) =>
        h('button', { class: i === brush ? 'selected' : '', title: `Block ${i}`, onclick: () => ((brush = i), setMode(mode === 'monster' ? 'paint' : mode), rebuildPickers()) }, blockCanvas(b.pixels, chooser.palette), h('small', null, i)),
      ),
    );
    rebuildMonsters();
    draw();
  }

  function rebuildPickers(): void {
    [...picker.children].forEach((b, i) => b.classList.toggle('selected', i === brush));
  }

  function firstPic(m: Monster | undefined): number {
    const p = m?.pic[0]?.[0] ?? MONBL;
    return p >= 0 && p < MONBL ? p : -1;
  }

  function rebuildMonsters(): void {
    clear(
      monPicker,
      ...mons.map((m, i) => {
        const pic = firstPic(m);
        return h(
          'button',
          { class: mode === 'monster' && i === monBrush ? 'selected' : '', title: `Monster ${i}`, onclick: () => ((monBrush = i), setMode('monster'), rebuildMonsters()) },
          pic >= 0 ? blockCanvas(mblk[pic].pixels, chooser.palette, { transparent: true, className: 'checker' }) : h('span', null, '—'),
          h('small', null, i),
        );
      }),
    );
  }

  function draw(): void {
    const s = BLEN * zoom;
    canvas.width = MLEN * s;
    canvas.height = MWID * s;
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) ctx.drawImage(bgImgs[map.blocks[y * MLEN + x]] ?? bgImgs[0], x * s, y * s, s, s);
    map.monsters.forEach((m) => {
      if (m.monnum >= LASTMON) return;
      const pic = firstPic(mons[m.monnum]);
      if (pic >= 0) ctx.drawImage(monImgs[pic], m.curx * s, m.cury * s, s, s);
      else {
        ctx.strokeStyle = '#f0f';
        ctx.strokeRect(m.curx * s + 2, m.cury * s + 2, s - 4, s - 4);
      }
    });
    monCount.textContent = `${map.monsters.filter((m) => m.monnum < LASTMON).length} of ${LASTMM} monster slots used`;
    for (const mk of linkMarks()) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = mk.kind === 'from' ? '#ffd400' : '#00e0ff';
      ctx.strokeRect(mk.x * s + 1, mk.y * s + 1, s - 2, s - 2);
    }
  }

  const cell = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: Math.floor(((e.clientX - r.left) / r.width) * MLEN), y: Math.floor(((e.clientY - r.top) / r.height) * MWID) };
  };
  let start: { x: number; y: number } | undefined;

  function paintCell(x: number, y: number, v = brush): void {
    if (x < 0 || y < 0 || x >= MLEN || y >= MWID) return;
    map.blocks[y * MLEN + x] = v;
    const s = BLEN * zoom;
    ctx.drawImage(bgImgs[v], x * s, y * s, s, s);
  }

  function placeMonster(x: number, y: number, remove: boolean): void {
    const at = map.monsters.findIndex((m) => m.monnum < LASTMON && m.curx === x && m.cury === y);
    if (at >= 0) map.monsters[at].monnum = LASTMON;
    if (!remove) {
      const slot = map.monsters.findIndex((m) => m.monnum >= LASTMON);
      if (slot < 0) {
        toast(`A map holds at most ${LASTMM} monsters.`, 'error');
        return;
      }
      Object.assign(map.monsters[slot], { monnum: monBrush, curx: x, cury: y });
    }
    reindexMonsters(map);
    draw();
    save();
  }

  function floodFill(x: number, y: number): void {
    const target = map.blocks[y * MLEN + x];
    if (target === brush) return;
    const stack = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      if (cx < 0 || cy < 0 || cx >= MLEN || cy >= MWID || map.blocks[cy * MLEN + cx] !== target) continue;
      map.blocks[cy * MLEN + cx] = brush;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    draw();
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = cell(e);
    if (mode === 'monster') {
      placeMonster(p.x, p.y, e.button === 2);
      return;
    }
    if (mode === 'pick') {
      brush = map.blocks[p.y * MLEN + p.x];
      rebuildPickers();
      setMode('paint');
      return;
    }
    if (mode === 'fill') {
      floodFill(p.x, p.y);
      save();
      return;
    }
    canvas.setPointerCapture(e.pointerId);
    start = p;
    if (mode === 'paint') paintCell(p.x, p.y);
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = cell(e);
    const b = map.blocks[p.y * MLEN + p.x];
    const mon = map.monsters.find((m) => m.monnum < LASTMON && m.curx === p.x && m.cury === p.y);
    const marks = linkMarks().filter((m) => m.x === p.x && m.y === p.y);
    status.textContent = `(${p.x}, ${p.y}) block ${b}${mon ? ` · monster ${mon.monnum}` : ''}${marks.map((m) => ` · link ${m.label}`).join('')}`;
    if (!canvas.hasPointerCapture(e.pointerId) || !start) return;
    if (mode === 'paint') paintCell(p.x, p.y);
    if (mode === 'rect') {
      draw();
      const s = BLEN * zoom;
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(Math.min(start.x, p.x) * s, Math.min(start.y, p.y) * s, (Math.abs(p.x - start.x) + 1) * s, (Math.abs(p.y - start.y) + 1) * s);
    }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (mode === 'rect' && start) {
      const p = cell(e);
      for (let y = Math.min(start.y, p.y); y <= Math.max(start.y, p.y); y++) for (let x = Math.min(start.x, p.x); x <= Math.max(start.x, p.x); x++) map.blocks[y * MLEN + x] = brush;
      draw();
    }
    start = undefined;
    save();
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const modeBar = h('div', { class: 'toolbar' });
  function setMode(m: Mode): void {
    mode = m;
    clear(
      modeBar,
      ...(
        [
          ['paint', 'Paint'],
          ['rect', 'Rectangle'],
          ['fill', 'Fill'],
          ['pick', 'Pick block'],
          ['monster', 'Place monsters'],
        ] as [Mode, string][]
      ).map(([k, label]) => h('button', { class: k === mode ? 'primary' : '', onclick: () => (setMode(k), rebuildMonsters()) }, label)),
    );
  }
  setMode('paint');

  const fileSelect = (label: string, ext: FileKind, get: () => string, setv: (v: string) => void) =>
    fileField(project, label, [ext], get, (v) => {
      if (!v) return;
      setv(normalize(v));
      rebuild();
    }, { allowNone: false, title: `Which ${label.toLowerCase()} to paint this map with` });

  clear(
    host,
    h('p', { class: 'hint' }, 'Drag to paint blocks. In “Place monsters” mode, click to place the chosen monster and right-click to remove one. Yellow squares are links to other scenes; blue squares are where the character starts.'),
    // Nothing to paint with yet: say so, and offer the quickest ways to get blocks.
    !bblName || !project.files.has(bblName)
      ? h(
          'div',
          { class: 'callout' },
          h('strong', null, 'This map has no background blocks to paint with yet. '),
          'Take a set from the CD library, or draw your own.',
          h(
            'div',
            { class: 'toolbar' },
            h(
              'button',
              {
                class: 'primary',
                onclick: async () => {
                  const v = await pickFile(project, 'bbl', { adding: true, title: 'Background blocks for this map' });
                  if (!v) return;
                  // reopen the map with the new blocks (saved first: saving is otherwise delayed)
                  await project.saveNow();
                  location.reload();
                },
              },
              '📀 Take blocks from the library',
            ),
            h(
              'button',
              {
                onclick: async () => {
                  const v = await pickFile(project, 'bbl', { title: 'Background blocks for this map' });
                  if (v) location.hash = `#/p/${project.id}/${encodeURIComponent(v)}`;
                },
              },
              '✎ Draw my own',
            ),
          ),
        )
      : null,
    h(
      'div',
      { class: 'toolbar', style: 'margin-bottom:8px' },
      fileSelect('Background blocks', 'bbl', () => bblName, (v) => ((bblName = v), (bg = loadBlocks(v, 'bbl')))),
      fileSelect('Monsters', 'mon', () => monName, (v) => ((monName = v), (mons = parseMonsters(project.files.get(v)!)))),
      fileSelect('Monster blocks', 'mbl', () => mblName, (v) => ((mblName = v), (mblk = loadBlocks(v, 'mbl')))),
      chooser.el,
      selectField('Zoom', [[0.5, '50%'], [1, '100%'], [2, '200%']] as [number, string][], () => zoom, (v) => ((zoom = v), draw())),
    ),
    h(
      'div',
      { class: 'row' },
      h('div', { class: 'stack', style: 'flex:1 1 480px;min-width:0' }, modeBar, scroller, status),
      h(
        'div',
        { class: 'stack', style: 'flex:0 1 260px' },
        h('strong', null, 'Blocks'),
        picker,
        h('strong', null, 'Monsters'),
        monPicker,
        monCount,
      ),
    ),
  );
  rebuild();
  // Open where the action is: where the character starts, else the first placed monster.
  requestAnimationFrame(() => {
    const start = linkMarks().find((m) => m.kind === 'to') ?? map.monsters.find((m) => m.monnum < LASTMON) ?? undefined;
    const at = start ? ('curx' in start ? { x: start.curx, y: start.cury } : start) : undefined;
    if (!at) return;
    const s = BLEN * zoom;
    scroller.scrollTo({ left: at.x * s - scroller.clientWidth / 2, top: at.y * s - scroller.clientHeight / 2 });
  });
});
