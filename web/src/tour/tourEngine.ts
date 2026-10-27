// The tour player: plays chapters of steps (steps.ts) over the real page. A layer over the page
// (it never takes a click) holds the hosts, a ring and arrow on the control being shown, the
// speech bubble and anything wandering through; a bar along the bottom holds the caption (read
// out to screen readers) and Back, Pause, Next, Sound and Close. Steps move on by themselves.
// Recording mode hides the pointer and the buttons (the keys still work), shows a title card
// before each chapter, and keeps a steady pace, for screen recordings. A chapter on another
// page (the DOS page, dos.html) carries the tour on there with a full page load (handOff).
// While a tour plays, the page hears 'gm-tour' events ('start', 'end'): the desk makes room for
// the caption bar, and achievement notes wait until it ends.
import './tour.css';
import { h } from '../editor/core/ui';
import { Actor, loadSprites } from './actor';
import { closeMenu, findTarget, menuOpen, revealer, visible, waitFor } from './findTarget';
import { offStage, placeBubble, standBy, type Point, type Rect } from './place';
import { HOSTS, PROPS, captionOf, cssList, stepMs, voiceUrl, type Chapter, type HostId, type TourStep } from './steps';
import { TourSound } from './tourSound';
import { hushDemos } from '../media/demoAudio';

/** Asks the page's game preview to start or stop (homeShowcase.ts listens). */
const tourDemo = (what: 'play' | 'stop') => window.dispatchEvent(new CustomEvent('gm-tour-demo', { detail: what }));
import { onDosPage, pageHere, pageOf } from './tourPages';
import { parseHash } from '../urlState';
import type { Sprite } from '../cast/castStageDraw';

export interface TourOptions {
  record?: boolean;
  /** Carrying on from another page: no Start card when the sound can start without a click. */
  cont?: boolean;
  /** Said when the tour ends (finished or closed). */
  onEnd?: () => void;
}

const rectOf = (el: Element): Rect => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const announce = (what: 'start' | 'end') => window.dispatchEvent(new CustomEvent('gm-tour', { detail: what }));

/** Two addresses show the same thing (their paths match; the editor adds its own settings after them). */
const samePlace = (a: string, b: string) => parseHash(a).path.join('/') === parseHash(b).path.join('/');

/** The one tour playing. */
const now: { tour?: Tour } = {};

export const tourPlaying = (): boolean => !!now.tour;

export class Tour {
  private flat: { chapter: Chapter; step: TourStep; n: number }[];
  private i = -1;
  /** Bumped by every move, so a step still running knows it was left. */
  private token = 0;
  private paused = false;
  private still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private sprites?: Map<string, Sprite>;
  private hosts = new Map<HostId, Actor>();
  private props: Actor[] = [];
  private opened = new Set<HTMLElement>();
  private pressed?: HTMLElement;
  private chapterShown?: Chapter;
  private navigating = false;
  /** Where the visitor was, and whether the tour moved them within that page (a tour of it takes them back). */
  private startHash = location.hash;
  private moved = false;
  private returnFocus = document.activeElement as HTMLElement | null;
  private sound = new TourSound();
  private hold?: { left: number; t0: number; timer: number; done: () => void };

  private layer = h('div', { class: 'tour-layer', 'aria-hidden': 'true' });
  private ring = h('div', { class: 'tour-ring', hidden: true }, h('div', { class: 'tour-arrow' }));
  private bubble = h('div', { class: 'tour-bubble', hidden: true });
  private caption = h('p', { class: 'tour-caption', 'aria-live': 'polite' });
  private count = h('span', { class: 'tour-count' });
  private backBtn = h('button', { type: 'button', class: 'tour-back', onclick: () => this.go(this.i - 1) }, '◀ Back');
  private pauseBtn = h('button', { type: 'button', class: 'tour-pause', onclick: () => this.setPaused(!this.paused) }, 'Pause');
  private nextBtn = h('button', { type: 'button', class: 'tour-next', onclick: () => this.go(this.i + 1) }, 'Next ▶');
  private soundBtn = h('button', { type: 'button', class: 'tour-sound', 'aria-pressed': 'true', onclick: () => this.toggleSound() }, 'Sound');
  private closeBtn = h('button', { type: 'button', class: 'tour-close', onclick: () => this.end() }, 'Close tour');
  private bar = h(
    'section',
    { class: 'tour-bar', 'aria-label': 'Guided tour', tabindex: '-1' },
    h('div', { class: 'tour-words' }, this.count, this.caption),
    h('div', { class: 'tour-controls' }, this.backBtn, this.pauseBtn, this.nextBtn, this.soundBtn, this.closeBtn),
  );
  private card?: HTMLElement;
  private barSize = new ResizeObserver(() => document.documentElement.style.setProperty('--tour-bar-h', `${this.bar.offsetHeight}px`));

  constructor(
    private chapters: Chapter[],
    private opts: TourOptions = {},
  ) {
    this.flat = chapters.flatMap((chapter) => chapter.steps.map((step, n) => ({ chapter, step, n })));
  }

  /** Starts from a click (the sound may start), or from the address (recording mode asks for a click first). */
  async start(): Promise<void> {
    now.tour?.end();
    now.tour = this;
    document.documentElement.classList.toggle('tour-recording', !!this.opts.record);
    // the game previews hold still and quiet: the guides do the talking, and start one when they show it
    hushDemos(true);
    document.documentElement.classList.add('tour-on');
    tourDemo('stop');
    this.layer.append(this.ring, this.bubble);
    document.body.append(this.layer, this.bar);
    // the bar's height for a page that keeps its bottom clear of it (the DOS page's footer: tour.css)
    this.barSize.observe(this.bar);
    announce('start');
    this.showSound();
    document.addEventListener('keydown', this.onKey, true);
    window.addEventListener('hashchange', this.onHash);
    window.addEventListener('resize', this.onResize);
    this.sprites = await loadSprites();
    // carried on from another page: the browser may let the sound start without a click
    const playing = this.opts.cont && (await this.sound.startNow());
    if (this.opts.record && !playing) {
      // a click on Start lets the music play; the pointer is hidden from then on
      if (!(await this.titleCard('A guided tour', 'Game-Maker: Sandbox Edition', true))) return;
    }
    this.sound.start();
    (this.opts.record ? this.bar : this.pauseBtn).focus();
    this.go(0);
  }

  // ---- moving through the steps ------------------------------------------------------------

  private go(i: number): void {
    if (now.tour !== this) return;
    if (i >= this.flat.length) return this.end();
    i = Math.max(0, i);
    const token = ++this.token;
    this.cancelHold();
    this.i = i;
    void this.run(token).catch((e: unknown) => console.warn('Tour step failed:', e));
  }

  private live = (token: number) => token === this.token && now.tour === this;

  private async run(token: number): Promise<void> {
    // out of the click on Next first: its trip up to the document would close a menu opened here
    await sleep(0);
    if (!this.live(token)) return;
    const { chapter, step, n } = this.flat[this.i];
    this.backBtn.disabled = this.i === 0;
    this.nextBtn.textContent = this.i === this.flat.length - 1 ? 'Finish' : 'Next ▶';
    this.count.textContent = `${chapter.title} · ${n + 1} of ${chapter.steps.length}`;
    this.unpress();
    this.ring.hidden = true;
    this.bubble.hidden = true;
    // a new chapter: its page, its music, and (recording, or more than one chapter) its title card
    if (chapter !== this.chapterShown) {
      this.chapterShown = chapter;
      this.clearHosts();
      if ((chapter.file === 'dos.html') !== onDosPage()) return this.handOff(chapter);
      const elsewhere = pageHere() !== chapter.page;
      if (elsewhere || (chapter.always && !samePlace(location.hash, chapter.hash))) {
        this.navigating = true;
        if (!elsewhere) this.moved = true;
        location.hash = chapter.hash;
        await sleep(50);
        this.navigating = false;
      }
      this.sound.music(chapter.music);
      if (this.opts.record || this.chapters.length > 1 || this.opts.cont) {
        this.bubble.hidden = true;
        await this.titleCard(chapter.title, 'Game-Maker: Sandbox Edition', false, [...new Set([chapter.speaker, chapter.actor])]);
        if (!this.live(token)) return;
      }
      await waitFor(chapter.ready);
      if (!this.live(token)) return;
    }
    // the address this step is shown at, on the chapter's page (the editor's palette after its map)
    const at = this.addressOf(this.i);
    if (at && !samePlace(location.hash, at.hash)) {
      this.bubble.hidden = true;
      this.navigating = true;
      this.moved = true;
      location.hash = at.hash;
      await sleep(50);
      this.navigating = false;
      await waitFor(at.ready);
      if (!this.live(token)) return;
    }
    // the control: shown from its menu if it is in one, other menus the tour opened closed
    const need = step.target?.reveal ? revealer(step.target) : undefined;
    for (const m of this.opened) if (m !== need) (closeMenu(m), this.opened.delete(m));
    let target = step.target ? findTarget(step.target) : undefined;
    if (!target && need && step.target) {
      if (!menuOpen(need)) this.clickKeepingFocus(need);
      this.opened.add(need);
      // a menu opens at once; a panel may load first
      for (let t = 0; t < 3000 && !target; t += 100) {
        await sleep(t ? 100 : 60);
        if (!this.live(token)) return;
        target = findTarget(step.target);
      }
    }
    if (step.target && !target) {
      console.warn(`Tour: nothing on the page for ${step.id} (${cssList(step.target.css).join(', ')})`);
      this.bar.dataset.missing = step.id;
      if (step.optional) return this.go(this.i + 1);
    }
    if (target) await this.bringIntoView(target);
    if (!this.live(token)) return;
    this.caption.textContent = captionOf(chapter, step);
    const voice = this.sound.speak(voiceUrl(chapter, step));
    await this.act(chapter, step, target, token);
    if (!this.live(token)) return;
    const said = await voice;
    if (!this.live(token)) return;
    await this.wait(Math.max(stepMs(step), said));
    if (!this.live(token)) return;
    if (step.action === 'exit') await this.exitAll();
    if (this.live(token)) this.go(this.i + 1);
  }

  /** The address step `i` is shown at: the last `go` up to it in its chapter, else the chapter's own when it insists. */
  private addressOf(i: number): { hash: string; ready: string } | undefined {
    const { chapter, n } = this.flat[i];
    for (let k = n; k >= 0; k--) {
      const go = chapter.steps[k].go;
      if (go) return go;
    }
    return chapter.always ? { hash: chapter.hash, ready: chapter.ready } : undefined;
  }

  /** Scrolls the control onto the screen, above the bar, when it isn't. */
  private async bringIntoView(el: HTMLElement): Promise<void> {
    const r = rectOf(el);
    const bottom = innerHeight - this.floor();
    const across = r.x >= 0 && r.x + Math.min(r.w, 200) <= this.view().w;
    if (across && r.y >= 0 && r.y + Math.min(r.h, 200) <= bottom) return;
    // centered in what the bar leaves of the window (a phone's bar is tall)
    const margin = el.style.scrollMarginBottom;
    el.style.scrollMarginBottom = `${this.floor()}px`;
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: this.still ? 'auto' : 'smooth' });
    el.style.scrollMarginBottom = margin;
    await sleep(this.still ? 60 : 500);
  }

  // ---- the hosts ---------------------------------------------------------------------------

  private floor(): number {
    return this.bar.getBoundingClientRect().height;
  }

  private view = () => ({ w: document.documentElement.clientWidth, h: innerHeight });

  /** A host, on the layer (off the screen's edge until it walks on). */
  private host(id: HostId): Actor | undefined {
    let a = this.hosts.get(id);
    if (!a) {
      const sprite = this.sprites?.get(id);
      if (!sprite) return undefined;
      a = new Actor(sprite, this.scaleFor(HOSTS[id].scale), false);
      a.place(offStage(a.size, this.view(), this.floor(), false));
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
  private homeSpot(a: Actor, avoid: Rect | undefined, slot: number): Point {
    const v = this.view();
    const right = !!avoid && avoid.x + avoid.w / 2 < v.w / 2 && avoid.y + avoid.h > v.h / 2;
    const x = 16 + slot * (a.size.w + 12);
    return { x: right ? v.w - x - a.size.w : x, y: v.h - this.floor() - a.size.h - 8 };
  }

  private async act(chapter: Chapter, step: TourStep, target: HTMLElement | undefined, token: number): Promise<void> {
    const actorId = step.actor ?? chapter.actor;
    const speakerId = step.speaker ?? chapter.speaker;
    const actor = this.host(actorId);
    const speaker = this.host(speakerId);
    const v = this.view();
    const floor = this.floor();
    const box = target ? rectOf(target) : undefined;
    this.bubble.hidden = true;
    const slot = (id: HostId) => (id === chapter.speaker ? 0 : 1);
    const moves: Promise<void>[] = [];
    // the one talking waits in the corner away from the control (walking on the first time)
    if (speaker && speaker !== actor) moves.push(speaker.walk(this.homeSpot(speaker, box, slot(speakerId)), this.still));
    if (actor) {
      const at = step.action === 'enter' || step.action === 'say' || step.action === 'exit' || !box;
      const to = at ? this.homeSpot(actor, box, slot(actorId)) : standBy(box, actor.size, v, floor, step.action === 'press');
      moves.push(actor.walk(to, this.still));
    }
    if (step.prop) void this.runProp(step, box);
    await Promise.all(moves);
    if (!this.live(token)) return;
    if (actor && box) actor.face(box.x + box.w / 2 < actor.pos.x + actor.size.w / 2);
    if (target && (step.action === 'point' || step.action === 'press' || step.action === 'walk')) this.showRing(target, actor);
    if (step.action === 'press' && target) {
      await actor?.hop(this.still);
      this.sound.effect(step.sound);
      this.pressed = target;
      target.classList.add('tour-pressed');
      if (step.click === true || (step.click && target.matches(step.click))) this.clickKeepingFocus(target);
    } else this.sound.effect(step.sound);
    if (step.demo) tourDemo(step.demo);
    if (!this.live(token)) return;
    if (step.action === 'enter' && actor) void actor.hop(this.still);
    this.say(step, speaker, box);
  }

  private say(step: TourStep, speaker: Actor | undefined, avoid: Rect | undefined): void {
    this.bubble.textContent = step.say;
    this.bubble.hidden = false;
    const v = this.view();
    const width = Math.min(320, v.w - 32);
    this.bubble.style.width = `${width}px`;
    const size = { w: width, h: this.bubble.getBoundingClientRect().height };
    const anchor = speaker ? { ...speaker.pos, ...speaker.size } : { x: v.w / 2, y: v.h / 2, w: 0, h: 0 };
    const p = placeBubble(anchor, size, v, this.floor(), avoid);
    this.bubble.dataset.side = p.side;
    this.bubble.style.left = `${Math.round(p.x)}px`;
    this.bubble.style.top = `${Math.round(p.y)}px`;
    this.bubble.style.setProperty('--tail', `${Math.round(p.tail)}px`);
  }

  /** The ring around the control, and the arrow on the side the host stands. */
  private showRing(target: HTMLElement, by: Actor | undefined): void {
    const r = rectOf(target);
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
  }

  private onResize = () => {
    const { step } = this.flat[this.i] ?? {};
    const t = step?.target && findTarget(step.target);
    if (t && !this.ring.hidden) this.showRing(t, this.hosts.get(step.actor ?? this.flat[this.i].chapter.actor));
  };

  /** Something from the game wanders through: a chicken across the floor, a hat dropped by the control. */
  private async runProp(step: TourStep, box: Rect | undefined): Promise<void> {
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

  private clearHosts(): void {
    for (const a of [...this.hosts.values(), ...this.props]) a.dispose();
    this.hosts.clear();
    this.props = [];
  }

  private async exitAll(): Promise<void> {
    this.bubble.hidden = true;
    this.ring.hidden = true;
    const v = this.view();
    await Promise.all([...this.hosts.values()].map((a) => a.walk(offStage(a.size, v, this.floor(), a.pos.x > v.w / 2), this.still)));
  }

  // ---- the page's own controls --------------------------------------------------------------

  /** Clicks a control (a menu button, Another) and keeps the keyboard on the tour's bar. */
  private clickKeepingFocus(el: HTMLElement): void {
    const had = document.activeElement as HTMLElement | null;
    el.click();
    if (had && this.bar.contains(had)) had.focus();
    else if (this.opts.record) this.bar.focus();
  }

  private unpress(): void {
    this.pressed?.classList.remove('tour-pressed');
    this.pressed = undefined;
  }

  // ---- timing, pause, sound and keys ---------------------------------------------------------

  private wait(ms: number): Promise<void> {
    return new Promise((done) => {
      this.hold = { left: ms, t0: performance.now(), timer: 0, done };
      if (!this.paused) this.hold.timer = window.setTimeout(done, ms);
    });
  }

  private cancelHold(): void {
    if (this.hold) clearTimeout(this.hold.timer);
    this.hold = undefined;
  }

  private setPaused(paused: boolean): void {
    this.paused = paused;
    this.pauseBtn.textContent = paused ? 'Play' : 'Pause';
    this.pauseBtn.setAttribute('aria-label', paused ? 'Play the tour' : 'Pause the tour');
    this.sound.pause(paused);
    const hold = this.hold;
    if (!hold) return;
    if (paused) {
      clearTimeout(hold.timer);
      hold.left -= performance.now() - hold.t0;
    } else {
      hold.t0 = performance.now();
      hold.timer = window.setTimeout(hold.done, Math.max(400, hold.left));
    }
  }

  private toggleSound(): void {
    this.sound.set(!this.sound.on);
    if (this.sound.on) this.sound.music(this.chapterShown?.music);
    this.showSound();
  }

  private showSound(): void {
    this.soundBtn.setAttribute('aria-pressed', String(this.sound.on));
    this.soundBtn.textContent = this.sound.on ? '🔊 Sound' : '🔇 Sound';
    this.soundBtn.setAttribute('aria-label', this.sound.on ? 'Sound on (press to mute)' : 'Sound off (press to turn on)');
  }

  private onKey = (e: KeyboardEvent) => {
    // a dialog of the page's own takes its own keys
    if (document.querySelector('dialog[open]') || this.card?.querySelector('button')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.end();
      return;
    }
    // recording mode has no buttons: the keys drive it
    if (!this.opts.record && !this.bar.contains(document.activeElement)) return;
    const typing = (e.target as HTMLElement).closest?.('input, textarea, select');
    if (typing) return;
    if (e.key === 'ArrowRight') this.go(this.i + 1);
    else if (e.key === 'ArrowLeft') this.go(this.i - 1);
    else if (this.opts.record && e.key === ' ') this.setPaused(!this.paused);
    else if (this.opts.record && e.key.toLowerCase() === 'm') this.toggleSound();
    else return;
    e.preventDefault();
  };

  /** Leaving the page (a link the visitor followed) ends the tour. */
  private onHash = () => {
    const chapter = this.flat[this.i]?.chapter;
    if (!this.navigating && chapter && pageHere() !== chapter.page) this.end();
  };

  // ---- another page -------------------------------------------------------------------------

  /**
   * The tour goes on on another page (the DOS page, or back to index.html from it): its title
   * card comes up here and again there, and the address there names the chapters left, with
   * &cont so it carries on without a Start card when the browser lets its sound start.
   */
  private handOff(chapter: Chapter): void {
    const rest = this.chapters.slice(this.chapters.indexOf(chapter)).map((c) => c.id);
    const params = `tour=${rest.join(',')}${this.opts.record ? '&record' : ''}&cont`;
    const url = chapter.file ? `./${chapter.file}?${params}` : `./${chapter.hash}${chapter.hash.includes('?') ? '&' : '?'}${params}`;
    this.cancelHold();
    this.sound.dispose();
    this.bubble.hidden = this.ring.hidden = true;
    void this.titleCard(chapter.title, 'Game-Maker: Sandbox Edition', false, [...new Set([chapter.speaker, chapter.actor])]);
    // a moment for the card to show, then the page
    setTimeout(() => location.assign(url), 300);
  }

  // ---- title cards and the end ---------------------------------------------------------------

  /** A chapter's title card for a moment; with `ask`, a Start button that waits for a click (false: closed). */
  private titleCard(title: string, sub: string, ask = false, who: HostId[] = ['teddy', 'gwinn']): Promise<boolean> {
    const hosts = who.map((id) => {
      const s = this.sprites?.get(id);
      return s ? new Actor(s, HOSTS[id].scale + 1, false) : undefined;
    });
    const start = ask ? h('button', { type: 'button', class: 'primary tour-start' }, '▶ Start') : undefined;
    const card = h(
      'div',
      { class: 'tour-card', role: ask ? 'dialog' : undefined, 'aria-label': ask ? title : undefined },
      h('div', { class: 'tour-card-hosts' }, ...hosts.map((a) => a?.el)),
      h('p', { class: 'tour-card-sub' }, sub),
      h('h2', { class: 'tour-card-title' }, title),
      start,
    );
    this.card = card;
    document.body.append(card);
    this.caption.textContent = ask ? '' : title;
    const done = (ok: boolean) => {
      for (const a of hosts) a?.dispose();
      card.remove();
      if (this.card === card) this.card = undefined;
      return ok;
    };
    if (start) {
      start.focus();
      return new Promise((resolve) => {
        start.addEventListener('click', () => resolve(done(now.tour === this)));
        card.addEventListener('keydown', (e) => e.key === 'Escape' && (this.end(), resolve(done(false))));
      });
    }
    return sleep(2600).then(() => done(now.tour === this));
  }

  /** Ends the tour: everything taken away, menus it opened shut, the keyboard back where it was. */
  end(): void {
    if (now.tour !== this) return;
    now.tour = undefined;
    this.token++;
    this.cancelHold();
    this.unpress();
    for (const m of this.opened) closeMenu(m);
    this.opened.clear();
    this.clearHosts();
    this.sound.dispose();
    hushDemos(false);
    document.documentElement.classList.remove('tour-on');
    this.card?.remove();
    this.layer.remove();
    this.bar.remove();
    this.barSize.disconnect();
    document.documentElement.style.removeProperty('--tour-bar-h');
    document.documentElement.classList.remove('tour-recording');
    announce('end');
    document.removeEventListener('keydown', this.onKey, true);
    window.removeEventListener('hashchange', this.onHash);
    window.removeEventListener('resize', this.onResize);
    // a tour of just this page goes back to what the visitor had open on it (their own game, not the one shown)
    const page = pageOf(this.startHash);
    if (this.moved && this.chapters.every((c) => c.page === page) && pageOf(location.hash) === page && location.hash !== this.startHash)
      location.hash = this.startHash;
    const back = this.returnFocus;
    if (back && back !== document.body && back.isConnected && visible(back)) back.focus();
    else document.querySelector<HTMLElement>('.tour-btn')?.focus();
    this.opts.onEnd?.();
  }
}
