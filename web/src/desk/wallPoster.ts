// A poster or fold-out map pinned on the wall while a Sandbox Software game is in the
// drive, like the ones that came folded up in the box. about.json "box".poster names a
// picture from the game ({ gif: 'title.gif' }) or a stretch of a map
// ({ map: ['galaxy.map', x, y, w, h] } in blocks, drawn as a creased fold-out map);
// without one the game's title screen becomes the poster.
import './wallPoster.css';
import { h } from '../editor/core/ui';
import type { CatalogEntry } from '../project/files';
import { mapShot } from './boxes/boxArt';
import type { BoxExtras } from './boxes/boxFacts';
import { seeded } from './boxes/boxFacts';

type Poster = NonNullable<BoxExtras['poster']>;

let scene: HTMLElement | undefined;
let games: CatalogEntry[] = [];
let shown: string | undefined;
const drawn = new Map<string, Promise<HTMLCanvasElement | undefined>>();

/** Where posters go (the desk scene) and which games have them. */
export function setPosterWall(wall: HTMLElement, entries: CatalogEntry[]): void {
  scene = wall;
  games = entries;
}

function posterOf(entry: CatalogEntry): Poster | undefined {
  const box = entry.original?.box as (BoxExtras & { tagline?: string }) | undefined;
  if (box?.poster) return box.poster;
  return entry.files.includes('title.gif') ? { gif: 'title.gif', caption: box?.tagline } : undefined;
}

function loadImage(src: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(undefined);
    img.src = src;
  });
}

const W = 320;

function wrapCentered(ctx: CanvasRenderingContext2D, text: string, y: number, width: number, lh: number): number {
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width && line) {
      ctx.fillText(line, W / 2, y);
      y += lh;
      line = word;
    } else line = test;
  }
  if (line) ctx.fillText(line, W / 2, y);
  return y + lh;
}

/** A poster: the game's title over one of its pictures, with a caption. */
async function drawPoster(entry: CatalogEntry, poster: Poster): Promise<HTMLCanvasElement | undefined> {
  const box = entry.original?.box;
  const map = poster.map;
  let pic: CanvasImageSource | undefined;
  let pw = 0;
  let ph = 0;
  if (map) {
    const c = await mapShot(entry, map[0], map[1], map[2], map[3], map[4]).catch(() => undefined);
    if (c) [pic, pw, ph] = [c, c.width, c.height];
  } else if (poster.gif) {
    const img = await loadImage(`./${entry.path}${poster.gif.toLowerCase()}`);
    if (img) [pic, pw, ph] = [img, img.naturalWidth, img.naturalHeight];
  }
  if (!pic) return undefined;
  const fold = !!map;
  // fit the picture in the space a poster has on the wall
  const scale = Math.min((W - 24) / pw, (W * 1.05) / ph);
  const picW = Math.round(pw * scale);
  const picH = Math.round(ph * scale);
  const picX = (W - picW) / 2;
  const head = 58;
  const H = Math.max(Math.round(W * 1.25), head + picH + 90);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  // paper: glossy black for a poster, off-white for a map
  ctx.fillStyle = fold ? '#efe6cf' : (box?.background ?? '#111');
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  const titleText = (poster.title ?? entry.title).toUpperCase();
  let px = 34;
  const font = (p: number) => `italic 900 ${p}px 'Arial Black', Impact, sans-serif`;
  for (; px > 12; px--) {
    ctx.font = font(px);
    if (ctx.measureText(titleText).width < W - 20) break;
  }
  ctx.fillStyle = fold ? '#7a2a10' : (box?.accent ?? '#fc0');
  ctx.fillText(titleText, W / 2, 16 + px);
  ctx.imageSmoothingEnabled = false;
  const picY = head;
  ctx.drawImage(pic, picX, picY, picW, picH);
  if (fold) {
    ctx.strokeStyle = '#5a4630';
    ctx.lineWidth = 2;
    ctx.strokeRect(picX, picY, picW, picH);
  }
  ctx.font = `700 15px Arial, sans-serif`;
  ctx.fillStyle = fold ? '#3a2a18' : (box?.ink ?? '#fff');
  const caption = poster.caption ?? (fold ? `A map of ${entry.title}` : '');
  if (caption) wrapCentered(ctx, caption, picY + picH + 28, W - 36, 19);
  ctx.font = `900 11px Arial, sans-serif`;
  ctx.fillText((entry.company ?? 'Sandbox Software').toUpperCase().split('').join(' '), W / 2, H - 14);
  // folds: a fold-out map has a grid of creases; a poster was rolled, so just a couple
  const rnd = seeded(`${entry.id}#poster`);
  const crease = (x0: number, y0: number, x1: number, y1: number, alpha: number) => {
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0 + 1, y0 + 1);
    ctx.lineTo(x1 + 1, y1 + 1);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 1.4})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };
  if (fold) {
    crease(W / 2, 0, W / 2, H, 0.22);
    for (const f of [1 / 3, 2 / 3]) crease(0, H * f, W, H * f, 0.22);
    // the panels catch the light differently
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(W / 2, 0, W / 2, H / 3);
    ctx.fillRect(0, H / 3, W / 2, H / 3);
    ctx.fillRect(W / 2, (H * 2) / 3, W / 2, H / 3);
  } else {
    crease(0, H * (0.3 + rnd() * 0.1), W, H * (0.32 + rnd() * 0.1), 0.12);
  }
  // a sheen of age
  ctx.fillStyle = 'rgba(236, 222, 190, 0.08)';
  ctx.fillRect(0, 0, W, H);
  return c;
}

/** Pins the game's poster (or fold-out map) on the wall; replaces any other. */
export async function showWallPoster(gameId: string): Promise<void> {
  const entry = games.find((g) => g.id === gameId);
  const poster = entry && posterOf(entry);
  if (!scene || !entry || !poster) return hideWallPoster();
  if (shown === gameId && scene.querySelector('.wall-poster')) return;
  shown = gameId;
  if (!drawn.has(gameId)) drawn.set(gameId, drawPoster(entry, poster));
  const canvas = await drawn.get(gameId)!;
  if (shown !== gameId) return;
  scene.querySelector('.wall-poster')?.remove();
  if (!canvas) return;
  const img = h('img', { src: canvas.toDataURL(), alt: '', draggable: false });
  const tilt = (seeded(gameId)() - 0.5) * 3;
  scene.append(
    h(
      'figure',
      {
        class: `wall-poster ${poster.map ? 'fold-out' : ''}`,
        style: `--tilt: ${tilt.toFixed(2)}deg`,
        title: `${entry.title} — ${poster.map ? 'the fold-out map from the box' : 'the poster from the box'}`,
        'aria-label': `${entry.title} poster`,
      },
      img,
    ),
  );
}

/** Takes the poster down. */
export function hideWallPoster(): void {
  shown = undefined;
  const p = scene?.querySelector<HTMLElement>('.wall-poster');
  if (!p) return;
  p.classList.add('leaving');
  setTimeout(() => p.remove(), 300);
}
