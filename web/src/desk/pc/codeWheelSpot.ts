// A Sandbox Software game's paper code wheel (manual/printables/codeWheel.ts), laid on the desk beside the
// monitor while the PC plays a scene with one of its puzzles (the scenes its printables.json names). Click it
// for the wheel to turn, and that scene's puzzles with Tell me the answer; Esc or a click outside goes back
// to the game. The wheel's code loads only for a game that has one.
import './codeWheelSpot.css';
import { h, clear } from '../../editor/core/ui';
import { loadCatalog } from '../../project/files';
import type { CodeWheelItem } from '../../manual/printables/types';

type Wheel = typeof import('../../manual/printables/codeWheel');

/** The code wheels in game `saveId`'s box (a catalog game's is `game:<id>`). */
async function wheelsOf(saveId: string | undefined): Promise<CodeWheelItem[]> {
  const id = saveId?.startsWith('game:') ? saveId.slice('game:'.length) : undefined;
  if (!id) return [];
  const entry = (await loadCatalog().catch(() => [])).find((g) => g.id === id);
  return (entry?.original?.printables?.items ?? []).filter((i): i is CodeWheelItem => i.kind === 'codewheel');
}

function open(wheel: Wheel, it: CodeWheelItem, scene: number, onClose: () => void): void {
  const close = () => {
    overlay.remove();
    onClose();
  };
  const holder = h('div', { class: 'cw-desk-large' }, wheel.codeWheelLive(it, scene));
  const overlay = h(
    'div',
    { class: 'desk-overlay cw-desk-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': it.title },
    h('button', { class: 'close', onclick: close }, 'Close (Esc)'),
    holder,
    h('p', { class: 'hint' }, 'Back to the game: Esc or click outside the wheel'),
  );
  // its keys turn the wheel, not the game, which listens on the window
  overlay.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') close();
  });
  overlay.addEventListener('keyup', (e) => e.stopPropagation());
  overlay.addEventListener('click', (e) => e.target === overlay && close());
  document.body.append(overlay);
  holder.querySelector<HTMLElement>('.cw-dial')?.focus();
}

export function codeWheelSpot(refocus: () => void): { el: HTMLElement; game(saveId?: string): void; scene(n: number): void } {
  const el = h('button', { class: 'cw-spot', type: 'button', hidden: true });
  let wheels: CodeWheelItem[] = [];
  let playing = 0; // which game, so a slow catalog can't set out an earlier game's wheel
  let scene = -1;
  const show = async () => {
    const mine = playing;
    const it = wheels.find((w) => w.puzzles?.some((p) => p.scenes.includes(scene)));
    el.hidden = !it;
    clear(el);
    if (!it) return;
    const wheel = await import('../../manual/printables/codeWheel');
    if (mine !== playing) return;
    el.setAttribute('aria-label', `${it.title}: a puzzle here. Open the code wheel`);
    el.title = 'A puzzle here: click for the code wheel';
    el.onclick = (e) => {
      e.stopPropagation();
      open(wheel, it, scene, refocus);
    };
    el.append(wheel.codeWheelPicture(it), h('span', { class: 'cw-spot-tag', 'aria-hidden': 'true' }, 'Puzzle! Click for the code wheel'));
  };
  return {
    el,
    game(saveId) {
      const mine = ++playing;
      wheels = [];
      scene = -1;
      void show();
      if (saveId)
        void wheelsOf(saveId).then((w) => {
          if (mine !== playing) return;
          wheels = w;
          void show();
        });
    },
    scene(n) {
      scene = n;
      if (wheels.length) void show();
    },
  };
}
