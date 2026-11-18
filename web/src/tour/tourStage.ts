// Positions the tour's hosts, props, bubble and highlight over the real page.
import { h } from '../editor/core/ui';
import { Actor } from './actor';
import { findTarget, visible } from './findTarget';
import { barOnTop, steadyRect, offStage, placeBubble, standBy, type Point, type Rect } from './place';
import { HOSTS, PROPS, type Chapter, type HostId, type TourStep } from './steps';
import type { Sprite } from '../cast/castStageDraw';
import { sleep } from './tourClock';

export const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};
/** Waits until `el` stays put on the screen for a few frames (a scroll has finished), at most `max` ms. */
async function settled(el: HTMLElement, max = 4000): Promise<void> {
  const end = performance.now() + max;
  let last = '';
  for (let still = 0; still < 4 && performance.now() < end;) {
    await new Promise((r) => requestAnimationFrame(r));
    const r = el.getBoundingClientRect();
    const at = `${Math.round(r.x)},${Math.round(r.y)}`;
    still = at === last ? still + 1 : 0;
    last = at;
  }
}

export class TourStage {
  sprites?: Map<string, Sprite>;
  private hosts = new Map<HostId, Actor>();
  private props: Actor[] = [];
  layer = h('div', { class: 'tour-layer', 'aria-hidden': 'true' });
  ring = h('div', { class: 'tour-ring', hidden: true }, h('div', { class: 'tour-arrow' }));
  bubble = h('div', { class: 'tour-bubble', hidden: true });
  /** Which showing of the ring is current (an older one's watcher stops). */
  private ringGen = 0;

  constructor(
    private still: boolean,
    private active: () => boolean,
    private current: () => { chapter: Chapter; step: TourStep } | undefined,
    private card: () => HTMLElement | undefined,
    private getBar: () => HTMLElement,
  ) {}

  private get bar(): HTMLElement {
    return this.getBar();
  }

  /** Scrolls the control onto the screen, above the bar, when it isn't. */
  async bringIntoView(el: HTMLElement): Promise<void> {
    const r = rectOf(el);
    const bottom = innerHeight - this.floor();
    const across = r.x >= 0 && r.x + Math.min(r.w, 200) <= this.view().w;
    if (across && r.y >= 0 && r.y + Math.min(r.h, 200) <= bottom) return;
    // centered in what the bar leaves of the window (a phone's bar is tall)
    const margin = el.style.scrollMarginBottom;
    el.style.scrollMarginBottom = `${this.floor()}px`;
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: this.still ? 'auto' : 'smooth' });
    el.style.scrollMarginBottom = margin;
    // a long smooth scroll outlasts any fixed wait: the hosts aim only once the control stops moving
    await settled(el);
  }

  /** The room the bar takes at the bottom: none while it sits at the top for a control under it. */
  floor(): number {
    return this.barTop ? 0 : this.bar.getBoundingClientRect().height;
  }

  /** The bar is at the top edge, out of the way of a control in a fixed footer. */
  private barTop = false;

  /** Puts the bar at the top while the control would be under it at the bottom, back at the bottom when it isn't. */
  clearBar(target: HTMLElement | undefined): boolean {
    const h = this.bar.getBoundingClientRect().height;
    const r = target && rectOf(target);
    const w = this.view().w;
    const under = !!r && barOnTop(r, { x: 0, y: innerHeight - h, w, h }, { x: 0, y: 0, w, h });
    if (under === this.barTop) return false;
    this.barTop = under;
    this.bar.classList.toggle('tour-bar-top', under);
    return true;
  }

  view = () => ({ w: document.documentElement.clientWidth, h: innerHeight });

  /** A host, on the layer (off the screen's edge until it walks on). */
  host(id: HostId): Actor | undefined {
    let a = this.hosts.get(id);
    if (!a) {
      const sprite = this.sprites?.get(id);
      if (!sprite) return undefined;
      a = new Actor(sprite, this.scaleFor(HOSTS[id].scale), false);
      // already in the Library (a regular wandering it, or Joe behind his desk, hidden while the tour is on):
      // the tour takes them over where they stand, so they walk out from there
      const visitor = document.querySelector<HTMLElement>(`.lib-visitor[data-cast="${id}"]`);
      const there = visitor ?? (id === 'joe' ? document.querySelector<HTMLElement>('.lib-o-joe canvas') : null);
      const r = there?.getBoundingClientRect();
      if (r && r.width && r.right > 0 && r.left < this.view().w && r.bottom > 0 && r.top < this.view().h) {
        // Joe steps out from the desk's back corner (his spot, as percents of the room), not onto the desk's front
        const out = visitor ? undefined : document.querySelector<HTMLElement>('.lib-o-joe')?.dataset.out?.split(',').map(Number);
        const room = document.querySelector('.lib-room')?.getBoundingClientRect();
        if (out && room && out.length === 2 && out.every(Number.isFinite))
          a.place({ x: room.left + (room.width * out[0]) / 100 - a.size.w / 2, y: room.top + (room.height * out[1]) / 100 - a.size.h });
        else a.place({ x: r.left + r.width / 2 - a.size.w / 2, y: r.bottom - a.size.h });
        visitor?.remove();
        // Joe or the visitor starts as big as they stand in the room (a visitor is drawn bigger than a tour
        // host), then shrinks to tour size as they walk to their spot, never popping smaller where they stood
        if (r.width > a.size.w && !this.still) a.startAt({ w: r.width, h: (r.width * a.size.h) / a.size.w });
      } else {
        a.place(offStage(a.size, this.view(), this.floor(), false));
        // a visitor still walking in from the edge is the same person: the host takes their place, never a second copy
        visitor?.remove();
      }
      a.el.dataset.host = id;
      this.layer.append(a.el);
      this.hosts.set(id, a);
    }
    return a;
  }

  /** Smaller sprites on a phone. */
  private scaleFor(scale: number): number {
    return this.view().w < 600 ? Math.max(2, scale - 1) : scale;
  }

  /** Where the one talking waits: the bottom corner away from the control. */
  homeSpot(a: Actor, avoid: Rect | undefined, slot: number): Point {
    const v = this.view();
    const right = !!avoid && avoid.x + avoid.w / 2 < v.w / 2 && avoid.y + avoid.h > v.h / 2;
    const x = 16 + slot * (a.size.w + 12);
    return { x: right ? v.w - x - a.size.w : x, y: v.h - this.floor() - a.size.h - 8 };
  }

  say(step: TourStep, speaker: Actor | undefined, avoid: Rect | undefined): void {
    this.bubble.textContent = step.say;
    this.bubble.hidden = false;
    const v = this.view();
    const width = Math.min(320, v.w - 32);
    this.bubble.style.width = `${width}px`;
    // The pop-in animation scales its painted bounds; layout must use its full final height.
    const size = { w: width, h: this.bubble.offsetHeight };
    const anchor = speaker ? { ...speaker.pos, ...speaker.size } : { x: v.w / 2, y: v.h / 2, w: 0, h: 0 };
    const others = [...this.hosts.values()].filter((host) => host !== speaker).map((host) => ({ ...host.pos, ...host.size }));
    const p = placeBubble(anchor, size, v, this.floor(), avoid, 8, others, this.barTop ? this.bar.getBoundingClientRect().height + 8 : 8);
    this.bubble.dataset.side = p.side;
    this.bubble.style.left = `${Math.round(p.x)}px`;
    this.bubble.style.top = `${Math.round(p.y)}px`;
    this.bubble.style.setProperty('--tail', `${Math.round(p.tail)}px`);
  }

  /** The ring around the control, and the arrow on the side the host stands. */
  showRing(target: HTMLElement, by: Actor | undefined, steady = false): void {
    const measure = () =>
      steady ? steadyRect(rectOf(target.parentElement ?? target), 1.2 * Math.max(target.offsetWidth, target.offsetHeight)) : rectOf(target);
    // the page may have settled or shifted since the step began: the bar moves for where the control is now
    this.clearBar(target);
    const r = measure();
    Object.assign(this.ring.style, { left: `${r.x - 4}px`, top: `${r.y - 4}px`, width: `${r.w + 8}px`, height: `${r.h + 8}px` });
    let side = 'below';
    if (by) {
      const cx = by.pos.x + by.size.w / 2;
      const cy = by.pos.y + by.size.h / 2;
      if (cy > r.y + r.h) side = 'below';
      else if (cy < r.y) side = 'above';
      else side = cx < r.x ? 'left' : 'right';
    }
    this.ring.dataset.side = side;
    this.ring.hidden = false;
    this.followRing(target, measure);
  }

  /**
   * Keeps the ring on its control while it shows: it moves with it (a page that shifts), and
   * goes when the control does (a pressed Next that turned the page).
   */
  private followRing(target: HTMLElement, measure: () => Rect): void {
    const ring = this.ring;
    const was = measure();
    const gen = ++this.ringGen;
    const look = () => {
      if (gen !== this.ringGen || ring.hidden || !this.active()) return;
      if (!target.isConnected || !visible(target) || this.covered(target)) {
        // gone, or covered by what its press opened (a manual over its button): ring and press go
        ring.hidden = true;
        target.classList.remove('tour-pressed');
        return;
      }
      const r = measure();
      if (Math.abs(r.x - was.x) > 1 || Math.abs(r.y - was.y) > 1 || Math.abs(r.w - was.w) > 1 || Math.abs(r.h - was.h) > 1) {
        Object.assign(was, r);
        if (this.clearBar(target)) this.resize();
        Object.assign(ring.style, { left: `${r.x - 4}px`, top: `${r.y - 4}px`, width: `${r.w + 8}px`, height: `${r.h + 8}px` });
      }
      requestAnimationFrame(look);
    };
    requestAnimationFrame(look);
  }

  /** Something of the page's own lies over the middle of the control (an overlay its press opened). */
  private covered(target: HTMLElement): boolean {
    const r = target.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false;
    const top = document.elementFromPoint(x, y);
    return !!top && !target.contains(top) && !top.contains(target) && !this.bar.contains(top) && !this.layer.contains(top) && !this.card()?.contains(top);
  }

  resize = () => {
    const current = this.current();
    if (!current) return;
    const { step, chapter } = current;
    const t = step?.target && findTarget(step.target);
    const actorId = step.actor ?? chapter.actor,
      speakerId = step.speaker ?? chapter.speaker;
    const actor = this.hosts.get(actorId),
      speaker = this.hosts.get(speakerId);
    if (!this.bubble.hidden) {
      const view = this.view(),
        floor = this.floor(),
        box = t ? rectOf(t) : undefined;
      for (const host of this.hosts.values())
        host.place({
          x: Math.max(0, Math.min(view.w - host.size.w, host.pos.x)),
          y: Math.max(0, Math.min(view.h - floor - host.size.h, host.pos.y)),
        });
      const slot = (id: HostId) => (id === chapter.speaker ? 0 : 1);
      if (speaker && speaker !== actor) speaker.place(this.homeSpot(speaker, box, slot(speakerId)));
      if (actor) {
        const at = step.action === 'enter' || step.action === 'say' || step.action === 'exit' || !box;
        actor.place(at ? this.homeSpot(actor, box, slot(actorId)) : standBy(box, actor.size, view, floor, step.action === 'press'));
      }
      this.say(step, speaker, box);
    }
    if (t && !this.ring.hidden) this.showRing(t, actor);
  };

  /** Something from the game wanders through: a chicken across the floor, a hat dropped by the control. */
  async runProp(step: TourStep, box: Rect | undefined): Promise<void> {
    const cue = step.prop!;
    const sprite = this.sprites?.get(cue.id);
    if (!sprite) return;
    const a = new Actor(sprite, this.scaleFor(PROPS[cue.id].scale), !sprite.sprite.walk);
    this.props.push(a);
    this.layer.append(a.el);
    const v = this.view();
    const floor = this.floor();
    if (cue.run === 'across') {
      a.place(offStage(a.size, v, floor, false));
      await a.walk({ x: v.w + 8, y: a.pos.y }, false);
    } else {
      const spot = box ? standBy(box, a.size, v, floor) : { x: v.w / 2, y: v.h / 2 };
      a.place({ x: spot.x, y: -a.size.h });
      await a.walk(spot, this.still);
      await sleep(2500);
    }
    a.dispose();
  }

  clearHosts(): void {
    for (const a of [...this.hosts.values(), ...this.props]) a.dispose();
    this.hosts.clear();
    this.props = [];
  }

  async exitAll(): Promise<void> {
    this.bubble.hidden = true;
    this.ring.hidden = true;
    const v = this.view();
    await Promise.all([...this.hosts.values()].map((a) => a.walk(offStage(a.size, v, this.floor(), a.pos.x > v.w / 2), this.still)));
  }
}
