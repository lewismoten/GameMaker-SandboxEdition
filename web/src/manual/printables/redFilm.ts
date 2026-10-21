// Hint book answers hidden the way 90s hint books (and Daniel C. Wilson's "red reveal",
// danielcwilson.com/blog/2018/02/optical-fun-red-reveal/) hid them, with just two inks as a
// printer would use: the answer in cyan, the ink opposite red, on a field of crossing red
// lines about as dark as the cyan, with fine red lines printed over the letters too.
// Every red has full red (R = 255), so through red film it turns the film's own red, just as
// the white paper does, and vanishes; the cyan has no red at all, so it turns dark. Where a
// fine line crosses a letter the inks overprint (multiply, as ink on paper does) into a dark
// cyan or black, which the film keeps dark, so the letters come through whole. That holds
// for real red cellophane over a printed page too.
import { h } from '../../editor/core/ui';

/** The answer's ink: process cyan, no red at all. */
export const CYAN_INK = 'rgb(0,174,239)';
/** The red lines, from pure red to a light red; every one has full red. */
export const LINE_INKS = ['rgb(255,0,0)', 'rgb(255,80,80)', 'rgb(255,140,140)'];

const rgb = (color: string) => (color.match(/\d+/g) ?? []).map(Number);

/** Rec. 601 luma of an "rgb(r,g,b)" color, 0-255. */
export function luma(color: string): number {
  const [r, g, b] = rgb(color);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Two inks printed over each other (multiply), as "rgb(r,g,b)". */
export function overprint(a: string, b: string): string {
  const x = rgb(a);
  const y = rgb(b);
  return `rgb(${x.map((v, i) => Math.round((v * y[i]) / 255)).join(',')})`;
}

/** How light a color looks through pure red film, 0-255: only its red gets through. */
export function throughRedFilm(color: string): number {
  return rgb(color)[0];
}

const layer = (deg: number, gap: number, line: number, ink: string) =>
  `repeating-linear-gradient(${deg}deg, transparent 0 ${gap}em, ${ink} ${gap}em ${gap + line}em)`;

/** The red lines under the answer: crossing hatching about as dark as the cyan, as CSS backgrounds. */
export function redField(): string {
  return [layer(152, 0.11, 0.07, LINE_INKS[1]), layer(112, 0.13, 0.06, LINE_INKS[0]), layer(38, 0.09, 0.08, LINE_INKS[2])].join(',');
}

/** The fine red lines printed over the answer, cutting its letters. */
export function redLines(): string {
  return [layer(152, 0.22, 0.045, LINE_INKS[0]), layer(64, 0.29, 0.04, LINE_INKS[1])].join(',');
}

/** An answer hidden among red lines. */
export function redCode(text: string): HTMLElement {
  return h(
    'span',
    { class: 'rf-code', style: `background:${redField()}, #fff` },
    h('span', { class: 'rf-text', style: `color:${CYAN_INK}` }, text),
    // fine red lines over the top, overprinting the cyan (see .rf-noise in paper.css)
    h('span', { class: 'rf-noise', 'aria-hidden': 'true', style: `background:${redLines()}` }),
  );
}

/**
 * A circle of red film that follows the pointer over a page with hidden answers, like
 * holding the hint book's red lens up to it.
 */
export class RedLens {
  private el = h('div', { class: 'rf-lens', hidden: true, 'aria-hidden': 'true' });

  mount(parent: HTMLElement): void {
    parent.append(this.el);
  }

  /** Follows the pointer over `area` while `active()` says this page has answers to hide. */
  follow(area: HTMLElement, active: () => boolean): void {
    const move = (e: PointerEvent) => {
      const over = active() && (e.target as Element | null)?.closest?.('.pp-sheet');
      if (!over) return this.hide();
      this.el.hidden = false;
      this.el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };
    area.addEventListener('pointermove', move);
    area.addEventListener('pointerdown', move);
    area.addEventListener('pointerleave', () => this.hide());
    area.addEventListener('scroll', () => this.hide(), { passive: true });
  }

  hide(): void {
    this.el.hidden = true;
  }
}

/** The draggable red cellophane. */
export class RedFilm {
  private el = h(
    'div',
    { class: 'rf-film', hidden: true, role: 'img', 'aria-label': 'Red film (drag it over the answers)' },
    h('span', { class: 'rf-film-label' }, 'RED FILM · drag me'),
  );
  private x = 0;
  private y = 0;

  constructor() {
    let start: { px: number; py: number; x: number; y: number } | undefined;
    this.el.addEventListener('pointerdown', (e) => {
      start = { px: e.clientX, py: e.clientY, x: this.x, y: this.y };
      this.el.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    this.el.addEventListener('pointermove', (e) => {
      if (!start) return;
      this.place(start.x + e.clientX - start.px, start.y + e.clientY - start.py);
    });
    const end = () => (start = undefined);
    this.el.addEventListener('pointerup', end);
    this.el.addEventListener('pointercancel', end);
  }

  mount(parent: HTMLElement): void {
    parent.append(this.el);
  }

  private place(x: number, y: number): void {
    const w = this.el.offsetWidth || 300;
    const hh = this.el.offsetHeight || 180;
    this.x = Math.max(-w / 2, Math.min(window.innerWidth - w / 2, x));
    this.y = Math.max(0, Math.min(window.innerHeight - 40, y));
    this.el.style.transform = `translate(${this.x}px, ${this.y}px) rotate(-2deg)`;
    void hh;
  }

  toggle(): void {
    if (this.el.hidden) this.show();
    else this.hide();
  }

  show(): void {
    this.el.hidden = false;
    const w = this.el.offsetWidth;
    this.place((window.innerWidth - w) / 2, window.innerHeight * 0.35);
  }

  hide(): void {
    this.el.hidden = true;
  }
}
