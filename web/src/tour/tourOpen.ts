// What the tour opens on the page to show what is in it, and shuts again: a menu or panel a
// target's `reveal` names (the ⚙ button, the ⋯ menu, the game pad's large controls), or an
// overlay a press opens (steps.ts Opener: a box off the shelf, the magazine, a manual). Each is
// a handle the player keeps while its steps play, closed when the tour moves on or ends.
import { closeMenu, findTarget, menuOpen, visible } from './findTarget';
import type { Opener } from './steps';

export interface Opened {
  /** The same for every step that shows it: the menu button, or the Opener. */
  key: unknown;
  isOpen(): boolean;
  /** Opens it and settles once it shows (or gives up after a while). */
  open(): Promise<void>;
  close(): void;
  /** What it shows while open (an overlay, a dialog), whose keys stay the tour's. */
  shows(): HTMLElement | undefined;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** A menu or panel opened by clicking its button (shut by clicking it again). */
export function menuHandle(button: HTMLElement, click: (el: HTMLElement) => void, inside?: () => HTMLElement | undefined): Opened {
  return {
    key: button,
    isOpen: () => menuOpen(button),
    open: async () => {
      if (!menuOpen(button)) click(button);
      await sleep(60);
    },
    close: () => closeMenu(button),
    shows: () => inside?.()?.closest<HTMLElement>('dialog, [role="dialog"]') ?? undefined,
  };
}

/** An overlay a control opens; its own close button shuts it. */
export function overlayHandle(o: Opener, click: (el: HTMLElement) => void): Opened {
  const shown = () => findTarget({ label: o.label, css: o.shown });
  return {
    key: o,
    isOpen: () => !!shown(),
    open: async () => {
      if (shown()) return;
      // a menu's item works hidden (the paper stack's magazine); a box on a shelf a phone doesn't show isn't taken down
      const by = o.hiddenBy ? document.querySelector<HTMLElement>(o.by) : findTarget({ label: o.label, css: o.by });
      if (!by) return;
      click(by);
      // a manual or a box can take a few seconds to lay out
      for (let t = 0; t < 10_000 && !shown(); t += 100) await sleep(100);
    },
    close: () => {
      const btn = [...document.querySelectorAll<HTMLElement>(o.close)].find(visible);
      if (btn && shown()) btn.click();
    },
    shows: () => shown(),
  };
}
