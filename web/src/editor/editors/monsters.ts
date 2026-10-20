// Monster editor (MONEDIT.EXE): 64 monsters with animation, strength and movement.
import { registerEditor } from './index';
import { h, clear, numberField, selectField, checkField, debounce } from '../ui';
import { blockCanvas, paintBlock } from '../draw';
import { paletteChooser } from './blocks';
import { MONBL, newBlockSet, parseBlocks } from '../../formats/blocks';
import { LASTMON, LASTSL, MAXMARCH, parseMonsters, serializeMonsters, type Monster } from '../../formats/monster';

const ORIENTS: [number, string][] = [
  [0, 'Normal'],
  [1, 'Rotate ↻ 90°'],
  [2, 'Rotate 180°'],
  [3, 'Rotate ↺ 90°'],
  [4, 'Mirror ↔'],
  [5, 'Rotate + mirror'],
  [6, 'Mirror ↕'],
  [7, 'Rotate + mirror ↕'],
];

type Motion = 'path' | 'toward' | 'away' | 'random';

function motionOf(m: Monster): Motion {
  if (m.towards === 0) return 'path';
  if (m.towards >= 64) return 'random';
  return m.towards < 0 ? 'away' : 'toward';
}

function speedOf(m: Monster): number {
  if (m.towards >= 64) return m.towards >> 6;
  return Math.abs(m.towards);
}

function setMotion(m: Monster, motion: Motion, speed: number): void {
  speed = Math.max(1, Math.min(63, speed));
  m.towards = motion === 'path' ? 0 : motion === 'toward' ? speed : motion === 'away' ? -speed : speed << 6;
}

registerEditor(['mon'], (host, project, file) => {
  const mons = parseMonsters(project.files.get(file)!);
  const use = project.usesOf(file).find((u) => u.slot === 3);
  const game = project.game();
  let mblName = (use && game.scenes[use.scene].files[4]) || project.files.byExtension('mbl')[0] || '';
  let mblk = mblName ? parseBlocks(project.files.get(mblName)!, MONBL) : newBlockSet('mbl');
  let current = 0;
  const save = debounce(() => project.files.set(file, serializeMonsters(mons)), 250);
  const chooser = paletteChooser(project, mblName || file, () => render());

  const list = h('div', { class: 'block-picker', style: 'max-height:none;grid-template-columns:repeat(auto-fill,44px)' });
  const detail = h('div', { class: 'stack', style: 'flex:1 1 520px;min-width:0' });
  const preview = h('canvas', { class: 'pixel checker', style: 'width:80px;height:80px;border:1px solid var(--border)' });
  let anim = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const firstPic = (m: Monster) => (m.pic[0][0] >= 0 && m.pic[0][0] < MONBL ? m.pic[0][0] : -1);

  function animate(): void {
    clearTimeout(timer);
    const m = mons[current];
    if (anim >= LASTSL || m.pic[anim][0] >= MONBL || m.pic[anim][0] < 0) anim = 0;
    const pic = m.pic[anim][0];
    if (pic >= 0 && pic < MONBL) paintBlock(preview, mblk[pic].pixels, chooser.palette, { transparent: true });
    const ticks = Math.max(1, m.pic[anim][1]);
    anim++;
    timer = setTimeout(animate, (ticks * 1000) / 18.2);
  }

  function renderList(): void {
    clear(
      list,
      ...mons.map((m, i) => {
        const p = firstPic(m);
        return h(
          'button',
          { class: i === current ? 'selected' : '', title: `Monster ${i}`, onclick: () => ((current = i), (anim = 0), render()) },
          p >= 0 ? blockCanvas(mblk[p].pixels, chooser.palette, { transparent: true }) : h('span', { class: 'meta' }, '·'),
          h('small', null, i),
        );
      }),
    );
  }

  function edit(fn: () => void): void {
    fn();
    mons[current].used = 1;
    save();
  }

  function renderDetail(): void {
    const m = mons[current];
    const frames = m.pic.slice(0, LASTSL);
    const count = frames.findIndex(([p]) => p >= MONBL || p < 0);
    const shown = count < 0 ? LASTSL : count;
    const blockOptions: [number, string][] = [...Array.from({ length: MONBL }, (_, i) => [i, `Block ${i}`] as [number, string])];
    const monOptions: [number, string][] = [[LASTMON, 'Nothing (it is gone)'], ...Array.from({ length: LASTMON }, (_, i) => [i, `Monster ${i}`] as [number, string])];
    const endKind = m.end === -2 ? -2 : m.end === -1 ? -1 : m.end === 0 ? 0 : 1;

    const pathTable = (p: 0 | 1, title: string, hint: string) =>
      h(
        'div',
        { class: 'panel' },
        h('h4', { style: 'margin:0 0 4px' }, title),
        h('p', { class: 'hint' }, hint),
        h(
          'table',
          { class: 'data' },
          h('thead', null, h('tr', null, h('th', null, '#'), h('th', null, 'x (blocks)'), h('th', null, 'y (blocks)'), h('th', null, 'Speed (0 = end)'), h('th', null, 'Picture'))),
          h(
            'tbody',
            null,
            ...m.march[p].map((c, i) =>
              h(
                'tr',
                null,
                h('td', null, i + 1),
                h('td', null, numberField('', () => c.x, (v) => edit(() => (c.x = v)), { min: -99, max: 99 })),
                h('td', null, numberField('', () => c.y, (v) => edit(() => (c.y = v)), { min: -99, max: 99 })),
                h('td', null, numberField('', () => c.pic, (v) => edit(() => (c.pic = v)), { min: 0, max: 40 })),
                h('td', null, selectField('', ORIENTS, () => c.orient, (v) => edit(() => (c.orient = v)))),
              ),
            ),
          ),
        ),
      );

    clear(
      detail,
      h(
        'div',
        { class: 'panel row', style: 'align-items:center' },
        preview,
        h('div', { class: 'stack' }, h('h3', { style: 'margin:0' }, `Monster ${current}`), h('div', { class: 'meta' }, m.used ? 'In use' : 'Unused slot')),
      ),
      h(
        'div',
        { class: 'panel' },
        h('h4', { style: 'margin:0 0 6px' }, 'Animation'),
        h(
          'table',
          { class: 'data' },
          h('thead', null, h('tr', null, h('th', null, 'Frame'), h('th', null, 'Picture'), h('th', null, ''), h('th', null, 'Ticks (1/18 s)'))),
          h(
            'tbody',
            null,
            ...frames.slice(0, shown).map((f, i) =>
              h(
                'tr',
                null,
                h('td', null, i + 1),
                h('td', null, selectField('', blockOptions, () => f[0], (v) => edit(() => ((f[0] = v), renderDetail(), renderList())))),
                h('td', null, f[0] >= 0 && f[0] < MONBL ? blockCanvas(mblk[f[0]].pixels, chooser.palette, { transparent: true, className: 'checker' }) : ''),
                h('td', null, numberField('', () => f[1], (v) => edit(() => (f[1] = v)), { min: 1, max: 32767 })),
              ),
            ),
          ),
        ),
        h(
          'div',
          { class: 'toolbar', style: 'margin-top:6px' },
          shown < LASTSL &&
            h(
              'button',
              {
                onclick: () =>
                  edit(() => {
                    m.pic[shown] = [shown > 0 ? m.pic[shown - 1][0] : 0, shown > 0 ? m.pic[shown - 1][1] : 4];
                    if (shown + 1 <= LASTSL) m.pic[shown + 1] = [MONBL, 1];
                    renderDetail();
                    renderList();
                  }),
              },
              '+ Frame',
            ),
          shown > 0 &&
            h(
              'button',
              {
                onclick: () =>
                  edit(() => {
                    m.pic[shown - 1] = [MONBL, 1];
                    renderDetail();
                    renderList();
                  }),
              },
              '− Last frame',
            ),
        ),
      ),
      h(
        'div',
        { class: 'panel grid-fields', style: 'grid-template-columns:repeat(auto-fill,minmax(200px,1fr))' },
        numberField('Power', () => m.power, (v) => edit(() => (m.power = v)), { min: 0, max: 255, title: 'Stronger monsters destroy weaker ones they touch. 100 or more cannot be destroyed by touching the character.' }),
        numberField('Score when destroyed by a weapon', () => m.upscore, (v) => edit(() => (m.upscore = v)), { min: -32768, max: 32767 }),
        selectField('When destroyed it becomes', monOptions, () => (m.newmon < 0 ? LASTMON : m.newmon), (v) => edit(() => (m.newmon = v))),
        selectField(
          'Lives',
          [
            [-2, 'Forever (indestructible)'],
            [-1, 'Until the end of its path'],
            [0, 'Until destroyed'],
            [1, 'For a set time'],
          ] as [number, string][],
          () => endKind,
          (v) => edit(() => ((m.end = v === 1 ? Math.max(1, m.end) || 100 : v), renderDetail())),
        ),
        endKind === 1 ? numberField('Lifetime (ticks)', () => m.end, (v) => edit(() => (m.end = v)), { min: 1, max: 32767 }) : null,
        checkField('Stopped by solid blocks', () => !!m.thru, (v) => edit(() => (m.thru = v ? 1 : 0))),
      ),
      h(
        'div',
        { class: 'panel grid-fields', style: 'grid-template-columns:repeat(auto-fill,minmax(200px,1fr))' },
        selectField(
          'Movement',
          [
            ['path', 'Follows its path'],
            ['toward', 'Chases the character'],
            ['away', 'Runs from the character'],
            ['random', 'Wanders randomly'],
          ] as [Motion, string][],
          () => motionOf(m),
          (v) => edit(() => (setMotion(m, v, speedOf(m) || 1), renderDetail())),
        ),
        motionOf(m) !== 'path' ? numberField('Speed (pixels per tick)', () => speedOf(m), (v) => edit(() => setMotion(m, motionOf(m), v)), { min: 1, max: 63 }) : null,
        selectField(
          'Near the character (8×5 blocks)',
          [
            [0, 'Keep moving normally'],
            [1, 'Follow the attack path'],
            [2, 'Follow the attack path, relative to the character'],
          ] as [number, string][],
          () => m.activate,
          (v) => edit(() => (m.activate = v)),
        ),
      ),
      pathTable(0, 'Path', `Up to ${MAXMARCH} corners, as block offsets from where the monster starts. A speed of 0 ends the path; it then repeats (or the monster dies, if it lives until the end of its path).`),
      m.activate ? pathTable(1, 'Attack path', 'Used while the character is near. Starts at corner 2.') : null,
    );
    anim = 0;
    animate();
  }

  function render(): void {
    renderList();
    renderDetail();
  }

  clear(
    host,
    h('p', { class: 'hint' }, 'Pick a monster, then set its animation, strength and movement. Place monsters on maps with the map editor, or let blocks and character sequences give birth to them.'),
    h(
      'div',
      { class: 'toolbar', style: 'margin-bottom:8px' },
      selectField('Monster blocks', project.files.byExtension('mbl').map((f) => [f, f] as [string, string]), () => mblName, (v) => {
        mblName = v;
        mblk = parseBlocks(project.files.get(v)!, MONBL);
        render();
      }),
      chooser.el,
    ),
    h('div', { class: 'row' }, h('div', { style: 'flex:0 1 240px' }, list), detail),
  );
  render();
  return () => clearTimeout(timer);
});
