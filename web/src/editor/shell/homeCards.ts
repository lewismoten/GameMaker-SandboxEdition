// The games on the home page. One model (HomeGame) covers your projects, the CD's sample
// games, our own games and the shareware. The grid shows each as a compact tile: its
// picture (the first level, drawn when the tile scrolls into view) with buttons over it
// for the keys, the manual and the demo (which plays right there in the picture), and its
// title. Choosing a tile shows the game in the panel at the top (homeShowcase.ts), which
// offers everything else with gameActions().
import { h, toast, promptText, confirmDialog, modal } from '../core/ui';
import { Project } from '../core/project';
import { renderShot } from '../../desk/boxes/boxArt';
import { openGameManual } from '../../manual/gameManual';
import { GameFiles, creditLine, loadHostedGame, type CatalogEntry } from '../../project/files';
import { deleteProject, listProjects, loadProject } from '../../project/storage';
import { ADVTYPE, NOSCENE, parseGame } from '../../formats/game';
import { levelShot } from '../editors/integrator/integratorArt';
import { catalogTarget, healthBadge, projectTarget, type HealthTarget } from './gameHealth';
import { showKeyMap } from '../keymap/keyMapView';
import { demoButton } from '../../media/demo';
import { catalogHasDemo, filesHaveDemo, playDemoPreview, type DemoPreview } from '../../media/demoPreview';
import type { HomeNav } from './home';
import { downloadProject, exportProject, exportProjectPage, exportProjectForDos } from './projectExport';
import { gamePage } from '../../seo/site';
import { icon as svgIcon, type IconName } from './homeIcons';

/**
 * Where ▶ Play goes: the game's own page (play-<id>.html, made at build time with its link
 * preview). The dev server only learns of those pages when restarted, so in development
 * the shared player page is used instead, which plays the same.
 */
export function playLink(id: string): string {
  return import.meta.env?.DEV ? `./play.html?game=${encodeURIComponent(id)}` : `./${gamePage(id)}`;
}

export type GameKind = 'mine' | 'gameware' | 'sandbox' | 'shareware';

type ProjectSummary = Awaited<ReturnType<typeof listProjects>>[number];

export interface HomeGame {
  /** `cd:<catalog id>` or `my:<project id>`: kept in the address (#/game/…). */
  key: string;
  kind: GameKind;
  title: string;
  /** Who made it, or when you last edited it. */
  byline: string;
  blurb?: string;
  gam: string | null;
  /** Lower-case words the library's search box looks in. */
  search: string;
  entry?: CatalogEntry;
  project?: ProjectSummary;
  health?: HealthTarget;
  /** Draws the game's picture (its first level) into a canvas of any size. */
  drawShot(canvas: HTMLCanvasElement): Promise<unknown>;
  /** All the game's files (loaded once). */
  files(): Promise<GameFiles>;
  hasDemo(): Promise<boolean>;
}

/** Recreational Software Designs' own games. */
export const RSD_GAMES = ['sample', 'pipemare', 'nebula'];

function searchText(...parts: (string | number | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function once<T>(f: () => Promise<T>): () => Promise<T> {
  let p: Promise<T> | undefined;
  return () => {
    p ??= f();
    p.catch(() => (p = undefined));
    return p;
  };
}

export function catalogGame(g: CatalogEntry, kind: GameKind): HomeGame {
  const title = g.gam ? g.title : `${g.id} (pictures, monsters and sounds)`;
  const byline =
    kind === 'sandbox'
      ? (g.company ?? 'Sandbox Software')
      : kind === 'shareware'
        ? creditLine(g) || 'Shareware · play only'
        : !g.gam
          ? 'Pictures, monsters and sounds to build with'
          : [g.company ?? g.author, g.year].filter(Boolean).join(' · ') || 'Gameware from the Game-Maker CD';
  return {
    key: `cd:${g.id}`,
    kind,
    title,
    byline,
    blurb: g.blurb,
    gam: g.gam,
    search: searchText(title, g.id, g.author, g.company, g.year),
    entry: g,
    health: g.gam ? catalogTarget(g) : undefined,
    drawShot: (c) => renderShot(g, c, Math.round(c.width / 20), Math.round(c.height / 20)),
    files: once(() => loadHostedGame(g)),
    hasDemo: () => catalogHasDemo(g),
  };
}

export function projectGame(p: ProjectSummary): HomeGame {
  const load = once(async () => {
    const stored = await loadProject(p.id);
    if (!stored) throw new Error('That game is not in this browser any more.');
    return stored.files;
  });
  return {
    key: `my:${p.id}`,
    kind: 'mine',
    title: p.name,
    byline: `${p.gam} · edited ${new Date(p.updated).toLocaleDateString()}`,
    gam: p.gam,
    search: searchText(p.name, p.gam),
    project: p,
    health: projectTarget(p.id, p.name, p.updated),
    // the first level the title scene leads to, where the hero arrives
    drawShot: async (c) => {
      const files = await load();
      const game = parseGame(files.get(p.gam)!);
      const link = game.scenes[0]?.links.find((l) => l.toScene !== NOSCENE && game.scenes[l.toScene]?.gametype === ADVTYPE);
      const i = link ? link.toScene : game.scenes.findIndex((s) => s.gametype === ADVTYPE);
      if (i < 0) return false;
      const shot = levelShot(files, game.scenes[i], link?.to ?? { x: 50, y: 50 }, Math.round(c.width / 20), Math.round(c.height / 20));
      if (!shot) return false;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(shot, 0, 0, c.width, c.height);
      return true;
    },
    files: load,
    hasDemo: async () => filesHaveDemo(await load(), p.gam),
  };
}

/**
 * Draws a game's picture into a canvas when it comes near the view (a picture needs a
 * few of the game's files, so the ones far down a long list wait until scrolled to).
 */
export const shotObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      shotObserver.unobserve(e.target);
      const el = e.target as HTMLCanvasElement & { draw?: () => Promise<unknown> };
      void el.draw?.();
    }
  },
  { rootMargin: '300px 0px' },
);

/**
 * A canvas showing the game's picture once it is near the view. Until then it is marked
 * `shot-loading` (a placeholder shimmer), and `shot-none` when there is no picture to draw.
 */
export function gameShot(game: HomeGame, width: number, height: number, className = 'card-shot pixel'): HTMLCanvasElement {
  const c = h('canvas', { class: `${className} shot-loading`, width, height, 'aria-hidden': 'true' }) as HTMLCanvasElement & { draw?: () => Promise<unknown> };
  c.draw = () =>
    game
      .drawShot(c)
      .then((drawn) => drawn !== false || c.classList.add('shot-none'))
      .catch(() => c.classList.add('shot-none'))
      .finally(() => c.classList.remove('shot-loading'));
  shotObserver.observe(c);
  return c;
}

/** Calls `f` once the element has scrolled into view. */
const whenSeen = (() => {
  const waiting = new WeakMap<Element, () => void>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      waiting.get(e.target)?.();
    }
  });
  return (el: Element, f: () => void) => {
    waiting.set(el, f);
    io.observe(el);
  };
})();

/** ⌨ Keys: a keyboard map of what each key does in the game, worked out from its files. */
export function openKeys(game: HomeGame): void {
  showKeyMap(game.files(), game.gam ?? undefined, game.title);
}

/** The manual, for games that have one printed. */
export function hasManual(game: HomeGame): boolean {
  return !!game.entry?.original?.manual;
}

/**
 * Plays the game's demo inside `screen` (an element holding the picture), with a stop and a
 * sound button over it; returns a function that stops it. `onState` hears when it plays and stops.
 */
export function demoInPicture(
  game: HomeGame,
  screen: HTMLElement,
  o: { loop?: boolean; onState?: (playing: boolean) => void } = {},
): { stop(): void; ready: Promise<boolean> } {
  let preview: DemoPreview | undefined;
  let stopped = false;
  const host = h('div', { class: 'demo-screen', 'aria-hidden': 'true' });
  const sound = h('button', { class: 'shot-icon demo-sound', type: 'button' });
  const showSound = () => {
    const muted = preview?.muted ?? true;
    sound.textContent = muted ? '🔇' : '🔊';
    sound.title = muted ? 'Turn the sound on' : 'Turn the sound off';
    sound.setAttribute('aria-label', `${sound.title} (${game.title} demo)`);
  };
  sound.addEventListener('click', (e) => {
    e.stopPropagation();
    preview?.setMuted(!preview.muted);
    showSound();
  });
  const stop = () => {
    if (stopped) return;
    stopped = true;
    preview?.stop();
    host.remove();
    sound.remove();
    screen.classList.remove('demo-playing');
    o.onState?.(false);
  };
  const ready = (async () => {
    screen.classList.add('demo-loading');
    try {
      const files = await game.files();
      if (stopped || !game.gam) return false;
      screen.append(host, sound);
      preview = playDemoPreview(host, files, game.gam, { title: game.title, loop: o.loop, onStop: stop });
      if (!preview) {
        stop();
        return false;
      }
      showSound();
      screen.classList.add('demo-playing');
      o.onState?.(true);
      return true;
    } catch (e) {
      toast((e as Error).message, 'error');
      stop();
      return false;
    } finally {
      screen.classList.remove('demo-loading');
    }
  })();
  return { stop, ready };
}

export interface TileOptions {
  /** Shows the game in the panel at the top. */
  onSelect(game: HomeGame): void;
}

/** A game in the grid: its picture with ⌨ 📖 ▶ over it, and its title. */
export function gameTile(game: HomeGame, o: TileOptions): HTMLElement {
  const shot = game.gam || game.kind === 'mine' ? gameShot(game, 160, 100) : h('div', { class: 'card-shot card-shot-none', 'aria-hidden': 'true' }, '🎨');
  const icons = h('div', { class: 'shot-icons' });
  const picture = h('div', { class: 'tile-shot' }, shot, icons);
  const select = h(
    'button',
    { class: 'tile-select', type: 'button', 'aria-label': `${game.title}: show it at the top`, onclick: () => o.onSelect(game) },
    h('span', { class: 'tile-title' }, game.title),
    h('span', { class: 'tile-meta', title: game.byline }, game.byline),
  );
  const tile = h('article', { class: 'card game-tile', dataset: { search: game.search, key: game.key } }, picture, select);
  // the picture selects too (the buttons over it do their own thing)
  picture.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('button')) o.onSelect(game);
  });
  if (game.health) picture.append(healthBadge(game.health));
  if (!game.gam) return tile;

  // each button says what it does in a tip (on hover and keyboard focus) and to screen readers
  const icon = (name: IconName, tip: string, onclick: () => void) =>
    h(
      'button',
      { class: 'shot-icon', type: 'button', dataset: { tip }, 'aria-label': `${tip}: ${game.title}`, onclick: (e: Event) => (e.stopPropagation(), onclick()) },
      svgIcon(name),
    );
  icons.append(icon('keys', 'Keys: what each key does', () => openKeys(game)));
  if (hasManual(game)) icons.append(icon('manual', 'Read the manual', () => void openGameManual(game.entry!)));

  // ▶ Demo only once we know there is a demo to play
  let playing: { stop(): void } | undefined;
  const demoLabel = h('span', null, 'Demo');
  const demo = icon('play', 'Watch the demo here', () => {
    if (playing) return playing.stop();
    playing = demoInPicture(game, picture, {
      onState: (on) => {
        demo.firstElementChild!.replaceWith(svgIcon(on ? 'stop' : 'play'));
        demoLabel.textContent = on ? 'Stop' : 'Demo';
        demo.dataset.tip = on ? 'Stop the demo' : 'Watch the demo here';
        demo.setAttribute('aria-label', `${demo.dataset.tip}: ${game.title}`);
        demo.setAttribute('aria-pressed', String(on));
        if (!on) playing = undefined;
      },
    });
  });
  demo.append(demoLabel);
  demo.classList.add('demo-toggle');
  demo.setAttribute('aria-pressed', 'false');
  whenSeen(tile, () => void game.hasDemo().then((yes) => yes && icons.prepend(demo)));
  return tile;
}

/** Makes an editable copy of a CD game and opens it. */
async function copyGame(game: HomeGame, nav: HomeNav, name = game.title): Promise<void> {
  toast(`Copying ${game.title}…`);
  const p = Project.fromFiles(await game.files(), name);
  if (game.gam) p.gam = game.gam;
  await p.saveNow();
  nav.openProject(p.id);
}

/** The small menu of less-used actions. */
export function moreMenu(...items: (HTMLElement | null | false | undefined)[]): HTMLElement {
  const menu = h(
    'details',
    { class: 'card-more' },
    h('summary', { title: 'More', 'aria-label': 'More actions' }, '⋯ More'),
    h('div', { class: 'card-more-menu' }, ...items),
  );
  // Close when something else is clicked, or after choosing an item.
  const outside = (e: Event) => {
    if (!menu.contains(e.target as Node) || (e.target as HTMLElement).closest('.card-more-menu button')) menu.open = false;
  };
  menu.addEventListener('toggle', () => {
    if (menu.open) setTimeout(() => document.addEventListener('click', outside, true));
    else document.removeEventListener('click', outside, true);
  });
  return menu;
}

/** Everything that can be done with a game, for the panel at the top. */
export function gameActions(game: HomeGame, nav: HomeNav, refresh: () => Promise<void>): HTMLElement[] {
  const play = (href: string) => h('a', { class: 'button primary', href, 'aria-label': `Play ${game.title}` }, '▶ Play');
  const keys = h('button', { class: 'with-ico', title: 'What each key does in this game', onclick: () => openKeys(game) }, svgIcon('keys'), 'Keys');
  const e = game.entry;
  if (game.project) {
    const p = game.project;
    return [
      h('button', { class: 'primary', onclick: () => nav.openProject(p.id) }, '✎ Open'),
      h('a', { class: 'button', href: `./play.html?project=${encodeURIComponent(p.id)}` }, '▶ Play'),
      keys,
      moreMenu(
        h('button', { onclick: () => void downloadProject(p.id) }, 'Download .zip'),
        h('button', { onclick: () => void exportProject(p.id) }, 'Export web app'),
        h('button', { onclick: () => void exportProjectPage(p.id), title: 'One .html file with the game and player inside' }, 'Export as one web page'),
        h('button', { onclick: () => void exportProjectForDos(p.id) }, 'Export for DOS'),
        h(
          'button',
          {
            class: 'danger',
            onclick: async () => {
              if (await confirmDialog('Delete game', `Delete “${p.name}” from this browser? Download it first if you want to keep it.`, 'Delete')) {
                await deleteProject(p.id);
                await refresh();
              }
            },
          },
          'Delete',
        ),
      ),
    ].filter((x): x is HTMLElement => !!x);
  }
  if (!e) return [];
  if (!e.gam)
    return [
      h(
        'button',
        {
          class: 'primary',
          onclick: async () => {
            const name = await promptText('New game', 'Title (shown on the menu screen)', 'My Game');
            if (name) await copyGame(game, nav, name);
          },
        },
        '✎ Start a game with these',
      ),
    ];
  const href = playLink(e.id);
  return (
    [
      play(href),
      game.kind === 'shareware'
        ? h('button', { onclick: () => void showNotice(e) }, '📜 Notice')
        : h('button', { onclick: () => void copyGame(game, nav), 'aria-label': `Edit a copy of ${game.title}` }, '✎ Edit a copy'),
      keys,
      hasManual(game) ? h('button', { onclick: () => void openGameManual(e) }, '📖 Manual') : null,
    ] as (HTMLElement | null)[]
  ).filter((x): x is HTMLElement => !!x);
}

/** “🎬 Demo…”: the demo in a dialog, where it can also be saved as a video. */
export function demoDialogButton(game: HomeGame): HTMLElement | null {
  const b = demoButton(game.title, () => game.files(), game.gam);
  if (!b) return null;
  b.textContent = '🎬 Demo video';
  b.title = 'Watch the demo with its music and sounds, or save it as a video';
  return b;
}

export function showNotice(g: CatalogEntry): Promise<unknown> {
  return modal(`${g.title}: shareware notice`, (close) => [
    h(
      'pre',
      { style: 'white-space:pre-wrap;max-height:60vh;overflow:auto;font:13px/1.4 ui-monospace,monospace' },
      g.notice || 'This game is shareware. It is copyrighted by its author.',
    ),
    h('p', { class: 'meta' }, 'These notices are from 1993–1994; the addresses and prices may no longer be current.'),
    h('div', { class: 'buttons' }, h('button', { class: 'primary', onclick: () => close(undefined) }, 'Close')),
  ]);
}
