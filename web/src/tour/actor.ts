// A host or prop on the tour's layer: the regular's own sprite (public/cast/sprites.json, the
// games' real frames, read by cast/castSprite.ts and cut by cast/castStageDraw.ts), drawn on a
// small canvas scaled with whole pixels, walking from place to place with its walk frames and
// facing you with its front frames while it stands.
import { spriteCanvases, type CastSprite } from '../cast/castSprite';
import { cutSprite, type Sprite } from '../cast/castStageDraw';
import { walkMs, type Point, type Size } from './place';

let sheet: Promise<Map<string, Sprite>> | undefined;

/** The cast's sprites, fetched once. */
export function loadSprites(): Promise<Map<string, Sprite>> {
  sheet ??= fetch('./cast/sprites.json')
    .then((r) => (r.ok ? (r.json() as Promise<Record<string, CastSprite>>) : {}))
    .catch((): Record<string, CastSprite> => ({}))
    .then((all: Record<string, CastSprite>) => new Map(Object.entries(all).map(([id, s]) => [id, cutSprite(s, spriteCanvases(s))])));
  return sheet;
}

export class Actor {
  readonly el: HTMLCanvasElement;
  readonly size: Size;
  pos: Point = { x: -999, y: -999 };
  private walking = false;
  private left = false;
  private frame = 0;
  private timer = 0;
  private raf = 0;

  constructor(
    private sprite: Sprite,
    scale: number,
    still: boolean,
  ) {
    const { w, h } = sprite.sprite;
    this.size = { w: w * scale, h: h * scale };
    this.el = document.createElement('canvas');
    this.el.className = 'tour-actor';
    this.el.width = w;
    this.el.height = h;
    this.el.style.width = `${this.size.w}px`;
    this.el.style.height = `${this.size.h}px`;
    this.draw();
    if (!still) this.timer = window.setInterval(() => this.tick(), sprite.sprite.ms);
  }

  private get frames(): HTMLCanvasElement[] {
    return this.walking && this.sprite.walk.length ? this.sprite.walk : this.sprite.front;
  }

  private tick(): void {
    this.frame++;
    this.draw();
  }

  private draw(): void {
    const frames = this.frames;
    const f = frames[this.frame % frames.length];
    const ctx = this.el.getContext('2d');
    if (!ctx || !f) return;
    ctx.clearRect(0, 0, this.el.width, this.el.height);
    ctx.drawImage(f, 0, 0);
    const mirror = this.left !== !!this.sprite.sprite.mirror;
    this.el.style.transform = mirror ? 'scaleX(-1)' : '';
  }

  place(p: Point): void {
    this.pos = p;
    this.el.style.left = `${Math.round(p.x)}px`;
    this.el.style.top = `${Math.round(p.y)}px`;
  }

  /** Faces left or right (a walk faces where it goes). */
  face(left: boolean): void {
    this.left = left;
    this.draw();
  }

  /** Walks to `to` (or, with reduced motion, simply appears there); resolves on arrival. */
  walk(to: Point, still: boolean): Promise<void> {
    cancelAnimationFrame(this.raf);
    const from = { ...this.pos };
    if (still || Math.hypot(to.x - from.x, to.y - from.y) < 4) {
      this.place(to);
      return Promise.resolve();
    }
    const ms = walkMs(from, to);
    this.walking = true;
    this.face(to.x < from.x);
    const t0 = performance.now();
    return new Promise((resolve) => {
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / ms);
        // a little bob as it goes
        const bob = Math.sin(k * Math.PI * 6) * 2 * (1 - k);
        this.place({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k - Math.abs(bob) });
        if (k < 1) this.raf = requestAnimationFrame(step);
        else {
          this.walking = false;
          this.frame = 0;
          this.draw();
          resolve();
        }
      };
      this.raf = requestAnimationFrame(step);
    });
  }

  /** A hop on the spot (a press, or a happy bark). */
  hop(still: boolean): Promise<void> {
    if (still) return Promise.resolve();
    const base = { ...this.pos };
    const t0 = performance.now();
    return new Promise((resolve) => {
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 420);
        this.place({ x: base.x, y: base.y - Math.sin(k * Math.PI) * 18 });
        if (k < 1) this.raf = requestAnimationFrame(step);
        else resolve();
      };
      this.raf = requestAnimationFrame(step);
    });
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    clearInterval(this.timer);
    this.el.remove();
  }
}
