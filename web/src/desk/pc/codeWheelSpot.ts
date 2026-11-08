// A Sandbox Software game's paper decoder, laid on the desk beside the monitor while the PC plays a scene with
// one of its puzzles (the scenes its printables.json names): a code wheel (manual/printables/codeWheel.ts) or a
// look-up code sheet (codeSheet.ts). Click it for the wheel to turn or the card to read, and that scene's
// puzzles with Tell me the answer; Esc or a click outside goes back to the game. Their code loads only for a game
// that has one.
import './codeWheelSpot.css';
import { h, clear } from '../../editor/core/ui';
import { loadCatalog } from '../../project/files';
import type { CodeSheetItem, CodeWheelItem, PostcardGrilleItem } from '../../manual/printables/types';

type Decoder = CodeWheelItem | CodeSheetItem | PostcardGrilleItem;

/** The code wheels and code sheets in game `saveId`'s box (a catalog game's is `game:<id>`). */
async function wheelsOf(saveId: string | undefined): Promise<Decoder[]> {
  const id = saveId?.startsWith('game:') ? saveId.slice('game:'.length) : undefined;
  if (!id) return [];
  const entry = (await loadCatalog().catch(() => [])).find((g) => g.id === id);
  return (entry?.original?.printables?.items ?? []).filter(
    (i): i is Decoder => i.kind === 'codewheel' || i.kind === 'codesheet' || i.kind === 'postcardgrille',
  );
}

/** The decoder's live view (a wheel to turn, a card to read) and its small picture on the desk. */
async function views(it: Decoder): Promise<{ live: (scene: number) => HTMLElement; picture: () => Element }> {
  if (it.kind === 'postcardgrille') {
    const m = await import('../../manual/printables/postcardGrille');
    return { live: (scene) => m.postcardGrilleLive(it, scene), picture: () => m.postcardGrillePicture(it) };
  }
  if (it.kind === 'codesheet') {
    const m = await import('../../manual/printables/codeSheet');
    return { live: (scene) => m.codeSheetLive(it, scene), picture: () => m.codeSheetPicture(it) };
  }
  const m = await import('../../manual/printables/codeWheel');
  return { live: (scene) => m.codeWheelLive(it, scene), picture: () => m.codeWheelPicture(it) };
}

function open(live: HTMLElement, it: Decoder, onClose: () => void): void {
  const close = () => {
    overlay.remove();
    onClose();
  };
  const holder = h('div', { class: 'cw-desk-large' }, live);
  const overlay = h(
    'div',
    { class: 'desk-overlay cw-desk-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': it.title },
    h('button', { class: 'close', onclick: close }, 'Close (Esc)'),
    holder,
    h('p', { class: 'hint' }, `Back to the game: Esc or click outside the ${it.kind === 'codewheel' ? 'wheel' : 'card'}`),
  );
  // its keys turn the wheel, not the game, which listens on the window
  overlay.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') close();
  });
  overlay.addEventListener('keyup', (e) => e.stopPropagation());
  overlay.addEventListener('click', (e) => e.target === overlay && close());
  document.body.append(overlay);
  // the small disc, ready for the arrow keys; on a card, its first square
  holder.querySelector<HTMLElement | SVGElement>('.cw-inner, .cs-grid td, .pg-grille')?.focus();
}

export function codeWheelSpot(refocus: () => void): { el: HTMLElement; game(saveId?: string): void; scene(n: number): void } {
  const el = h('button', { class: 'cw-spot', type: 'button', hidden: true });
  let wheels: Decoder[] = [];
  let playing = 0; // which game, so a slow catalog can't set out an earlier game's wheel
  let scene = -1;
  const show = async () => {
    const mine = playing;
    const it = wheels.find((w) => w.puzzles?.some((p) => p.scenes.includes(scene)));
    el.hidden = !it;
    clear(el);
    if (!it) return;
    const v = await views(it);
    if (mine !== playing) return;
    const what = it.kind === 'codesheet' ? 'code sheet' : it.kind === 'postcardgrille' ? 'postcard and grille' : 'code wheel';
    el.setAttribute('aria-label', `${it.title}: a puzzle here. Open the ${what}`);
    el.title = `A puzzle here: click for the ${what}`;
    const at = scene;
    el.onclick = (e) => {
      e.stopPropagation();
      open(v.live(at), it, refocus);
    };
    el.append(
      it.kind === 'codewheel' ? v.picture() : h('span', { class: 'cs-spot-pic' }, v.picture()),
      h('span', { class: 'cw-spot-tag', 'aria-hidden': 'true' }, `Puzzle! Click for the ${what}`),
    );
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
