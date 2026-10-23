// Every few minutes (about five, at random) something happens outside the window, by day
// or by night as the room's clock has it: the snow plow, kids with sleds, the dogs loose
// (Gwinn up to something), THE CHEZ, a fainting goat, a rubber chicken flying past; a
// shooting star or the northern lights after dark. Never while a game is playing on the PC
// (it would only distract), never without motion, never while the page is hidden.
// Other code can send one now: dispatchEvent(new CustomEvent('gm-window-event', { detail:
// { kind } })), as the registration card does for the mail truck ("mailtruck", which only
// comes that way).
import { daylight } from "../../room/daylight";
import { stillMotion } from "../propKit";
import { play, type OutsideEvent } from "./outside";
import { plow } from "./plow";
import { sleds } from "./sleds";
import { dogs } from "./dogs";
import { chez } from "./chez";
import { goat } from "./goat";
import { chicken } from "./chicken";
import { star } from "./star";
import { aurora } from "./aurora";
import { mailtruck } from "./mailtruck";

const EVENTS: OutsideEvent[] = [plow, sleds, dogs, chez, goat, chicken, star, aurora];
const ALL = [...EVENTS, mailtruck];
export const WINDOW_EVENT = "gm-window-event";

export function outsideWindow(win: HTMLElement, pc: { gamePlaying(): boolean }): () => void {
  const layer = win.querySelector<HTMLElement>(".sw-hits");
  if (!layer) return () => {};
  let busy = false;
  const run = (ev: OutsideEvent) => {
    if (busy || pc.gamePlaying() || !win.isConnected) return;
    busy = true;
    void play(win, layer, ev).then(() => (busy = false));
  };
  let timer = 0;
  let last = "";
  const later = () => {
    timer = window.setTimeout(() => {
      if (!win.isConnected) return;
      if (!document.hidden && !stillMotion()) {
        const night = daylight() < 0.5;
        const now = EVENTS.filter((e) => (e.when === "any" || (e.when === "night") === night) && e.kind !== last);
        const ev = now[Math.floor(Math.random() * now.length)];
        if (ev) {
          last = ev.kind;
          run(ev);
        }
      }
      later();
    }, 180_000 + Math.random() * 240_000);
  };
  later();
  const asked = (e: Event) => {
    const kind = (e as CustomEvent<{ kind?: string }>).detail?.kind;
    const ev = ALL.find((x) => x.kind === kind);
    if (ev) run(ev);
  };
  addEventListener(WINDOW_EVENT, asked);
  return () => {
    clearTimeout(timer);
    removeEventListener(WINDOW_EVENT, asked);
  };
}
