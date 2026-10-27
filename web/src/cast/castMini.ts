// The cast page's small stage: once the full stage scrolls out of view, a picture-in-picture of it
// floats in a corner (upper left on a wide window, lower left on a narrow one; cast.css). Its
// canvas shows the stage's own frames, copied as each is drawn, with a play/pause, a way back to
// the full stage, and a close that keeps it away for the rest of the visit.
import { h } from '../editor/core/ui';

interface MiniStage {
  el: HTMLElement;
  /** Copies the stage's current frame (when shown). */
  mirror(): void;
  /** Whether it is showing: the stage is out of view and it was not closed. */
  readonly shown: boolean;
  /** The full stage is in view (true) or scrolled away above (false). */
  stageInView(inView: boolean): void;
  setPlaying(on: boolean): void;
  say(name: string): void;
}

export function castMini(stage: HTMLCanvasElement, opts: { toggle(): void; back(): void; change(): void }): MiniStage {
  const canvas = h('canvas', { width: stage.width, height: stage.height, class: 'cast-mini-canvas', 'aria-hidden': 'true' });
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const who = h('span', { class: 'cast-mini-who', 'aria-hidden': 'true' });
  const play = h('button', { type: 'button', class: 'cast-mini-btn', onclick: () => opts.toggle() });
  const back = h(
    'button',
    { type: 'button', class: 'cast-mini-btn', 'aria-label': 'Back to the stage', title: 'Back to the stage', onclick: () => opts.back() },
    '⤒',
  );
  let closed = false;
  let away = false;
  const close = h(
    'button',
    {
      type: 'button',
      class: 'cast-mini-btn',
      'aria-label': 'Close the small stage',
      title: 'Close',
      onclick: () => {
        closed = true;
        el.closest('main')?.classList.add('cast-mini-closed');
        update();
      },
    },
    '×',
  );
  const el = h(
    'div',
    { class: 'cast-mini', role: 'group', 'aria-label': 'Small stage', hidden: true },
    canvas,
    h('div', { class: 'cast-mini-bar' }, who, play, back, close),
  );
  canvas.addEventListener('click', () => opts.toggle());
  const mini: MiniStage = {
    el,
    get shown() {
      return away && !closed;
    },
    mirror() {
      if (mini.shown) ctx.drawImage(stage, 0, 0);
    },
    stageInView(inView) {
      away = !inView;
      update();
    },
    setPlaying(on) {
      play.textContent = on ? '❚❚' : '▶';
      play.setAttribute('aria-label', on ? 'Pause the stage' : 'Play the stage');
      play.title = on ? 'Pause' : 'Play';
    },
    say(name) {
      who.textContent = name;
    },
  };
  function update(): void {
    const was = !el.hidden;
    el.hidden = !mini.shown;
    if (mini.shown) mini.mirror();
    if (was !== mini.shown) opts.change();
  }
  return mini;
}
