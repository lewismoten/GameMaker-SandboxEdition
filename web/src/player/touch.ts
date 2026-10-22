// On-screen controls for touch screens: a direction pad (slide a thumb around it, diagonals
// too), a button for every other key the current character's sequences use, and
// Esc/F1/F2/Enter. Buttons send scan codes, as if the keys were pressed.
//
// The screen keeps all the room it can; the controls float over the player, see-through
// until pressed (player.css): upright (9:16) the screen sits at the top with the pad and
// buttons over the black below it, sideways (16:9) they float over the screen's edges.
// 🎮 hides them (remembered).
import type { Keyboard } from '../input/keyboard';
import { scanName } from '../input/scancodes';

// Scan codes the pad covers: the arrows plus the keypad's diagonals (Home, PgUp, End, PgDn),
// so a character's diagonal keys don't also get action buttons.
const ARROWS = new Set([72, 75, 77, 80, 71, 73, 79, 81]);
const UP = 72;
const LEFT = 75;
const RIGHT = 77;
const DOWN = 80;

/** Arrow keys for a thumb at (dx, dy) from the pad's center; a dead zone in the middle. */
export function padKeys(dx: number, dy: number, radius: number): number[] {
  const dist = Math.hypot(dx, dy);
  if (dist < radius * 0.25) return [];
  // Eight 45° sectors: straight directions get one key, diagonals two. Screen y grows
  // downward, so positive angles are below center; ±4 are both "left" (atan2 wraps at ±180°).
  const sector = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
  const byS: Record<number, number[]> = {
    0: [RIGHT],
    1: [DOWN, RIGHT],
    2: [DOWN],
    3: [DOWN, LEFT],
    4: [LEFT],
    [-4]: [LEFT],
    [-3]: [UP, LEFT],
    [-2]: [UP],
    [-1]: [UP, RIGHT],
  };
  return byS[sector] ?? [];
}

/** 'portrait' when the player is taller than (about) square. */
// Up to 15% wider than tall still counts as portrait.
export function touchLayout(width: number, height: number): 'portrait' | 'landscape' {
  return width < height * 1.15 ? 'portrait' : 'landscape';
}

/** A short label for a key on a touch button. */
export function touchLabel(scan: number): string {
  const short: Record<number, string> = { 76: '5', 57: 'Space', 28: 'Enter', 29: 'Ctrl', 56: 'Alt', 42: 'Shift', 54: 'Shift', 15: 'Tab', 14: '⌫' };
  return short[scan] ?? scanName(scan).replace(/ \/ .*/, '');
}

const HIDE_KEY = 'gm-touch-controls';

/** The visitor hid the touch controls (they stay hidden in every game until shown again). */
function touchHidden(): boolean {
  try {
    return localStorage.getItem(HIDE_KEY) === 'hidden';
  } catch {
    return false;
  }
}

export class TouchControls {
  readonly el: HTMLElement;
  private actions: HTMLElement;
  private shown = '';
  private padDown = new Set<number>();
  private resize?: ResizeObserver;

  constructor(private keyboard: Keyboard) {
    this.el = document.createElement('div');
    this.el.className = 'gm-touch';
    this.el.addEventListener('contextmenu', (e) => e.preventDefault());

    const pad = document.createElement('div');
    pad.className = 'gm-pad';
    pad.setAttribute('role', 'group');
    pad.setAttribute('aria-label', 'Direction pad');
    const arrows: Record<number, HTMLElement> = {};
    for (const [scan, label, area] of [
      [UP, '▲', 'up'],
      [LEFT, '◀', 'left'],
      [RIGHT, '▶', 'right'],
      [DOWN, '▼', 'down'],
    ] as [number, string, string][]) {
      const s = document.createElement('span');
      s.className = `gm-arrow gm-${area}`;
      s.textContent = label;
      s.setAttribute('aria-hidden', 'true'); // (the pad is one control, named as a group)
      pad.append(s);
      arrows[scan] = s;
    }
    // The thumb's offset from the pad's center, with the pad's half width as the radius.
    const steer = (e: PointerEvent) => {
      const r = pad.getBoundingClientRect();
      this.setPad(padKeys(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2), r.width / 2), arrows);
    };
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      // Capture keeps the thumb steering even when it slides off the pad.
      pad.setPointerCapture?.(e.pointerId);
      steer(e);
    });
    pad.addEventListener('pointermove', (e) => {
      if (pad.hasPointerCapture?.(e.pointerId) || e.buttons) steer(e);
    });
    const release = () => this.setPad([], arrows);
    pad.addEventListener('pointerup', release);
    pad.addEventListener('pointercancel', release);
    pad.addEventListener('lostpointercapture', release);

    this.actions = document.createElement('div');
    this.actions.className = 'gm-actions';
    const sys = document.createElement('div');
    sys.className = 'gm-sys';
    sys.append(this.button(1, 'Esc'), this.button(59, 'F1'), this.button(60, 'F2'), this.button(28, 'Enter'), this.toggle());
    this.el.append(sys, pad, this.actions);
  }

  /** The switch that hides the controls (to see the whole screen, or to play with a keyboard), remembered. */
  private toggle(): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'gm-touch-toggle';
    b.textContent = '🎮';
    const set = (hidden: boolean) => {
      this.el.classList.toggle('gm-touch-hidden', hidden);
      b.setAttribute('aria-pressed', String(!hidden));
      b.setAttribute('aria-label', 'Touch controls');
      b.title = hidden ? 'Show the touch controls' : 'Hide the touch controls';
    };
    set(touchHidden());
    b.addEventListener('pointerdown', (e) => e.preventDefault()); // the game keeps the focus
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const hidden = !this.el.classList.contains('gm-touch-hidden');
      if (hidden) this.releaseAll();
      set(hidden);
      try {
        localStorage.setItem(HIDE_KEY, hidden ? 'hidden' : 'shown');
      } catch {
        /* private mode */
      }
    });
    return b;
  }

  /** Adds the controls to the player and keeps their layout matched to its shape. */
  attach(container: HTMLElement): void {
    container.classList.add('has-touch');
    container.append(this.el);
    const fit = () => {
      const layout = touchLayout(container.clientWidth, container.clientHeight);
      container.classList.toggle('touch-portrait', layout === 'portrait');
      container.classList.toggle('touch-landscape', layout === 'landscape');
    };
    fit();
    if (typeof ResizeObserver !== 'undefined') {
      this.resize = new ResizeObserver(fit);
      this.resize.observe(container);
    }
  }

  detach(): void {
    this.resize?.disconnect();
    this.releaseAll();
  }

  private releaseAll(): void {
    for (const s of this.padDown) this.keyboard.inject(s, false);
    this.padDown.clear();
    this.el.querySelectorAll('.gm-arrow.down').forEach((e) => e.classList.remove('down'));
    // (a held button lets go of its key the way a lost finger does)
    this.el.querySelectorAll('button.down').forEach((b) => b.dispatchEvent(new Event('pointercancel')));
  }

  /** Releases the arrows no longer wanted, then presses the new ones; a key held in both stays down untouched. */
  private setPad(keys: number[], arrows: Record<number, HTMLElement>): void {
    const want = new Set(keys);
    for (const s of [...this.padDown])
      if (!want.has(s)) {
        this.padDown.delete(s);
        arrows[s]?.classList.remove('down');
        this.keyboard.inject(s, false);
      }
    for (const s of want)
      if (!this.padDown.has(s)) {
        this.padDown.add(s);
        arrows[s]?.classList.add('down');
        this.keyboard.inject(s, true);
      }
  }

  private button(scan: number, label: string): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.setAttribute('aria-label', scanName(scan));
    const down = (e: PointerEvent) => {
      e.preventDefault();
      b.setPointerCapture?.(e.pointerId);
      b.classList.add('down');
      this.keyboard.inject(scan, true);
    };
    const up = (e: Event) => {
      e.preventDefault();
      if (!b.classList.contains('down')) return;
      b.classList.remove('down');
      this.keyboard.inject(scan, false);
    };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
    return b;
  }

  /** Shows a button for each non-arrow key used by the character (scan codes). */
  setKeys(scans: number[]): void {
    // Leaves out the pad's keys, Esc, Enter and F1-F10 (only F1 and F2 have buttons, in the fixed row); at most six.
    const list = [...new Set(scans.filter((s) => s && !ARROWS.has(s) && s !== 1 && s !== 28 && !(s >= 59 && s <= 68)))].slice(0, 6);
    const sig = list.join(',');
    if (sig === this.shown) return;
    this.shown = sig;
    this.actions.replaceChildren(...list.map((s) => this.button(s, touchLabel(s))));
    this.actions.dataset.count = String(list.length);
  }
}

/** Touch screens without a mouse; `?touch=1` / `?touch=0` in the address forces it. */
export function wantsTouchControls(): boolean {
  const forced = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('touch') : null;
  if (forced === '1' || forced === '0') return forced === '1';
  return typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
}
