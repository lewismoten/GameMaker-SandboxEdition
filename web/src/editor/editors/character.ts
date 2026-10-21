// Character editor (CHAREDIT.EXE): the hero's starting health, money, counters and
// inventory, and its sequences (idle, die, hurt, pick up, drop and up to 15 of your own),
// each a series of 20x40 frames made of a top and a bottom block.
import './character.css';
import { registerEditor } from './index';
import { fileField } from '../filePicker';
import { blockButton, chooseBlock, type BlockExtra } from '../blockChooser';
import { h, clear, numberField, selectField, checkField, debounce } from '../core/ui';
import { drawBlockTo, paintBlock } from '../core/draw';
import { paletteChooser } from './blocks';
import { audio } from './mediaShared';
import { BACKBL, BLEN, CHARBL, MONBL, newBlockSet, parseBlocks } from '../../formats/blocks';
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
} from '../../formats/character';
import { LASTSND, parseSoundSet, SOUND_NAMES } from '../../formats/sound';
import { scanName, SCAN } from '../../input/scancodes';
import {
  ORIENT_NAMES,
  bottomOrient,
  deleteFrame,
  firesMonster,
  flipHOrient,
  flipVOrient,
  insertFrame,
  moveFrame,
  normalOrient,
  rotateOrient,
  topOrient,
  travel,
  withBottomOrient,
  withTopOrient,
} from './characterLogic';

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
  let current = 0;
  let withSound = false;
  const save = debounce(() => project.files.set(file, serializeCharacter(chr)), 250);
  const edit = (fn: () => void) => {
    fn();
    save();
  };
  const chooser = paletteChooser(project, cblName || file, () => render());
  const pal = () => chooser.palette;

  const seqName = (i: number) => SEQUENCE_NAMES[i] ?? (chr.sequences[i].key ? `Key ${scanName(chr.sequences[i].key >> 8)}` : 'No key yet');
  const help = (text: string) => h('p', { class: 'chr-help' }, text);
  const group = (title: string, icon: string, ...body: (Node | null)[]) =>
    h('section', { class: 'chr-group' }, h('h4', null, h('span', { class: 'chr-icon' }, icon), title), ...body);

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
        h('h4', null, h('span', { class: 'chr-icon' }, '▦'), 'Starting inventory'),
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
          { class: `chr-seq${i === current ? ' selected' : ''}${frameCount(s) ? '' : ' empty'}`, onclick: () => ((current = i), renderList(), renderDetail()) },
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

  function drawStage(seq: Sequence, i: number, pos: { x: number; y: number }, burst: string): void {
    const ctx = stage.getContext('2d')!;
    ctx.fillStyle = '#05061a';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.fillStyle = '#12163a';
    for (let x = 0; x < STAGE_W; x += BLEN) ctx.fillRect(x, 0, 1, STAGE_H);
    for (let y = 0; y < STAGE_H; y += BLEN) ctx.fillRect(0, y, STAGE_W, 1);
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

  // ---------------------------------------------------------------- frames
  function keyPicker(seq: Sequence): HTMLElement {
    const btn = h('button', { class: 'chr-key', title: 'Click, then press the key' }, seq.key ? scanName(seq.key >> 8) : 'None');
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
    return h(
      'label',
      { class: 'field' },
      h('span', null, 'Key'),
      h(
        'div',
        { class: 'row', style: 'gap:4px' },
        btn,
        seq.key ? h('button', { onclick: () => (edit(() => (seq.key = 0)), renderList(), renderDetail()) }, 'Clear') : null,
      ),
    );
  }

  /** One block of a frame: click to choose, hover for rotate / flip buttons. */
  function frameCell(f: Frame, top: boolean): HTMLElement {
    const get = () => (top ? f.pic1 : f.pic2);
    const orient = () => (top ? topOrient(f) : bottomOrient(f));
    const canvas = h('canvas', { width: BLEN, height: BLEN, class: 'pixel' });
    const cell = h('div', { class: 'chr-cell checker' });
    const paint = (changed = false) => {
      const n = get();
      cell.classList.toggle('none', n >= CHARBL);
      cell.title =
        n < CHARBL
          ? `${top ? 'Top' : 'Bottom'}: block ${n}, ${ORIENT_NAMES[normalOrient(orient())].toLowerCase()} — click to change`
          : `No ${top ? 'top' : 'bottom'} block — click to choose one`;
      if (n < CHARBL) paintBlock(canvas, cbl[n].pixels, pal(), { transparent: true, orient: normalOrient(orient()) });
      else canvas.getContext('2d')!.clearRect(0, 0, BLEN, BLEN);
      if (changed) renderList();
    };
    const turn = (fn: (o: number) => number, label: string, icon: string) =>
      h(
        'button',
        {
          class: 'chr-turn',
          title: label,
          'aria-label': label,
          onclick: (e: Event) => {
            e.stopPropagation();
            edit(() => (f.orient = top ? withTopOrient(f, fn(topOrient(f))) : withBottomOrient(f, fn(bottomOrient(f)))));
            paint(true);
          },
        },
        icon,
      );
    const extras: BlockExtra[] = [{ value: CHARBL, label: 'none', icon: '∅' }];
    if (!top) extras.push({ value: MONBL, label: 'Fire a monster', icon: '🔥' });
    cell.addEventListener('click', async () => {
      const n = await chooseBlock(`${top ? 'Top' : 'Bottom'} block`, cbl, pal(), get(), extras, true);
      if (n === undefined) return;
      const wasFiring = firesMonster(f);
      edit(() => {
        if (top) f.pic1 = n;
        else {
          if (n === MONBL && !wasFiring) f.pic1 = 0;
          else if (n !== MONBL && wasFiring) f.pic1 = CHARBL;
          f.pic2 = n;
        }
      });
      if (wasFiring !== firesMonster(f)) renderDetail();
      else paint(true);
    });
    cell.append(
      canvas,
      h(
        'div',
        { class: 'chr-turns' },
        turn(rotateOrient, 'Rotate a quarter turn', '↻'),
        turn(flipHOrient, 'Flip left ↔ right', '⇆'),
        turn(flipVOrient, 'Flip upside down', '⇅'),
      ),
    );
    paint();
    return cell;
  }

  function frameCard(seq: Sequence, f: Frame, i: number, n: number): HTMLElement {
    const fires = firesMonster(f);
    const tool = (label: string, icon: string, fn: () => void, disabled = false) =>
      h('button', { class: 'chr-tool', title: label, 'aria-label': label, disabled, onclick: () => (edit(fn), renderDetail()) }, icon);
    const sprite = fires
      ? h(
          'div',
          { class: 'chr-sprite fires' },
          h(
            'div',
            { class: 'chr-fire' },
            h('span', { class: 'chr-fire-icon' }, '🔥'),
            numberField(
              'Monster #',
              () => f.pic1,
              (v) => edit(() => (f.pic1 = v)),
              { min: 0, max: 63, title: 'Which monster (from the monster file) is born beside the hero' },
            ),
          ),
          frameCell(f, false),
        )
      : h('div', { class: 'chr-sprite' }, frameCell(f, true), frameCell(f, false));
    return h(
      'div',
      { class: 'chr-frame' },
      h(
        'div',
        { class: 'chr-frame-head' },
        h('b', null, i + 1),
        tool('Move earlier', '◀', () => moveFrame(seq, i, -1), i === 0),
        tool('Move later', '▶', () => moveFrame(seq, i, 1), i >= n - 1),
        tool('Duplicate', '⧉', () => insertFrame(seq, i), n >= MAXFRAME),
        tool('Delete', '✕', () => deleteFrame(seq, i)),
      ),
      sprite,
      h(
        'div',
        { class: 'chr-frame-fields' },
        numberField(
          '→ x',
          () => f.x,
          (v) => edit(() => ((f.x = v), (stageInfo.textContent = describeTravel(seq)))),
          { min: -20, max: 20, title: 'Pixels to move right (negative: left) when this frame shows' },
        ),
        numberField(
          '↓ y',
          () => f.y,
          (v) => edit(() => ((f.y = v), (stageInfo.textContent = describeTravel(seq)))),
          { min: -20, max: 20, title: 'Pixels to move down (negative: up) when this frame shows' },
        ),
        numberField(
          '⏱ ticks',
          () => f.pause,
          (v) => edit(() => ((f.pause = v), (stageInfo.textContent = describeTravel(seq)))),
          { min: 0, max: 999, title: 'How long the frame shows, in 1/18 s ticks' },
        ),
      ),
    );
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

    frameCards = seq.frames.slice(0, n).map((f, i) => frameCard(seq, f, i, n));
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
          h('h3', null, `${current}. ${seqName(current)}`),
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
          stageInfo,
        ),
      ),
      h(
        'section',
        { class: 'chr-frames-wrap' },
        h('h4', null, 'Frames ', h('span', { class: 'chr-muted' }, `${n} of ${MAXFRAME} · hover a block to turn or flip it, click it to change it`)),
        h('div', { class: 'chr-frames' }, ...frameCards, addFrame),
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
                keyPicker(seq),
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

  clear(
    host,
    h(
      'div',
      { class: 'chr-editor' },
      h(
        'div',
        { class: 'ed-head' },
        h(
          'p',
          { class: 'hint' },
          `The hero: how it starts the game, and how it moves. Objects come from ${bblName || 'no block set'} and sounds from ${sndName || 'no sound set'}.`,
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
      h('h3', { class: 'chr-title' }, 'At the start of the game'),
      sheet,
      h('h3', { class: 'chr-title' }, 'Sequences'),
      h('div', { class: 'chr-seqs' }, list, detail),
    ),
  );
  render();
  return () => {
    clearTimeout(timer);
    audio.stopSpeaker();
    audio.stopVoc();
  };
});
