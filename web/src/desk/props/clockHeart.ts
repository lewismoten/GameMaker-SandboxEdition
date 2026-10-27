// The tin heart in the wall clock (tinHearts/deskHearts.ts): once the rubber chicken has popped
// out of the wristwatch a few times, every pop after that drops a small tin heart out with him,
// until it is taken. It waits on the clock's lug for a while, a button of its own (Tab reaches it
// right after the clock), then slips back in; the next pop brings it out again. Where the clock
// isn't drawn (a narrow or not-so-wide window), clock.ts lets the DOS prompt's TIME stand in for
// pressing it, and the heart rolls out beside the monitor instead.
import { h } from '../../editor/core/ui';
import { chickenPopped, CLOCK_HEART, takeClockHeart } from '../../tinHearts/deskHearts';
import { deskHeartStates, setOverride } from '../../tinHearts/tinHearts';
import { say } from './propKit';
import { roomSound } from './propSound';
import { tinHeartSvg } from './tinHeartArt';

/**
 * How long it waits to be taken before it slips back in (unless it has focus or the pointer): on
 * the clock, half a minute; by the monitor, longer, since the screen keeps Tab while it has focus.
 */
const WAITS_MS = { clock: 30_000, pc: 120_000 };

/** What the room says when it is taken. */
const TAKEN = 'A tin heart, ticking like it means it. Sir Reginald must have been keeping it warm in there. It’s yours now.';

/** Is the clock heart found now (taken in the room, or added in EGG.EXE)? */
const clockHeartFound = (): boolean => deskHeartStates().find((s) => s.id === CLOCK_HEART)?.found ?? false;

export interface ClockHeart {
  /** The chicken popped out: counts the pop, and true when the heart comes out this time. */
  popped(): boolean;
  /** Shows the heart: on the wall clock, or (where it isn't drawn) beside the monitor. */
  show(where: 'clock' | 'pc'): void;
  off(): void;
}

export function clockHeart(clock: HTMLElement): ClockHeart {
  const btn = h('button', {
    type: 'button',
    class: 'clock-heart room-prop',
    'aria-label': 'A small tin heart, fallen out of the wall clock: take it',
    title: 'A small tin heart, ticking',
  });
  btn.append(tinHeartSvg(40));
  let timer = 0;
  let where: 'clock' | 'pc' = 'clock';
  const anchor = () => (where === 'clock' ? clock : (clock.closest('.desk')?.querySelector('.monitor') ?? clock));

  const hide = () => {
    clearTimeout(timer);
    if (!btn.isConnected) return;
    const had = document.activeElement === btn;
    btn.remove();
    if (had && where === 'clock') clock.focus();
  };
  const wait = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => (btn.matches(':hover, :focus') ? wait() : hide()), WAITS_MS[where]);
  };

  btn.addEventListener('click', () => {
    if (clockHeartFound()) return hide();
    const at = anchor();
    // taken in the room: a find EGG.EXE had taken away counts again
    setOverride(CLOCK_HEART, undefined);
    takeClockHeart();
    roomSound.watch();
    hide();
    say(at, TAKEN, tinHeartSvg(48));
  });

  return {
    popped: () => chickenPopped(clockHeartFound()),
    show(to) {
      where = to;
      btn.classList.toggle('by-pc', to === 'pc');
      if (to === 'clock') clock.after(btn);
      else {
        // on the monitor's bezel, in the monitor's own box so it scrolls with it; before the
        // monitor when tabbing, since the screen (last) keeps Tab
        const mon = clock.closest('.desk')?.querySelector<HTMLElement>('.monitor');
        if (!mon) return;
        mon.before(btn);
        btn.style.left = `${mon.offsetLeft + 10}px`;
        btn.style.top = `${mon.offsetTop + mon.offsetHeight - 52}px`;
      }
      // restart its drop
      btn.classList.remove('out');
      void btn.offsetWidth;
      btn.classList.add('out');
      wait();
    },
    off: () => {
      clearTimeout(timer);
      btn.remove();
    },
  };
}
