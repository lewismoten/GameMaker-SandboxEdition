// The panel at the top of the home page: one game, large. At first it is a featured game
// picked at random (and says so, with a button for another); choosing a game in the grid
// below shows that one instead. Its screen plays the game's demo when it has one (silent
// until the sound is turned on), or shows its first level; beside it are the title, who
// made it, a few lines about it, and everything that can be done with it.
import './homeShowcase.css';
import { h, clear } from '../core/ui';
import { demoDialogButton, demoInPicture, gameActions, type HomeGame, type GameKind } from './homeCards';
import { healthBadge, healthNote } from './gameHealth';
import { icon } from './homeIcons';
import type { HomeNav } from './home';

const KIND_LABEL: Record<GameKind, string> = {
  mine: 'My game',
  gameware: 'Gameware',
  sandbox: 'Sandbox',
  shareware: 'Shareware',
};

/** Movement is welcome and data is not scarce: demos may start by themselves. */
const mayAutoplay = () =>
  !matchMedia('(prefers-reduced-motion: reduce)').matches && !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

/** A featured game plays by itself only when its files are this small (a demo needs them all). */
const AUTOPLAY_BYTES = 1.2e6;

/** Runs `f` once the page is idle after loading and `el` is on screen (so a demo waits for the page). */
function whenIdleAndSeen(el: Element, f: () => void): void {
  const idle = (cb: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 3000 }) : setTimeout(cb, 1500));
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    idle(f);
  });
  const start = () => io.observe(el);
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
}

export interface Showcase {
  el: HTMLElement;
  /** Shows a game; `featured` when nobody chose it. */
  show(game: HomeGame, how: { featured?: boolean; onAnother?: () => void }): void;
  readonly game: HomeGame | undefined;
}

export function showcase(nav: HomeNav, refresh: () => Promise<void>): Showcase {
  // the monitor: a bezel around the glass, where the picture and the demo go
  const screen = h('div', { class: 'sc-glass' });
  const label = h('p', { class: 'sc-label' });
  const title = h('h2', { class: 'sc-title', tabindex: -1 });
  const byline = h('p', { class: 'sc-byline' });
  const blurb = h('p', { class: 'sc-blurb' });
  const actions = h('div', { class: 'sc-actions' });
  const notes = h('div', { class: 'sc-notes' });
  const el = h(
    'section',
    { class: 'showcase', 'aria-label': 'Selected game' },
    h('div', { class: 'sc-screen' }, screen),
    h('div', { class: 'sc-info' }, label, title, byline, blurb, actions, notes),
  );
  let current: HomeGame | undefined;
  let demo: { stop(): void } | undefined;
  let generation = 0;

  const show: Showcase['show'] = (game, how) => {
    const gen = ++generation;
    demo?.stop();
    demo = undefined;
    current = game;
    el.dataset.key = game.key;
    el.classList.toggle('featured', !!how.featured);

    clear(
      label,
      h('span', { class: `sc-chip kind-${game.kind}` }, KIND_LABEL[game.kind]),
      how.featured ? h('span', { class: 'sc-featured', title: 'Picked at random' }, '★ Featured') : null,
      how.featured && how.onAnother ? h('button', { class: 'sc-another', onclick: how.onAnother, title: 'Feature another game' }, icon('dice'), 'Another') : null,
    );
    title.textContent = game.title;
    byline.textContent = game.byline;
    blurb.textContent = game.blurb ?? '';
    blurb.hidden = !game.blurb;

    const canvas = h('canvas', { class: 'sc-shot pixel', width: 320, height: 200, 'aria-hidden': 'true' }) as HTMLCanvasElement;
    const playBtn = h('button', { class: 'sc-demo-btn', type: 'button', hidden: true });
    clear(screen, canvas, playBtn, game.health && !game.health.released ? healthBadge(game.health, true) : null);
    if (game.gam || game.kind === 'mine') void game.drawShot(canvas).catch(() => undefined);
    else screen.append(h('div', { class: 'sc-none', 'aria-hidden': 'true' }, '🎨'));

    const setPlaying = (on: boolean) => {
      playBtn.textContent = on ? '■ Stop demo' : '▶ Watch demo';
      playBtn.setAttribute('aria-label', `${on ? 'Stop' : 'Play'} the ${game.title} demo here`);
      playBtn.setAttribute('aria-pressed', String(on));
      if (!on) demo = undefined;
    };
    const play = () => {
      demo = demoInPicture(game, screen, { loop: true, onState: (on) => gen === generation && setPlaying(on) });
    };
    playBtn.addEventListener('click', () => (demo ? demo.stop() : play()));

    clear(actions, ...gameActions(game, nav, refresh));
    clear(notes, game.health?.released ? healthNote(game.health) : null);
    void game.hasDemo().then((yes) => {
      if (gen !== generation || !yes) return;
      playBtn.hidden = false;
      setPlaying(false);
      const dialog = demoDialogButton(game);
      if (dialog) actions.insertBefore(dialog, actions.querySelector('.card-more'));
      if (mayAutoplay() && (game.entry?.bytes ?? 0) <= AUTOPLAY_BYTES) whenIdleAndSeen(screen, () => gen === generation && !demo && play());
    });
  };

  return {
    el,
    show,
    get game() {
      return current;
    },
  };
}
