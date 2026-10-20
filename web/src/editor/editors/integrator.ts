// Integrator (GRATOR.EXE): the game's scenes, the files each uses, and the links between them.
import { registerEditor } from './index';
import { h, clear, selectField, textField, numberField, modal, confirmDialog } from '../ui';
import { blockImages } from '../draw';
import type { FileKind, Project } from '../project';
import { fileField } from '../filePicker';
import {
  ADVTYPE,
  ENDTYPE,
  GRAPHIC_EXTS,
  MAXSCENELINKS,
  NOSCENE,
  SCENEDESCLEN,
  STARTTYPE,
  emptyScene,
  fileSlotsFor,
  sceneKind,
  slotExtensions,
  type Game,
  type Point,
} from '../../formats/game';
import { BACKBL, newBlockSet, parseBlocks } from '../../formats/blocks';
import { MLEN, MWID, parseMap } from '../../formats/map';
import { defaultPalette, parsePalette } from '../../formats/palette';

const WORLD = { x: 5, y: 29, w: 310, h: 165 };
const SCALE = 2.5;

function sceneBox(desc: string, pos: Point): { x: number; y: number; w: number; h: number } {
  return { x: pos.x, y: pos.y, w: Math.max(24, (desc.length || 4) * 6 + 8), h: 12 };
}

/** Lets the user click a map cell of a scene. */
async function pickOnMap(project: Project, game: Game, scene: number, current: Point, title: string): Promise<Point | undefined> {
  const s = game.scenes[scene];
  const mapBytes = s?.files[1] && project.files.get(s.files[1]);
  if (!mapBytes) return modal<Point>(title, (close) => [h('p', null, 'That scene has no map yet.'), h('div', { class: 'buttons' }, h('button', { onclick: () => close(undefined) }, 'OK'))]);
  const map = parseMap(mapBytes);
  const bbl = s.files[2] && project.files.get(s.files[2]);
  const blocks = bbl ? parseBlocks(bbl, BACKBL) : newBlockSet('bbl');
  const pal = s.files[0] && project.files.get(s.files[0]) ? parsePalette(project.files.get(s.files[0])!) : defaultPalette();
  const imgs = blockImages(blocks, pal);
  const cell = 8;
  const canvas = h('canvas', { width: MLEN * cell, height: MWID * cell, class: 'pixel', style: 'max-width:100%;cursor:crosshair' });
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < MWID; y++) for (let x = 0; x < MLEN; x++) ctx.drawImage(imgs[map.blocks[y * MLEN + x]] ?? imgs[0], x * cell, y * cell, cell, cell);
  ctx.strokeStyle = '#ffd400';
  ctx.lineWidth = 2;
  ctx.strokeRect(current.x * cell, current.y * cell, cell, cell);
  const label = h('div', { class: 'meta' }, `Current: (${current.x}, ${current.y})`);
  return modal<Point>(title, (close) => {
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      label.textContent = `(${Math.floor(((e.clientX - r.left) / r.width) * MLEN)}, ${Math.floor(((e.clientY - r.top) / r.height) * MWID)})`;
    });
    canvas.addEventListener('click', (e) => {
      const r = canvas.getBoundingClientRect();
      close({ x: Math.floor(((e.clientX - r.left) / r.width) * MLEN), y: Math.floor(((e.clientY - r.top) / r.height) * MWID) });
    });
    return [h('div', { style: 'max-height:70vh;overflow:auto' }, canvas), label, h('div', { class: 'buttons' }, h('button', { onclick: () => close(undefined) }, 'Cancel'))];
  });
}

registerEditor(['gam'], (host, project) => {
  const game = project.game();
  let selected = 0;
  const save = () => project.saveGame(game);

  const world = h('canvas', { width: 320 * SCALE, height: 200 * SCALE, style: 'width:100%;max-width:800px;border-radius:8px;cursor:pointer;touch-action:none' });
  const ctx = world.getContext('2d')!;
  const panel = h('div', { class: 'stack', style: 'flex:1 1 420px;min-width:0' });

  function drawWorld(): void {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    ctx.fillStyle = '#000060';
    ctx.fillRect(0, 0, 320, 200);
    ctx.fillStyle = '#0a0a8a';
    ctx.fillRect(WORLD.x, WORLD.y, WORLD.w, WORLD.h);
    ctx.font = '7px ui-monospace, monospace';
    ctx.fillStyle = '#ffd400';
    ctx.fillText(`${game.scenes[0]?.desc || 'Untitled'} — ${game.scenes.filter((s) => s.gametype !== NOSCENE).length} scenes`, 6, 18);
    // links
    game.scenes.forEach((s, i) => {
      if (s.gametype === NOSCENE) return;
      const a = sceneBox(s.desc, s.pos);
      for (const l of s.links) {
        const t = game.scenes[l.toScene];
        if (l.toScene === NOSCENE || !t || t.gametype === NOSCENE) continue;
        const b = sceneBox(t.desc, t.pos);
        ctx.strokeStyle = i === selected ? '#ffd400' : '#7f9cff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(a.x + a.w / 2, a.y + a.h / 2);
        ctx.lineTo(b.x + b.w / 2, b.y + b.h / 2);
        ctx.stroke();
        // arrow head
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        const mx = (a.x + a.w / 2 + b.x + b.w / 2) / 2;
        const my = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx - 4 * Math.cos(ang - 0.5), my - 4 * Math.sin(ang - 0.5));
        ctx.lineTo(mx - 4 * Math.cos(ang + 0.5), my - 4 * Math.sin(ang + 0.5));
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      }
    });
    // scenes
    game.scenes.forEach((s, i) => {
      if (s.gametype === NOSCENE) return;
      const b = sceneBox(s.desc, s.pos);
      ctx.fillStyle = s.gametype === ADVTYPE ? '#c0c0c0' : '#40c040';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = i === selected ? '#ffd400' : '#000';
      ctx.lineWidth = i === selected ? 1.5 : 0.5;
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#000';
      ctx.fillText(s.desc || `#${i}`, b.x + 4, b.y + 9);
    });
  }

  function sceneAt(x: number, y: number): number {
    for (let i = game.scenes.length - 1; i >= 0; i--) {
      const s = game.scenes[i];
      if (s.gametype === NOSCENE) continue;
      const b = sceneBox(s.desc, s.pos);
      if (x >= b.x && y >= b.y && x <= b.x + b.w && y <= b.y + b.h) return i;
    }
    return -1;
  }

  let drag: { i: number; dx: number; dy: number } | undefined;
  const toWorld = (e: PointerEvent) => {
    const r = world.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 320, y: ((e.clientY - r.top) / r.height) * 200 };
  };
  world.addEventListener('pointerdown', (e) => {
    const p = toWorld(e);
    const i = sceneAt(p.x, p.y);
    if (i < 0) return;
    selected = i;
    drag = { i, dx: p.x - game.scenes[i].pos.x, dy: p.y - game.scenes[i].pos.y };
    world.setPointerCapture(e.pointerId);
    drawWorld();
    renderPanel();
  });
  world.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toWorld(e);
    const s = game.scenes[drag.i];
    const b = sceneBox(s.desc, s.pos);
    s.pos = {
      x: Math.round(Math.max(WORLD.x + 1, Math.min(WORLD.x + WORLD.w - b.w - 1, p.x - drag.dx))),
      y: Math.round(Math.max(WORLD.y + 1, Math.min(WORLD.y + WORLD.h - b.h - 1, p.y - drag.dy))),
    };
    drawWorld();
  });
  world.addEventListener('pointerup', () => {
    if (drag) save();
    drag = undefined;
  });

  function addScene(): void {
    const s = emptyScene(ADVTYPE);
    s.desc = `Level ${game.scenes.filter((x) => x.gametype === ADVTYPE).length + 1}`;
    s.pos = { x: 40 + ((game.scenes.length * 37) % 220), y: 70 + ((game.scenes.length * 23) % 90) };
    const free = game.scenes.findIndex((x, i) => i > 1 && x.gametype === NOSCENE);
    if (free >= 0) game.scenes[free] = s;
    else game.scenes.push(s);
    selected = free >= 0 ? free : game.scenes.length - 1;
    save();
    drawWorld();
    renderPanel();
  }

  function sceneOptions(): [number, string][] {
    return [[NOSCENE, '— no link —'], ...game.scenes.map((s, i) => [i, `${i}: ${s.desc || '(untitled)'}`] as [number, string]).filter(([i]) => game.scenes[i].gametype !== NOSCENE)];
  }



  function renderPanel(): void {
    const s = game.scenes[selected];
    if (!s) {
      clear(panel);
      return;
    }
    const kind = sceneKind(s);
    const slots = fileSlotsFor(s);
    const exts = slotExtensions(s);
    const scrollOpt: [number, string][] = [
      [0xff, 'Scroll when the character nears the edge'],
      [0, 'Never scroll'],
    ];
    const pointField = (p: Point, label: string, sceneForMap: number) =>
      h(
        'span',
        { class: 'row', style: 'gap:4px;align-items:center;flex-wrap:nowrap' },
        numberField(`${label} x`, () => p.x, (v) => ((p.x = v), save()), { min: 0, max: MLEN - 1 }),
        numberField('y', () => p.y, (v) => ((p.y = v), save()), { min: 0, max: MWID - 1 }),
        h(
          'button',
          {
            title: 'Pick on the map',
            onclick: async () => {
              const pick = await pickOnMap(project, game, sceneForMap, p, `${label}: click a map block`);
              if (pick) {
                p.x = pick.x;
                p.y = pick.y;
                save();
                renderPanel();
              }
            },
          },
          '⌖',
        ),
      );

    clear(
      panel,
      h(
        'div',
        { class: 'panel stack' },
        h('h3', { style: 'margin:0' }, kind === 'start' ? 'Start scene (title & menu)' : kind === 'end' ? 'End scene (game won / lost)' : `Level scene #${selected}`),
        textField('Description (the start scene’s is the game title)', () => s.desc, (v) => ((s.desc = v.slice(0, SCENEDESCLEN - 1)), (s.descRaw = undefined), save(), drawWorld()), { maxLength: SCENEDESCLEN - 1 }),
        kind === 'adventure' || kind === 'unused'
          ? h(
              'div',
              { class: 'toolbar' },
              h(
                'button',
                {
                  class: 'danger',
                  onclick: async () => {
                    if (!(await confirmDialog('Delete scene', `Delete “${s.desc}” and every link to it?`, 'Delete'))) return;
                    for (const other of game.scenes) for (const l of other.links) if (l.toScene === selected) l.toScene = NOSCENE;
                    game.scenes[selected] = emptyScene();
                    selected = 0;
                    save();
                    drawWorld();
                    renderPanel();
                  },
                },
                'Delete scene',
              ),
            )
          : null,
      ),
      h(
        'div',
        { class: 'panel' },
        h('h3', { style: 'margin-top:0' }, 'Files'),
        h('div', { class: 'grid-fields', style: 'grid-template-columns:repeat(auto-fill,minmax(190px,1fr))' }, ...slots.map((label, i) =>
          fileField(project, label, (exts[i] === 'graphic' ? GRAPHIC_EXTS : [exts[i]]) as FileKind[], () => s.files[i] ?? '', (v) => ((s.files[i] = v), save())),
        )),
      ),
      kind === 'adventure'
        ? h(
            'div',
            { class: 'panel' },
            h('h3', { style: 'margin-top:0' }, 'Scrolling'),
            h(
              'div',
              { class: 'grid-fields', style: 'grid-template-columns:repeat(auto-fill,minmax(230px,1fr))' },
              ...(['up', 'down', 'left', 'right'] as const).map((d) => selectField(d[0].toUpperCase() + d.slice(1), scrollOpt, () => (s.scroll[d] === 0 ? 0 : 0xff), (v) => ((s.scroll[d] = v), save()))),
            ),
          )
        : null,
      kind === 'end'
        ? null
        : h(
            'div',
            { class: 'panel' },
            h('h3', { style: 'margin-top:0' }, kind === 'start' ? 'Where the game starts' : 'Links to other scenes'),
            h(
              'p',
              { class: 'hint' },
              kind === 'start'
                ? 'Link 1 picks the first level and the block where the character starts in it.'
                : 'When the character touches the “from” block, play continues in the linked scene at its “to” block. Link to “Game Won” to end the game.',
            ),
            h(
              'table',
              { class: 'data' },
              h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Go to scene'), kind === 'start' ? null : h('th', null, 'From block (this map)'), h('th', null, 'To block (its map)'))),
              h(
                'tbody',
                null,
                ...s.links.slice(0, kind === 'start' ? 1 : MAXSCENELINKS).map((l, i) =>
                  h(
                    'tr',
                    null,
                    h('td', null, i + 1),
                    h('td', null, selectField('', sceneOptions(), () => l.toScene, (v) => ((l.toScene = v), save(), drawWorld(), renderPanel()))),
                    kind === 'start' ? null : h('td', null, l.toScene === NOSCENE ? '' : pointField(l.from, 'From', selected)),
                    h('td', null, l.toScene === NOSCENE ? '' : pointField(l.to, 'To', l.toScene)),
                  ),
                ),
              ),
            ),
          ),
    );
  }

  clear(
    host,
    h('p', { class: 'hint' }, 'Each box is a scene: drag to arrange, click to edit. Green boxes are the start (title/menu) and end scenes; grey boxes are levels. Lines show links.'),
    h('div', { class: 'row' }, h('div', { class: 'stack', style: 'flex:1 1 480px;min-width:0' }, world, h('div', { class: 'toolbar' }, h('button', { class: 'primary', onclick: addScene }, '+ Add level scene'))), panel),
  );
  if (!game.scenes.some((s) => s.gametype === STARTTYPE) || !game.scenes.some((s) => s.gametype === ENDTYPE)) clear(host.querySelector('.hint')!, 'This game is missing its start or end scene.');
  drawWorld();
  renderPanel();
});

