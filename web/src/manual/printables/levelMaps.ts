// Load Level Maps and cache their raster pictures for printing, previews and the viewer.
import './paper.css'; // first: this piece's own styles build on the paper's
import './levelMaps.css';
import { type CatalogEntry, GameFiles, peekGameFile } from '../../project/files';
import { type Game, parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { type Level, fillerBlock, levelsOf } from './levelMapLayout';
import { scenePixels } from '../../gfx/levelPicture';
import { paintIndexed } from '../../editor/core/draw';
import { type Mint, coursePanelUrls, GUTTER, PANEL_GAP, PANEL_HEAD, wholeCourseSize, wholeCourseSvg } from './levelCourseSvg';
import { MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { unrolledShows } from '../../editor/check/unroll';
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { type PrintContext, type Sheet, sheet } from './kit';
import { type ReaderOptions, type Reader } from '../readView';
import { hasSecrets, loadSecrets } from './levelSecrets';
import { type Loaded, levelViewer } from './levelMapViewer';
import { loadViews } from './levelViews';
import { listedRoomHints } from './levelRoomHints';
import { COURSE_AREA, FULL, cropper, COLORS, markText } from './levelMapDrawing';
import { mergeStates } from './levelStates';
import { pageCounts, printSheets } from './levelMapPages';
import { h } from '../../editor/core/ui';
import { el } from './worldMapArt';

export { COLORS } from './levelMapDrawing';
export { markText } from './levelMapDrawing';
export { labelRoom } from './levelMapDrawing';
export { levelSvg } from './levelMapDrawing';
export { captionSvg } from './levelMapDrawing';

/** "Print everything" stays sensible: big maps go full size too unless that runs past this many pages. */
const MOST_PAGES = 60;

/** The game and every level's files (palette, map, blocks, monsters). */
export async function loadLevels(entry: CatalogEntry): Promise<{ game: Game; files: GameFiles } | undefined> {
  if (!entry.gam) return undefined;
  const gam = await peekGameFile(entry, entry.gam);
  if (!gam) return undefined;
  const game = parseGame(gam);
  const files = new GameFiles();
  const want = new Set<string>();
  for (const s of game.scenes) if (s.gametype === 10) for (const k of [0, 1, 2, 3, 4]) if (s.files[k]) want.add(s.files[k].toLowerCase());
  await Promise.all(
    [...want].map(async (n) => {
      const b = await peekGameFile(entry, n).catch(() => undefined);
      if (b) files.set(n, b);
    }),
  );
  return { game, files };
}

/** Draws a level (once) and gives a URL of its picture, ready to show. */
export type Painter = (l: Level) => Promise<string>;

/** A level's picture, a block to 20 pixels: its blocks and monsters, secrets drawn as ground. */
export function levelCanvas(game: Game, files: GameFiles, l: Level): HTMLCanvasElement {
  const pic = scenePixels(files, game.scenes[l.scene], l.area.x, l.area.y, l.area.w, l.area.h, l.cells);
  if (pic && l.unrolled?.runs) blankUnseen(pic, l, files, game);
  const canvas = document.createElement('canvas');
  if (pic) paintIndexed(canvas, pic.pixels, pic.width, pic.height, pic.palette);
  return canvas;
}

/** Blob URLs it made are kept in `blobs` to revoke later; with none kept, pictures are data URLs (nothing to release). */
function minter(blobs?: Set<string>): Mint {
  return (b, canvas) => {
    if (!b || !blobs) return canvas.toDataURL();
    const url = URL.createObjectURL(b);
    blobs.add(url);
    return url;
  };
}

function painter(game: Game, files: GameFiles, mint: Mint): Painter {
  const done = new Map<Level, Promise<string>>();
  return (l) => {
    let p = done.get(l);
    if (!p) {
      p = new Promise<string>((resolve) => {
        const canvas = levelCanvas(game, files, l);
        canvas.toBlob((b) => {
          const url = mint(b, canvas);
          const img = new Image();
          img.src = url;
          void img.decode().then(
            () => resolve(url),
            () => resolve(url),
          );
        });
      });
      done.set(l, p);
    }
    return p;
  };
}

/** Draws a course's panels (once) and gives the URL of each, in order. */
export type CoursePainter = (l: Level) => Promise<string[]>;

function coursePainter(game: Game, files: GameFiles, mint: Mint): CoursePainter {
  const done = new Map<Level, Promise<string[]>>();
  return (l) => {
    let p = done.get(l);
    if (!p) done.set(l, (p = coursePanelUrls(game, files, l, mint)));
    return p;
  };
}

/**
 * A level that winds on past a lap shows only what the player sees there: the rest of its box
 * is the map's padding block (the same blocks come round again where the player does see them).
 */
function blankUnseen(pic: { width: number; pixels: Uint8Array }, l: Level, files: GameFiles, game: Game): void {
  const u = l.unrolled!;
  const filler = fillerBlock(l.cells);
  const at = l.cells.indexOf(filler);
  const pad = at >= 0 ? scenePixels(files, game.scenes[l.scene], at % MLEN, Math.floor(at / MLEN), 1, 1, l.cells) : undefined;
  for (let by = 0; by < l.area.h; by++)
    for (let bx = 0; bx < l.area.w; bx++) {
      if (unrolledShows(u, l.area.x + bx, l.area.y + by)) continue;
      for (let yy = 0; yy < BLEN; yy++)
        for (let xx = 0; xx < BLEN; xx++) pic.pixels[(by * BLEN + yy) * pic.width + bx * BLEN + xx] = pad ? pad.pixels[yy * BLEN + xx] : 0;
    }
}

/** Concurrent callers share one load. Keep its result, but allow another attempt after failure. */
function cachedLoad<T>(start: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () =>
    (pending ??= start().catch((error: unknown) => {
      pending = undefined;
      throw error;
    }));
}

/** Each game's levels as laid out (courses and all), shared by the thumbnail and the reader, which both want them. */
const laidOut = new WeakMap<Game, Level[]>();

/** The Level Maps of a game: printed pages, and the on-screen viewer. Undefined when it gets none. */
export function levelMaps(ctx: PrintContext):
  | {
      render(): Promise<Sheet[]>;
      release(): void;
      first(): Promise<Sheet | undefined>;
      reader(o: ReaderOptions): Promise<Reader>;
      preview(): Promise<Sheet | undefined>;
    }
  | undefined {
  if (!hasSecrets(ctx.entry.id)) return undefined;
  // the open viewer's pictures are blobs, revoked by release(); small pictures are data URLs, so closing the viewer leaves them be
  let blobs = new Set<string>();
  const source = cachedLoad(() => loadLevels(ctx.entry));
  const make = (keep?: Set<string>): Promise<Loaded | undefined> =>
    source().then(async (x) => {
      if (!x) return undefined;
      const [secret, views] = await Promise.all([loadSecrets(ctx.entry.id), loadViews(ctx.entry.id)]);
      if (!secret) return undefined;
      // the states of one place (near and far planes) print as one map
      let laid = laidOut.get(x.game);
      if (!laid) {
        laid = levelsOf(
          x.game,
          x.files,
          secret,
          views?.maps,
          views?.unrolled ?? {},
          listedRoomHints(ctx.entry.id),
          views?.courses ?? {},
          // the biggest blocks that fit, up to twice full size, so a course's details read, on at most half as many pages again
          { pageW: COURSE_AREA.w, pageH: COURSE_AREA.h, padW: 2 * GUTTER + PANEL_GAP, padH: 2 * PANEL_HEAD + PANEL_GAP, most: 2, least: FULL, growth: 1.5 },
        );
        laidOut.set(x.game, laid);
      }
      const seen = mergeStates(x.game, laid);
      // every block of the map as it is on the map, not as the player goes through it
      const every = seen.map((l) => ({ ...l, area: l.whole, marks: l.mapMarks ?? l.marks, unrolled: undefined, course: undefined }));
      return {
        game: x.game,
        seen,
        every,
        paint: painter(x.game, x.files, minter(keep)),
        paintCourse: coursePainter(x.game, x.files, minter(keep)),
        crop: cropper(),
        full: pageCounts(ctx.entry.id, x.game, seen).full <= MOST_PAGES,
        all: false,
      };
    });
  let load = cachedLoad(() => make(blobs));
  const loadThumb = cachedLoad(() => make());
  return {
    /** Lets go of the viewer's blob pictures (when the box viewer closes); the next open paints them again. */
    release() {
      const gone = blobs;
      for (const url of gone) URL.revokeObjectURL(url);
      // a picture still being painted for the closed viewer lands here later: let go of it as it arrives
      gone.add = (url) => (URL.revokeObjectURL(url), gone);
      blobs = new Set();
      load = cachedLoad(() => make(blobs));
    },
    async render() {
      const x = await load();
      return x ? printSheets(ctx.entry, x.game, x.all ? x.every : x.seen, x.paint, x.paintCourse, x.crop, x.full) : [];
    },
    /** Only the first printed sheet, painting just the levels on it (the box list's small picture). */
    async first() {
      const x = await loadThumb();
      return x ? (await printSheets(ctx.entry, x.game, x.all ? x.every : x.seen, x.paint, x.paintCourse, x.crop, x.full, true))[0] : undefined;
    },
    async reader(o) {
      const x = await load();
      if (!x?.seen.length) return { el: h('p', { class: 'gmb-loading' }, 'This game has no levels to map.'), view: () => {} };
      dispatchEvent(new CustomEvent('gm-achievement', { detail: { id: 'print-level-maps' } }));
      return levelViewer(ctx.entry.id, x, o);
    },
    /** The first level's picture, cropped as printed, for a small picture of the Level Maps (the Library's card). */
    async preview() {
      const x = await loadThumb();
      const l = x?.seen[0];
      if (!x || !l) return undefined;
      if (l.course) {
        const size = wholeCourseSize(l.course);
        return sheet(
          4,
          4,
          'lm-preview',
          el(
            'svg',
            {
              viewBox: `0 0 ${size.w} ${size.h}`,
              width: '100%',
              height: '100%',
              role: 'img',
              'aria-label': `${l.name}, whole course`,
            },
            wholeCourseSvg(x.game, l, await x.paintCourse(l), 0, 0, COLORS, (m) => markText(x.game, m)),
          ),
        );
      }
      const url = await x.paint(l);
      // a long strip shows its start; a tall one its top
      const aspect = Math.min(2, Math.max(0.75, l.area.w / l.area.h));
      return sheet(4 * aspect, 4, 'lm-preview', h('img', { src: url, alt: '' }));
    },
  };
}
