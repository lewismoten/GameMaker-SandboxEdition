// The close-up of Teddy's Forte Locks toy safe: the dial turns by drag, scroll wheel or the arrow
// keys (Left and Right a tick, Shift five) or by typing a number in the box, which turns the dial
// there smoothly (right, left, right for the three entries); a right, left, right combination opens the door on a
// little dog treat store paid for in the games' leftover pretend coins. Esc closes it and puts
// the keyboard back on the safe.
import './safeDialog.css';
import { h } from '../editor/core/ui';
import { focusInto } from '../desk/overlayFocus';
import { roomSound } from '../desk/props/propSound';
import { stillMotion } from '../desk/props/propKit';
import { newDial, opens, spin, turnDial, TICKS, type Dial, type Turn } from './dial';
import { loadMoney } from './money';
import { balance, buy, loadSafe, saveSafe, type SafeRecord } from './store';
import { safeSvg } from './safeArt';
import { teddySvg } from './teddyArt';
import { TREATS, treatById } from './treats';

const TICK_DEG = 360 / TICKS;
const fmt = (n: number) => n.toLocaleString('en-US');
const coins = (n: number) => `${fmt(n)} pretend coin${n === 1 ? '' : 's'}`;

function teddy(): HTMLElement {
  const el = h('div', { class: 'kn-teddy', 'aria-hidden': 'true' });
  el.innerHTML = teddySvg();
  return el;
}

export async function openSafe(): Promise<void> {
  let rec: SafeRecord = await loadSafe();
  const saved = Object.values(await loadMoney()).reduce((a, b) => a + b, 0);
  let dial: Dial = newDial();
  let showOpen = rec.opened; // opened once: it opens with one press from then on
  let back = () => {};

  const stage = h('div', { class: 'kn-stage' });
  const status = h('p', { class: 'kn-status', role: 'status', 'aria-live': 'polite' });
  const live = h('div', { class: 'kn-sr', role: 'status', 'aria-live': 'polite' });
  const side = h('div', { class: 'kn-side' });
  const panel = h('div', { class: 'kn-panel' }, stage, side);
  const overlay = h(
    'div',
    { class: 'desk-overlay kn-overlay', role: 'dialog', 'aria-label': 'Teddy’s Forte Locks toy safe, close-up' },
    h('button', { class: 'close', type: 'button', onclick: () => close() }, 'Close (Esc)'),
    panel,
    live,
  );

  const close = () => {
    window.removeEventListener('keydown', onKey, true);
    overlay.remove();
    back();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopImmediatePropagation();
      e.preventDefault();
      close();
    }
  };

  // ---- the dial ------------------------------------------------------------------------
  let announce = 0;
  const say = (text: string) => {
    status.textContent = text;
  };
  const dialEl = (): HTMLElement | null => stage.querySelector('.kn-dial');
  const setAngle = (deg: number) => {
    const g = stage.querySelector<SVGGElement>('.kn-dial-turn');
    if (g) g.style.transform = `rotate(${deg}deg)`;
  };
  const paint = () => {
    const d = dialEl();
    setAngle(-dial.pos * TICK_DEG);
    if (d) {
      d.setAttribute('aria-valuenow', String(dial.pos));
      d.setAttribute('aria-valuetext', `${dial.pos}`);
    }
    clearTimeout(announce);
    announce = window.setTimeout(() => (live.textContent = `${dial.pos}`), 250);
  };
  const turn = (ticks: number) => {
    stopAnim();
    const dir = Math.sign(ticks);
    for (let i = 0; i < Math.abs(ticks); i++) {
      dial = turnDial(dial, dir);
      if (dial.pos % 5 === 0) roomSound.dialClick();
    }
    paint();
  };

  // ---- the number box: the dial turns to a typed number --------------------------------
  const ENTRY_DIRS: Turn[] = ['right', 'left', 'right'];
  let entry = 0; // which of the three numbers is next
  let raf = 0;
  let finishAnim: (() => void) | undefined;
  function stopAnim() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
    finishAnim?.();
  }
  /** Turns `steps` ticks in `dir`, animated (instant with reduced motion), clicking at each 5. */
  function animateTurn(steps: number, dir: Turn, done: () => void) {
    stopAnim();
    const sign = dir === 'right' ? 1 : -1;
    const start = -dial.pos * TICK_DEG; // the angle now; turning right raises it (clockwise)
    const before = dial;
    let clicked = 0;
    const clicksTo = (n: number) => {
      for (; clicked < n;) {
        clicked++;
        if (((((before.pos - sign * clicked) % TICKS) + TICKS) % TICKS) % 5 === 0) roomSound.dialClick();
      }
    };
    const land = () => {
      raf = 0;
      finishAnim = undefined;
      clicksTo(steps);
      dial = turnDial(before, sign * steps);
      paint();
      done();
    };
    if (stillMotion() || steps === 0) return land();
    const t0 = performance.now();
    const ms = Math.min(1000, 450 + steps * 9);
    finishAnim = land;
    const frame = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setAngle(start + sign * steps * TICK_DEG * eased);
      clicksTo(Math.floor(steps * eased));
      if (k < 1) raf = requestAnimationFrame(frame);
      else land();
    };
    raf = requestAnimationFrame(frame);
  }
  const stepsFor = (target: number, dir: Turn) => (dir === 'right' ? (dial.pos - target + TICKS) % TICKS : (target - dial.pos + TICKS) % TICKS);
  let dirLabel: HTMLElement | undefined;
  let numBox: HTMLInputElement | undefined;
  const showNext = () => {
    if (dirLabel) dirLabel.textContent = `Turn ${ENTRY_DIRS[entry % 3]} to`;
  };
  function goTo() {
    const raw = numBox?.value.trim() ?? '';
    const n = Number(raw);
    if (!raw || !Number.isInteger(n) || n < 0 || n >= TICKS) return say(`Type a whole number from 0 to ${TICKS - 1}.`);
    const dir = ENTRY_DIRS[entry % 3];
    const steps = stepsFor(n, dir);
    if (!steps) return say(`The dial is already at ${n}. Pick another number.`);
    entry++;
    showNext();
    say(`Turning ${dir} to ${n}.`);
    animateTurn(steps, dir, () => say(`Turned ${dir} to ${n}.`));
  }
  function reset() {
    const right = dial.pos <= TICKS / 2;
    animateTurn(right ? dial.pos : TICKS - dial.pos, right ? 'right' : 'left', () => {
      dial = newDial();
      entry = 0;
      showNext();
      paint();
      say('The dial is back at 0 and the numbers are forgotten.');
    });
  }

  function wireDial(el: HTMLElement) {
    el.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') turn(step);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') turn(-step);
      else if (e.key === 'Enter') return tryDoor();
      else return;
      e.preventDefault();
    });
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        turn(e.deltaY > 0 ? 1 : -1);
      },
      { passive: false },
    );
    let last: number | undefined;
    let carry = 0;
    const angle = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
    };
    el.addEventListener('pointerdown', (e) => {
      last = angle(e);
      carry = 0;
      el.setPointerCapture(e.pointerId);
      el.focus({ preventScroll: true });
    });
    el.addEventListener('pointermove', (e) => {
      if (last === undefined) return;
      const a = angle(e);
      let d = a - last;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      last = a;
      carry += d;
      const t = Math.trunc(carry / TICK_DEG);
      if (t) {
        carry -= t * TICK_DEG;
        turn(t);
      }
    });
    const end = () => (last = undefined);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  function tryDoor() {
    stopAnim();
    if (opens(dial)) {
      roomSound.dialClick();
      rec = { ...rec, opened: true };
      showOpen = true;
      void saveSafe(rec);
      render();
      say('Click-clunk! The door swings open.');
    } else {
      dial = spin(dial);
      entry = 0;
      showNext();
      say(
        dial.pos === 0 && !dial.runs.length
          ? 'The door does not budge.'
          : 'The door does not budge. Hint: right, left, right, and stop on each number. Somebody wrote it down near the phone.',
      );
    }
  }

  // ---- the store -----------------------------------------------------------------------
  let reaction: HTMLElement | undefined;
  const eat = (id: string) => {
    const next = buy(rec, id, saved);
    const t = treatById(id);
    if (!next || !t) return;
    rec = next;
    void saveSafe(rec);
    roomSound.treatCrunch();
    render();
    const line = side.querySelector<HTMLElement>('.kn-line');
    if (line) line.textContent = t.line;
    live.textContent = '';
    setTimeout(() => (live.textContent = `Bought ${t.name}. ${t.line}`), 50);
    reaction = side.querySelector('.kn-teddy') as HTMLElement;
    if (!stillMotion()) {
      reaction?.classList.remove('kn-munch');
      void reaction?.offsetWidth;
      reaction?.classList.add('kn-munch');
    }
    side.querySelector<HTMLElement>(`[data-treat="${id}"]`)?.focus({ preventScroll: true });
  };

  function store(): HTMLElement {
    const left = balance(saved, rec);
    const list = TREATS.filter((t) => rec.treats[t.id]);
    return h(
      'div',
      { class: 'kn-store' },
      h('h2', null, 'Teddy’s treat store'),
      h('p', { class: 'kn-bal' }, `In the safe: ${coins(left)}`),
      h(
        'ul',
        { class: 'kn-menu' },
        ...TREATS.map((t) =>
          h(
            'li',
            null,
            h('span', null, t.name),
            h('b', null, t.price ? coins(t.price) : 'free'),
            h(
              'button',
              {
                type: 'button',
                'data-treat': t.id,
                'aria-label': `Buy ${t.name} for ${t.price ? coins(t.price) : 'free'}`,
                ...(t.price > left ? { disabled: true } : {}),
                onclick: () => eat(t.id),
              },
              'Buy',
            ),
          ),
        ),
      ),
      h('div', { class: 'kn-eat' }, teddy(), h('p', { class: 'kn-line' }, 'Teddy sits at the safe and waits. His ears are perfectly even.')),
      h('h3', null, 'Treat list'),
      list.length
        ? h('ul', { class: 'kn-list' }, ...list.map((t) => h('li', null, `${t.name} × ${rec.treats[t.id]}`)))
        : h('p', { class: 'kn-none' }, 'Nothing eaten yet.'),
      h(
        'button',
        { type: 'button', class: 'kn-shut', onclick: () => ((showOpen = false), (dial = newDial()), render(), say('The door is shut.')) },
        'Close the door',
      ),
    );
  }

  function render() {
    stage.innerHTML = '';
    side.innerHTML = '';
    const art = h('div', { class: 'kn-art', 'aria-hidden': 'true' });
    art.innerHTML = safeSvg(showOpen, dial.pos);
    if (showOpen) {
      stage.append(art);
      side.append(store());
      return;
    }
    // the dial: a slider the size of the dial's ring, laid over the drawing
    const knob = h('div', {
      class: 'kn-dial',
      role: 'slider',
      tabindex: '0',
      'aria-label': 'Combination dial. Left and Right arrows turn one number, with Shift five. Enter tries the door.',
      'aria-valuemin': '0',
      'aria-valuemax': String(TICKS - 1),
      'aria-valuenow': String(dial.pos),
      'aria-valuetext': String(dial.pos),
      'aria-orientation': 'horizontal',
    });
    wireDial(knob);
    art.append(knob);
    stage.append(art);
    dirLabel = h('label', { class: 'kn-dir', for: 'kn-num' });
    numBox = h('input', {
      id: 'kn-num',
      class: 'kn-num',
      type: 'number',
      min: '0',
      max: String(TICKS - 1),
      step: '1',
      inputmode: 'numeric',
      'aria-describedby': 'kn-dir-hint',
      onkeydown: (e: KeyboardEvent) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        e.stopPropagation();
        goTo();
      },
    });
    showNext();
    side.append(
      h('h2', null, 'Forte Locks'),
      h('p', { id: 'kn-dir-hint' }, 'Teddy’s toy safe. Type a number and Turn, or drag the dial, scroll over it or use the arrow keys. Then try the door.'),
      h('div', { class: 'kn-entry' }, dirLabel, numBox, h('button', { type: 'button', class: 'kn-turn primary', onclick: goTo }, 'Turn')),
      h(
        'div',
        { class: 'kn-btns' },
        h('button', { type: 'button', class: 'kn-try primary', onclick: tryDoor }, 'Try the door'),
        h('button', { type: 'button', class: 'kn-reset', onclick: reset }, 'Reset'),
      ),
      status,
    );
    if (rec.opened)
      side.append(h('button', { type: 'button', class: 'kn-reopen', onclick: () => ((showOpen = true), render()) }, 'Open the door (you know the way)'));
    paint();
  }

  window.addEventListener('keydown', onKey, true);
  document.body.append(overlay);
  render();
  back = focusInto(
    showOpen ? (overlay.querySelector('.kn-store button:not([disabled])') ?? overlay.querySelector('button.close')) : overlay.querySelector('.kn-dial'),
  );
}
