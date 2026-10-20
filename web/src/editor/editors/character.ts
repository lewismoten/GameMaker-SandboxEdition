// Character editor (CHAREDIT.EXE): the player's sequences (idle, die, hurt, pick up,
// drop and up to 15 of your own), each a series of two-block-high frames.
import { registerEditor } from './index';
import { fileField } from '../filePicker';
import { blockButton } from '../blockChooser';
import { h, clear, numberField, selectField, checkField, debounce } from '../ui';
import { drawBlockTo } from '../draw';
import { paletteChooser } from './blocks';
import { BACKBL, CHARBL, MONBL, newBlockSet, parseBlocks } from '../../formats/blocks';
import { INF_REPEAT, MAXFRAME, MAXINV, SEQUENCE_NAMES, emptyFrame, frameCount, parseCharacter, serializeCharacter, type Sequence } from '../../formats/character';
import { LASTSND, parseSoundSet, SOUND_NAMES } from '../../formats/sound';
import { scanName, SCAN } from '../../input/scancodes';

const ORIENTS: [number, string][] = [
  [0, 'Normal'],
  [1, '↻ 90°'],
  [2, '180°'],
  [3, '↺ 90°'],
  [4, 'Mirror ↔'],
  [5, '↻ + mirror'],
  [6, 'Mirror ↕'],
  [7, '↺ + mirror'],
];
const JOY_DIRS: [number, string][] = [
  [0, 'No joystick'],
  [1, 'Up'],
  [2, 'Up-right'],
  [3, 'Right'],
  [4, 'Down-right'],
  [5, 'Down'],
  [6, 'Down-left'],
  [7, 'Left'],
  [8, 'Up-left'],
  [9, 'Any direction'],
];
const JOY_BUTTONS: [number, string][] = [
  [0, 'Doesn’t matter'],
  [1, 'Button 1'],
  [2, 'Button 2'],
  [3, 'Both buttons'],
  [4, 'No buttons'],
];

registerEditor(['chr'], (host, project, file) => {
  const chr = parseCharacter(project.files.get(file)!);
  const game = project.game();
  const use = project.usesOf(file).find((u) => u.slot === 5);
  const scene = use ? game.scenes[use.scene] : undefined;
  let cblName = scene?.files[6] || project.files.byExtension('cbl')[0] || '';
  const bblName = scene?.files[2] || project.files.byExtension('bbl')[0] || '';
  const sndName = scene?.files[7] || project.files.byExtension('snd')[0] || '';
  let cbl = cblName ? parseBlocks(project.files.get(cblName)!, CHARBL) : newBlockSet('cbl');
  const bbl = bblName ? parseBlocks(project.files.get(bblName)!, BACKBL) : newBlockSet('bbl');
  const sounds = sndName ? parseSoundSet(project.files.get(sndName)!) : undefined;
  let current = 0;
  const save = debounce(() => project.files.set(file, serializeCharacter(chr)), 250);
  const edit = (fn: () => void) => {
    fn();
    save();
  };
  const chooser = paletteChooser(project, cblName || file, () => render());

  const seqName = (i: number) => SEQUENCE_NAMES[i] ?? (chr.sequences[i].key ? `Key ${scanName(chr.sequences[i].key >> 8)}` : `Sequence ${i}`);
  const list = h('div', { class: 'stack', style: 'flex:0 0 200px' });
  const detail = h('div', { class: 'stack', style: 'flex:1 1 560px;min-width:0' });
  const preview = h('canvas', { width: 120, height: 120, class: 'pixel checker', style: 'width:120px;height:120px;border:1px solid var(--border)' });
  let timer: ReturnType<typeof setTimeout> | undefined;

  function animate(seq: Sequence, frame = 0, pos = { x: 50, y: 60 }): void {
    clearTimeout(timer);
    const n = frameCount(seq);
    const ctx = preview.getContext('2d')!;
    ctx.clearRect(0, 0, 120, 120);
    if (!n) return;
    const f = seq.frames[frame % n];
    if (f.pic2 === MONBL) {
      ctx.fillStyle = '#f0f';
      ctx.font = '10px system-ui';
      ctx.fillText(`fires monster ${f.pic1}`, 4, 12);
    } else {
      pos.x = (((pos.x + f.x) % 100) + 100) % 100;
      pos.y = (((pos.y + f.y) % 100) + 100) % 100;
      if (f.pic1 < CHARBL) drawBlockTo(ctx, cbl[f.pic1].pixels, chooser.palette, pos.x, pos.y - 20, 1, true, f.orient & 15);
      if (f.pic2 < CHARBL) drawBlockTo(ctx, cbl[f.pic2].pixels, chooser.palette, pos.x, pos.y, 1, true, f.orient >> 4);
    }
    timer = setTimeout(() => animate(seq, frame + 1, pos), (Math.max(1, f.pause) * 1000) / 18.2);
  }

  function renderList(): void {
    clear(
      list,
      ...chr.sequences.map((_, i) =>
        h('button', { class: i === current ? 'primary' : '', style: 'text-align:left', onclick: () => ((current = i), render()) }, `${i}. ${seqName(i)}`),
      ),
    );
  }

  /** A frame's block, chosen from pictures of the character blocks. */
  const frameBlock = (get: () => number, set: (n: number) => void, title: string, canFire: boolean) =>
    blockButton(() => cbl, () => chooser.palette, get, set, {
      title,
      extras: [{ value: CHARBL, label: 'none', icon: '∅' }, ...(canFire ? [{ value: MONBL, label: 'Fire a monster', icon: '🔥' }] : [])],
    });

  function keyPicker(seq: Sequence): HTMLElement {
    const btn = h('button', { title: 'Click, then press the key' }, seq.key ? scanName(seq.key >> 8) : 'None');
    btn.addEventListener('click', () => {
      btn.textContent = 'Press a key…';
      const onKey = (e: KeyboardEvent) => {
        e.preventDefault();
        window.removeEventListener('keydown', onKey, true);
        if (e.code === 'Escape') {
          btn.textContent = seq.key ? scanName(seq.key >> 8) : 'None';
          return;
        }
        const scan = SCAN[e.code];
        if (scan === undefined || (scan >= 59 && scan <= 68)) {
          btn.textContent = 'That key is reserved';
          return;
        }
        const ascii = e.key.length === 1 ? e.key.toLowerCase().charCodeAt(0) & 0xff : 0;
        edit(() => (seq.key = (scan << 8) | ascii));
        renderList();
        btn.textContent = scanName(scan);
      };
      window.addEventListener('keydown', onKey, true);
    });
    return h('label', { class: 'field' }, h('span', null, 'Key'), h('div', { class: 'row', style: 'gap:4px' }, btn, seq.key ? h('button', { onclick: () => (edit(() => (seq.key = 0)), render()) }, 'Clear') : null));
  }

  function renderDetail(): void {
    const seq = chr.sequences[current];
    const n = frameCount(seq);
    const soundOptions: [number, string][] = [
      [LASTSND, 'None'],
      ...Array.from({ length: LASTSND }, (_, i) => [i, `${i}: ${sounds?.digital[i] ? `${sounds.digital[i]}.voc` : (SOUND_NAMES[i] ?? 'PC speaker')}`] as [number, string]),
    ];
    const objectOptions: [number, string][] = [[BACKBL, 'No (always available)'], ...bbl.map((b, i) => [i, `Background block ${i}${b.obj ? ' (object)' : ''}`] as [number, string]).filter(([i]) => bbl[i].obj)];
    const meter = chr.meter[current];
    const reps = current >= 5;

    clear(
      detail,
      h('div', { class: 'panel row', style: 'align-items:center' }, preview, h('div', { class: 'stack' }, h('h3', { style: 'margin:0' }, `${current}. ${seqName(current)}`), h('button', { onclick: () => animate(seq) }, '▶ Replay'))),
      h(
        'div',
        { class: 'panel grid-fields', style: 'grid-template-columns:repeat(auto-fill,minmax(190px,1fr))' },
        current >= 3 ? keyPicker(seq) : null,
        current >= 3 ? selectField('Joystick', JOY_DIRS, () => seq.jstkMov, (v) => edit(() => (seq.jstkMov = v))) : null,
        current >= 3 ? selectField('Joystick button', JOY_BUTTONS, () => seq.jstkBut, (v) => edit(() => (seq.jstkBut = v))) : null,
        selectField('Sound', soundOptions, () => (seq.sound < 0 || seq.sound >= LASTSND ? LASTSND : seq.sound), (v) => edit(() => (seq.sound = v))),
        current >= 5 ? selectField('Needs object in inventory', objectOptions, () => seq.bloc, (v) => edit(() => (seq.bloc = v))) : null,
        reps
          ? selectField('Executions', [[1, 'Limited'], [0, 'Unlimited']] as [number, string][], () => (meter === INF_REPEAT ? 0 : 1), (v) =>
              edit(() => ((chr.meter[current] = v ? 10 : INF_REPEAT), renderDetail())),
            )
          : null,
        reps && meter !== INF_REPEAT ? numberField('Times at start', () => meter, (v) => edit(() => (chr.meter[current] = v)), { min: 0, max: 32766 }) : null,
        checkField('Always complete the sequence', () => !!seq.ground, (v) => edit(() => (seq.ground = v ? 1 : 0)), 'If off, another key can interrupt it'),
        checkField('Once per key press', () => !!seq.norepeat, (v) => edit(() => (seq.norepeat = v ? 1 : 0)), 'If off, it repeats while the key is held'),
        checkField('Momentum', () => !!seq.momentum, (v) => edit(() => (seq.momentum = v ? 1 : 0)), 'Motion adds to the character’s momentum, like gravity'),
      ),
      h(
        'div',
        { class: 'panel' },
        h('h4', { style: 'margin:0 0 6px' }, 'Frames'),
        h(
          'table',
          { class: 'data' },
          h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'Top'), h('th', null, ''), h('th', null, 'Bottom'), h('th', null, ''), h('th', null, 'Move x'), h('th', null, 'Move y'), h('th', null, 'Ticks'))),
          h(
            'tbody',
            null,
            ...seq.frames.slice(0, n).map((f, i) => {
              const fires = f.pic2 === MONBL;
              return h(
                'tr',
                null,
                h('td', null, i + 1),
                h('td', null, fires ? numberField('Monster', () => f.pic1, (v) => edit(() => (f.pic1 = v)), { min: 0, max: 63 }) : frameBlock(() => f.pic1, (v) => edit(() => ((f.pic1 = v), renderDetail())), 'Top block', false)),
                h('td', null, fires ? '' : selectField('', ORIENTS, () => f.orient & 15, (v) => edit(() => (f.orient = (f.orient & ~15) | v)))),
                h('td', null, frameBlock(() => f.pic2, (v) => edit(() => ((f.pic2 = v), renderDetail())), 'Bottom block', true)),
                h('td', null, fires ? '' : selectField('', ORIENTS, () => (f.orient >> 4) & 15, (v) => edit(() => (f.orient = (f.orient & 15) | (v << 4))))),
                h('td', null, numberField('', () => f.x, (v) => edit(() => (f.x = v)), { min: -20, max: 20 })),
                h('td', null, numberField('', () => f.y, (v) => edit(() => (f.y = v)), { min: -20, max: 20 })),
                h('td', null, numberField('', () => f.pause, (v) => edit(() => (f.pause = v)), { min: 0, max: 999 })),
              );
            }),
          ),
        ),
        h(
          'div',
          { class: 'toolbar', style: 'margin-top:6px' },
          n < MAXFRAME &&
            h(
              'button',
              {
                onclick: () =>
                  edit(() => {
                    seq.frames[n] = n > 0 ? { ...seq.frames[n - 1], extra: new Uint8Array(5) } : { ...emptyFrame(), pic1: 0, pic2: 1, pause: 2 };
                    if (n + 1 < MAXFRAME) seq.frames[n + 1] = emptyFrame(true);
                    renderDetail();
                  }),
              },
              '+ Frame',
            ),
          n > 0 &&
            h(
              'button',
              {
                onclick: () =>
                  edit(() => {
                    seq.frames[n - 1] = emptyFrame(true);
                    renderDetail();
                  }),
              },
              '− Last frame',
            ),
        ),
      ),
    );
    animate(seq);
  }

  function renderCharacter(): HTMLElement {
    const money = chr.meter[3];
    return h(
      'div',
      { class: 'panel' },
      h('h4', { style: 'margin:0 0 6px' }, 'At the start of the game'),
      h(
        'div',
        { class: 'grid-fields', style: 'grid-template-columns:repeat(auto-fill,minmax(170px,1fr))' },
        numberField('Hit points', () => chr.meter[0], (v) => edit(() => (chr.meter[0] = v)), { min: 1, max: 32766 }),
        numberField('Lives', () => chr.meter[1], (v) => edit(() => (chr.meter[1] = v)), { min: 0, max: 32766 }),
        selectField('Money', [[1, 'Used'], [0, 'Not used']] as [number, string][], () => (money === INF_REPEAT ? 0 : 1), (v) => edit(() => ((chr.meter[3] = v ? 1 : INF_REPEAT), render()))),
        money !== INF_REPEAT ? numberField('Money at start', () => money - 1, (v) => edit(() => (chr.meter[3] = v + 1)), { min: 0, max: 32765 }) : null,
        ...Array.from({ length: 5 }, (_, i) => numberField(`Special counter ${i + 1}`, () => chr.meter[20 + i], (v) => edit(() => (chr.meter[20 + i] = v)), { min: -32767, max: 32767 })),
      ),
      h('h4', { style: 'margin:10px 0 6px' }, 'Inventory'),
      h(
        'div',
        { class: 'row', style: 'gap:6px' },
        ...Array.from({ length: MAXINV }, (_, i) =>
          h(
            'label',
            { class: 'field' },
            h('span', null, `Slot ${i + 1}`),
            blockButton(() => bbl, () => chooser.palette, () => chr.inv[i], (v) => edit(() => (chr.inv[i] = v)), {
              title: `Inventory slot ${i + 1}: an object block`,
              extras: [{ value: BACKBL, label: 'empty', icon: '∅' }],
              transparent: false,
              only: (b) => !!b.obj,
            }),
          ),
        ),
      ),
    );
  }

  const top = h('div');
  function render(): void {
    renderList();
    clear(top, renderCharacter());
    renderDetail();
  }

  clear(
    host,
    h('p', { class: 'hint' }, `Sequences 0–4 are built in (idle, die, injured, pick up, drop); 5–19 run when their key is pressed. Background blocks come from ${bblName || 'no block set'} and sounds from ${sndName || 'no sound set'}.`),
    h(
      'div',
      { class: 'toolbar', style: 'margin-bottom:8px' },
      fileField(project, 'Character blocks', ['cbl'], () => cblName, (v) => {
        if (!v) return;
        cblName = v;
        cbl = parseBlocks(project.files.get(v)!, CHARBL);
        render();
      }, { allowNone: false }),
      chooser.el,
    ),
    top,
    h('div', { style: 'height:12px' }),
    h('div', { class: 'row' }, list, detail),
  );
  render();
  return () => clearTimeout(timer);
});


