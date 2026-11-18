// Home game models and adapters for catalog entries and browser projects.
import { renderShot, renderTitle } from '../../gfx/gameShots';
import { paintIndexed } from '../core/draw';
import { GameFiles, creditLine, loadHostedGame, type CatalogEntry } from '../../project/files';
import { demoNeeds, streamHostedGame } from '../../project/streamGame';
import { listProjects, loadProject } from '../../project/storage';
import { ADVTYPE, NOSCENE, parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { catalogTarget, projectTarget, type HealthTarget } from './gameHealth';
import { editedWhen } from './homeTime';
import { readableBlurb } from './homeBlurb';
import { isBizarreGame } from '../../project/bizarre';
import { gameVersion } from '../../project/gameVersion';
import type { CommunityGame } from '../../community/catalog';

const demoPreview = () => import('../../media/demoPreview');

/** How much of a game a demo in the panel fetches before it is asked for, in bytes. */
const PREVIEW_AHEAD = 192 * 1024;

export type GameKind = 'mine' | 'gameware' | 'sandbox' | 'shareware' | 'bizarre' | 'starter' | 'special' | 'community';

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
  community?: Readonly<CommunityGame>;
  health?: HealthTarget;
  /** Draws the game's picture (its first level) into a canvas of any size. */
  drawShot(canvas: HTMLCanvasElement): Promise<unknown>;
  /** Draws its title screen (320 x 200, gfx/titlePicture.ts); false when it has none. */
  drawTitle(canvas: HTMLCanvasElement): Promise<boolean>;
  /** All the game's files (loaded once). */
  files(): Promise<GameFiles>;
  /** Enough of its files to start the demo preview, the rest arriving as it plays (hosted games). */
  previewFiles?(): Promise<GameFiles>;
  hasDemo(): Promise<boolean>;
}

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
  const made =
    kind === 'sandbox' || kind === 'starter' || kind === 'special'
      ? [g.company ?? 'Sandbox Software', g.year].filter(Boolean).join(' · ')
      : kind === 'shareware' || kind === 'bizarre'
        ? creditLine(g) || (isBizarreGame(g) ? 'The Bard of Bizarre · free to change' : 'Shareware · play only')
        : !g.gam
          ? 'Pictures, monsters and sounds'
          : [g.company ?? g.author, g.year].filter(Boolean).join(' · ') || 'Gameware from the Game-Maker CD';
  // a game made for this project names its version (about.json), small, after who made it
  const version = g.gam ? gameVersion(g) : undefined;
  const byline = version ? `${made} · v${version}` : made;
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
    drawTitle: (c) => renderTitle(g, c),
    files: once(() => loadHostedGame(g)),
    previewFiles: once(async () => {
      // the demo's files as it asks for them, and a little ahead (not the whole game)
      const s = streamHostedGame(g, './', 4, PREVIEW_AHEAD);
      await s.started;
      await s.files.stream?.need(demoNeeds(s.files.get(g.gam ?? '')));
      return s.files;
    }),
    hasDemo: async () => (await import('../../media/demoKind')).catalogHasDemo(g), // from the .gam: no player needed yet
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
    title: p.name.trim(),
    // the game it began as, when it is a copy
    byline: [editedWhen(p.updated), original?.gam ? `copy of ${original.title}` : null, p.gam].filter(Boolean).join(' · '),
    // two lines (pre-line in home.css), so a narrow tile never ends a line with a lone “·”
    tileByline: original?.gam ? `${editedWhen(p.updated)}\nfrom ${original.title}` : undefined,
    gam: p.gam,
    search: searchText(p.name.trim(), p.gam),
    project: p,
    health: projectTarget(p.id, p.name, p.updated, original?.gam ? catalogTarget(original) : undefined),
    // the first level the title scene leads to, where the hero arrives
    drawShot: async (c) => {
      const files = await load();
      const game = parseGame(files.get(p.gam)!);
      const link = game.scenes[0]?.links.find((l) => l.toScene !== NOSCENE && game.scenes[l.toScene]?.gametype === ADVTYPE);
      const i = link ? link.toScene : game.scenes.findIndex((s) => s.gametype === ADVTYPE);
      if (i < 0) return false;
      const { levelShot } = await import('../editors/integrator/integratorArt');
      const shot = levelShot(files, game.scenes[i], link?.to ?? { x: 50, y: 50 }, Math.round(c.width / 20), Math.round(c.height / 20));
      if (!shot) return false;
      const ctx = c.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(shot, 0, 0, c.width, c.height);
      return true;
    },
    // its title screen, from its own files as they are now
    drawTitle: async (c) => {
      const files = await load();
      // drawn live only for a game of yours (a listed game's is built ahead: gameShots.ts), so its readers load then
      const { titlePixels } = await import('../../gfx/titlePicture');
      const pic = titlePixels(files, parseGame(files.get(p.gam)!));
      if (pic) paintIndexed(c, pic.pixels, pic.width, pic.height, pic.palette);
      return !!pic;
    },
    files: load,
    // its own demo, one added for the CD game it still is, or the attract mode (demoPreview.ts)
    hasDemo: async () => !!(await (await demoPreview()).filesDemoKind(await load(), p.gam)),
  };
}
