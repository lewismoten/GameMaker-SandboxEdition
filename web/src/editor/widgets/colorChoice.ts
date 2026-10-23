// Big-target ways to choose one of a palette's 256 colors, beside an editor's small swatch grid
// (WCAG 2.5.8 asks for 24px targets, or an equivalent control that has them): a color number
// box and a "Bigger colors" dialog whose swatches are 32px or more, arrow keys included.
import { h, modal } from '../core/ui';
import { rovingGrid } from './rovingGrid';
import './colorChoice.css';

export interface ColorChoiceOptions {
  /** The color chosen now. */
  get(): number;
  /** Chooses a color. */
  set(i: number): void;
  /** The CSS color a swatch shows. */
  css(i: number): string;
  /** A swatch's name (by default "Color 12"). */
  name?(i: number): string;
}

export interface ColorChoice {
  el: HTMLElement;
  /** Shows the color chosen now in the number box. */
  refresh(): void;
}

export function colorChoice(o: ColorChoiceOptions): ColorChoice {
  const name = o.name ?? ((i: number) => `Color ${i}`);
  const num = h('input', { type: 'number', min: 0, max: 255, class: 'color-choice-num', 'aria-label': 'Color number (0 to 255)' }) as HTMLInputElement;
  num.addEventListener('change', () => {
    const v = Math.round(Number(num.value));
    if (Number.isFinite(v)) o.set(Math.max(0, Math.min(255, v)));
    refresh();
  });
  const bigger = h('button', { type: 'button', class: 'color-choice-big', title: 'Choose from bigger swatches', onclick: () => void openBigger() }, 'Bigger colors');
  const refresh = () => (num.value = String(o.get()));

  const openBigger = () =>
    modal<number>('Choose a color', (close) => {
      const grid = rovingGrid(h('div', { class: 'color-zoom' }), 'Colors (arrow keys move, Enter chooses)');
      const pick = (b: HTMLElement) => {
        grid.querySelector('.selected')?.classList.remove('selected');
        b.classList.add('selected');
      };
      for (let i = 0; i < 256; i++) {
        grid.append(
          h('button', {
            type: 'button',
            class: i === o.get() ? 'selected' : '',
            style: `background:${o.css(i)}`,
            title: name(i),
            'aria-label': name(i),
            // a click or tap chooses; the arrow keys (a click with no detail) only move
            onclick: (e: MouseEvent) => (e.detail > 0 ? close(i) : pick(e.currentTarget as HTMLElement)),
          }),
        );
      }
      grid.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const i = [...grid.children].indexOf(document.activeElement as Element);
        if (i < 0) return;
        e.preventDefault();
        close(i);
      });
      // the chosen color has the keyboard once the dialog is open
      requestAnimationFrame(() => grid.querySelector<HTMLElement>('.selected')?.focus());
      return h('div', { class: 'color-zoom-body' }, grid);
    }).then((i) => {
      if (i !== undefined) o.set(i);
      refresh();
      bigger.focus();
    });

  refresh();
  return { el: h('div', { class: 'color-choice' }, h('label', null, 'Color ', num), bigger), refresh };
}
