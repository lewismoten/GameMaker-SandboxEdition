// The games on the home page. One model (HomeGame) covers your projects, the CD's sample
// games, our own games and the shareware. The grid shows each as a compact tile: its
// picture (the first level, drawn when the tile scrolls into view) with buttons over it
// for the keys and the manual, and its title. Choosing a tile shows the game in the panel
// at the top (homeShowcase.ts), which plays its demo and offers everything else with gameActions().
import { h, toast, promptText, modal } from '../core/ui';
import { Project } from '../core/project';
import { renderShot } from '../../desk/boxes/boxArt';
import { GameFiles, creditLine, loadHostedGame, withDetails, type CatalogEntry } from '../../project/files';
import { demoNeeds, streamHostedGame } from '../../project/streamGame';
import { listProjects, loadProject } from '../../project/storage';
import { ADVTYPE, NOSCENE, parseGame } from '../../formats/game';
import { levelShot } from '../editors/integrator/integratorArt';
import { catalogTarget, healthBadge, projectTarget, type HealthTarget } from './gameHealth';
import type { DemoPreview } from '../../media/demoPreview';
import type { HomeNav } from './home';
import { gamePage } from '../../seo/site';
import { icon as svgIcon, type IconName } from './homeIcons';
import { editedWhen } from './homeTime';
import { readableBlurb } from './homeBlurb';
import { rememberOrigin } from './homeOrigin';
import { projectMenuItems } from './homeProjectActions';
import { chooseCopy } from './homeCopies';

// Loaded when first used, so the list of games shows without them: the demo player (and
// the game engine with it), the keyboard map and the manual with the paper in the box.
const demoPreview = () => import('../../media/demoPreview');
const openGameManual = async (entry: CatalogEntry) => (await import('../../manual/gameManual')).openGameManual(entry);

/**
 * Where ▶ Play goes: the game's own page (play-<id>.html, made at build time with its link
 * preview). The dev server only learns of those pages when restarted, so in development
 * the shared player page is used instead, which plays the same.
 */
export function playLink(id: string): string {
  return import.meta.env?.DEV ? `./play.html?game=${encodeURIComponent(id)}` : `./${gamePage(id)}`;
}

/** How much of a game a demo in the panel fetches before it is asked for, in bytes. */
const PREVIEW_AHEAD = 192 * 1024;

export type GameKind = 'mine' | 'gameware' | 'sandbox' | 'shareware';

type ProjectSummary = Awaited<ReturnType<typeof listProjects>>[number];

export interface HomeGame {
  /** `cd:<catalog id>` or `my:<project id>`: kept in the address (#/game/…). */
  key: string;
  kind: GameKind;
  title: string;
  /** Who made it, or when you last edited it. */
  byline: string;
  /** A shorter byline for a narrow tile (who made it, without the year). */
  tileByline?: string;
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
  /** Enough of its files to start the demo preview, the rest arriving as it plays (hosted games). */
  previewFiles?(): Promise<GameFiles>;
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
  // the CD's library of parts has no game, nor a title of its own
  const title = g.gam ? g.title : 'Parts library';
  const byline =
    kind === 'sandbox'
      ? [g.company ?? 'Sandbox Software', g.year].filter(Boolean).join(' · ')
      : kind === 'shareware'
        ? creditLine(g) || 'Shareware · play only'
        : !g.gam
          ? 'Pictures, monsters and sounds'
          : [g.company ?? g.author, g.year].filter(Boolean).join(' · ') || 'Gameware from the Game-Maker CD';
  return {
    key: `cd:${g.id}`,
    kind,
    title,
    byline,
    // a tile names just the maker (the year is in the panel)
    tileByline: g.gam ? g.company || g.author || byline : undefined,
    blurb: readableBlurb(g.id, g.blurb),
    gam: g.gam,
    search: searchText(title, g.id, g.author, g.company, g.year),
    entry: g,
    health: g.gam ? catalogTarget(g) : undefined,
    drawShot: (c) => renderShot(g, c, Math.round(c.width / 20), Math.round(c.height / 20)),
    files: once(() => loadHostedGame(g)),
    previewFiles: once(async () => {
      // the demo's files as it asks for them, and a little ahead (not the whole game)
      const s = streamHostedGame(g, './', 4, PREVIEW_AHEAD);
      await s.started;
      await s.files.stream?.need(demoNeeds(s.files.get(g.gam ?? '')));
      return s.files;
    }),
    hasDemo: async () => (await demoPreview()).catalogHasDemo(g),
  };
}

/** `original`: the finished game it was copied from, whose own problems its ⚠ leaves out. */
export function projectGame(p: ProjectSummary, original?: CatalogEntry): HomeGame {
  const load = once(async () => {
    const stored = await loadProject(p.id);
    if (!stored) throw new Error('That game is not in this browser any more.');
    return stored.files;
  });
  return {
    key: `my:${p.id}`,
    kind: 'mine',
    title: p.name,
    // the game it began as, when it is a copy
    byline: [editedWhen(p.updated), original?.gam ? `copy of ${original.title}` : null, p.gam].filter(Boolean).join(' · '),
    tileByline: original?.gam ? `${editedWhen(p.updated)} · from ${original.title}` : undefined,
    gam: p.gam,
    search: searchText(p.name, p.gam),
    project: p,
    health: projectTarget(p.id, p.name, p.updated, original?.gam ? catalogTarget(original) : undefined),
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
    // its own demo, one added for the CD game it still is, or the attract mode (demoPreview.ts)
    hasDemo: async () => !!(await (await demoPreview()).filesDemoKind(await load(), p.gam)),
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

/** ⌨ Keys: a keyboard map of what each key does in the game, worked out from its files. */
export function openKeys(game: HomeGame): void {
  void import('../keymap/keyMapView').then(({ showKeyMap }) => showKeyMap(game.files(), game.gam ?? undefined, game.title));
}

/** The manual, for games that have one printed. */
export function hasManual(game: HomeGame): boolean {
  return !!game.entry?.original?.manual;
}

/**
 * Plays the game's demo inside `screen` (an element holding the picture), with the demos'
 * sound choice (None · SB · PC, media/demoAudio.ts) over it; returns a function that stops it. `onState` hears when it plays and stops.
 */
export function demoInPicture(
  game: HomeGame,
  screen: HTMLElement,
  o: { loop?: boolean; onState?: (playing: boolean) => void } = {},
): { stop(): void; ready: Promise<boolean> } {
  let preview: DemoPreview | undefined;
  let stopped = false;
  const host = h('div', { class: 'demo-screen', 'aria-hidden': 'true' });
  let sound: HTMLElement | undefined;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    preview?.stop();
    host.remove();
    sound?.remove();
    screen.classList.remove('demo-playing');
    o.onState?.(false);
  };
  const ready = (async () => {
    screen.classList.add('demo-loading');
    try {
      const [files, { playDemoPreview }, { demoAudioPicker }] = await Promise.all([
        (game.previewFiles ?? game.files)(),
        demoPreview(),
        import('../../media/demoAudio'),
      ]);
      if (stopped || !game.gam) return false;
      sound = demoAudioPicker({ compact: true, label: `${game.title} demo sound`, className: 'demo-sound' });
      screen.append(host, sound);
      preview = playDemoPreview(host, files, game.gam, { title: game.title, loop: o.loop, onStop: stop });
      if (!preview) {
        stop();
        return false;
      }
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
  /** A game of yours: its ⋯ button (rename, duplicate, download, delete…). */
  onMore?(game: HomeGame): void;
}

/** A game in the grid: its picture with Keys and Manual over it, and its title. */
export function gameTile(game: HomeGame, o: TileOptions): HTMLElement {
  const shot = game.gam || game.kind === 'mine' ? gameShot(game, 160, 100) : h('div', { class: 'card-shot card-shot-none', 'aria-hidden': 'true' }, '🎨');
  // Keys and Manual at the top left (⚠ takes the top right); choosing the tile plays its demo in the panel
  const tools = h('div', { class: 'shot-icons shot-tools' });
  const picture = h('div', { class: 'tile-shot' }, shot, tools);
  const select = h(
    'button',
    { class: 'tile-select', type: 'button', onclick: () => o.onSelect(game) },
    h('span', { class: 'tile-title' }, game.title),
    h('span', { class: 'tile-meta', title: game.tileByline ?? game.byline }, game.tileByline ?? game.byline),
  );
  const tile = h('article', { class: 'card game-tile', dataset: { search: game.search, key: game.key } }, picture, select);
  if (game.project && o.onMore) {
    const tip = 'Rename, duplicate, download or delete';
    tile.classList.add('has-more');
    tile.append(
      h(
        'button',
        { class: 'tile-more', type: 'button', title: tip, 'aria-label': `More: ${tip.toLowerCase()} ${game.title}`, onclick: () => o.onMore!(game) },
        '⋯',
      ),
    );
  }
  // the picture selects too (the buttons over it do their own thing)
  picture.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('button')) o.onSelect(game);
  });
  // ⚠ only on your own games: a finished game's files are as released, nothing to fix
  if (game.health && !game.health.released) picture.append(healthBadge(game.health));
  if (!game.gam) return tile;

  // each button says what it does in a tip (on hover and keyboard focus) and to screen readers
  const icon = (name: IconName, tip: string, onclick: () => void) =>
    h(
      'button',
      // out of the Tab order (one stop per tile; the panel at the top has them all for the keyboard)
      { class: 'shot-icon', type: 'button', tabindex: -1, dataset: { tip }, 'aria-label': `${tip}: ${game.title}`, onclick: (e: Event) => (e.stopPropagation(), onclick()) },
      svgIcon(name),
    );
  tools.append(icon('keys', 'Keys: what each key does', () => openKeys(game)));
  if (hasManual(game)) tools.append(icon('manual', 'Read the manual', () => void openGameManual(game.entry!)));

  return tile;
}

/** Makes an editable copy of a CD game and opens it. */
async function copyGame(game: HomeGame, nav: HomeNav, name = game.title): Promise<void> {
  // already have a copy? offer it first, so a second one is made only on purpose
  if (game.entry) {
    const pick = await chooseCopy(game.title, game.entry.id, game.gam);
    if (!pick) return;
    if (pick !== 'new') return nav.openProject(pick.id);
  }
  // a demo added for this edition goes in only if asked for (offerAddedDemo, media/addedDemo.ts)
  const { offerAddedDemo } = await import('../../media/addedDemo');
  const files = await offerAddedDemo(game.entry, await game.files(), game.gam);
  if (!files) return;
  toast(`Copying ${game.title}…`);
  const p = Project.fromFiles(files, name);
  if (game.gam) p.gam = game.gam;
  await p.saveNow();
  rememberOrigin(p.id, game.entry?.id);
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
  const play = (href: string) => h('a', { class: 'button primary with-ico', href, 'aria-label': `Play ${game.title}` }, svgIcon('play'), 'Play');
  const keys = h('button', { class: 'with-ico', title: 'What each key does in this game', onclick: () => openKeys(game) }, svgIcon('keys'), 'Keys');
  const e = game.entry;
  if (game.project) {
    const p = game.project;
    return [
      h('button', { class: 'primary with-ico', onclick: () => nav.openProject(p.id) }, svgIcon('edit'), 'Open'),
      h('a', { class: 'button with-ico', href: `./play.html?project=${encodeURIComponent(p.id)}` }, svgIcon('play'), 'Play'),
      keys,
      moreMenu(...projectMenuItems(p, refresh)),
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
        ? h('button', { class: 'with-ico', onclick: () => void showNotice(e) }, svgIcon('notice'), 'Notice')
        : h('button', { class: 'with-ico', onclick: () => void copyGame(game, nav), 'aria-label': `Edit a copy of ${game.title}` }, svgIcon('edit'), 'Edit a copy'),
      keys,
      hasManual(game) ? h('button', { class: 'with-ico', onclick: () => void openGameManual(e) }, svgIcon('manual'), 'Manual') : null,
    ] as (HTMLElement | null)[]
  ).filter((x): x is HTMLElement => !!x);
}

/** “Demo video”: the demo in a dialog, where it can also be saved as a video. */
export function demoDialogButton(game: HomeGame): HTMLElement | null {
  if (!game.gam) return null;
  // the dialog and the video maker load when it is pressed (media/demo.ts does the rest)
  const press = async () => (await import('../../media/demo')).demoButton(game.title, () => game.files(), game.gam)?.click();
  return h(
    'button',
    { class: 'with-ico', title: 'Watch the demo with its music and sounds, or save it as a video', onclick: () => void press() },
    svgIcon('film'),
    'Demo video',
  );
}

export async function showNotice(listed: CatalogEntry): Promise<unknown> {
  const g = await withDetails(listed).catch(() => listed); // the notice is in games/details/<id>.json
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
