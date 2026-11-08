// Asking the page to do something for a step (a 'gm-tour-act' event). An act with `hold` makes
// the step's line wait: the page calls the event's `ready` once what it waits for (the BBS's
// handle prompt on the desk's screen) is up, or gives up. A timeout keeps the tour from hanging
// if the page never answers.
import type { PageAct } from './steps';

/** The longest a held line waits: the desk's own wait for a prompt is 30 s, plus the dialing. */
export const HOLD_MS = 45_000;

/** What the event carries: the act, and `ready` for the page to call when a held act is done. */
export type ActDetail = PageAct & { ready?: () => void };

/** Sends the act; resolves at once, or (with `hold`) when the page says it is ready or the timeout passes. */
export function askPage(act: PageAct, timeoutMs = HOLD_MS): Promise<void> {
  if (!act.hold) {
    window.dispatchEvent(new CustomEvent('gm-tour-act', { detail: act }));
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    const ready = () => {
      clearTimeout(timer);
      resolve();
    };
    const detail: ActDetail = { ...act, ready };
    window.dispatchEvent(new CustomEvent('gm-tour-act', { detail }));
  });
}
