// The tour player: plays chapters of steps (steps.ts) over the real page. A layer over the page
// (it never takes a click) holds the hosts, a ring and arrow on the control being shown, the
// speech bubble and anything wandering through; a bar along the bottom holds the caption (read
// out to screen readers) and Back, Pause, Next, Sound and Close. Steps move on by themselves.
// Recording mode hides the pointer and the buttons (the keys still work), shows a title card
// before each chapter, and keeps a steady pace, for screen recordings. A chapter on another
// page (the DOS page, dos.html) carries the tour on there with a full page load (handOff).
// While a tour plays, the page hears 'gm-tour' events ('start', 'end'): the desk makes room for
// the caption bar, and achievement notes wait until it ends.
import { availableOffline } from '../offline/availability';
import './tour.css';
import { h } from '../editor/core/ui';
import { loadSprites } from './actor';
import { findTarget, revealer, visible, waitFor } from './findTarget';
import { menuHandle, overlayHandle, type Opened } from './tourOpen';
import { standBy } from './place';
import { TourStage, rectOf } from './tourStage';
import { TourClock, sleep } from './tourClock';
import { titleCard } from './tourCard';
import { hasClip, loadClipIndex, type ClipIndex } from './voiceIndex';
import { captionOf, cssList, stepMs, voiceUrl, type Chapter, type HostId, type PageAct, type TourStep } from './steps';
import { TourSound } from './tourSound';
import { TourRecorder } from './tourRecorder';
import { recordNoticeText, showRecordNotice } from './recordNotice';
import { CHAPTERS } from './chapters/index';
import { hushDemos } from '../media/demoAudio';

/** Asks the page's game preview to start or stop (homeShowcase.ts listens). */
const tourDemo = (what: 'play' | 'stop') => window.dispatchEvent(new CustomEvent('gm-tour-demo', { detail: what }));
import { askPage } from './pageAct';
import { onDosPage, pageHere, pageOf } from './tourPages';
import { parseHash, setHashParams } from '../urlState';

interface TourOptions {
  record?: boolean;
  /** Carrying on from another page: no Start card when the sound can start without a click. */
  cont?: boolean;
  /** Said when the tour ends (finished or closed). */
  onEnd?: () => void;
}

const announce = (what: 'start' | 'end') => window.dispatchEvent(new CustomEvent('gm-tour', { detail: what }));
/** Asks the page to do something for a step (steps.ts PageAct; the desk's deskTour.ts listens). */
const pageAct = (act: PageAct) => askPage(act);

/** A localStorage value, or null (none, or no storage). */
const stored = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/** Two addresses show the same thing (their paths match; the editor adds its own settings after them). */
const samePlace = (a: string, b: string) => parseHash(a).path.join('/') === parseHash(b).path.join('/');
/** The same page and the same settings on it (a step's `go` may only change a filter). */
const sameAddress = (a: string, b: string) => {
  const [x, y] = [parseHash(a), parseHash(b)];
  return samePlace(a, b) && Object.entries(y.params).every(([k, v]) => x.params[k] === v);
};

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
  /** Menus and overlays the tour opened, by their handle's key (tourOpen.ts). */
  private opened = new Map<unknown, Opened>();
  /** Openers whose control was not on the page, so later steps behind them wait less for it. */
  private unopenable = new Set<unknown>();
  /** Where the keyboard goes back once a menu that kept it for a press is done with (focusBack). */
  private focusLater?: HTMLElement;
  private releaseFocusHold?: () => void;
  /** Steps whose page act was asked for (once a tour), and the chapters they were in. */
  private acted = new Set<string>();
  private actedIn = new Set<Chapter>();
  /** What the chapter shown changed and puts back when it is left (steps.ts Keep). */
  private kept?: { chapter: Chapter; storage: [string, string | null][]; selected?: string; params: Record<string, string | undefined> };
  /** A page's overlay making the rest of the page inert doesn't take the tour's own bar and layer. */
  private uninert = new MutationObserver((list) => {
    for (const m of list) if ((m.target as HTMLElement).inert) (m.target as HTMLElement).inert = false;
  });
  private pressed?: HTMLElement;
  private chapterShown?: Chapter;
  private navigating = false;
  /** Where the visitor was, and whether the tour moved them within that page (a tour of it takes them back). */
  private startHash = location.hash;
  private moved = false;
  private returnFocus = document.activeElement as HTMLElement | null;
  private sound = new TourSound();

  private clock = new TourClock();
  private stage = new TourStage(
    this.still,
    () => now.tour === this,
    () => this.flat[this.i],
    () => this.card,
    () => this.bar,
  );
  private onResize = () => this.stage.resize();
  private caption = h('p', { class: 'tour-caption', 'aria-live': 'polite' });
  private count = h('span', { class: 'tour-count' });
  private backBtn = h('button', { type: 'button', class: 'tour-back', onclick: () => this.go(this.i - 1) }, '◀ Back');
  private notice?: HTMLElement;
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
  /** Recording the tab, a video a chapter (Record the whole tour), when the visitor agreed to share it. */
  private recorder?: TourRecorder;
  private barSize = new ResizeObserver(() => {
    document.documentElement.style.setProperty('--tour-bar-h', `${this.bar.offsetHeight}px`);
    this.onResize();
  });

  constructor(
    private chapters: Chapter[],
    private opts: TourOptions = {},
  ) {
    this.flat = chapters.flatMap((chapter) => chapter.steps.map((step, n) => ({ chapter, step, n })));
  }

  /** Starts from a click (the sound may start), or from the address (recording mode asks for a click first). */
  /** Which steps have a recorded clip (voiceIndex.ts); every step is assumed to until it has loaded. */
  private clips?: ClipIndex;

  /** A step's clip address, or none when the index says there is none. */
  private clipUrl(chapter: Chapter, step: TourStep): string | undefined {
    return hasClip(this.clips, chapter.id, step.id) ? voiceUrl(chapter, step) : undefined;
  }

  async start(): Promise<void> {
    void loadClipIndex().then((index) => (this.clips = index));
    now.tour?.end();
    now.tour = this;
    document.documentElement.classList.toggle('tour-recording', !!this.opts.record);
    // the game previews hold still and quiet: the guides do the talking, and start one when they show it
    hushDemos(true);
    document.documentElement.classList.add('tour-on');
    tourDemo('stop');
    this.stage.layer.append(this.stage.ring, this.stage.bubble);
    document.body.append(this.stage.layer, this.bar);
    // the bar's height for a page that keeps its bottom clear of it (the DOS page's footer: tour.css)
    this.barSize.observe(this.bar);
    announce('start');
    this.showSound();
    // on the window, ahead of the overlays the tour opens (they take every key once they are up)
    window.addEventListener('keydown', this.onKey, true);
    for (const el of [this.stage.layer, this.bar]) this.uninert.observe(el, { attributes: true, attributeFilter: ['inert'] });
    window.addEventListener('hashchange', this.onHash);
    window.addEventListener('resize', this.onResize);
    this.stage.sprites = await loadSprites();
    if (now.tour !== this) return;
    // carried on from another page: the browser may let the sound start without a click (a
    // recording still asks for one, to share the new page)
    if (this.opts.cont) await this.sound.startNow();
    if (now.tour !== this) return;
    if (this.opts.record) {
      // a click on Start lets the music play and the tab be recorded (asked again on each page,
      // since a recording can't carry over a page load); the pointer is hidden from then on
      if (!(await this.titleCard('A guided tour', 'Game-Maker: Sandbox Edition', true))) return;
      const asked = await TourRecorder.ask();
      this.recorder = asked.recorder;
      if (now.tour !== this) return void this.recorder?.finish();
      const text = recordNoticeText(asked);
      if (text) {
        // nothing is being recorded: say so, and play as a plain tour (pointer and buttons back)
        this.opts = { ...this.opts, record: false };
        document.documentElement.classList.remove('tour-recording');
        this.notice = showRecordNotice(text);
      }
    }
    this.sound.start();
    (this.opts.record ? this.bar : this.pauseBtn).focus();
    this.go(0);
  }

  // ---- moving through the steps ------------------------------------------------------------

  private go(i: number): void {
    if (now.tour !== this) return;
    if (i >= this.flat.length) return void this.finale();
    i = Math.max(0, i);
    const token = ++this.token;
    this.clock.cancelHold();
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
    this.stage.ring.hidden = true;
    this.stage.bubble.hidden = true;
    // a new chapter: its page, its music, and (recording, or more than one chapter) its title card
    if (chapter !== this.chapterShown) {
      // what the last chapter changed goes back while its page is still here
      await this.leaveChapter();
      if (!this.live(token)) return;
      this.chapterShown = chapter;
      this.stage.clearHosts();
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
      // each chapter its own video, numbered in the whole tour's order
      await this.recorder?.chapter(CHAPTERS.indexOf(chapter) + 1, chapter.id);
      if (!this.live(token)) return;
      if (this.opts.record || this.chapters.length > 1 || this.opts.cont) {
        this.stage.bubble.hidden = true;
        await this.titleCard(chapter.title, 'Game-Maker: Sandbox Edition', false, [...new Set([chapter.speaker, chapter.actor])]);
        if (!this.live(token)) return;
      }
      await waitFor(chapter.ready);
      if (!this.live(token)) return;
      this.keepFor(chapter);
    }
    // the address this step is shown at, on the chapter's page (the editor's palette after its map)
    const at = this.addressOf(this.i);
    if (at && !sameAddress(location.hash, at.hash)) {
      this.stage.bubble.hidden = true;
      this.navigating = true;
      this.moved = true;
      location.hash = at.hash;
      // the page redraws for its new address before the old controls can be mistaken for the new
      await sleep(250);
      this.navigating = false;
      await waitFor(at.ready);
      if (!this.live(token)) return;
    }
    // the control: shown from its menu or overlay if it is in one, others the tour opened closed
    const need = this.handleFor(step);
    for (const [k, m] of this.opened) if (k !== need?.key) (this.closeKeepingFocus(m), this.opened.delete(k));
    let target = step.target ? findTarget(step.target) : undefined;
    this.focusBack();
    // an opener that failed already is tried briefly, not for the full wait again
    const patience = step.target?.in && this.unopenable.has(step.target.in) ? 300 : 3000;
    if (need && step.target && (!target || !need.isOpen())) {
      await this.openKeepingFocus(need, step.action === 'press' && !!step.click);
      if (!this.live(token)) return;
      // a menu opens at once; a panel may load first
      for (let t = 0; t < patience && !(target = findTarget(step.target)); t += 100) {
        await sleep(100);
        if (!this.live(token)) return;
      }
    }
    if (step.target && !target) {
      if (step.target.in) this.unopenable.add(step.target.in);
      console.warn(`Tour: nothing on the page for ${step.id} (${cssList(step.target.css).join(', ')})`);
      this.bar.dataset.missing = step.id;
      if (step.optional) return this.go(this.i + 1);
    }
    if (target) await this.stage.bringIntoView(target);
    if (!this.live(token)) return;
    this.stage.clearBar(target);
    this.caption.textContent = captionOf(chapter, step);
    const clip = this.clipUrl(chapter, step);
    if (clip && !(await availableOffline(clip))) {
      if (!this.live(token)) return;
      this.soundBtn.title = 'Spoken tour: Not in your offline copy';
      this.soundBtn.textContent = 'No voice offline';
    } else {
      this.soundBtn.removeAttribute('title');
      this.showSound();
    }
    // the clip starts with the bubble (after the hosts have walked), never before it
    let voice: Promise<number> = Promise.resolve(0);
    const speak = () => (voice = this.sound.speak(this.clipUrl(chapter, step)));
    // the next steps' clips load while this one plays (a clip that is late stays silent)
    for (const up of this.flat.slice(this.i + 1, this.i + 3)) this.sound.prefetch(this.clipUrl(up.chapter, up.step));
    await this.act(chapter, step, target, token, speak);
    if (!this.live(token)) return;
    const said = await voice;
    if (!this.live(token)) return;
    await this.clock.wait(Math.max(stepMs(step), said), this.paused);
    if (!this.live(token)) return;
    if (step.action === 'exit') await this.stage.exitAll();
    if (this.live(token)) this.go(this.i + 1);
  }

  /** What a step's control is in: a menu its target reveals, or an overlay it is `in`. */
  private handleFor(step: TourStep): Opened | undefined {
    const t = step.target;
    if (t?.in) return this.opened.get(t.in) ?? overlayHandle(t.in, (el) => el.click());
    const button = t?.reveal ? revealer(t) : undefined;
    return button
      ? (this.opened.get(button) ??
          menuHandle(
            button,
            (el) => el.click(),
            () => findTarget(t!),
          ))
      : undefined;
  }

  /**
   * Opens a menu or overlay and keeps it until the tour moves past it. The keyboard stays on the
   * tour's bar (an overlay moves it into itself), and a page's modal dialog, which the browser
   * puts above everything, gets the tour's layer and bar put above it in turn.
   */
  private async openKeepingFocus(m: Opened, later = false): Promise<void> {
    this.opened.set(m.key, m);
    const had = document.activeElement as HTMLElement | null;
    await m.open();
    if (now.tour !== this) return m.close();
    const back = had && this.bar.contains(had) ? had : this.opts.record ? this.bar : undefined;
    // a menu that shuts when the keyboard leaves it (the modem's speeds) keeps it until its item is pressed
    if (later) this.focusLater = back;
    else if (back) (back.focus({ preventScroll: true }), this.holdFocus(back));
    if (document.querySelector('dialog:modal')) this.raise();
  }

  /** The keyboard back on the tour's bar, if a menu kept it for a press. */
  private focusBack(): void {
    const el = this.focusLater;
    this.focusLater = undefined;
    if (el?.isConnected && now.tour === this) el.focus({ preventScroll: true });
  }

  /** Shuts a menu or overlay; one that hands the keyboard back to what opened it leaves it on the tour's bar. */
  private closeKeepingFocus(m: Opened): void {
    const had = document.activeElement as HTMLElement | null;
    m.close();
    if (had && this.bar.contains(had) && had.isConnected && document.activeElement !== had) had.focus({ preventScroll: true });
  }

  /** The layer and the bar in the browser's top layer, above a modal dialog just opened. */
  private raise(): void {
    for (const el of [this.stage.layer, this.bar]) {
      el.popover = 'manual';
      if (el.matches(':popover-open')) el.hidePopover();
      el.showPopover();
    }
  }

  // ---- what a chapter changes, put back --------------------------------------------------------

  /** Notes what the chapter will change (steps.ts Keep), as it starts. */
  private keepFor(chapter: Chapter): void {
    const k = chapter.keep;
    if (!k) return void (this.kept = undefined);
    const { params } = parseHash(location.hash);
    this.kept = {
      chapter,
      storage: (k.storage ?? []).map((key) => [key, stored(key)]),
      selected: k.selected ? document.querySelector(k.selected)?.id || undefined : undefined,
      params: Object.fromEntries((k.params ?? []).map((p) => [p, params[p]])),
    };
  }

  /**
   * The chapter shown is left: menus and overlays it opened shut, its page tidied up (its leave
   * act, once it did something there), and what it changed put back.
   */
  private async leaveChapter(): Promise<void> {
    for (const m of this.opened.values()) this.closeKeepingFocus(m);
    this.opened.clear();
    const chapter = this.chapterShown;
    if (chapter?.leave && this.actedIn.delete(chapter)) void pageAct({ do: chapter.leave });
    const kept = this.kept;
    this.kept = undefined;
    if (!kept || kept.chapter !== chapter) return;
    const was = kept.selected ? document.getElementById(kept.selected) : null;
    if (was && was.getAttribute('aria-selected') !== 'true') {
      was.click();
      // the page redraws for it before its settings are put back over what the click remembered
      await sleep(50);
    }
    for (const [key, value] of kept.storage)
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch {
        /* no storage: nothing was kept either */
      }
    if (Object.keys(kept.params).length && pageOf(location.hash) === chapter.page) setHashParams(kept.params);
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

  // ---- the hosts ---------------------------------------------------------------------------

  private async act(chapter: Chapter, step: TourStep, target: HTMLElement | undefined, token: number, speak: () => void): Promise<void> {
    const actorId = step.actor ?? chapter.actor;
    const speakerId = step.speaker ?? chapter.speaker;
    const actor = this.stage.host(actorId);
    const speaker = this.stage.host(speakerId);
    const v = this.stage.view();
    const floor = this.stage.floor();
    const box = target ? rectOf(target) : undefined;
    this.stage.bubble.hidden = true;
    const slot = (id: HostId) => (id === chapter.speaker ? 0 : 1);
    const moves: Promise<void>[] = [];
    // the one talking waits in the corner away from the control (walking on the first time)
    if (speaker && speaker !== actor) moves.push(speaker.walk(this.stage.homeSpot(speaker, box, slot(speakerId)), this.still));
    if (actor) {
      const at = step.action === 'enter' || step.action === 'say' || step.action === 'exit' || !box;
      const to = at ? this.stage.homeSpot(actor, box, slot(actorId)) : standBy(box, actor.size, v, floor, step.action === 'press');
      moves.push(actor.walk(to, this.still));
    }
    if (step.prop) void this.stage.runProp(step, box);
    await Promise.all(moves);
    if (!this.live(token)) return;
    if (actor && box) actor.face(box.x + box.w / 2 < actor.pos.x + actor.size.w / 2);
    if (target && (step.action === 'point' || step.action === 'press' || step.action === 'walk')) this.stage.showRing(target, actor, !!step.target?.steady);
    if (step.action === 'press' && target) {
      await actor?.hop(this.still);
      this.sound.effect(step.sound);
      this.pressed = target;
      target.classList.add('tour-pressed');
      if (step.click === true || (step.click && target.matches(step.click))) this.clickKeepingFocus(target);
      // the pressed item shows a moment in its menu before the keyboard comes back (which may shut it)
      if (this.focusLater) setTimeout(() => this.live(token) && this.focusBack(), 1500);
      if (step.opens) {
        await this.openKeepingFocus(overlayHandle(step.opens, (el) => el.click()));
        if (!this.live(token)) return;
      }
    } else this.sound.effect(step.sound);
    let held: Promise<void> = Promise.resolve();
    if (step.act && !this.acted.has(step.id)) {
      this.acted.add(step.id);
      this.actedIn.add(chapter);
      held = pageAct(step.act);
    }
    if (step.demo) tourDemo(step.demo);
    if (!this.live(token)) return;
    if (step.action === 'enter' && actor) await actor.hop(this.still);
    if (!this.live(token)) return;
    // a held line waits for the page (the BBS's handle prompt on the screen)
    await held;
    if (!this.live(token)) return;
    this.stage.say(step, speaker, box);
    speak();
  }

  // ---- the page's own controls --------------------------------------------------------------

  /** Clicks a control (a menu button, Another) and keeps the keyboard on the tour's bar. */
  private clickKeepingFocus(el: HTMLElement): void {
    const had = document.activeElement as HTMLElement | null;
    el.click();
    const back = had && this.bar.contains(had) ? had : this.opts.record ? this.bar : undefined;
    back?.focus();
    if (back) this.holdFocus(back);
  }

  /**
   * For a few seconds after the tour presses something, what it set going (the desk's PC
   * booting) doesn't take the keyboard from the tour's bar; a click or key of the visitor's own
   * lets it go at once.
   */
  private holdFocus(el: HTMLElement): void {
    this.releaseFocusHold?.();
    const onIn = (e: FocusEvent) => {
      if (now.tour !== this || !el.isConnected) return off();
      if (!this.bar.contains(e.target as Node)) el.focus({ preventScroll: true });
    };
    const off = () => {
      document.removeEventListener('focusin', onIn, true);
      window.removeEventListener('pointerdown', off, true);
      clearTimeout(timer);
      if (this.releaseFocusHold === off) this.releaseFocusHold = undefined;
    };
    this.releaseFocusHold = off;
    document.addEventListener('focusin', onIn, true);
    window.addEventListener('pointerdown', off, true);
    const timer = window.setTimeout(off, 4000);
  }

  private unpress(): void {
    this.pressed?.classList.remove('tour-pressed');
    this.pressed = undefined;
  }

  // ---- timing, pause, sound and keys ---------------------------------------------------------

  private setPaused(paused: boolean): void {
    this.paused = paused;
    this.pauseBtn.textContent = paused ? 'Play' : 'Pause';
    this.pauseBtn.setAttribute('aria-label', paused ? 'Play the tour' : 'Pause the tour');
    this.sound.pause(paused);
    this.clock.setPaused(paused);
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
    // a dialog of the page's own takes its own keys (not one the tour opened to show it)
    if (this.card?.querySelector('button') || this.pageDialog()) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
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
    // the tour's key, not the overlay's under it too (the box viewer would turn the box)
    e.stopImmediatePropagation();
  };

  /** A dialog the visitor opened on the page (not one the tour opened to show what is in it). */
  private pageDialog(): boolean {
    const ours = [...this.opened.values()].map((m) => m.shows()).filter((x): x is HTMLElement => !!x);
    return [...document.querySelectorAll<HTMLElement>('dialog[open], [role="dialog"]:not(.tour-card)')].some(
      (d) => visible(d) && !ours.some((o) => o === d || o.contains(d) || d.contains(o)),
    );
  }

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
  /** After the last step: the whole tour (or a recording) says it is over before it ends. */
  private async finale(): Promise<void> {
    const token = ++this.token;
    if (this.chapters.length > 1 || this.opts.record || this.opts.cont) {
      this.stage.clearHosts();
      this.stage.bubble.hidden = this.stage.ring.hidden = true;
      this.sound.music(undefined);
      await this.titleCard('That’s the whole tour!', 'Thanks for watching · Game-Maker: Sandbox Edition', false, ['teddy', 'gwinn'], 5000);
      if (!this.live(token)) return;
    }
    await this.recorder?.finish();
    this.recorder = undefined;
    this.end();
  }

  private async handOff(chapter: Chapter): Promise<void> {
    const rest = this.chapters.slice(this.chapters.indexOf(chapter)).map((c) => c.id);
    const params = `tour=${rest.join(',')}${this.opts.record ? '&record' : ''}&cont`;
    const url = chapter.file ? `./${chapter.file}?${params}` : `./${chapter.hash}${chapter.hash.includes('?') ? '&' : '?'}${params}`;
    this.clock.cancelHold();
    this.sound.dispose();
    this.stage.bubble.hidden = this.stage.ring.hidden = true;
    void this.titleCard(chapter.title, 'Game-Maker: Sandbox Edition', false, [...new Set([chapter.speaker, chapter.actor])]);
    // this page's last chapter saved (a recording ends with its page), then a moment for the card
    await this.recorder?.finish();
    this.recorder = undefined;
    setTimeout(() => location.assign(url), 300);
  }

  // ---- title cards and the end ---------------------------------------------------------------

  /** A chapter's title card for a moment; with `ask`, a Start button that waits for a click (false: closed). */
  private titleCard(title: string, sub: string, ask = false, who: HostId[] = ['teddy', 'gwinn'], ms = 2600): Promise<boolean> {
    return titleCard(
      this.stage.sprites,
      this.caption,
      () => this.card,
      (card) => {
        this.card = card;
      },
      () => now.tour === this,
      () => this.end(),
      title,
      sub,
      ask,
      who,
      ms,
    );
  }

  /** Ends the tour: everything taken away, menus it opened shut, the keyboard back where it was. */
  end(): void {
    if (now.tour !== this) return;
    now.tour = undefined;
    this.token++;
    this.releaseFocusHold?.();
    this.focusLater = undefined;
    this.clock.cancelHold();
    this.unpress();
    void this.leaveChapter();
    this.stage.clearHosts();
    this.sound.dispose();
    // closed early: what was recorded so far is still saved
    void this.recorder?.finish();
    this.recorder = undefined;
    hushDemos(false);
    document.documentElement.classList.remove('tour-on');
    this.notice?.remove();
    this.card?.remove();
    this.stage.layer.remove();
    this.bar.remove();
    this.barSize.disconnect();
    document.documentElement.style.removeProperty('--tour-bar-h');
    document.documentElement.classList.remove('tour-recording');
    announce('end');
    window.removeEventListener('keydown', this.onKey, true);
    this.uninert.disconnect();
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
