// Map picture rendering and PNG download dialog.
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, MWID, type parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { LASTMON, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import type { Level } from '../../../manual/printables/levelMapLayout';
import type { Project } from '../../core/project';
import { download, h, modal, selectField, toast } from '../../core/ui';
import { WHOLE_MAP, contentBounds, dragRect, gameView, type BlockRect, type Handle } from './mapClip';
import { findPlayersView, posterPng, posterScene } from './mapPoster';

/** The map picture's choices for the whole map, the level and a game screen. */
const OPT_LABELS = { monsters: 'Monsters where they start', grid: 'Block grid (yellow lines every 10 blocks)', links: 'Scene links and start points' };

interface Context {
  readonly project: Project;
  readonly file: string;
  readonly map: ReturnType<typeof parseMap>;
  readonly bgImgs: HTMLCanvasElement[];
  readonly monImgs: HTMLCanvasElement[];
  readonly mons: Monster[];
  readonly linkMarks: () => { x: number; y: number; kind: 'from' | 'to'; label: string }[];
  readonly firstPic: (m: Monster | undefined) => number;
}

export function createMapPicture(editor: Context) {
  /** The map (or the part of it in `area`) at one pixel per block pixel, as the scene draws it. */
  function renderWhole(opts: { monsters: boolean; grid: boolean; links: boolean }, scale = 1, area: BlockRect = WHOLE_MAP): HTMLCanvasElement {
    const s = BLEN * scale;
    const c = h('canvas', { width: area.w * s, height: area.h * s });
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = false;
    g.translate(-area.x * s, -area.y * s);
    for (let y = area.y; y < area.y + area.h; y++)
      for (let x = area.x; x < area.x + area.w; x++) g.drawImage(editor.bgImgs[editor.map.blocks[y * MLEN + x]] ?? editor.bgImgs[0], x * s, y * s, s, s);
    if (opts.monsters)
      for (const m of editor.map.monsters) {
        if (m.monnum >= LASTMON) continue;
        const pic = editor.firstPic(editor.mons[m.monnum]);
        if (pic >= 0) g.drawImage(editor.monImgs[pic], m.curx * s, m.cury * s, s, s);
      }
    if (opts.grid) {
      g.fillStyle = 'rgba(255,255,255,0.22)';
      for (let i = 1; i < MLEN && s >= 8; i++) g.fillRect(i * s, 0, 1, MWID * s);
      for (let i = 1; i < MWID && s >= 8; i++) g.fillRect(0, i * s, MLEN * s, 1);
      g.fillStyle = 'rgba(255,212,0,0.55)'; // every 10 blocks, to count by
      for (let i = 10; i < MLEN; i += 10) g.fillRect(i * s, 0, 1, MWID * s);
      for (let i = 10; i < MWID; i += 10) g.fillRect(0, i * s, MLEN * s, 1);
    }
    if (opts.links)
      for (const mk of editor.linkMarks()) {
        g.lineWidth = Math.max(1, 2 * scale);
        g.strokeStyle = mk.kind === 'from' ? '#ffd400' : '#00e0ff';
        g.strokeRect(mk.x * s + 1, mk.y * s + 1, s - 2, s - 2);
      }
    return c;
  }

  async function exportImage(): Promise<void> {
    const opts = { monsters: true, grid: false, links: false };
    const level = contentBounds(
      editor.map.blocks,
      editor.map.monsters.filter((m) => m.monnum < LASTMON).map((m) => ({ x: m.curx, y: m.cury })),
    );
    // where the character can start in this map (the game shows a screen round it)
    const starts = editor
      .linkMarks()
      .filter((m) => m.kind === 'to')
      .filter((m, i, all) => all.findIndex((o) => o.x === m.x && o.y === m.y) === i);
    const startChoices: [number, string][] = starts.length
      ? starts.map((m, i) => [i, `${m.label} (${m.x}, ${m.y})`])
      : [[0, `the middle of the level (${level.x + (level.w >> 1)}, ${level.y + (level.h >> 1)})`]];
    const startAt = (i: number) => starts[i] ?? { x: level.x + (level.w >> 1), y: level.y + (level.h >> 1) };
    type AreaMode = 'whole' | 'level' | 'screen' | 'players';
    // "As players see it": found once, the first time it is chosen (the explorer plays the map)
    let players: ReturnType<typeof findPlayersView> | undefined;
    let playersLevel: Level | undefined;
    let playersNote = '';
    /** The poster's width at 1×, in pixels. */
    let posterWide = 0;
    const PREVIEW_POSTER = 0.25;
    let mode: AreaMode = level.w < MLEN || level.h < MWID ? 'level' : 'whole';
    let start = 0;
    let screens = 1;
    let scale = 1;
    let area: BlockRect = mode === 'level' ? { ...level } : { ...WHOLE_MAP };
    const PREVIEW = 4; // preview pixels per block

    await modal<void>('Download a picture of the map', (close) => {
      let shot: HTMLElement = renderWhole(opts, PREVIEW / BLEN);
      shot.className = 'pixel map-export-shot';
      const frame = h('div', { class: 'map-export-frame' });
      for (const hd of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as Handle[])
        frame.append(h('span', { class: `map-export-handle h-${hd}`, dataset: { handle: hd } }));
      const preview = h('div', { class: 'map-export-preview' }, shot, frame);
      const info = h('p', { class: 'meta map-export-info' });
      const modeBar = h('div', { class: 'map-export-modes', role: 'radiogroup', 'aria-label': 'Which part of the map' });
      const screenOpts = h('div', { class: 'map-export-screen row' });
      const scaleSel = selectField(
        'Picture size',
        [
          [0.05, '0.05× (a block is 1 pixel)'],
          [0.25, '0.25× (a block is 5 pixels)'],
          [0.5, '0.5× (a block is 10 pixels)'],
          [1, '1× (a block is 20 pixels)'],
          [2, '2×'],
          [3, '3×'],
        ],
        () => scale,
        (v) => ((scale = v), refresh()),
      );
      const fixed = () => mode === 'screen';
      const mapOpts = h('div', { class: 'stack', style: 'gap:4px' }, ...(['monsters', 'grid', 'links'] as const).map((k) => opt(OPT_LABELS[k], k)));
      const setShot = (next: HTMLElement) => {
        next.className = 'pixel map-export-shot';
        shot.replaceWith(next);
        shot = next;
      };
      const refresh = () => {
        const poster = mode === 'players';
        frame.hidden = poster;
        mapOpts.hidden = poster;
        preview.classList.toggle('poster', poster);
        [...modeBar.children].forEach((b) => b.setAttribute('aria-checked', String((b as HTMLElement).dataset.mode === mode)));
        if (poster) {
          screenOpts.hidden = true;
          info.textContent = playersNote + (playersLevel && posterWide ? ` A ${Math.round(posterWide * scale)}-pixel-wide PNG picture.` : '');
          downloadBtn.disabled = !playersLevel;
          return;
        }
        downloadBtn.disabled = false;
        if (!(shot instanceof HTMLCanvasElement)) setShot(renderWhole(opts, PREVIEW / BLEN));
        const p = (v: number) => `${(v / MLEN) * 100}%`;
        Object.assign(frame.style, { left: p(area.x), top: p(area.y), width: p(area.w), height: `${(area.h / MWID) * 100}%` });
        frame.classList.toggle('fixed', fixed());
        frame.title = fixed() ? 'Drag to move the screen' : 'Drag to move; drag an edge or corner to resize';
        info.textContent = `Blocks ${area.x}–${area.x + area.w - 1} across, ${area.y}–${area.y + area.h - 1} down (${area.w}×${area.h}): a ${area.w * BLEN * scale}×${area.h * BLEN * scale} PNG picture.`;
        screenOpts.hidden = mode !== 'screen';
      };
      // the poster: the explorer plays the map once, then it is drawn the printed Level Maps' way
      const showPlayers = () => {
        if (!players) {
          playersNote = 'Playing the level from every way in to see where it goes…';
          players = findPlayersView(editor.project, editor.file, (done, total) => {
            playersNote = `Playing the level from every way in to see where it goes… (way in ${Math.min(done + 1, total)} of ${total})`;
            if (mode === 'players') info.textContent = playersNote;
          });
          void players.done.then(
            async (found) => {
              const l = found?.level;
              playersLevel = l;
              if (!l) playersNote = 'No scene plays on this map, so there is no way in to follow.';
              else {
                const b = await posterPng(editor.project, l, PREVIEW_POSTER);
                const img = h('img', { alt: `${l.name}, as the player goes through it` });
                const wide = b ? (await createImageBitmap(b)).width / PREVIEW_POSTER : 0;
                if (b) img.src = URL.createObjectURL(b);
                const joins = l.unrolled?.loops.some(Boolean);
                playersNote = `Scene ${l.group.scenes.join(', ')} · ${l.area.w}×${l.area.h} blocks: what the player sees${
                  l.unrolled ? ', laid out as the player goes past the map’s edge' : ''
                }${joins ? ' (dashed edges join up)' : ''}, with where you arrive and the ways out.${
                  found.complete ? '' : ' The level is big: the bot ran out of time, so a corner it never reached may be left off.'
                }`;
                posterWide = wide;
                if (mode === 'players') setShot(img);
              }
              if (mode === 'players') refresh();
            },
            (e: unknown) => {
              if (e instanceof DOMException && e.name === 'AbortError') return;
              playersNote = `The level could not be played: ${e instanceof Error ? e.message : String(e)}`;
              if (mode === 'players') refresh();
            },
          );
        }
        refresh();
      };
      const setMode = (m: AreaMode) => {
        mode = m;
        if (m === 'players') return showPlayers();
        area = m === 'whole' ? { ...WHOLE_MAP } : m === 'level' ? { ...level } : gameView(startAt(start), { w: screens, h: screens });
        if (m === 'screen' && scale === 1) scale = 2;
        scaleSel.querySelector('select')!.value = String(scale);
        refresh();
      };
      const modeBtn = (m: AreaMode, label: string, title: string) =>
        h('button', { role: 'radio', dataset: { mode: m }, title, onclick: () => setMode(m) }, label);
      modeBar.append(
        modeBtn('whole', 'Whole map', `All ${MLEN}×${MWID} blocks`),
        modeBtn('level', 'Just the level', 'Leaves out the background fill round the level, which the character never sees'),
        modeBtn('screen', 'Screen-sized crop', 'Select an area in screen units within the stored map edges'),
        modeBtn(
          'players',
          'As players see it',
          'The map as a strategy guide or poster shows it: what the player sees, laid out as they go (on past an edge the map wraps over), with where you arrive and the ways out',
        ),
      );
      if (!posterScene(editor.project, editor.file)) {
        const b = modeBar.lastElementChild as HTMLButtonElement;
        b.disabled = true;
        b.title = 'No scene plays on this map yet, so there is no way in to follow.';
      }
      screenOpts.append(
        selectField(
          'Start point',
          startChoices,
          () => start,
          (v) => ((start = v), setMode('screen')),
        ),
        selectField(
          'Size',
          [
            [1, '1 screen (16×10 blocks)'],
            [2, '2×2 screens'],
            [3, '3×3 screens'],
          ],
          () => screens,
          (v) => ((screens = v), setMode('screen')),
        ),
      );
      // drag the frame, its edges or its corners (in whole blocks)
      frame.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        frame.setPointerCapture(e.pointerId);
        const handle = ((e.target as HTMLElement).dataset.handle as Handle | undefined) ?? 'move';
        const r = preview.getBoundingClientRect();
        const from = { ...area };
        const move = (ev: PointerEvent) => {
          const dx = Math.round(((ev.clientX - e.clientX) / r.width) * MLEN);
          const dy = Math.round(((ev.clientY - e.clientY) / r.height) * MWID);
          area = dragRect(from, handle, dx, dy, fixed());
          if (mode === 'whole' && (area.w < MLEN || area.h < MWID)) mode = 'level';
          refresh();
        };
        const up = () => (frame.removeEventListener('pointermove', move), frame.removeEventListener('pointerup', up));
        frame.addEventListener('pointermove', move);
        frame.addEventListener('pointerup', up);
      });
      function opt(label: string, k: keyof typeof opts) {
        const input = h('input', { type: 'checkbox', checked: opts[k], style: 'width:auto;margin:0' });
        input.addEventListener('change', () => {
          opts[k] = input.checked;
          setShot(renderWhole(opts, PREVIEW / BLEN));
        });
        return h('label', { style: 'display:flex;flex-direction:row;align-items:center;gap:8px;font-weight:normal' }, input, label);
      }
      const downloadBtn = h(
        'button',
        {
          class: 'primary',
          onclick: () => {
            const name = editor.file.replace(/\.map$/i, '');
            if (mode === 'players') {
              if (!playersLevel) return;
              void posterPng(editor.project, playersLevel, scale).then(async (b) => {
                if (!b) return toast('The picture could not be made.', 'error');
                download(`${name}-players.png`, new Uint8Array(await b.arrayBuffer()), 'image/png');
                close(undefined);
              });
              return;
            }
            renderWhole(opts, scale, area).toBlob(async (b) => {
              if (!b) return toast('The picture could not be made.', 'error');
              const suffix = mode === 'screen' ? 'screen' : area.w === MLEN && area.h === MWID ? 'map' : 'level';
              download(`${name}-${suffix}.png`, new Uint8Array(await b.arrayBuffer()), 'image/png');
              close(undefined);
            }, 'image/png');
          },
        },
        '⤓ Download PNG',
      );
      setMode(mode);
      return h(
        'div',
        { class: 'stack map-export' },
        modeBar,
        screenOpts,
        preview,
        info,
        h('div', { class: 'map-export-opts' }, mapOpts, scaleSel),
        h('div', { class: 'buttons' }, h('button', { onclick: () => close(undefined) }, 'Cancel'), downloadBtn),
      );
    });
    players?.cancel();
  }

  return { exportImage };
}
