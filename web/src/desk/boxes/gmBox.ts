// The Game-Maker 3.0 retail box (after the real pink 1994 box) as six faces for the box
// viewer, and what comes out of it: the Owner's Guide and the CD, whose rainbow sheen
// shifts as it turns.
import './gmBox.css';
import { h } from '../../editor/core/ui';
import type { BoxFaces } from './gameBox';
import { loadedShots, preloadShots, sandboxShots } from '../../gfx/sandboxShots';
import { gmCover } from '../../manual/printables/gmCover';
import { priceSticker } from './boxSeals';
import { GM_PRICE, gmFloppy } from '../../manual/printables/gmInserts';
import type { BoxItem } from '../../manual/printables/viewer';
import { boxList, showInBox } from './boxList';

preloadShots();

const PPI = 80;
const W = 7.5 * PPI;
const H_DESK = 9.25 * PPI;
const D = 2 * PPI;

const PINK = '#f0a090';
const YELLOW = '#f2e600';
const GREEN = '#1f9a3a';
const RED = '#d81e1e';
/** The box's colors, for the box to print (printables/gmBoxPrint.ts). */
export const GM_BOX_COLORS = { pink: PINK, yellow: YELLOW, red: RED, navy: '#1d3f7a', black: '#0b0b0b' } as const;
const LOGO = (px: number) => `italic 900 ${px}px 'Arial Black', Impact, sans-serif`;
const SANS = (px: number, weight = 700, italic = false) => `${italic ? 'italic ' : ''}${weight} ${px}px Arial, Helvetica, sans-serif`;

/** A face's canvas, w x h at PPI; `scale` draws it that many times finer (a box to print) in the same units. */
function canvas(w: number, h: number, scale = 1): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const ctx = c.getContext('2d')!;
  ctx.scale(scale, scale);
  return [c, ctx];
}

/** "GAME-MAKER" in yellow with its green drop shadow, slanted, fitted to a width. */
export function logo(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, max: number, align: CanvasTextAlign = 'left'): void {
  let px = max;
  ctx.font = LOGO(px);
  while (ctx.measureText('GAME-MAKER').width > width && px > 8) ctx.font = LOGO(--px);
  ctx.save();
  ctx.textAlign = align;
  ctx.translate(x, y);
  ctx.transform(1, 0, -0.14, 1, 0, 0);
  ctx.fillStyle = GREEN;
  ctx.fillText('GAME-MAKER', px * 0.06, px * 0.06);
  ctx.fillStyle = YELLOW;
  ctx.fillText('GAME-MAKER', 0, 0);
  ctx.restore();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lh: number): number {
  let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width && line) {
      ctx.fillText(line, x, y);
      y += lh;
      line = word;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lh;
}

function badge(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  ctx.fillStyle = '#0f6e2c';
  ctx.fillRect(x, y, w, 96);
  ctx.strokeStyle = YELLOW;
  ctx.lineWidth = 6;
  ctx.strokeRect(x + 3, y + 3, w - 6, 90);
  ctx.fillStyle = '#fff';
  ctx.font = SANS(13);
  ctx.textAlign = 'center';
  // this edition is a port: RSD made the original
  ['ORIGINALLY', 'CREATED BY', 'RECREATIONAL', 'SOFTWARE', 'DESIGNS'].forEach((l, i) => ctx.fillText(l, x + w / 2, y + 21 + i * 16));
  ctx.textAlign = 'left';
}

/** Sets the largest font from `max` down to `min` px that fits `text` in `width`; false when even `min` doesn't. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, max: number, min: number, width: number): boolean {
  for (let px = max; px >= min; px--) {
    ctx.font = font(px);
    if (ctx.measureText(text).width <= width) return true;
  }
  return false;
}

/** Whether a point on the front is clear for a caption: below the bands, off the RSD badge and the version flash. */
function clearOnFront(px: number, py: number, H: number): boolean {
  if (px < 4 || px > W - 4 || py < 190 || py > H - 4) return false;
  if (px > W - 190 && px < W - 14 && py > H - 124 && py < H - 20) return false;
  return ((px - 110) / 92) ** 2 + ((py - (H - 80)) / 72) ** 2 > 1;
}

/** The longest run of a tile's caption strip (x0..x1, y0..y1 in the tilted grid) that the front shows clear. */
function clearSpan(m: DOMMatrix, x0: number, x1: number, y0: number, y1: number, H: number): [number, number] {
  let best: [number, number] = [x0, x0];
  let start: number | undefined;
  for (let x = x0; x <= x1; x += 2) {
    const ok = [y0, y1].every((y) => {
      const p = m.transformPoint({ x, y });
      return clearOnFront(p.x, p.y, H);
    });
    if (ok) start ??= x;
    if (start !== undefined && (!ok || x + 2 > x1)) {
      const end = ok ? x : x - 2;
      if (end - start > best[1] - best[0]) best = [start, end];
      start = undefined;
    }
  }
  return best;
}

/**
 * A box to print (the Library's retail box, printables/retailBox.ts): the front and back `h`
 * pixels tall at PPI (the desk's box is 9.25 in), drawn `scale` times finer, with no store's
 * price sticker.
 */
export interface GmPrintSize {
  h: number;
  scale: number;
}

/** The front and back on canvases: the desk's, or one to print (GmPrintSize). */
export function paintGmFaces(sampleTiles: [HTMLCanvasElement, string][], print?: GmPrintSize): { front: HTMLCanvasElement; back: HTMLCanvasElement } {
  const H = print?.h ?? H_DESK;
  const k = print?.scale ?? 1;
  // the front shows games made with Game-Maker: Sandbox Software's, once they have loaded
  const games = loadedShots();
  const tiles: [HTMLCanvasElement, string, string?][] =
    games.length >= 6 ? games.slice(0, 6).map((g) => [g.canvas, g.feature, g.title.toUpperCase()]) : sampleTiles;
  // ---- front
  const [front, f] = canvas(W, H, k);
  f.fillStyle = PINK;
  f.fillRect(0, 0, W, H);
  // the tilted grid of screenshots
  f.save();
  f.beginPath();
  f.rect(0, 150, W, H - 150);
  f.clip();
  f.translate(-80, 170);
  f.rotate((-14 * Math.PI) / 180);
  tiles.forEach(([shot, caption, game], i) => {
    const tw = 330;
    const th = 248;
    const x = (i % 2) * (tw + 26) - 10;
    const y = Math.floor(i / 2) * (th + 60) + 60;
    f.fillStyle = 'rgba(0,0,0,0.35)';
    f.fillRect(x + 6, y + 10, tw, th + (game ? 44 : 30));
    f.fillStyle = '#111';
    f.fillRect(x, y, tw, th + (game ? 44 : 30));
    f.imageSmoothingEnabled = false;
    f.drawImage(shot, x, y, tw, th);
    // the captions go in the part of the strip the box shows, shrunk to fit, or not at all
    // in the face's own units, whatever scale it is drawn at
    const [from, to] = clearSpan(new DOMMatrix().scale(1 / k).multiply(f.getTransform()), x, x + tw, y + th + 3, y + th + (game ? 42 : 28), H);
    if (to - from < 140) return;
    f.fillStyle = '#fff';
    fitFont(f, caption, (px) => SANS(px), game ? 17 : 19, 13, to - from - 16);
    f.fillText(caption, from + 8, y + th + 21);
    if (game) {
      f.fillStyle = YELLOW;
      const made = `MADE WITH GAME-MAKER: ${game}`;
      const line = fitFont(f, made, (px) => SANS(px, 900, true), 12, 9, to - from - 16) ? made : game;
      fitFont(f, line, (px) => SANS(px, 900, true), 12, 8, to - from - 16);
      f.fillText(line, from + 8, y + th + 37);
    }
  });
  f.restore();
  // banner and tagline
  f.fillStyle = '#0b0b0b';
  f.fillRect(0, 0, W, 120);
  f.fillStyle = '#fff';
  f.font = SANS(22, 700, true);
  f.fillText('COMPUTER-AIDED DESIGN TOOLS', 24, 36);
  logo(f, 24, 104, W - 48, 86);
  f.fillStyle = RED;
  f.fillRect(0, 120, W, 34);
  f.fillStyle = '#fff';
  f.font = SANS(20, 700, true);
  f.fillText('CREATE YOUR OWN COMPUTER GAMES', 18, 145);
  badge(f, W - 186, H - 120, 168);
  // this fork's box, not RSD's: a band under the tagline
  f.fillStyle = '#1d3f7a';
  f.fillRect(0, 154, W, 30);
  f.fillStyle = YELLOW;
  f.fillRect(0, 184, W, 3);
  f.fillStyle = '#fff';
  f.font = SANS(17, 900);
  f.fillText('SANDBOX EDITION', 18, 175);
  f.font = SANS(13, 700, true);
  f.textAlign = 'right';
  f.fillText('a modified fork of RSD Game-Maker 3.0', W - 18, 175);
  f.textAlign = 'left';
  // version flash
  f.save();
  f.translate(110, H - 80);
  f.rotate(-0.2);
  f.fillStyle = YELLOW;
  f.beginPath();
  for (let i = 0; i < 24; i++) {
    const r = i % 2 ? 50 : 66;
    const a = (i / 24) * Math.PI * 2;
    f.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r);
  }
  f.fill();
  f.fillStyle = '#000';
  f.textAlign = 'center';
  f.font = SANS(18, 900);
  f.fillText('VERSION', 0, -4);
  f.font = SANS(34, 900);
  f.fillText('3.0', 0, 30);
  f.restore();

  // the list price is printed on the back; Bits & Bytes Software marked it down
  if (!print) priceSticker(f, W - 150, 200, GM_PRICE.store, GM_PRICE.sale, -0.05, GM_PRICE.msrp);

  // ---- back
  const [back, b] = canvas(W, H, k);
  b.fillStyle = PINK;
  b.fillRect(0, 0, W, H);
  b.fillStyle = '#0b0b0b';
  b.fillRect(0, 0, W, 96);
  logo(b, 24, 76, 380, 64);
  b.fillStyle = '#fff';
  b.font = SANS(26, 900, true);
  b.fillText('3.0', 440, 76);
  b.fillStyle = '#1d1a14';
  b.font = SANS(23, 900, true);
  b.fillText('Design your own arcade adventures!', 30, 140);
  b.font = `19px Georgia, 'Times New Roman', serif`;
  let y = wrap(
    b,
    'Game-Maker is a complete set of computer-aided design tools for building your own action games in 256-color VGA. No programming needed: draw the scenery, animate the monsters, paint the maps and link the scenes together, then play your game or give it to your friends.',
    30,
    174,
    W - 60,
    22,
  );
  b.font = SANS(18);
  for (const line of [
    'Draw 20x20 blocks with a full paint program',
    'Animate monsters and give them paths to follow',
    'Paint 100x100 block maps that scroll',
    'Design your hero: moves, jumps, shots, inventory',
    'Import GIF pictures and FLI animations',
    'Sound Blaster music and digitized sound',
    'Link title screens, levels and endings into a game',
  ]) {
    b.fillStyle = RED;
    b.fillRect(34, y - 13, 10, 10);
    b.fillStyle = '#1d1a14';
    b.fillText(line, 56, y);
    y += 21;
  }
  // a strip of games made with it
  const strip: [HTMLCanvasElement, string][] = games.length
    ? games.slice(0, 4).map((g) => [g.canvas, g.title])
    : sampleTiles.slice(0, 4).map(([c, t]) => [c, t]);
  b.fillStyle = '#0b0b0b';
  b.fillRect(30, y - 4, W - 60, 128);
  b.fillStyle = YELLOW;
  b.font = SANS(13, 900, true);
  b.fillText(games.length ? 'GAMES MADE WITH GAME-MAKER BY SANDBOX SOFTWARE' : 'SCREENS FROM THE SAMPLE GAMES', 40, y + 14);
  const sw = (W - 60 - 20 - 3 * 10) / 4;
  strip.forEach(([shot, name], i) => {
    const sx = 40 + i * (sw + 10);
    b.imageSmoothingEnabled = false;
    b.drawImage(shot, sx, y + 22, sw, (sw * 10) / 16);
    b.fillStyle = '#fff';
    b.font = SANS(11, 700);
    while (b.measureText(name).width > sw && name.length > 4) name = `${name.slice(0, -2)}…`;
    b.fillText(name, sx, y + 22 + (sw * 10) / 16 + 14);
  });
  y += 132;
  // system requirements (as the Owner's Manual gives them), and the UPC block with the list price
  const reqW = W - 60 - 182;
  b.fillStyle = '#fff6ee';
  b.fillRect(30, y, reqW, 104);
  b.strokeStyle = '#1d1a14';
  b.lineWidth = 2;
  b.strokeRect(30, y, reqW, 104);
  b.fillStyle = '#1d1a14';
  b.font = SANS(13, 900);
  b.fillText('SYSTEM REQUIREMENTS', 42, y + 19);
  b.font = SANS(12, 400);
  [
    'IBM AT, PS/2 or compatible: 286 or better',
    '512K free memory · hard disk · MS-DOS 4.1+',
    'Standard VGA (256 colors) · two-button mouse',
    '3½" 1.44 MB drive · double-spin CD-ROM (bonus CD)',
    'Optional: Sound Blaster card, joystick',
  ].forEach((l, i) => b.fillText(l, 42, y + 36 + i * 15));
  const upcX = W - 30 - 166;
  const upcY = y + 4;
  b.fillStyle = '#fff';
  b.fillRect(upcX, upcY, 166, 96);
  b.fillStyle = '#111';
  for (let i = 0, x = upcX + 12; x < upcX + 154; i++) {
    const bw = [1, 2, 1, 3, 1, 1, 2, 4][(i * 5 + 3) % 8];
    if (i % 2 === 0) b.fillRect(x, upcY + 8, bw, i < 3 || x > upcX + 146 ? 64 : 58);
    x += bw + 1;
  }
  b.font = `12px 'Courier New', monospace`;
  b.textAlign = 'center';
  b.fillText('0 55501 30595 3', upcX + 83, upcY + 80);
  b.font = SANS(10, 700);
  b.fillText(`SUGG. RETAIL ${GM_PRICE.msrp}`, upcX + 83, upcY + 92);
  b.textAlign = 'left';
  b.font = SANS(12, 400);
  b.fillText('Game-Maker © 1991–1994 Recreational Software Designs; released under the MIT License in 2014.', 30, H - 40);
  b.fillText('Sandbox Edition box art, made for this modified fork. Not the original RSD box.', 30, H - 22);
  return { front, back };
}

/** tiles: the screenshots from the desk box, each with its caption. */
export function drawGmBox(sampleTiles: [HTMLCanvasElement, string][]): BoxFaces {
  const H = H_DESK;
  const { front, back } = paintGmFaces(sampleTiles);

  // ---- sides and ends
  const spine = (): string => {
    const [c, s] = canvas(D, H);
    s.fillStyle = '#0b0b0b';
    s.fillRect(0, 0, D, H);
    s.fillStyle = RED;
    s.fillRect(0, H - 120, D, 34);
    s.save();
    s.translate(D / 2 + 26, H / 2 - 10);
    s.rotate(Math.PI / 2);
    logo(s, 0, 0, H - 300, 80, 'center');
    s.restore();
    s.fillStyle = '#fff';
    s.textAlign = 'center';
    s.font = SANS(16, 900);
    s.fillText('RSD', D / 2, 52);
    // this fork's mark under the publisher's
    s.fillStyle = '#1d3f7a';
    s.fillRect(D / 2 - 34, 64, 68, 30);
    s.strokeStyle = YELLOW;
    s.lineWidth = 2;
    s.strokeRect(D / 2 - 33, 65, 66, 28);
    s.fillStyle = YELLOW;
    s.font = SANS(20, 900);
    s.fillText('SE', D / 2, 87);
    s.fillStyle = '#fff';
    s.font = SANS(11, 700);
    s.fillText('SANDBOX EDITION', D / 2, H - 70);
    s.font = SANS(14, 700, true);
    s.fillText('VERSION 3.0', D / 2, H - 98);
    return c.toDataURL();
  };
  const end = (): string => {
    const [c, s] = canvas(W, D);
    s.fillStyle = PINK;
    s.fillRect(0, 0, W, D);
    s.fillStyle = '#0b0b0b';
    s.fillRect(0, 30, W, 100);
    logo(s, W / 2, 104, W - 80, 72, 'center');
    return c.toDataURL();
  };
  return { front: front.toDataURL(), back: back.toDataURL(), left: spine(), right: spine(), top: end(), bottom: end() };
}

/** The pieces of paper in the box (the disks lie beside the guide already), as the guide's own tray lists them. */
function insertItems(): Promise<BoxItem[]> {
  return Promise.all([import('../../manual/printables/gmItems'), import('../../project/files')]).then(
    async ([{ gmBoxItems }, { loadCatalog, isSandboxGame }]) => {
      const family = (await loadCatalog().catch(() => [])).filter(isSandboxGame);
      return gmBoxItems(family).filter((i) => i.id !== 'disks');
    },
  );
}

function coverImg(game?: string, title?: string): HTMLImageElement {
  const img = gmCover(game, title);
  img.alt = '';
  return img;
}

/** The Owner's Guide, the program disks, the bonus-games CD and the inserts, laid beside the box in the viewer. */
export function gmBoxContents(openGuide: () => void, insertCd: () => void): HTMLElement {
  // Click the CD to put it in the drive and start Game-Maker (same as the viewer's button).
  const disc = h(
    'div',
    {
      class: 'holo-cd',
      role: 'button',
      tabindex: 0,
      title: 'Put the CD in and start Game-Maker',
      'aria-label': 'Game-Maker CD: put it in and start Game-Maker',
    },
    h('div', { class: 'holo-spin' }, h('div', { class: 'holo-label' })),
  );
  disc.addEventListener('click', insertCd);
  disc.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), insertCd()));
  disc.querySelector('.holo-label')!.innerHTML = `<svg viewBox="0 0 100 100">
    <defs>
      <path id="holo-top" d="M 16 50 A 34 34 0 0 1 84 50"/>
      <path id="holo-inner" d="M 26 50 A 24 24 0 0 1 74 50"/>
      <path id="holo-bottom" d="M 12 50 A 38 38 0 0 0 88 50"/>
    </defs>
    <text class="cd-title"><textPath href="#holo-top" startOffset="50%" text-anchor="middle">GAME-MAKER 3.0</textPath></text>
    <text class="cd-edition"><textPath href="#holo-inner" startOffset="50%" text-anchor="middle">SANDBOX EDITION</textPath></text>
    <text class="cd-small"><textPath href="#holo-bottom" startOffset="50%" text-anchor="middle">BONUS GAMES CD-ROM · NOT AN RSD DISC</textPath></text>
  </svg>`;
  // the sheen follows the light: move the pointer over the disc to tilt it
  disc.addEventListener('pointermove', (e) => {
    const r = disc.getBoundingClientRect();
    disc.style.setProperty('--lx', `${((e.clientX - r.left) / r.width) * 100}%`);
    disc.style.setProperty('--ly', `${((e.clientY - r.top) / r.height) * 100}%`);
  });
  // the Owner's Guide with its real cover (manual/printables/gmCover.ts): Teddy's game under the peeled corner once it has loaded
  const guide = h(
    'button',
    { class: 'guide-book has-cover', onclick: openGuide, title: 'Read the Owner’s Guide', 'aria-label': 'Read the Owner’s Guide' },
    coverImg(),
  );
  void sandboxShots().then((shots) => {
    const g = shots.find((x) => x.id === 'teddy') ?? shots[0];
    if (g) guide.replaceChildren(coverImg(g.canvas.toDataURL(), g.title));
  });
  const disks = h(
    'button',
    { class: 'gm-disks', onclick: () => showInBox(openGuide, 'disks'), title: 'Look at the program disks', 'aria-label': 'Program disks: two 3½-inch disks' },
    gmFloppy(2),
    gmFloppy(1),
  );
  return h(
    'div',
    { class: 'gm-contents' },
    h('div', { class: 'gm-left' }, guide, disks, disc),
    boxList({ label: 'What’s in the Game-Maker box', items: insertItems(), open: openGuide }),
  );
}
