// Things that happen outside the window (desk/props/outside/): each a small module that
// draws itself over the view for a few seconds (room/snowWindow.ts addSkyExtra) while a
// button rides along with it, so it can be clicked or tabbed to for a word about it (and its
// achievement the first time). index.ts picks one every few minutes.
import { addSkyExtra, VIEW } from '../../room/snowWindow';
import { hitArea, pressable, say, stillMotion } from '../propKit';
import { ambient, muteAmbient } from '../propSound';
import { windowVisible } from './visible';

let live = false;
/** Whether something outside is playing and can be seen (for sounds it starts later on). */
export const outsidePlaying = (): boolean => live;

/** Where something is in the window's view, in its pixels: x, y, width, height. */
export type Box = [number, number, number, number];

export interface OutsideEvent {
  kind: string;
  /** Its achievement, the first time it is pressed. */
  id: string;
  /** Its button's name while it is there. */
  label: string;
  /** When it can happen by itself (any time when something asks for it: index.ts). */
  when: 'day' | 'night' | 'any';
  /** How long it lasts. */
  ms: number;
  /** Its sound as it starts (through the speakers' knob). */
  start?(): void;
  /** Draws it `p` of the way through (0 to 1), `t` ms in; where it is now, to press. */
  draw(ctx: CanvasRenderingContext2D, p: number, t: number): Box | undefined;
  /** Pressed: its sound, and what the bubble says. */
  press(): string;
}

/** The street in front of the houses, where things drive and walk. */
export const STREET = VIEW.h - 18;
const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;

/**
 * Plays `ev` in the window `win` (its buttons go in `layer`, under the moon's). Without
 * motion it stands still halfway through for a few seconds instead. Only while the window
 * can be seen (visible.ts): not at all if it can't, and cut short, its sound silenced, the
 * moment it can't any more (a manual opened over it, the tab put away). Resolves when over.
 */
export function play(win: HTMLElement, layer: HTMLElement, ev: OutsideEvent): Promise<void> {
  if (!windowVisible(win)) return Promise.resolve();
  const still = stillMotion();
  const button = hitArea(`sw-out sw-out-${ev.kind}`);
  const moon = layer.querySelector('.sw-moon');
  if (moon) moon.before(button);
  else layer.append(button);
  const off = pressable(button, ev.label, () => say(button, ev.press()), { id: ev.id });
  const ms = still ? 3500 : ev.ms;
  muteAmbient(false);
  live = true;
  if (ev.start) ambient(ev.start);
  let looked = 0;
  let seen = true;
  return new Promise((done) => {
    addSkyExtra(win, (ctx, t) => {
      // (looked at a few times a second, not every frame)
      if (t - looked > 250) {
        looked = t;
        seen = windowVisible(win);
      }
      if (t >= ms || !win.isConnected || !seen) {
        if (!seen) muteAmbient(true);
        live = false;
        if (document.activeElement === button) win.querySelector<HTMLElement>('.sw-glass')?.focus();
        off();
        button.remove();
        done();
        return false;
      }
      const box = ev.draw(ctx, still ? 0.5 : t / ms, still ? ms / 2 : t);
      button.hidden = !box;
      if (box) {
        const [x, y, w, h] = box;
        Object.assign(button.style, { left: pct(x, VIEW.w), top: pct(y, VIEW.h), width: pct(w, VIEW.w), height: pct(h, VIEW.h) });
      }
      return true;
    });
  });
}

/** Across the view, right to left (most things) or left to right, `w` wide. */
export const across = (p: number, w: number, leftward = true) => (leftward ? VIEW.w + 10 - p * (VIEW.w + w + 20) : -w - 10 + p * (VIEW.w + w + 20));
