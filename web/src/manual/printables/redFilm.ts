// Hint book answers hidden the way 90s hint books (and Daniel C. Wilson's "red reveal",
// danielcwilson.com/blog/2018/02/optical-fun-red-reveal/) hid them: the answer is printed
// in cyan, the color opposite red, over a field of letter-shaped decoys and under three
// layers of red stitching. Everything but the answer has full red (R = 255), so through red
// film (mix-blend-mode: multiply with pure red) it all turns the film's own red and
// vanishes, while the cyan, which has almost no red, turns dark. Without the film the decoys
// sit at the answer's own size and lightness and the stitching cuts every letter apart.
import { h } from '../../editor/ui';
import { rng } from './kit';

/** Colors with full red, at about the lightness of the answer's cyan (luma ~ 200). */
export const DECOY_INKS = [
  'rgb(255,170,205)',
  'rgb(255,180,140)',
  'rgb(255,165,240)',
  'rgb(255,192,120)',
  'rgb(255,172,172)',
  'rgb(255,186,224)',
  'rgb(255,200,255)',
];
/** The answer's pale cyans: half red at most, so the film turns them dark red; luma ~ 195. */
export const CYAN_INKS = ['rgb(118,222,236)', 'rgb(128,214,242)', 'rgb(112,226,222)', 'rgb(136,210,246)', 'rgb(108,224,232)'];

/** Rec. 601 luma of an "rgb(r,g,b)" color, 0-255. */
export function luma(color: string): number {
  const [r, g, b] = (color.match(/\d+/g) ?? []).map(Number);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

let noiseUrl: string | undefined;

/**
 * The field the answer sits on: a pale pink wash crowded with decoy letters and specks in
 * full-red colors as light as the answer, so the eye can't tell which letters are real.
 */
export function redNoiseTile(): string {
  if (noiseUrl) return noiseUrl;
  const W = 240;
  const H = 120;
  const c = h('canvas', { width: W, height: H });
  const g = c.getContext('2d')!;
  const r = rng(0x5a17d);
  const pick = (list: string[]) => list[Math.floor(r() * list.length)];
  g.fillStyle = 'rgb(255,214,226)';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = pick(DECOY_INKS);
    const s = 1 + Math.floor(r() * 2);
    g.fillRect(Math.floor(r() * W), Math.floor(r() * H), s, s);
  }
  // decoy letters in the answer's size and weight, drawn across the tile's edges too so it repeats seamlessly
  for (let i = 0; i < 700; i++) {
    g.font = `${r() < 0.6 ? 700 : 400} ${11 + Math.floor(r() * 6)}px Arial, sans-serif`;
    g.fillStyle = pick(DECOY_INKS);
    const ch = String.fromCharCode((r() < 0.7 ? 97 : 65) + Math.floor(r() * 26));
    const x = r() * W;
    const y = r() * H;
    for (const [dx, dy] of [
      [0, 0],
      [-W, 0],
      [0, -H],
      [-W, -H],
    ])
      g.fillText(ch, x + dx, y + dy + 12);
  }
  noiseUrl = c.toDataURL();
  return noiseUrl;
}

let inkUrl: string | undefined;

/** The answer's ink: cyan mottled with its neighbors, all low in red. */
export function blueInkTile(): string {
  if (inkUrl) return inkUrl;
  const W = 96;
  const c = h('canvas', { width: W, height: W });
  const g = c.getContext('2d')!;
  const r = rng(0xb1e);
  g.fillStyle = CYAN_INKS[0];
  g.fillRect(0, 0, W, W);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = CYAN_INKS[Math.floor(r() * CYAN_INKS.length)];
    const s = 1 + Math.floor(r() * 3);
    g.fillRect(Math.floor(r() * W), Math.floor(r() * W), s, s);
  }
  inkUrl = c.toDataURL();
  return inkUrl;
}

/** An answer hidden in red noise. */
export function redCode(text: string): HTMLElement {
  return h(
    'span',
    { class: 'rf-code', style: `background-image:url(${redNoiseTile()})` },
    h('span', { class: 'rf-text', style: `background-image:url(${blueInkTile()})` }, text),
    // the red stitching over the top: three layers of fine lines (see .rf-noise in paper.css)
    h('span', { class: 'rf-noise', 'aria-hidden': 'true' }),
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
