// Monster editor (MONEDIT.EXE): 64 monsters with animation, strength and movement, and a
// name for each (monsterNames.ts: kept in the companion file, never in the .mon).
import './monsters.css';
import { rovingGrid } from '../../widgets/rovingGrid';
import { History } from '../../core/history';
import { registerEditor } from '../registry';
import { viewState } from '../../../urlState';
import { h, clear, numberField, selectField, checkField, debounce } from '../../core/ui';
import { blockCanvas, paintBlock } from '../../core/draw';
import { paletteChooser } from '../../widgets/paletteChooser';
import { blockButton } from '../../widgets/blockChooser';
import { fileField } from '../../widgets/filePicker';
import { MONBL, newBlockSet, parseBlocks } from '../../../formats/blocks';
import { LASTMON, LASTSL, parseMonsters, serializeMonsters, type Monster } from '../../../formats/monster';
import { monsterPathEditor } from './monsterPathEditor';
import { checkBadges } from '../../widgets/checkBadges';
import { normalize } from '../../../project/files';
import { fitToPane } from '../../core/fitPane';
import { monsterName, setMonsterName } from './monsterNames';

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
  // the address keeps the monster shown (…/NEBULA.MON?monster=3)
  const view = viewState(['p', project.id, file]);
  const urlMonster = view.num('monster');
  let current = urlMonster !== undefined && urlMonster >= 0 && urlMonster < mons.length ? urlMonster : 0;
  const save = debounce(() => project.files.set(file, serializeMonsters(mons)), 250);
  const chooser = paletteChooser(project, mblName || file, () => render());
  /** Each monster as its first animation frame, for choosing monsters by picture. */
  const monsterPictures = () => mons.map((mon) => mblk[mon.pic[0]?.[0] ?? -1] ?? newBlockSet('mbl')[0]);

  const list = rovingGrid(h('div', { class: 'block-picker mon-list' }), 'Monsters');
  const detail = h('div', { class: 'stack mon-detail' });
  const preview = h('canvas', { class: 'pixel checker', style: 'width:80px;height:80px;border:1px solid var(--border)' });
  const paths = monsterPathEditor({
    project,
    monFile: file,
    monsters: mons,
    index: () => current,
    mblk: () => mblk,
    palette: () => chooser.palette,
    onEdit: () => edit(() => renderList()),
  });
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
        const name = monsterName(project, file, i);
        return h(
          'button',
          {
            class: i === current ? 'selected' : '',
            title: name ? `Monster ${i}: ${name}` : `Monster ${i}`,
            onclick: () => ((current = i), (anim = 0), render()),
          },
          p >= 0 ? blockCanvas(mblk[p].pixels, chooser.palette, { transparent: true }) : h('span', { class: 'meta' }, '·'),
          h('small', null, i),
        );
      }),
    );
  }

  function edit(fn: () => void): void {
    fn();
    mons[current].used = 1;
    committed();
    save();
  }

  // Undo: each change records the state before it (changes less than half a second apart, like a drag, are one step).
  const history = new History<Uint8Array>();
  let base = serializeMonsters(mons);
  let lastChange = 0;
  const undoBtn = h('button', { title: 'Undo (Ctrl+Z)', disabled: true, onclick: () => step(true) }, '↶ Undo');
  const redoBtn = h('button', { title: 'Redo (Ctrl+Y)', disabled: true, onclick: () => step(false) }, '↷ Redo');
  const syncHistory = () => {
    undoBtn.disabled = !history.canUndo;
    redoBtn.disabled = !history.canRedo;
  };
  function committed(): void {
    const now = Date.now();
    if (now - lastChange > 500) history.record(base);
    lastChange = now;
    base = serializeMonsters(mons);
    syncHistory();
  }
  function step(back: boolean): void {
    const to = back ? history.undo(base) : history.redo(base);
    if (!to) return;
    mons.splice(0, mons.length, ...parseMonsters(to));
    base = to;
    lastChange = 0;
    syncHistory();
    save();
    render();
  }

  /** The monster's name: for the designer and the Scene maker's Cast, never written to the .mon. */
  function nameField(): HTMLElement {
    const i = current;
    const input = h('input', {
      type: 'text',
      value: monsterName(project, file, i),
      maxLength: 40,
      placeholder: 'e.g. Scorpion',
      title: 'What you call this monster: shown in the editor and in a Cast scene, never saved in the game’s files',
    });
    input.addEventListener('change', () => {
      setMonsterName(project, file, i, input.value);
      renderList();
    });
    return h('label', { class: 'field mon-name-field' }, h('span', null, 'Name'), input);
  }

  function renderDetail(): void {
    const m = mons[current];
    const frames = m.pic.slice(0, LASTSL);
    const count = frames.findIndex(([p]) => p >= MONBL || p < 0);
    const shown = count < 0 ? LASTSL : count;
    const endKind = m.end === -2 ? -2 : m.end === -1 ? -1 : m.end === 0 ? 0 : 1;

    clear(
      detail,
      h(
        'div',
        { class: 'panel mon-top' },
        h(
          'div',
          { class: 'mon-who' },
          preview,
          h('div', { class: 'mon-name' }, h('h2', null, `Monster ${current}`), h('div', { class: 'meta' }, m.used ? 'In use' : 'Unused slot'), nameField()),
        ),
        h(
          'div',
          { class: 'mon-anim' },
          // the frame buttons share the heading's line, so six frames fit on one row
          h(
            'div',
            { class: 'mon-anim-head' },
            h('h3', { id: 'mon-anim-head' }, 'Animation ', h('small', { class: 'meta' }, 'picture and ticks (1/18 s) of each frame')),
            h(
              'div',
              { class: 'mon-frame-tools' },
              shown < LASTSL &&
                h(
                  'button',
                  {
                    title: 'Add a frame (a copy of the last one)',
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
            'ol',
            { class: 'mon-frames', 'aria-labelledby': 'mon-anim-head' },
            ...frames.slice(0, shown).map((f, i) =>
              h(
                'li',
                { class: 'mon-frame' },
                blockButton(
                  () => mblk,
                  () => chooser.palette,
                  () => f[0],
                  (v) => edit(() => ((f[0] = v), renderDetail(), renderList())),
                  { title: `Frame ${i + 1}: a monster block` },
                ),
                numberField(
                  '',
                  () => f[1],
                  (v) => edit(() => (f[1] = v)),
                  { min: 1, max: 32767, title: `Frame ${i + 1}: ticks to show it (1/18 s each)` },
                ),
              ),
            ),
          ),
        ),
      ),
      h(
        'div',
        { class: 'panel grid-fields mon-stats', style: 'grid-template-columns:repeat(auto-fill,minmax(200px,1fr))' },
        numberField(
          'Power',
          () => m.power,
          (v) => edit(() => (m.power = v)),
          { min: 0, max: 255, title: 'Stronger monsters destroy weaker ones they touch. 100 or more cannot be destroyed by touching the character.' },
        ),
        numberField(
          'Score when destroyed by a weapon',
          () => m.upscore,
          (v) => edit(() => (m.upscore = v)),
          { min: -32768, max: 32767 },
        ),
        h(
          'label',
          { class: 'field' },
          h('span', null, 'When destroyed it becomes'),
          blockButton(
            monsterPictures,
            () => chooser.palette,
            () => (m.newmon < 0 ? LASTMON : m.newmon),
            (v) => edit(() => (m.newmon = v)),
            {
              title: 'The monster it turns into when destroyed',
              extras: [{ value: LASTMON, label: 'nothing', icon: '∅' }],
              only: (_, i) => !!mons[i]?.used,
            },
          ),
        ),
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
        endKind === 1
          ? numberField(
              'Lifetime (ticks)',
              () => m.end,
              (v) => edit(() => (m.end = v)),
              { min: 1, max: 32767 },
            )
          : null,
        checkField(
          'Stopped by solid blocks',
          () => !!m.thru,
          (v) => edit(() => (m.thru = v ? 1 : 0)),
        ),
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
        motionOf(m) !== 'path'
          ? numberField(
              'Speed (pixels per tick)',
              () => speedOf(m),
              (v) => edit(() => setMotion(m, motionOf(m), v)),
              { min: 1, max: 63 },
            )
          : null,
      ),
      paths.el,
    );
    paths.refresh();
    anim = 0;
    animate();
  }

  // level check notes on this monster: contrast, speed, hurts that hold, long lift rounds
  const badges = checkBadges(project, file, (f) => f.where.monster?.n === current && normalize(f.where.monster.file) === normalize(file));
  function render(): void {
    view.set({ monster: current });
    badges.refresh();
    renderList();
    renderDetail();
  }

  clear(
    host,
    h(
      'div',
      { class: 'ed-head' },
      h(
        'p',
        { class: 'hint' },
        'Pick a monster, then set its animation, strength and movement. Place monsters on maps with the map editor, or let blocks and character sequences give birth to them.',
      ),
      h('div', { class: 'toolbar' }, undoBtn, redoBtn),
      badges.el,
      fileField(
        project,
        'Monster blocks',
        ['mbl'],
        () => mblName,
        (v) => {
          if (!v) return;
          mblName = v;
          mblk = parseBlocks(project.files.get(v)!, MONBL);
          render();
        },
        { allowNone: false },
      ),
      chooser.el,
    ),
    h('div', { class: 'mon-layout' }, h('div', { class: 'mon-side' }, list), detail),
  );
  fitToPane(list, detail);
  render();
  const onKey = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    const k = e.key.toLowerCase();
    if (k === 'z' || k === 'y') {
      e.preventDefault();
      step(k === 'z' && !e.shiftKey);
    }
  };
  window.addEventListener('keydown', onKey);
  return () => {
    clearTimeout(timer);
    paths.destroy();
    window.removeEventListener('keydown', onKey);
  };
});
