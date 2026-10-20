// On-screen controls for touch screens: a direction pad plus a button for every other
// key the current character's sequences use, and Esc/F1/F2. Buttons send scan codes.
import type { Keyboard } from '../input/keyboard';
import { scanName } from '../input/scancodes';

const ARROWS = new Set([72, 75, 77, 80, 71, 73, 79, 81]);

export class TouchControls {
  readonly el: HTMLElement;
  private keys: HTMLElement;
  private shown = '';

  constructor(private keyboard: Keyboard) {
    this.el = document.createElement('div');
    this.el.className = 'gm-touch';
    const pad = document.createElement('div');
    pad.className = 'gm-pad';
    for (const [scan, label, area] of [
      [72, '▲', 'up'],
      [75, '◀', 'left'],
      [77, '▶', 'right'],
      [80, '▼', 'down'],
    ] as [number, string, string][])
      pad.append(this.button(scan, label, area));
    this.keys = document.createElement('div');
    this.keys.className = 'gm-keys';
    const sys = document.createElement('div');
    sys.className = 'gm-sys';
    sys.append(this.button(1, 'Esc'), this.button(59, 'F1'), this.button(60, 'F2'), this.button(28, 'Enter'));
    this.el.append(pad, this.keys, sys);
  }

  private button(scan: number, label: string, area?: string): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.setAttribute('aria-label', scanName(scan));
    if (area) b.style.gridArea = area;
    const down = (e: Event) => {
      e.preventDefault();
      b.classList.add('down');
      this.keyboard.inject(scan, true);
    };
    const up = (e: Event) => {
      e.preventDefault();
      b.classList.remove('down');
      this.keyboard.inject(scan, false);
    };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('pointerleave', up);
    return b;
  }

  /** Shows a button for each non-arrow key used by the character (scan codes). */
  setKeys(scans: number[]): void {
    const list = [...new Set(scans.filter((s) => s && !ARROWS.has(s) && s !== 1 && !(s >= 59 && s <= 68)))].slice(0, 8);
    const sig = list.join(',');
    if (sig === this.shown) return;
    this.shown = sig;
    this.keys.replaceChildren(...list.map((s) => this.button(s, scanName(s).replace(/ \/ .*/, ''))));
  }
}

export function wantsTouchControls(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
}
