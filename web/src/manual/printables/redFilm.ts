// Hint book answers printed in blue under red and pink noise, the way 90s hint books hid
// them: look through red film and the red noise vanishes into the red, while the blue
// letters turn black. On screen the film is a sheet of red cellophane you drag around
// (mix-blend-mode: multiply does what the film does); on paper it prints as the noise.
import { h } from '../../editor/ui';
import { rng } from './kit';

let noiseUrl: string | undefined;

/** A tile of red noise: every speck has full red, so the film swallows it. */
export function redNoiseTile(): string {
  if (noiseUrl) return noiseUrl;
  const W = 240;
  const H = 120;
  const c = h('canvas', { width: W, height: H });
  const g = c.getContext('2d')!;
  const r = rng(0x5a17d);
  // pink wash
  g.fillStyle = 'rgb(255, 182, 196)';
  g.fillRect(0, 0, W, H);
  const colors = ['rgb(255,40,70)', 'rgb(255,90,150)', 'rgb(255,150,60)', 'rgb(255,120,200)', 'rgb(255,0,40)', 'rgb(255,170,230)', 'rgb(255,60,110)'];
  // specks
  for (let i = 0; i < 5200; i++) {
    g.fillStyle = colors[Math.floor(r() * colors.length)];
    const s = 1 + Math.floor(r() * 3);
    g.fillRect(Math.floor(r() * W), Math.floor(r() * H), s, s);
  }
  // squiggles like the real thing
  g.lineWidth = 1.6;
  for (let i = 0; i < 90; i++) {
    g.strokeStyle = colors[Math.floor(r() * colors.length)];
    g.beginPath();
    let x = r() * W;
    let y = r() * H;
    g.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      x += (r() - 0.5) * 26;
      y += (r() - 0.5) * 14;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  // letter-shaped decoys in the answer's weight: pink ones, and pale blue ones whose red is high
  // enough that the film hides them too, so the eye can't pick the real words out
  const decoys = ['rgb(215,160,255)', 'rgb(225,150,250)', 'rgb(205,170,255)', 'rgb(255,90,150)', 'rgb(235,120,230)'];
  for (let i = 0; i < 260; i++) {
    g.font = `${r() < 0.5 ? 700 : 400} ${12 + Math.floor(r() * 6)}px Arial, sans-serif`;
    g.fillStyle = decoys[Math.floor(r() * decoys.length)];
    g.fillText(String.fromCharCode((r() < 0.7 ? 97 : 65) + Math.floor(r() * 26)), r() * W, r() * H);
  }
  noiseUrl = c.toDataURL();
  return noiseUrl;
}

/** An answer hidden in red noise. */
export function redCode(text: string): HTMLElement {
  return h(
    'span',
    { class: 'rf-code' },
    h('span', { class: 'rf-text' }, text),
    h('span', { class: 'rf-noise', style: `background-image:url(${redNoiseTile()})`, 'aria-hidden': 'true' }),
  );
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
