// Every few minutes (about five, at random) something happens outside the window, by day
// or by night as the room's clock has it: the snow plow, kids with sleds, the dogs loose
// (Gwinn up to something), THE CHEZ, a fainting goat, a rubber chicken flying past; a
// shooting star or the northern lights after dark. Never while a game is playing on the PC
// (it would only distract), never without motion, and only while the window can be seen
// (visible.ts: not under a manual or a dialog, not with the tab put away).
// Other code can send one now: dispatchEvent(new CustomEvent('gm-window-event', { detail:
// { kind } })), as the registration card does for the mail truck and its reply for the mail
// jeep ("mailtruck" and "mailjeep", which only come that way). One asked for while another is
// going by waits its turn; when an asked one is over (or couldn't be seen at all) a
// 'gm-window-event-end' event with the same detail says so.
import { daylight } from '../../room/daylight';
import { stillMotion } from '../propKit';
import { play, type OutsideEvent } from './outside';
import { windowVisible } from './visible';
import { plow } from './plow';
import { sleds } from './sleds';
import { dogs } from './dogs';
import { chez } from './chez';
import { goat } from './goat';
import { chicken } from './chicken';
import { star } from './star';
import { aurora } from './aurora';
import { mailtruck } from './mailtruck';
import { mailjeep } from './mailjeep';

const EVENTS: OutsideEvent[] = [plow, sleds, dogs, chez, goat, chicken, star, aurora];
const ALL = [...EVENTS, mailtruck, mailjeep];
const WINDOW_EVENT = 'gm-window-event';
const WINDOW_EVENT_END = 'gm-window-event-end';

export function outsideWindow(win: HTMLElement, pc: { gamePlaying(): boolean }): () => void {
  const layer = win.querySelector<HTMLElement>('.sw-hits');
  if (!layer) return () => {};
  let busy = false;
  const waiting: OutsideEvent[] = []; // asked for while something else went by
  const ended = (ev: OutsideEvent) => dispatchEvent(new CustomEvent(WINDOW_EVENT_END, { detail: { kind: ev.kind } }));
  const run = (ev: OutsideEvent, asked = false) => {
    if (busy && asked) {
      waiting.push(ev);
      return;
    }
    if (busy || pc.gamePlaying() || !win.isConnected) {
      if (asked) ended(ev);
      return;
    }
    busy = true;
    void play(win, layer, ev).then(() => {
      busy = false;
      if (asked) ended(ev);
      const next = waiting.shift();
      if (next) run(next, true);
    });
  };
  let timer = 0;
  let last = '';
  const later = () => {
    timer = window.setTimeout(
      () => {
        if (!win.isConnected) return;
        if (windowVisible(win) && !stillMotion()) {
          const night = daylight() < 0.5;
          const now = EVENTS.filter((e) => (e.when === 'any' || (e.when === 'night') === night) && e.kind !== last);
          const ev = now[Math.floor(Math.random() * now.length)];
          if (ev) {
            last = ev.kind;
            run(ev);
          }
        }
        later();
      },
      180_000 + Math.random() * 240_000,
    );
  };
  later();
  const asked = (e: Event) => {
    const kind = (e as CustomEvent<{ kind?: string }>).detail?.kind;
    const ev = ALL.find((x) => x.kind === kind);
    if (ev) run(ev, true);
  };
  addEventListener(WINDOW_EVENT, asked);
  return () => {
    clearTimeout(timer);
    removeEventListener(WINDOW_EVENT, asked);
  };
}
