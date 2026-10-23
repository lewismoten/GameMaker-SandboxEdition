// The panel at the top of the home page: one game, large. At first it is a featured game
// picked at random (and says so, with a button for another); choosing a game in the grid
// below shows that one instead. Its screen plays the game's demo when it has one (silent
// until the sound is turned on), or shows its first level; beside it are the title, who
// made it, a few lines about it, and everything that can be done with it.
import './homeShowcase.css';
import { h, clear, promptText, toast } from '../core/ui';
import { demoDialogButton, demoInPicture, gameActions, type HomeGame, type GameKind } from './homeCards';
import { healthBadge, healthNote } from './gameHealth';
import { icon } from './homeIcons';
import { isImported } from './homeOrigin';
import type { HomeNav } from './home';
import { walkthroughButton } from '../../walkthrough/button';
import { savesButton } from '../../saves/button';
import { macDownload, type MacGame } from './macDownload';
import { winDownload } from './winDownload';
import { isBizarreGame } from '../../project/bizarre';

const KIND_LABEL: Record<GameKind, string> = {
  mine: 'My game',
  gameware: 'Gameware',
  sandbox: 'Sandbox',
  shareware: 'Shareware',
  bizarre: 'Bizarre',
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

/**
 * "Mac" and "Windows": the game as a Mac app (macDownload.ts) or a Windows program
 * (winDownload.ts). For the CD's games that may be shared (gameware, the Sandbox and Bard
 * of Bizarre games), not the other authors' shareware; a game of yours has them in its
 * ⋯ More menu.
 */
function appButtons(game: HomeGame): HTMLElement[] {
  const e = game.entry;
  if (!e?.gam || game.project || (game.kind === 'shareware' && !isBizarreGame(e))) return [];
  const load = async (): Promise<MacGame> => ({ title: e.title, gam: e.gam!, files: await game.files(), id: e.id, author: e.author ?? e.company, year: e.year, box: e.original?.box });
  return [
    h(
      'button',
      { class: 'with-ico', title: 'Play it on a Mac: a Mac app of the game (.dmg or .zip), built here', 'aria-label': `Download ${game.title} for Mac`, onclick: () => void macDownload(game.title, load) },
      icon('inbox'),
      'Mac',
    ),
    h(
      'button',
      { class: 'with-ico', title: 'Play it on Windows: a Windows program of the game (.exe or .zip), built here', 'aria-label': `Download ${game.title} for Windows`, onclick: () => void winDownload(game.title, load) },
      icon('inbox'),
      'Windows',
    ),
  ];
}

/** Copies the address that shows `game` here (#/game/…). */
async function copyLink(game: HomeGame): Promise<void> {
  const url = `${location.origin}${location.pathname}#/game/${game.key}`;
  try {
    await navigator.clipboard.writeText(url);
    toast(`Link to ${game.title} copied.`);
  } catch {
    // no clipboard (an insecure page, or refused): show it to copy by hand
    await promptText('Link to this game', 'Copy this link', url);
  }
}

export interface Showcase {
  el: HTMLElement;
  /** Shows a game; `featured` when nobody chose it, `resume` for the game of yours edited last. */
  show(game: HomeGame, how: { featured?: boolean; resume?: boolean; onAnother?: () => void }): void;
  /** Opens the ⋯ More menu of the game shown and puts the keyboard on its first item. */
  openMore(): void;
  /** Opens the game's Saves & scores (at a part named in the address: a slot, 'scores', 'backups'). */
  openSaves(initial?: string): void;
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
  let saves: ReturnType<typeof savesButton> = null;

  const show: Showcase['show'] = (game, how) => {
    const gen = ++generation;
    demo?.stop();
    demo = undefined;
    current = game;
    el.dataset.key = game.key;
    el.classList.toggle('featured', !!how.featured);

    clear(
      label,
      h('span', { class: `sc-chip kind-${game.kind}` }, game.project && isImported(game.project.id) ? 'Imported' : KIND_LABEL[game.kind]),
      how.featured ? h('span', { class: 'sc-featured', title: 'Picked at random' }, '★ Featured') : null,
      how.resume ? h('span', { class: 'sc-resume' }, 'Continue where you left off') : null,
      how.featured && how.onAnother ? h('button', { class: 'sc-another', onclick: how.onAnother, title: 'Feature another game' }, icon('dice'), 'Another') : null,
    );
    title.textContent = game.title;
    clear(
      byline,
      game.byline,
      // a finished game has an address of its own to share (yours live only in this browser)
      game.entry
        ? h(
            'button',
            { class: 'sc-another sc-link', onclick: () => void copyLink(game), title: 'Copy a link that opens this page on this game', 'aria-label': `Copy a link to ${game.title}` },
            icon('link'),
            'Copy link',
          )
        : null,
    );
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
    const walk = walkthroughButton(game.entry, () => game.files());
    if (walk) actions.insertBefore(walk, actions.querySelector('.card-more'));
    // saved games and high scores: a hosted game's are kept as game:<id>, yours as project:<id>
    saves = savesButton(
      game.entry || game.project
        ? { saveId: game.project ? `project:${game.project.id}` : `game:${game.entry!.id}`, title: game.title, gam: game.gam, files: () => game.files(), key: game.key }
        : undefined,
    );
    if (saves) actions.insertBefore(saves.el, actions.querySelector('.card-more'));
    for (const app of appButtons(game)) actions.insertBefore(app, actions.querySelector('.card-more'));
    clear(notes, game.health?.released ? healthNote(game.health) : null);
    void game.hasDemo().then((yes) => {
      if (gen !== generation || !yes) return;
      playBtn.hidden = false;
      setPlaying(false);
      const dialog = demoDialogButton(game);
      if (dialog) actions.insertBefore(dialog, actions.querySelector('.card-more'));
      if (!mayAutoplay()) return;
      // a game the visitor chose plays straight away; one shown by itself waits for the page, and only when small
      if (!how.featured && !how.resume) play();
      else if ((game.entry?.bytes ?? 0) <= AUTOPLAY_BYTES) whenIdleAndSeen(screen, () => gen === generation && !demo && play());
    });
  };

  const openMore = () => {
    const more = actions.querySelector<HTMLDetailsElement>('.card-more');
    if (!more) return;
    more.open = true;
    more.querySelector<HTMLElement>('.card-more-menu button')?.focus({ preventScroll: true });
    more.scrollIntoView({ block: 'nearest' });
  };

  return {
    el,
    show,
    openMore,
    openSaves: (initial) => void saves?.open(initial),
    get game() {
      return current;
    },
  };
}
