// The character editor's frame cards: a sequence frame's top and bottom blocks (click to
// choose, hover to turn or flip), or the monster it fires; its move and pause; and the
// buttons that move, copy or delete it. Also the key a sequence runs on. character.ts
// builds them, passing what they need to read and change (FrameContext).
import { h, numberField } from '../../core/ui';
import { paintBlock } from '../../core/draw';
import { chooseBlock, type BlockExtra } from '../../widgets/blockChooser';
import { BLEN, CHARBL, MONBL, type Block } from '../../../formats/blocks';
import { MAXFRAME, type Frame, type Sequence } from '../../../formats/character';
import type { Palette } from '../../../formats/palette';
import { scanName, SCAN } from '../../../input/scancodes';
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
  withBottomOrient,
  withTopOrient,
} from './characterLogic';

/** What the frame cards read from the editor, and how they tell it something changed. */
export interface FrameContext {
  /** The character's block set (.cbl), as it is now. */
  blocks(): Block[];
  palette(): Palette;
  /** Makes a change as one undo step, and saves. */
  edit(fn: () => void): void;
  /** A frame's picture or a key changed: redraw the sequence list. */
  listChanged(): void;
  /** Frames were added, moved or removed: redraw the sequence's detail. */
  redraw(): void;
  /** A frame's move or pause changed: update the distance the sequence travels. */
  travelChanged(seq: Sequence): void;
}

export function keyPicker(ctx: FrameContext, seq: Sequence): HTMLElement {
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
      ctx.edit(() => (seq.key = (scan << 8) | ascii));
      ctx.listChanged();
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
      seq.key ? h('button', { onclick: () => (ctx.edit(() => (seq.key = 0)), ctx.listChanged(), ctx.redraw()) }, 'Clear') : null,
    ),
  );
}

/** One block of a frame: click to choose, hover for rotate / flip buttons. */
export function frameCell(ctx: FrameContext, f: Frame, top: boolean): HTMLElement {
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
    if (n < CHARBL) paintBlock(canvas, ctx.blocks()[n].pixels, ctx.palette(), { transparent: true, orient: normalOrient(orient()) });
    else canvas.getContext('2d')!.clearRect(0, 0, BLEN, BLEN);
    if (changed) ctx.listChanged();
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
          ctx.edit(() => (f.orient = top ? withTopOrient(f, fn(topOrient(f))) : withBottomOrient(f, fn(bottomOrient(f)))));
          paint(true);
        },
      },
      icon,
    );
  const extras: BlockExtra[] = [{ value: CHARBL, label: 'none', icon: '∅' }];
  if (!top) extras.push({ value: MONBL, label: 'Fire a monster', icon: '🔥' });
  cell.addEventListener('click', async () => {
    const n = await chooseBlock(`${top ? 'Top' : 'Bottom'} block`, ctx.blocks(), ctx.palette(), get(), extras, true);
    if (n === undefined) return;
    const wasFiring = firesMonster(f);
    ctx.edit(() => {
      if (top) f.pic1 = n;
      else {
        if (n === MONBL && !wasFiring) f.pic1 = 0;
        else if (n !== MONBL && wasFiring) f.pic1 = CHARBL;
        f.pic2 = n;
      }
    });
    if (wasFiring !== firesMonster(f)) ctx.redraw();
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

export function frameCard(ctx: FrameContext, seq: Sequence, f: Frame, i: number, n: number): HTMLElement {
  const fires = firesMonster(f);
  const tool = (label: string, icon: string, fn: () => void, disabled = false) =>
    h('button', { class: 'chr-tool', title: label, 'aria-label': label, disabled, onclick: () => (ctx.edit(fn), ctx.redraw()) }, icon);
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
            (v) => ctx.edit(() => (f.pic1 = v)),
            { min: 0, max: 63, title: 'Which monster (from the monster file) is born beside the hero' },
          ),
        ),
        frameCell(ctx, f, false),
      )
    : h('div', { class: 'chr-sprite' }, frameCell(ctx, f, true), frameCell(ctx, f, false));
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
        (v) => ctx.edit(() => ((f.x = v), ctx.travelChanged(seq))),
        { min: -20, max: 20, title: 'Pixels to move right (negative: left) when this frame shows' },
      ),
      numberField(
        '↓ y',
        () => f.y,
        (v) => ctx.edit(() => ((f.y = v), ctx.travelChanged(seq))),
        { min: -20, max: 20, title: 'Pixels to move down (negative: up) when this frame shows' },
      ),
      numberField(
        '⏱ ticks',
        () => f.pause,
        (v) => ctx.edit(() => ((f.pause = v), ctx.travelChanged(seq))),
        { min: 0, max: 999, title: 'How long the frame shows, in 1/18 s ticks' },
      ),
    ),
  );
}
