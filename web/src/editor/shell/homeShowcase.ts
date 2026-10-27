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
import { chooseDownload, downloadButton } from './download';
import { catalogDownloadable } from '../../export/downloadable';
import { fictionNote } from '../../export/fiction';
import { fillRating } from './homeRatings';

const KIND_LABEL: Record<GameKind, string> = {
  mine: 'My game',
  gameware: 'Gameware',
  sandbox: 'Sandbox',
  shareware: 'Shareware',
  bizarre: 'Bizarre',
};

/** Movement is welcome, data is not scarce and no guided tour is on: demos may start by themselves. */
const mayAutoplay = () =>
  !document.documentElement.classList.contains('tour-on') &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches &&
  !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

/** Once the visitor stops a demo, no other starts by itself until they watch one again (kept for the visit). */
const STOPPED_KEY = 'gm-demos-stopped';
const demosStopped = (): boolean => {
  try {
    return sessionStorage.getItem(STOPPED_KEY) === '1';
  } catch {
    return false;
  }
};
const setDemosStopped = (on: boolean): void => {
  try {
    if (on) sessionStorage.setItem(STOPPED_KEY, '1');
    else sessionStorage.removeItem(STOPPED_KEY);
  } catch {
    // private windows may refuse; the choice then lasts only until the page changes
  }
};

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

/** "Download" (download.ts): for the catalog's games that may be shared (export/downloadable.ts); a game of yours has its own in gameActions. */
function catalogDownload(game: HomeGame): HTMLElement | null {
  const e = game.entry;
  if (!e || game.project || !catalogDownloadable(e)) return null;
  return downloadButton(game.title, () =>
    chooseDownload({
      title: e.title,
      gam: e.gam!,
      files: () => game.files(),
      id: e.id,
      author: e.author ?? e.company,
      year: e.year,
      box: e.original?.box,
      fiction: fictionNote(e),
      entry: e,
    }),
  );
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

interface Showcase {
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
  // our own games: made now, presented as 1990s releases (export/fiction.ts)
  const fiction = h('p', { class: 'sc-fiction' });
  const blurb = h('p', { class: 'sc-blurb' });
  // an imported game's stars and note (homeRatings.ts)
  const rate = h('div', { class: 'sc-rate', role: 'group', 'aria-label': 'Your rating and note' });
  const actions = h('div', { class: 'sc-actions' });
  const notes = h('div', { class: 'sc-notes' });
  const el = h(
    'section',
    { class: 'showcase', 'aria-label': 'Selected game' },
    h('div', { class: 'sc-screen' }, screen),
    h('div', { class: 'sc-info' }, label, title, byline, fiction, blurb, rate, actions, notes),
  );
  let current: HomeGame | undefined;
  let demo: { stop(): void } | undefined;
  let tourPlay: ((what: 'play' | 'stop') => void) | undefined;
  const onTourDemo = (e: Event) => {
    if (!el.isConnected) return window.removeEventListener('gm-tour-demo', onTourDemo);
    tourPlay?.((e as CustomEvent<'play' | 'stop'>).detail);
  };
  window.addEventListener('gm-tour-demo', onTourDemo);
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
      how.featured && how.onAnother
        ? h('button', { class: 'sc-another', onclick: how.onAnother, title: 'Feature another game' }, icon('dice'), 'Another')
        : null,
    );
    title.textContent = game.title;
    clear(
      byline,
      game.byline,
      // a finished game has an address of its own to share (yours live only in this browser)
      game.entry
        ? h(
            'button',
            {
              class: 'sc-another sc-link',
              onclick: () => void copyLink(game),
              title: 'Copy a link that opens this page on this game',
              'aria-label': `Copy link to ${game.title}`,
            },
            icon('link'),
            'Copy link',
          )
        : null,
    );
    fiction.textContent = (game.entry && !game.project && fictionNote(game.entry)) || '';
    fiction.hidden = !fiction.textContent;
    blurb.textContent = game.blurb ?? '';
    blurb.hidden = !game.blurb;
    rate.hidden = !(game.project && isImported(game.project.id));
    if (game.project && !rate.hidden) fillRating(rate, { id: game.project.id, name: game.title });
    else rate.replaceChildren();

    const canvas = h('canvas', { class: 'sc-shot pixel', width: 320, height: 200, 'aria-hidden': 'true' });
    const playBtn = h('button', { class: 'sc-demo-btn', type: 'button', hidden: true });
    clear(screen, canvas, playBtn, game.health && !game.health.released ? healthBadge(game.health, true) : null);
    if (game.gam || game.kind === 'mine') void game.drawShot(canvas).catch(() => undefined);
    else screen.append(h('div', { class: 'sc-none', 'aria-hidden': 'true' }, '🎨'));

    const setPlaying = (on: boolean) => {
      playBtn.textContent = on ? '■ Stop demo' : '▶ Watch demo';
      playBtn.setAttribute('aria-label', `${on ? 'Stop' : 'Watch'} demo of ${game.title} here`);
      playBtn.setAttribute('aria-pressed', String(on));
      if (!on) demo = undefined;
    };
    const play = () => {
      demo = demoInPicture(game, screen, { loop: true, onState: (on) => gen === generation && setPlaying(on) });
    };
    playBtn.addEventListener('click', () => {
      setDemosStopped(!!demo);
      if (demo) demo.stop();
      else play();
    });
    // the guided tour (tour/tourEngine.ts) holds the preview still, and starts it when it shows it
    tourPlay = (what) => {
      if (gen !== generation || playBtn.hidden) return;
      if (what === 'stop') demo?.stop();
      else if (!demo) play();
    };

    clear(actions, ...gameActions(game, nav, refresh));
    const walk = walkthroughButton(game.entry, () => game.files());
    if (walk) actions.insertBefore(walk, actions.querySelector('.card-more'));
    // saved games and high scores: a hosted game's are kept as game:<id>, yours as project:<id>
    saves = savesButton(
      game.entry || game.project
        ? {
            saveId: game.project ? `project:${game.project.id}` : `game:${game.entry!.id}`,
            title: game.title,
            gam: game.gam,
            files: () => game.files(),
            key: game.key,
          }
        : undefined,
    );
    if (saves) actions.insertBefore(saves.el, actions.querySelector('.card-more'));
    const dl = catalogDownload(game);
    if (dl) actions.insertBefore(dl, actions.querySelector('.card-more'));
    // an added demo is said in the notes, not over the picture
    const entry = game.entry;
    const demoNotes = async (): Promise<string[]> => {
      if (!entry) return [];
      const { catalogDemoKind, catalogExtraDemo } = await import('../../media/demoKind');
      const kind = await catalogDemoKind(entry).catch(() => undefined);
      if (kind === 'added')
        return (await catalogExtraDemo(entry).catch(() => undefined))?.inGame
          ? ['Its demo is the game’s own recording, which its title screen never played; this edition shows it so you can watch it.']
          : ['The original game has no title demo, so this edition added one in its place. It isn’t part of the game’s files.'];
      if (kind === 'attract') return ['The original game has no title demo; its preview here just shows the game running.'];
      return [];
    };
    clear(notes, game.health?.released ? healthNote({ ...game.health, notes: demoNotes }) : null);
    void game.hasDemo().then((yes) => {
      if (gen !== generation || !yes) return;
      playBtn.hidden = false;
      setPlaying(false);
      const dialog = demoDialogButton(game);
      if (dialog) actions.insertBefore(dialog, actions.querySelector('.card-more'));
      if (!mayAutoplay() || demosStopped()) return;
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
