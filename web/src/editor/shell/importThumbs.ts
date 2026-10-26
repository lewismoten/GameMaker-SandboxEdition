// Tiny title screens for the import chooser's list (importChooser.ts): each game's title
// picture (its title slide, else its menu screen, as the home page's tiles pick them, else
// GMTITLE.GIF), drawn small once its row is near the view, two at a time. Only the small
// canvases are kept; close() stops the rest and frees them when the list closes.
import { parseGame } from '../../formats/game';
import { decodeGif, isGif } from '../../formats/gif';
import { titlePixels, titleSource } from '../../gfx/titlePicture';
import type { FoundGame, GameReader } from '../../project/importScan';
import { paintIndexed } from '../core/draw';
import { h } from '../core/ui';

/** The canvas's own size: twice what it shows (80 x 50), so it stays crisp on fine screens. */
const W = 160;
const H = 100;
/** Pictures drawn at once. */
const AT_ONCE = 2;

interface Thumbs {
  /** A canvas for this game's row, drawn when it comes near the view. */
  thumb(game: FoundGame): HTMLCanvasElement;
  /** Stops drawing and frees every canvas. */
  close(): void;
}

/** A game's title screen at 320 x 200 on a scratch canvas, or undefined when it has none. */
async function titleCanvas(reader: GameReader, game: FoundGame): Promise<HTMLCanvasElement | undefined> {
  const gam = reader.mainGam(game);
  const gamBytes = gam && (await reader.file(game, gam));
  if (!gamBytes) return undefined;
  const parsed = parseGame(gamBytes);
  const files = await titleSource(parsed, (name) => reader.file(game, name));
  const big = document.createElement('canvas');
  const pic = titlePixels(files, parsed);
  if (pic) {
    paintIndexed(big, pic.pixels, pic.width, pic.height, pic.palette);
    return big;
  }
  // none of its own: the Game-Maker title it shows first
  const gif = await reader.file(game, 'gmtitle.gif');
  if (!gif || !isGif(gif)) return undefined;
  const img = decodeGif(gif);
  paintIndexed(big, img.pixels, img.width, img.height, img.palette);
  return big;
}

/** Thumbnails for the rows of `list` (the scrolling list they are in). */
export function importThumbs(reader: GameReader, list: HTMLElement): Thumbs {
  const waiting: (() => Promise<void>)[] = [];
  const all: HTMLCanvasElement[] = [];
  let running = 0;
  let closed = false;
  const pump = () => {
    while (!closed && running < AT_ONCE && waiting.length) {
      running++;
      void waiting.shift()!().finally(() => {
        running--;
        pump();
      });
    }
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        observer.unobserve(e.target);
        const draw = (e.target as HTMLCanvasElement & { draw?: () => Promise<void> }).draw;
        if (draw) waiting.push(draw);
      }
      pump();
    },
    { root: list, rootMargin: '200px 0px' },
  );
  return {
    thumb(game) {
      const c = h('canvas', {
        class: 'ic-thumb loading',
        width: String(W),
        height: String(H),
        role: 'img',
        'aria-label': `Title screen of ${game.name}`,
      }) as HTMLCanvasElement & {
        draw?: () => Promise<void>;
      };
      c.draw = async () => {
        let big: HTMLCanvasElement | undefined;
        try {
          big = await titleCanvas(reader, game);
        } catch {
          big = undefined;
        }
        if (closed) return;
        c.classList.remove('loading');
        if (!big) {
          c.classList.add('none');
          c.setAttribute('aria-label', `No title screen for ${game.name}`);
          return;
        }
        const ctx = c.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(big, 0, 0, W, H);
        big.width = big.height = 0;
      };
      all.push(c);
      observer.observe(c);
      return c;
    },
    close() {
      closed = true;
      observer.disconnect();
      waiting.length = 0;
      for (const c of all) c.width = c.height = 0;
      all.length = 0;
    },
  };
}
