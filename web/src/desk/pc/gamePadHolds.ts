// What is held on the desk's game pad (gamePad.ts) and its large controls (gamePadPanel.ts):
// the d-pad and buttons each pointer or key holds, handed to the PC's joystick
// (input/deskJoystick.ts), and every drawing of the pad shown pressed to match, a real
// gamepad's presses included.
import { holdDeskPad, padPosition, type Joy } from '../../input/deskJoystick';
import { showPad } from './gamePadArt';

/** What the pointers and keys hold on the pad, and the pad shown pressed. */
export class PadHolds {
  /** The d-pad, by who holds it (a pointer id, or a key on the large controls); the last one pushed wins. */
  private dirs = new Map<string, number>();
  private buttons = new Map<string, number>();
  private real: Joy = { pos: 0, buttons: 0 };
  private arts = new Set<HTMLElement>();

  /** A drawing to keep pressed as the pad is; returns what forgets it. */
  watch(art: HTMLElement): () => void {
    this.arts.add(art);
    this.show();
    return () => void this.arts.delete(art);
  }

  /** Holds the d-pad at `pos` (0 lets go) for `who`. */
  dir(who: string, pos: number): void {
    this.dirs.delete(who);
    if (pos) this.dirs.set(who, pos);
    this.changed();
  }

  /** Holds button `n` (1-4) down for `who`, or lets it go. */
  button(who: string, n: number, down: boolean): void {
    if (down) this.buttons.set(who, n);
    else this.buttons.delete(who);
    this.changed();
  }

  /** A real gamepad's d-pad and buttons, shown on the desk's. */
  gamepad(j: Joy | null): void {
    const next = j ?? { pos: 0, buttons: 0 };
    if (next.pos === this.real.pos && next.buttons === this.real.buttons) return;
    this.real = next;
    this.show();
  }

  letGo(): void {
    this.dirs.clear();
    this.buttons.clear();
    this.changed();
  }

  /** What the pad's own d-pad and buttons are held at. */
  held(): Joy {
    let pos = 0;
    for (const p of this.dirs.values()) pos = p;
    let buttons = 0;
    for (const n of this.buttons.values()) buttons |= 1 << (n - 1);
    return { pos, buttons };
  }

  private changed(): void {
    holdDeskPad(this.held());
    this.show();
  }

  private show(): void {
    const own = this.held();
    for (const art of this.arts) showPad(art, own.pos || this.real.pos, own.buttons | this.real.buttons);
  }
}

/**
 * Pressing a drawing of the pad with the pointer: a button, or the d-pad (pushed toward the
 * pointer, which can roll round it while held; a press just off its edge still pushes it).
 * Returns true for a press.
 */
export function pressWithPointer(holds: PadHolds, e: PointerEvent, art: HTMLElement): boolean {
  if (e.button > 0) return false;
  const target = e.target as Element;
  const btn = target.closest<HTMLElement>('.gp-btn, [data-b]');
  const pad = art.querySelector<HTMLElement>('.gp-dpad');
  // the d-pad, tilted away on the tray: the pointer's place across its drawn box gives the way
  const push = (m: PointerEvent): [number, number] => {
    const r = pad!.getBoundingClientRect();
    return [(m.clientX - r.left) / (r.width / 2) - 1, (m.clientY - r.top) / (r.height / 2) - 1];
  };
  const onDpad = !btn && !!pad && (!!target.closest('.gp-dpad, .gp-dirs') || Math.hypot(...push(e)) <= 1.3);
  if (!btn && !onDpad) return false;
  e.preventDefault();
  const el = e.currentTarget as HTMLElement;
  const who = `p${e.pointerId}`;
  try {
    el.setPointerCapture(e.pointerId);
  } catch {
    // a synthetic event: no capture, it still presses
  }
  const aim = (m: PointerEvent) => holds.dir(who, padPosition(...push(m), 0.22));
  const move = (m: PointerEvent) => m.pointerId === e.pointerId && aim(m);
  const n = Number(btn?.dataset.b);
  const up = (u: PointerEvent) => {
    if (u.pointerId !== e.pointerId) return;
    if (btn) holds.button(who, n, false);
    else holds.dir(who, 0);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', up);
    el.removeEventListener('lostpointercapture', up);
  };
  if (btn) holds.button(who, n, true);
  else {
    aim(e);
    el.addEventListener('pointermove', move);
  }
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('lostpointercapture', up);
  return true;
}
