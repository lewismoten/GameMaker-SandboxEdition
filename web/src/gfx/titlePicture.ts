// A game's title screen as palette-indexed pixels (320 x 200), drawn the way PLAYGAME's
// ShowGraphic would show it (engine/showGraphic.ts): for the home page's tiles, built ahead
// of time for listed games (scripts/gameShots.ts) and drawn live for your own (homeCards.ts).
// No canvas, so the build and the page draw it alike.
import { STARTTYPE, type Game } from '../formats/game';
import { decodeGif, isGif } from '../formats/gif';
import { applyFliFrame, isFli, newFliCanvas, parseFli } from '../formats/fli';
import { parseBackdrop, parseSlideList } from '../formats/graphicScripts';
import { busiest, busyness, type FileSource, type LevelPicture } from './levelPicture';

const W = 320;
const H = 200;

const ext = (name: string) => (/\.[^.]*$/.exec(name)?.[0] ?? '').toLowerCase();

/**
 * Game-Maker's own splash screens (GMTITLE.GIF and its kin, "made with Game-Maker") and a
 * maker's logo shown before the game's own title: the same on many games, so never a tile's
 * picture while the game has one of its own.
 */
const SPLASH = /^(gmtitle\d*|ajgames|sandlogo|bard)\.(gif|fli)$/i;

/** The slot numbers of scene 0's title graphic and menu graphic (START_FILES). */
const TITLE = 0;
const MENU = 2;

/** True when nearly every pixel is one color (a black or blank frame). */
function blank(pixels: Uint8Array): boolean {
  const counts = new Map<number, number>();
  for (const p of pixels) counts.set(p, (counts.get(p) ?? 0) + 1);
  return Math.max(...counts.values()) > pixels.length * 0.97;
}

/** A GIF on the screen, its window from (x, y) (drawGifFile, drawbkd). */
function gifPixels(bytes: Uint8Array | undefined, x = 0, y = 0): LevelPicture | undefined {
  if (!bytes || !isGif(bytes)) return undefined;
  const img = decodeGif(bytes);
  const pixels = new Uint8Array(W * H);
  for (let sy = 0; sy < H; sy++)
    for (let sx = 0; sx < W; sx++) {
      const ix = sx + x;
      const iy = sy + y;
      if (ix >= 0 && iy >= 0 && ix < img.width && iy < img.height) pixels[sy * W + sx] = img.pixels[iy * img.width + ix];
    }
  return { width: W, height: H, pixels, palette: img.palette };
}

/**
 * An animation's last frame as it plays (playFli), what stays on the screen; or its most
 * colorful when the last is much plainer (a title that shrinks away), so it shows whole.
 */
function fliPixels(bytes: Uint8Array | undefined): LevelPicture | undefined {
  if (!bytes || !isFli(bytes)) return undefined;
  const anim = parseFli(bytes);
  const c = newFliCanvas(anim);
  const frames: LevelPicture[] = [];
  for (let f = 0; f < anim.frameCount; f++) {
    applyFliFrame(anim, f, c);
    const pixels = new Uint8Array(W * H);
    for (let y = 0; y < Math.min(H, anim.height); y++) pixels.set(c.pixels.subarray(y * anim.width, y * anim.width + Math.min(W, anim.width)), y * W);
    frames.push({ width: W, height: H, pixels, palette: c.palette.slice() });
  }
  const last = frames.at(-1);
  const best = busiest(frames);
  return last && best && busyness(last) >= busyness(best) * 0.8 ? last : best;
}

/**
 * The picture a graphic file shows: a GIF, a backdrop's window of one, an animation's last
 * frame, or the slide a slide list holds longest (its title, after the logos); text pages
 * (.txt) draw over whatever is up, so they have none. Splash screens and blank pictures are left out.
 */
export function graphicPixels(files: FileSource, name: string, depth = 0): LevelPicture | undefined {
  if (!name || SPLASH.test(name)) return undefined;
  const bytes = files.get(name);
  let pic: LevelPicture | undefined;
  switch (ext(name)) {
    case '.gif':
      pic = gifPixels(bytes);
      break;
    case '.bkd': {
      if (!bytes) return undefined;
      const b = parseBackdrop(bytes);
      pic = SPLASH.test(b.gif) ? undefined : gifPixels(files.get(b.gif), b.x, b.y);
      break;
    }
    case '.fli':
      pic = fliPixels(bytes);
      break;
    case '.lst': {
      if (!bytes || depth > 2) return undefined;
      // the slide held longest (no pause: until a key, the longest of all), the later one on a tie
      const slides = parseSlideList(bytes)
        .map((s, i) => ({ s, i, wait: s.pause ?? 0xffff }))
        .sort((a, b) => b.wait - a.wait || b.i - a.i);
      for (const { s } of slides) {
        const p = graphicPixels(files, s.name, depth + 1);
        if (p) return p;
      }
      return undefined;
    }
  }
  return pic && !blank(pic.pixels) ? pic : undefined;
}

/** The title graphic file names a game's title pictures may come from: its title, then its menu screen. */
function titleFiles(game: Game): string[] {
  const start = game.scenes.find((s) => s.gametype === STARTTYPE);
  return start ? [start.files[TITLE], start.files[MENU]].filter(Boolean) : [];
}

/**
 * A game's title screen, 320 x 200: its title graphic (a slide list's title slide), or its
 * menu screen when it has none of its own (many shareware games show only a menu backdrop).
 * Undefined when it has neither, or they can't be read.
 */
export function titlePixels(files: FileSource, game: Game): LevelPicture | undefined {
  for (const name of titleFiles(game)) {
    try {
      const pic = graphicPixels(files, name);
      if (pic) return pic;
    } catch {
      /* unreadable: try the next */
    }
  }
  return undefined;
}

/** Where the build puts a listed game's title screen (scripts/gameShots.ts). */
export function builtTitlePath(id: string): string {
  return `games/shots/${id}-title.png`;
}

/**
 * The files a game's title screen needs, fetched one by one (a slide list's slides, a
 * backdrop's GIF): for a page that has only the .gam so far.
 */
export async function titleSource(game: Game, fetch: (name: string) => Promise<Uint8Array | undefined>): Promise<FileSource> {
  const got = new Map<string, Uint8Array | undefined>();
  let names = titleFiles(game);
  for (let depth = 0; depth < 4 && names.length; depth++) {
    const todo = names.filter((n) => !SPLASH.test(n) && !got.has(n.toLowerCase()));
    const bytes = await Promise.all(todo.map((n) => fetch(n).catch(() => undefined)));
    todo.forEach((n, i) => got.set(n.toLowerCase(), bytes[i]));
    names = todo.flatMap((n, i) => {
      const b = bytes[i];
      if (!b) return [];
      try {
        if (ext(n) === '.lst') return parseSlideList(b).map((s) => s.name);
        if (ext(n) === '.bkd') return [parseBackdrop(b).gif];
      } catch {
        /* unreadable: nothing more to fetch */
      }
      return [];
    });
  }
  return { get: (name) => got.get(name.toLowerCase()) };
}
