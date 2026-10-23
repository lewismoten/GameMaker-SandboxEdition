// Character editor (CHAREDIT.EXE): the hero's starting health, money, counters and
// inventory, and its sequences (idle, die, hurt, pick up, drop and up to 15 of your own),
// each a series of 20x40 frames made of a top and a bottom block.
//
// One closure per editor. Its sections, in order: sounds, the hero sheet (health, money,
// counters, inventory), the sequence list, the preview stage (each frame shown for its
// pause in 18.2 Hz ticks), the selected sequence's detail, and the page. The frame cards and
// key picker are in characterFrames.ts; turning blocks and editing frame lists are pure
// helpers in characterLogic.ts.
import './character.css';
import { registerEditor } from '../registry';
import { fileField } from '../../widgets/filePicker';
import { blockButton } from '../../widgets/blockChooser';
import { h, clear, numberField, selectField, checkField, debounce, confirmDialog } from '../../core/ui';
import { History } from '../../core/history';
import { drawBlockTo } from '../../core/draw';
import { paletteChooser } from '../blocks/blocks';
import { audio } from '../../widgets/mediaShared';
import { BACKBL, BLEN, CHARBL, newBlockSet, parseBlocks } from '../../../formats/blocks';
import {
  INF_REPEAT,
  MAXFRAME,
  MAXINV,
  SEQUENCE_NAMES,
  frameCount,
  parseCharacter,
  serializeCharacter,
  type Frame,
  type Sequence,
} from '../../../formats/character';
import { LASTSND, parseSoundSet, SOUND_NAMES } from '../../../formats/sound';
import { scanName } from '../../../input/scancodes';
import { viewState } from '../../../urlState';
import { bottomOrient, firesMonster, insertFrame, mirroredFrames, normalOrient, setFrames, topOrient, travel } from './characterLogic';
import { frameCard, keyPicker, type FrameContext } from './characterFrames';
import { stageBackdrop } from './characterStage';

const JOY_DIRS: [number, string][] = [
  [0, 'No joystick'],
  [1, '↑ Up'],
  [2, '↗ Up-right'],
  [3, '→ Right'],
  [4, '↘ Down-right'],
  [5, '↓ Down'],
  [6, '↙ Down-left'],
  [7, '← Left'],
  [8, '↖ Up-left'],
  [9, '✣ Any direction'],
];
const JOY_BUTTONS: [number, string][] = [
  [0, 'Any (doesn’t matter)'],
  [1, 'Button 1'],
  [2, 'Button 2'],
  [3, 'Both buttons'],
  [4, 'No buttons pressed'],
];

/** When the built-in sequences run, in plain words. */
const BUILT_IN_HELP = [
  'Plays whenever no other sequence is running — the hero standing still.',
  'Plays when hit points run out. Afterwards a life is lost (or the game ends).',
  'Plays when the hero touches a block or monster that takes hit points.',
  'Runs on its key: picks up the object the hero is standing on and puts it in the inventory.',
  'Runs on its key: asks which inventory object to drop, then puts it down.',
];

const STAGE_W = 240;
const STAGE_H = 120;

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
  // the address keeps the tab and the sequence shown (…/HERO.CHR?tab=sequences&sequence=4)
  const view = viewState(['p', project.id, file]);
  const urlSeq = view.num('sequence');
  let current = urlSeq !== undefined && urlSeq >= 0 && urlSeq < chr.sequences.length ? urlSeq : 0;
  let withSound = false;
  const save = debounce(() => project.files.set(file, serializeCharacter(chr)), 250);
  // Undo: each change records the state before it (changes less than half a second apart, like typing a number, are one step).
  const history = new History<Uint8Array>();
  let base = serializeCharacter(chr);
  let lastChange = 0;
  const undoBtn = h('button', { title: 'Undo (Ctrl+Z)', disabled: true, onclick: () => step(true) }, '↶ Undo');
  const redoBtn = h('button', { title: 'Redo (Ctrl+Y)', disabled: true, onclick: () => step(false) }, '↷ Redo');
  const syncHistory = () => {
    undoBtn.disabled = !history.canUndo;
    redoBtn.disabled = !history.canRedo;
  };
  const edit = (fn: () => void) => {
    fn();
    const now = Date.now();
    if (now - lastChange > 500) history.record(base);
    lastChange = now;
    base = serializeCharacter(chr);
    syncHistory();
    save();
  };
  function step(back: boolean): void {
    const to = back ? history.undo(base) : history.redo(base);
    if (!to) return;
    Object.assign(chr, parseCharacter(to));
    base = to;
    lastChange = 0;
    syncHistory();
    save();
    render();
  }
  const onKey = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    const k = e.key.toLowerCase();
    if (k === 'z' || k === 'y') {
      e.preventDefault();
      step(k === 'z' && !e.shiftKey);
    }
  };
  window.addEventListener('keydown', onKey);
  const chooser = paletteChooser(project, cblName || file, () => render());
  const pal = () => chooser.palette;

  const seqName = (i: number) => SEQUENCE_NAMES[i] ?? (chr.sequences[i].key ? `Key ${scanName(chr.sequences[i].key >> 8)}` : 'No key yet');
  const help = (text: string) => h('p', { class: 'chr-help' }, text);
  const group = (title: string, icon: string, ...body: (Node | null)[]) =>
    h('section', { class: 'chr-group' }, h('h2', null, h('span', { class: 'chr-icon' }, icon), title), ...body);

  // ---------------------------------------------------------------- sounds
  const vocFor = (n: number) => {
    const name = sounds?.digital[n];
    return name && name[0] !== ' ' ? project.files.get(`${name.trim()}.voc`) : undefined;
  };
  const soundLabel = (n: number) => {
    const name = sounds?.digital[n];
    const kind = name && name[0] !== ' ' ? `${name.trim().toLowerCase()}.voc` : 'PC speaker';
    return `${n + 1}. ${SOUND_NAMES[n] ? `${SOUND_NAMES[n]} — ` : ''}${kind}`;
  };
  async function playSound(n: number): Promise<void> {
    if (!sounds || n < 0 || n >= LASTSND) return;
    await audio.resume();
    if (!audio.playVoc(vocFor(n))) audio.playSpeaker(sounds.freqs[n]);
  }

  // ---------------------------------------------------------------- the hero sheet
  const sheet = h('div', { class: 'chr-sheet' });
  const status = h('div', { class: 'chr-f2-lines' });

  function updateStatus(): void {
    const line = (k: string, v: string | number) => h('div', null, h('span', null, k.padEnd(11, ' ')), String(v));
    clear(
      status,
      line('Score:', 0),
      chr.meter[3] !== INF_REPEAT ? line('Money:', chr.meter[3] - 1) : null,
      h('div', { class: 'gap' }),
      line('Hitpoints:', chr.meter[0]),
      line('Lives:', chr.meter[1]),
    );
  }

  function renderSheet(): void {
    const money = chr.meter[3];
    const counters = Array.from({ length: 5 }, (_, i) => {
      const m = 20 + i;
      const used = chr.meter[m] !== INF_REPEAT;
      return h(
        'div',
        { class: 'chr-counter' },
        h('b', null, `#${i + 1}`),
        selectField(
          '',
          [
            [1, 'Counts'],
            [0, 'Unlimited'],
          ] as [number, string][],
          () => (used ? 1 : 0),
          (v) => edit(() => ((chr.meter[m] = v ? 1 : INF_REPEAT), renderSheet())),
          'Unlimited: blocks never change it and never block the way',
        ),
        used
          ? numberField(
              '',
              () => chr.meter[m] - 1,
              (v) => edit(() => (chr.meter[m] = v + 1)),
              { min: -32000, max: 32765, title: `Special counter ${i + 1} at the start` },
            )
          : h('span', { class: 'chr-muted' }, '∞'),
      );
    });

    const inv = h(
      'div',
      { class: 'chr-inv' },
      ...Array.from({ length: MAXINV }, (_, i) =>
        blockButton(
          () => bbl,
          pal,
          () => chr.inv[i],
          (v) => edit(() => (chr.inv[i] = v)),
          {
            title: `Inventory slot ${i + 1}: an object the hero carries at the start`,
            extras: [{ value: BACKBL, label: 'empty', icon: '·' }],
            transparent: false,
            only: (b) => !!b.obj,
          },
        ),
      ),
    );

    clear(
      sheet,
      group(
        'Health & lives',
        '♥',
        h(
          'div',
          { class: 'chr-fields' },
          numberField(
            'Hit points',
            () => chr.meter[0],
            (v) => edit(() => ((chr.meter[0] = v), updateStatus())),
            { min: 1, max: 32766 },
          ),
          numberField(
            'Lives',
            () => chr.meter[1] + 1,
            (v) => edit(() => ((chr.meter[1] = v - 1), updateStatus())),
            { min: 1, max: 32767, title: 'Counting the first life' },
          ),
        ),
        help(
          'Harmful blocks and monsters take hit points; at zero the Die sequence plays and a life is lost. Lives counts the first one — the F2 screen shows the spare lives.',
        ),
      ),
      group(
        'Money & score',
        '$',
        h(
          'div',
          { class: 'chr-fields' },
          selectField(
            'Money',
            [
              [1, 'Used'],
              [0, 'No money'],
            ] as [number, string][],
            () => (money === INF_REPEAT ? 0 : 1),
            (v) => edit(() => ((chr.meter[3] = v ? 1 : INF_REPEAT), renderSheet(), updateStatus())),
          ),
          money !== INF_REPEAT
            ? numberField(
                'Money at start',
                () => money - 1,
                (v) => edit(() => ((chr.meter[3] = v + 1), updateStatus())),
                { min: 0, max: 32765 },
              )
            : null,
        ),
        help(
          'Blocks can give or take money. A block that costs more than the hero has blocks the way, like a toll or a shop. Score always starts at 0; blocks add points when touched.',
        ),
      ),
      group(
        'Special counters',
        '#',
        h('div', { class: 'chr-counters' }, ...counters),
        help(
          'Five hidden tallies blocks can add to or take from ("Changes counter" in the block editor). A block that would take one below zero blocks the way — use them for keys, ammo or collectables.',
        ),
      ),
      h(
        'section',
        { class: 'chr-group chr-f2-card' },
        h('h2', null, h('span', { class: 'chr-icon' }, '▦'), 'Starting inventory'),
        h('div', { class: 'chr-f2' }, inv, status),
        help('What the hero carries at the start, laid out as the F2 status screen shows it. Only blocks marked "can be picked up" fit here.'),
      ),
    );
    updateStatus();
  }

  // ---------------------------------------------------------------- sequence list
  const list = h('nav', { class: 'chr-list', 'aria-label': 'Sequences' });

  function spriteCanvas(f: Frame | undefined, scale: number): HTMLCanvasElement {
    const c = h('canvas', { width: BLEN * scale, height: BLEN * 2 * scale, class: 'pixel' });
    if (!f || firesMonster(f)) return c;
    const ctx = c.getContext('2d')!;
    if (f.pic1 < CHARBL) drawBlockTo(ctx, cbl[f.pic1].pixels, pal(), 0, 0, scale, true, normalOrient(topOrient(f)));
    if (f.pic2 < CHARBL) drawBlockTo(ctx, cbl[f.pic2].pixels, pal(), 0, BLEN * scale, scale, true, normalOrient(bottomOrient(f)));
    return c;
  }

  function renderList(): void {
    clear(
      list,
      h('div', { class: 'chr-list-head' }, 'Built in'),
      ...chr.sequences.map((s, i) => [
        i === 5 ? h('div', { class: 'chr-list-head' }, 'Your moves') : null,
        h(
          'button',
          { class: `chr-seq${i === current ? ' selected' : ''}${frameCount(s) ? '' : ' empty'}`, onclick: () => ((current = i), view.set({ sequence: i }), renderList(), renderDetail()) },
          h('span', { class: 'chr-seq-thumb checker' }, spriteCanvas(s.frames[0] && frameCount(s) ? s.frames[0] : undefined, 1)),
          h('span', { class: 'chr-seq-name' }, h('b', null, `${i}`), ' ', seqName(i)),
          s.key && i < 5 ? h('kbd', null, scanName(s.key >> 8)) : null,
        ),
      ]),
    );
  }

  // ---------------------------------------------------------------- preview stage
  const stage = h('canvas', { width: STAGE_W, height: STAGE_H, class: 'pixel chr-stage' });
  const stageInfo = h('span', { class: 'chr-muted' });
  let timer: ReturnType<typeof setTimeout> | undefined;
  let playing = true;
  let frameCards: HTMLElement[] = [];
  const backdrop = stageBackdrop(project, file, STAGE_W, STAGE_H, () => animate(chr.sequences[current]));

  function drawStage(seq: Sequence, i: number, pos: { x: number; y: number }, burst: string): void {
    const ctx = stage.getContext('2d')!;
    if (!backdrop.draw(ctx)) {
      ctx.fillStyle = '#05061a';
      ctx.fillRect(0, 0, STAGE_W, STAGE_H);
      ctx.fillStyle = '#12163a';
      for (let x = 0; x < STAGE_W; x += BLEN) ctx.fillRect(x, 0, 1, STAGE_H);
      for (let y = 0; y < STAGE_H; y += BLEN) ctx.fillRect(0, y, STAGE_W, 1);
    }
    const f = seq.frames[i];
    if (!f) return;
    const at = (n: number, o: number, x: number, y: number) => {
      for (const dx of [0, -STAGE_W, STAGE_W])
        for (const dy of [0, -STAGE_H, STAGE_H]) drawBlockTo(ctx, cbl[n].pixels, pal(), x + dx, y + dy, 1, true, normalOrient(o));
    };
    const shown = firesMonster(f) ? lastPicture(seq, i) : f;
    if (shown) {
      if (shown.pic1 < CHARBL) at(shown.pic1, topOrient(shown), pos.x, pos.y - BLEN);
      if (shown.pic2 < CHARBL) at(shown.pic2, bottomOrient(shown), pos.x, pos.y);
    }
    if (burst) {
      ctx.fillStyle = '#ff5';
      ctx.font = '9px monospace';
      ctx.fillText(burst, Math.min(pos.x + 22, STAGE_W - 70), Math.max(10, pos.y - 4));
    }
  }

  /** The picture still on screen while a frame fires a monster. */
  function lastPicture(seq: Sequence, i: number): Frame | undefined {
    for (let k = i - 1; k >= 0; k--) if (!firesMonster(seq.frames[k])) return seq.frames[k];
    return undefined;
  }

  function animate(seq: Sequence, i = 0, pos = { x: (STAGE_W - BLEN) / 2, y: STAGE_H / 2 + 10 }): void {
    clearTimeout(timer);
    const n = frameCount(seq);
    frameCards.forEach((c, k) => c.classList.toggle('playing', k === i && n > 0));
    if (!n) {
      drawStage(seq, -1, pos, '');
      return;
    }
    if (i === 0 && withSound && playing) void playSound(seq.sound);
    const f = seq.frames[i];
    let burst = '';
    if (firesMonster(f)) burst = `fires monster ${f.pic1}`;
    else {
      pos.x = (((pos.x + f.x) % STAGE_W) + STAGE_W) % STAGE_W;
      pos.y = (((pos.y + f.y) % STAGE_H) + STAGE_H) % STAGE_H;
    }
    drawStage(seq, i, pos, burst);
    if (!playing) return;
    timer = setTimeout(() => animate(seq, (i + 1) % n, pos), (Math.max(1, f.pause) * 1000) / 18.2);
  }

  function describeTravel(seq: Sequence): string {
    const t = travel(seq);
    const n = frameCount(seq);
    if (!n) return 'No frames yet — add one below.';
    const ticks = seq.frames.slice(0, n).reduce((a, f) => a + Math.max(1, f.pause), 0);
    const dir = [t.x ? `${Math.abs(t.x)} px ${t.x > 0 ? 'right' : 'left'}` : '', t.y ? `${Math.abs(t.y)} px ${t.y > 0 ? 'down' : 'up'}` : '']
      .filter(Boolean)
      .join(', ');
    return `${n} frame${n > 1 ? 's' : ''}, ${(ticks / 18.2).toFixed(2)} s per loop${dir ? `, moves ${dir}` : ', stays in place'}${seq.momentum ? ' (as momentum)' : ''}.`;
  }

  // ---------------------------------------------------------------- frames (characterFrames.ts)
  const frames: FrameContext = {
    blocks: () => cbl,
    palette: pal,
    edit,
    listChanged: () => renderList(),
    redraw: () => renderDetail(),
    travelChanged: (seq) => (stageInfo.textContent = describeTravel(seq)),
  };

  /** "Facing the other way, from…": fills this sequence with another one's frames mirrored (a walk left from a walk right). */
  function mirrorFrom(seq: Sequence, n: number): HTMLElement | null {
    const sources = chr.sequences.map((_, i) => i).filter((i) => i !== current && frameCount(chr.sequences[i]) > 0);
    if (!sources.length) return null;
    const sel = h(
      'select',
      { 'aria-label': 'Sequence to mirror' },
      ...sources.map((i) => h('option', { value: String(i) }, `${i}. ${seqName(i)}`)),
    ) as HTMLSelectElement;
    const go = h(
      'button',
      {
        title: 'Replace these frames with the chosen sequence’s, facing the other way: moves go left instead of right, blocks mirrored',
        onclick: async () => {
          const src = chr.sequences[Number(sel.value)];
          if (n && !(await confirmDialog('Mirror a sequence', `Replace this sequence’s ${n} frame${n === 1 ? '' : 's'} with ${seqName(Number(sel.value))}’s, facing the other way?`, 'Replace'))) return;
          edit(() => setFrames(seq, mirroredFrames(src)));
          renderList();
          renderDetail();
        },
      },
      'Make it',
    );
    return h('div', { class: 'toolbar chr-mirror' }, h('span', { class: 'chr-muted' }, 'Facing the other way, from'), sel, go);
  }

  // ---------------------------------------------------------------- sequence detail
  const detail = h('div', { class: 'chr-detail' });

  function renderDetail(): void {
    const seq = chr.sequences[current];
    const n = frameCount(seq);
    const meter = chr.meter[current];
    const own = current >= 5;
    const soundOptions: [number, string][] = [[LASTSND, 'None'], ...Array.from({ length: LASTSND }, (_, i) => [i, soundLabel(i)] as [number, string])];
    const soundNo = () => (seq.sound < 0 || seq.sound >= LASTSND ? LASTSND : seq.sound);
    const playBtn = h(
      'button',
      { class: 'primary', onclick: () => ((playing = !playing), (playBtn.textContent = playing ? '❚❚ Pause' : '▶ Play'), animate(seq)) },
      playing ? '❚❚ Pause' : '▶ Play',
    );
    const soundToggle = h(
      'button',
      {
        class: withSound ? 'selected' : '',
        title: 'Play the sequence’s sound each time it starts over',
        onclick: () => {
          withSound = !withSound;
          soundToggle.classList.toggle('selected', withSound);
          soundToggle.textContent = withSound ? '🔊 Sound on' : '🔈 Sound off';
          if (withSound) void audio.resume().then(() => ((playing = true), (playBtn.textContent = '❚❚ Pause'), animate(seq)));
        },
      },
      withSound ? '🔊 Sound on' : '🔈 Sound off',
    );
    stageInfo.textContent = describeTravel(seq);

    frameCards = seq.frames.slice(0, n).map((f, i) => frameCard(frames, seq, f, i, n));
    const addFrame =
      n < MAXFRAME
        ? h(
            'button',
            { class: 'chr-add', title: 'Add a frame (a copy of the last one)', onclick: () => (edit(() => insertFrame(seq, n - 1)), renderDetail()) },
            h('span', null, '+'),
            'Frame',
          )
        : null;

    clear(
      detail,
      h(
        'header',
        { class: 'chr-detail-head' },
        h(
          'div',
          null,
          h('h2', null, `${current}. ${seqName(current)}`),
          help(own ? 'Your own move: it runs when its key is pressed or the joystick is pushed its way.' : BUILT_IN_HELP[current]),
        ),
      ),
      h(
        'div',
        { class: 'chr-stage-wrap' },
        stage,
        h(
          'div',
          { class: 'chr-stage-bar' },
          playBtn,
          h('button', { onclick: () => ((playing = true), (playBtn.textContent = '❚❚ Pause'), animate(seq)) }, '⟲ Restart'),
          soundToggle,
          backdrop.el,
          stageInfo,
        ),
      ),
      h(
        'section',
        { class: 'chr-frames-wrap' },
        h('h3', null, 'Frames ', h('span', { class: 'chr-muted' }, `${n} of ${MAXFRAME} · hover a block to turn or flip it, click it to change it`)),
        h('div', { class: 'chr-frames' }, ...frameCards, addFrame),
        mirrorFrom(seq, n),
      ),
      h(
        'div',
        { class: 'chr-groups' },
        current >= 3
          ? group(
              'Controls',
              '⌨',
              h(
                'div',
                { class: 'chr-fields' },
                keyPicker(frames, seq),
                selectField(
                  'Joystick',
                  JOY_DIRS,
                  () => seq.jstkMov,
                  (v) => edit(() => (seq.jstkMov = v)),
                ),
                selectField(
                  'Joystick button',
                  JOY_BUTTONS,
                  () => seq.jstkBut,
                  (v) => edit(() => (seq.jstkBut = v)),
                ),
              ),
              help('Press the key (or push the joystick this way) to run the sequence. F1–F10 are kept for the game’s own menus.'),
            )
          : group('Controls', '⌨', help(`The game starts this one by itself. ${BUILT_IN_HELP[current]}`)),
        group(
          'Animation',
          '▶',
          h(
            'div',
            { class: 'stack' },
            checkField(
              'Always finish the sequence',
              () => !!seq.ground,
              (v) => edit(() => (seq.ground = v ? 1 : 0)),
              'Other keys can’t interrupt it — good for jumps',
            ),
            checkField(
              'Once per key press',
              () => !!seq.norepeat,
              (v) => edit(() => (seq.norepeat = v ? 1 : 0)),
              'Otherwise it repeats while the key is held',
            ),
            checkField(
              'Moves with momentum',
              () => !!seq.momentum,
              (v) => edit(() => ((seq.momentum = v ? 1 : 0), (stageInfo.textContent = describeTravel(seq)))),
              'Moves push the hero instead of placing it, like gravity',
            ),
          ),
          help('Each frame shows for its ticks, then the hero moves by its x and y.'),
        ),
        own
          ? group(
              'Requirements',
              '🔑',
              h(
                'div',
                { class: 'chr-fields' },
                h(
                  'label',
                  { class: 'field' },
                  h('span', null, 'Needs this object'),
                  blockButton(
                    () => bbl,
                    pal,
                    () => seq.bloc,
                    (v) => edit(() => (seq.bloc = v)),
                    {
                      title: 'The object the hero must carry to do this',
                      extras: [{ value: BACKBL, label: 'nothing', icon: '∅' }],
                      transparent: false,
                      only: (b) => !!b.obj,
                    },
                  ),
                ),
                selectField(
                  'Uses',
                  [
                    [0, 'Unlimited'],
                    [1, 'Limited'],
                  ] as [number, string][],
                  () => (meter === INF_REPEAT ? 0 : 1),
                  (v) => edit(() => ((chr.meter[current] = v ? 10 : INF_REPEAT), renderDetail())),
                ),
                meter !== INF_REPEAT
                  ? numberField(
                      'Uses at start',
                      () => meter,
                      (v) => edit(() => (chr.meter[current] = v)),
                      { min: 0, max: 32766 },
                    )
                  : null,
              ),
              help(`Limited uses work like ammo: each run uses one, and blocks set to change "Repetition count ${current - 4}" give more.`),
            )
          : null,
        group(
          'Sound',
          '♪',
          h(
            'div',
            { class: 'chr-fields' },
            selectField('Plays when it starts', soundOptions, soundNo, (v) => edit(() => (seq.sound = v))),
            h('button', { class: 'chr-play', title: 'Listen', disabled: !sounds, onclick: () => void playSound(soundNo()) }, '▶ Listen'),
          ),
          help(
            sounds ? `Sounds come from ${sndName}: a Sound Blaster .voc where one is set, otherwise the PC speaker tune.` : 'This game has no sound set yet.',
          ),
        ),
      ),
    );
    animate(seq);
  }

  // ---------------------------------------------------------------- page
  function render(): void {
    renderSheet();
    renderList();
    renderDetail();
  }

  // Two tabs, so each half gets the screen: how the hero starts, and its sequences (remembered per browser).
  const TAB_KEY = 'gm-chr-tab';
  let tab: 'start' | 'seqs' = 'start';
  try {
    if (localStorage.getItem(TAB_KEY) === 'seqs') tab = 'seqs';
  } catch {
    /* private mode */
  }
  if (view.get('tab') === 'start' || view.get('tab') === 'sequences') tab = view.get('tab') === 'start' ? 'start' : 'seqs';
  const startPanel = h('section', { class: 'chr-panel', id: 'chr-start', role: 'tabpanel', 'aria-labelledby': 'chr-tab-start' }, sheet);
  const seqPanel = h(
    'section',
    { class: 'chr-panel', id: 'chr-seqs', role: 'tabpanel', 'aria-labelledby': 'chr-tab-seqs' },
    h('div', { class: 'chr-seqs' }, list, detail),
  );
  const tabButton = (key: 'start' | 'seqs', label: string) =>
    h(
      'button',
      {
        class: 'chr-tab',
        id: `chr-tab-${key}`,
        role: 'tab',
        'aria-controls': `chr-${key}`,
        onclick: () => showTab(key, true),
        onkeydown: (e: KeyboardEvent) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          showTab(key === 'start' ? 'seqs' : 'start', true);
          tabBar.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
        },
      },
      label,
    );
  const tabBar = h(
    'div',
    { class: 'chr-tabs', role: 'tablist', 'aria-label': 'Character' },
    tabButton('start', 'At the start'),
    tabButton('seqs', 'Sequences (moves)'),
  );
  function showTab(key: 'start' | 'seqs', remember = false): void {
    tab = key;
    startPanel.hidden = key !== 'start';
    seqPanel.hidden = key !== 'seqs';
    for (const b of tabBar.querySelectorAll<HTMLElement>('.chr-tab')) {
      const on = b.id === `chr-tab-${key}`;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    view.set({ tab: key === 'start' ? 'start' : 'sequences' });
    if (remember)
      try {
        localStorage.setItem(TAB_KEY, key);
      } catch {
        /* private mode */
      }
  }

  clear(
    host,
    h(
      'div',
      { class: 'chr-editor' },
      h(
        'div',
        { class: 'ed-head' },
        // the tabs sit under the hint, beside the files, so the sequences get the height
        h(
          'div',
          { class: 'chr-head-main' },
          h(
            'p',
            { class: 'hint' },
            `The hero: how it starts the game, and how it moves. Objects come from ${bblName || 'no block set'} and sounds from ${sndName || 'no sound set'}.`,
          ),
          h('div', { class: 'chr-tabrow' }, tabBar, h('div', { class: 'toolbar chr-undo' }, undoBtn, redoBtn)),
        ),
        fileField(
          project,
          'Character blocks',
          ['cbl'],
          () => cblName,
          (v) => {
            if (!v) return;
            cblName = v;
            cbl = parseBlocks(project.files.get(v)!, CHARBL);
            render();
          },
          { allowNone: false },
        ),
        chooser.el,
      ),
      startPanel,
      seqPanel,
    ),
  );
  showTab(tab);
  render();
  return () => {
    window.removeEventListener('keydown', onKey);
    clearTimeout(timer);
    audio.stopSpeaker();
    audio.stopVoc();
  };
});
