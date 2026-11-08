// The Feelies strip under a game's turning box (feelies.ts): a row of thumbnails, one for each plastic trinket, laser kit
// and the phone kit that came with the game, and nothing else (the words and the downloads are in the box's "What's in the
// box" list, manual/printables/feelieItems.ts). Choosing one takes the box's place in the viewer with that feelie as a slowly
// turning 3D model (drag, the arrow keys, the wheel or a pinch; Home puts it back); choosing it again, or Esc, brings the box
// back (the turning is trinketTurntable.ts; the models are feelieModels.ts, the thumbnails feelieThumbs.ts). The phone has
// its own viewer and a small panel for its build, views and explosion (phone/phoneViewer.ts). A game without feelies gets
// a hidden element, and a secret game has no files to list.
import './trinketShelf.css';
import { h } from '../../editor/core/ui';
import { trinketTurntable } from './trinketTurntable';
import { loadFeelies, type Feelie } from './feelies';
import { viewMaker } from './feelieModels';
import { thumbnail } from './feelieThumbs';
import type { PhoneViewer } from './phone/phoneViewer';
import { paperFeelieTiles } from './paperFeelies';
import type { BoxItem } from '../../manual/printables/viewer';

/**
 * The strip for game `id`, or an element that stays hidden when the game has no feelies. `paper` are the box's feelies on
 * paper (code wheel, fingerprint card, spyglass…), shown beside the 3D ones; `open` opens the box's contents at one.
 */
export function trinketShelf(id: string, paper: Promise<BoxItem[]> = Promise.resolve([]), open: () => void = () => {}): HTMLElement {
  const shelf = h('section', { class: 'bc-trinkets', hidden: '', 'aria-label': 'Feelies' });
  void Promise.all([loadFeelies(id), paper.catch((): BoxItem[] => [])]).then(([list, sheets]) => {
    if (!list.length && !sheets.length) return;
    shelf.append(...strip(list, paperFeelieTiles(sheets, open)), h('button', { type: 'button', onclick: open }, 'Build instructions & downloads…'));
    shelf.hidden = false;
  });
  return shelf;
}

const ABOUT =
  'Feelies are physical extras packed in a game box. Infocom began the habit in the 1980s, and the name stuck. Some were copy protection, like a code wheel that had to be turned to answer the game. Others set a box apart from its shelf neighbors, helped during play, made the story feel real, or carried it beyond the screen.';

function strip(list: Feelie[], paperTiles: HTMLElement[]): HTMLElement[] {
  let at = -1; // -1: the box is showing
  let pv: PhoneViewer | undefined;
  const total = list.length;

  // PageUp and PageDown change feelie; the turntable has the rest of the keys
  const table = trinketTurntable(
    (e) => {
      if (e.key !== 'PageDown' && e.key !== 'PageUp') return false;
      step(e.key === 'PageDown' ? 1 : -1);
      return true;
    },
    { zoom: true },
  );
  const { canvas, status } = table;
  const hint = h('p', { class: 'fl-hint' }, 'Drag to turn · scroll or pinch to zoom · Esc for the box');
  const float = h('div', { class: 'trk-float', hidden: '' }, canvas, status, hint);

  const thumbs = list.map((f, i) => {
    const img = h('img', { class: 'fl-img', alt: '', draggable: false, hidden: '' });
    const name = h('span', { class: 'fl-name' }, f.title);
    const button = h(
      'button',
      { class: 'feelie', type: 'button', 'aria-pressed': 'false', 'aria-label': f.title, title: f.title, onclick: () => void choose(at === i ? -1 : i) },
      img,
      name,
    );
    // the render comes in when drawn; until then (or with no WebGL) the tile shows its name
    void thumbnail(f).then((src) => {
      if (!src) return;
      img.src = src;
      img.hidden = false;
      name.hidden = true;
    });
    return button;
  });
  const label = h('span', { class: 'fl-label', id: 'feelies-label' }, 'Feelies');
  const row = h('div', { class: 'fl-row', role: 'group', 'aria-labelledby': 'feelies-label' }, ...thumbs, ...paperTiles);
  // a button and its note side by side (a <details> would hold the note in a box of its own that clips it)
  const note = h('p', { class: 'fl-note', id: 'feelies-about', hidden: '' }, ABOUT);
  const ask = h('button', { class: 'fl-about', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'feelies-about' }, 'What are feelies?');
  ask.onclick = () => {
    note.hidden = !note.hidden;
    ask.setAttribute('aria-expanded', String(!note.hidden));
  };
  const about = h('div', { class: 'fl-ask' }, ask, note);

  /** Chooses feelie `i` (in the box viewer's place), or -1 for the box again. */
  async function choose(i: number) {
    const was = at;
    at = i;
    thumbs.forEach((c, k) => c.setAttribute('aria-pressed', String(k === i)));
    const viewer = row.closest('.box-viewer');
    const f = i >= 0 ? list[i] : undefined;
    const onPhone = f?.kind === 'phone';
    viewer?.classList.toggle('trinket-on', i >= 0);
    viewer?.classList.toggle('phone-on', onPhone);
    float.hidden = i < 0;
    hint.hidden = onPhone;
    if (pv) pv.info.hidden = !onPhone;
    if (was >= 0 && list[was].kind === 'phone' && !onPhone) {
      pv?.close();
      float.replaceChildren(canvas, status, hint);
    }
    if (!f) {
      table.clear();
      if (was >= 0) thumbs[was].focus({ preventScroll: true });
      return;
    }
    if (f.kind === 'phone') {
      table.clear();
      const { createPhoneViewer } = await import('./phone/phoneViewer');
      if (at !== i) return;
      if (!pv) {
        pv = createPhoneViewer();
        row.closest('.bc-trinkets')?.append(pv.info);
      }
      pv.info.hidden = false;
      float.replaceChildren(pv.canvas, pv.status);
      await pv.open();
      if (was < 0) pv.canvas.focus({ preventScroll: true });
      return;
    }
    canvas.setAttribute(
      'aria-label',
      `${f.title}, a 3D model. Drag it, or use the arrow keys, to turn it; the wheel or + and - zoom; Home puts it back; Escape returns to the box.`,
    );
    await table.showModel(() => viewMaker(f), { spin: true, fresh: true });
    if (was < 0) canvas.focus({ preventScroll: true });
  }
  const step = (dir: 1 | -1) => total > 0 && void choose((at + dir + total) % total);

  return [h('div', { class: 'fl-bar' }, label, row, about), float];
}
