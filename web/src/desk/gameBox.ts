// Retail boxes for the original games (games/<id>/about.json "box"): all six sides are
// drawn on canvases from the game's own data — its title, copy and screenshots of its
// maps — then folded into a 3D box. On the shelf the boxes lean against the wall; click
// one and it comes forward, turning slowly; drag to turn it, scroll or pinch to zoom,
// shift-drag (or two fingers) to pan, double-click to reset.
import './gameBox.css';
import { h } from '../editor/ui';
import type { CatalogEntry } from '../project/files';
import { mapShot } from './boxArt';

type Box = NonNullable<NonNullable<CatalogEntry['original']>['box']>;

/** Box proportions (inches, like a 1995 shelf box): width, height, depth. */
const W = 7.5;
const H = 9.25;
const D = 2;
const PPI = 80; // canvas pixels per inch

export interface BoxFaces {
  front: string;
  back: string;
  left: string;
  right: string;
  top: string;
  bottom: string;
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = Math.round(w * PPI);
  c.height = Math.round(h * PPI);
  return [c, c.getContext('2d')!];
}

/** Word-wraps text to a width; returns the y after the last line. */
function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number): number {
  for (const para of text.split(/\n+/)) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > width && line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        line = word;
      } else line = test;
    }
    if (line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
    y += lineHeight * 0.4;
  }
  return y;
}

/** The biggest font size (up to max) at which text fits the width. */
function fit(ctx: CanvasRenderingContext2D, text: string, font: (px: number) => string, width: number, max: number): number {
  let px = max;
  for (; px > 8; px -= 2) {
    ctx.font = font(px);
    if (ctx.measureText(text).width <= width) break;
  }
  return px;
}

const TITLE_FONT = (px: number) => `italic 900 ${px}px 'Arial Black', Impact, sans-serif`;
const BODY_FONT = (px: number) => `${px}px Georgia, 'Times New Roman', serif`;
const SANS = (px: number, weight = 700) => `${weight} ${px}px Arial, Helvetica, sans-serif`;

function background(ctx: CanvasRenderingContext2D, box: Box, w: number, h: number): void {
  const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
  g.addColorStop(0, box.background);
  g.addColorStop(1, shade(box.background, -0.35));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // a little print grain
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < (w * h) / 60; i++) {
    ctx.fillStyle = i % 2 ? '#fff' : '#000';
    ctx.fillRect((i * 7919) % w, (i * 104729) % h, 1, 1);
  }
  ctx.globalAlpha = 1;
}

/** Lightens (amount > 0) or darkens a #rrggbb color. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amount > 0 ? v + (255 - v) * amount : v * (1 + amount))));
  return `rgb(${ch(n >> 16)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
}

function titleText(ctx: CanvasRenderingContext2D, box: Box, title: string, cx: number, y: number, width: number, max: number): void {
  const px = fit(ctx, title, TITLE_FONT, width, max);
  ctx.font = TITLE_FONT(px);
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = px * 0.16;
  ctx.strokeStyle = '#000';
  ctx.fillStyle = shade(box.accent, -0.45);
  ctx.strokeText(title, cx + px * 0.06, y + px * 0.06);
  ctx.fillText(title, cx + px * 0.06, y + px * 0.06);
  ctx.strokeText(title, cx, y);
  const g = ctx.createLinearGradient(0, y - px, 0, y);
  g.addColorStop(0, shade(box.accent, 0.5));
  g.addColorStop(1, box.accent);
  ctx.fillStyle = g;
  ctx.fillText(title, cx, y);
  ctx.textAlign = 'left';
}

function publisherBand(ctx: CanvasRenderingContext2D, entry: CatalogEntry, w: number, y: number, hgt: number): void {
  ctx.fillStyle = '#0b0b0b';
  ctx.fillRect(0, y, w, hgt);
  ctx.fillStyle = '#f5d000';
  ctx.font = SANS(hgt * 0.5, 900);
  ctx.textAlign = 'center';
  ctx.fillText((entry.company ?? 'SANDBOX SOFTWARE').toUpperCase().split('').join(' '), w / 2, y + hgt * 0.68);
  ctx.textAlign = 'left';
}

function framedShot(ctx: CanvasRenderingContext2D, shot: HTMLCanvasElement | undefined, x: number, y: number, w: number, tilt = 0): number {
  const h = shot ? (w * shot.height) / shot.width : w * 0.625;
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(tilt);
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fillRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 12);
  ctx.shadowColor = 'transparent';
  if (shot) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(shot, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = '#222';
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }
  ctx.restore();
  return h;
}

function badge(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, bg: string, fg: string): number {
  ctx.font = SANS(17, 900);
  const w = ctx.measureText(text).width + 20;
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, 28);
  ctx.fillStyle = fg;
  ctx.fillText(text, x + 10, y + 20);
  return w;
}

function barcode(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: string): void {
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#000';
  let n = [...seed].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  for (let bx = x + 8; bx < x + w - 8; ) {
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    const bw = 1 + (n % 3);
    if ((n >> 8) % 2) ctx.fillRect(bx, y + 6, bw, h - 22);
    bx += bw + 1;
  }
  ctx.font = SANS(11, 400);
  ctx.fillText(`0 ${String(Math.abs(n) % 100000).padStart(5, '0')} ${String(Math.abs(n >> 5) % 100000).padStart(5, '0')} 5`, x + 10, y + h - 4);
}

/** Draws all six sides. */
export async function drawBox(entry: CatalogEntry): Promise<BoxFaces | undefined> {
  const box = entry.original?.box;
  if (!box) return undefined;
  const shots = await Promise.all((box.shots ?? []).slice(0, 3).map(([m, x, y]) => mapShot(entry, m, x, y, 16, 10).catch(() => undefined)));
  const sb = entry.original?.sound === 'sb';
  const title = entry.title;

  // ---- front
  const [front, f] = canvas(W, H);
  const fw = front.width;
  const fh = front.height;
  background(f, box, fw, fh);
  publisherBand(f, entry, fw, 0, 44);
  // a sunburst behind the title
  f.save();
  f.translate(fw / 2, 190);
  f.globalAlpha = 0.18;
  f.fillStyle = box.accent;
  for (let a = 0; a < 24; a++) {
    f.rotate((Math.PI * 2) / 24);
    f.beginPath();
    f.moveTo(0, 0);
    f.lineTo(-30, -900);
    f.lineTo(30, -900);
    f.fill();
  }
  f.restore();
  // "Main: Subtitle" — a big name with its subtitle under it
  const [mainTitle, subTitle] = title.includes(':') ? [title.slice(0, title.indexOf(':')), title.slice(title.indexOf(':') + 1).trim()] : [title, ''];
  titleText(f, box, mainTitle.toUpperCase(), fw / 2, subTitle ? 170 : 190, fw - 60, 120);
  let tagY = 248;
  if (subTitle) {
    f.textAlign = 'center';
    f.font = SANS(fit(f, subTitle.toUpperCase(), (px) => SANS(px, 900), fw - 100, 40), 900);
    f.lineWidth = 6;
    f.strokeStyle = '#000';
    f.strokeText(subTitle.toUpperCase(), fw / 2, 218);
    f.fillStyle = shade(box.accent, 0.35);
    f.fillText(subTitle.toUpperCase(), fw / 2, 218);
    tagY = 262;
  }
  f.fillStyle = box.ink;
  f.font = SANS(24, 700);
  f.textAlign = 'center';
  wrap(f, box.tagline, fw / 2, tagY, fw - 80, 28);
  f.textAlign = 'left';
  const shotH = framedShot(f, shots[0], 50, 316, fw - 100, -0.02);
  let bx = 40;
  const by = 316 + shotH + 36;
  bx += badge(f, 'VGA 256 COLORS', bx, by, '#0b0b0b', '#fff') + 10;
  badge(f, sb ? 'SOUND BLASTER' : 'PC SPEAKER SOUND', bx, by, sb ? '#c62828' : '#2e7d32', '#fff');
  // the shareware sash
  f.save();
  f.translate(fw - 62, fh - 62);
  f.rotate(-Math.PI / 4);
  f.fillStyle = '#d81e1e';
  f.fillRect(-140, -18, 280, 36);
  f.fillStyle = '#fff';
  f.font = SANS(18, 900);
  f.textAlign = 'center';
  f.fillText('SHAREWARE', 0, 7);
  f.restore();
  f.fillStyle = box.ink;
  f.font = SANS(17, 700);
  f.fillText('For IBM PC/AT & compatibles · 3½" HD disk', 40, fh - 28);

  // ---- back
  const [back, b] = canvas(W, H);
  background(b, box, back.width, back.height);
  publisherBand(b, entry, back.width, 0, 34);
  titleText(b, box, title.toUpperCase(), back.width / 2, 100, back.width - 60, 52);
  b.fillStyle = box.ink;
  b.font = BODY_FONT(19);
  let y = wrap(b, box.back, 40, 150, back.width - 80, 24);
  b.font = SANS(17, 700);
  for (const feat of box.features.slice(0, 7)) {
    b.fillStyle = box.accent;
    b.fillText('★', 40, y);
    b.fillStyle = box.ink;
    y = wrap(b, feat, 66, y, back.width - 110, 21) - 6;
  }
  y += 10;
  const smallW = (back.width - 100) / 2;
  const h1 = framedShot(b, shots[1] ?? shots[0], 40, y, smallW, 0.02);
  framedShot(b, shots[2] ?? shots[0], 60 + smallW, y + 8, smallW, -0.03);
  y += h1 + 30;
  // system requirements
  b.fillStyle = 'rgba(0,0,0,0.45)';
  b.fillRect(40, y, back.width - 260, 118);
  b.fillStyle = '#fff';
  b.font = SANS(15, 900);
  b.fillText('SYSTEM REQUIREMENTS', 52, y + 22);
  b.font = SANS(14, 400);
  wrap(b, `IBM PC/AT or compatible, 286 or better · 640K RAM · VGA · hard disk · ${sb ? 'Sound Blaster or compatible (PC speaker also supported)' : 'PC speaker sound'} · joystick optional`, 52, y + 44, back.width - 290, 18);
  barcode(b, back.width - 200, y, 160, 70, entry.id);
  b.fillStyle = box.ink;
  b.font = SANS(14, 700);
  if (box.rating) b.fillText(box.rating, back.width - 200, y + 96);
  b.font = SANS(12, 400);
  b.fillText(`© ${entry.year ?? 1995} ${entry.company ?? 'Sandbox Software'}. Made with Game-Maker by Recreational Software Designs.`, 40, back.height - 22);

  // ---- spines (title runs along them) and ends
  const spine = (label: string, sub: string): string => {
    const [c, s] = canvas(D, H);
    background(s, box, c.width, c.height);
    s.fillStyle = '#0b0b0b';
    s.fillRect(0, 0, c.width, 70);
    s.fillStyle = '#f5d000';
    s.font = SANS(15, 900);
    s.textAlign = 'center';
    s.fillText('SANDBOX', c.width / 2, 32);
    s.fillText('SOFTWARE', c.width / 2, 52);
    s.save();
    s.translate(c.width / 2, c.height / 2 + 30);
    s.rotate(Math.PI / 2);
    const px = fit(s, label, TITLE_FONT, c.height - 220, 60);
    s.font = TITLE_FONT(px);
    s.fillStyle = box.accent;
    s.strokeStyle = '#000';
    s.lineWidth = px * 0.12;
    s.strokeText(label, 0, px * 0.35);
    s.fillText(label, 0, px * 0.35);
    s.restore();
    s.fillStyle = box.ink;
    s.font = SANS(13, 700);
    s.fillText(sub, c.width / 2, c.height - 24);
    return c.toDataURL();
  };
  const end = (lines: string[]): string => {
    const [c, s] = canvas(W, D);
    background(s, box, c.width, c.height);
    s.textAlign = 'center';
    const px = fit(s, lines[0], TITLE_FONT, c.width - 40, 54);
    s.font = TITLE_FONT(px);
    s.fillStyle = box.accent;
    s.fillText(lines[0], c.width / 2, c.height / 2 + px * 0.2);
    s.fillStyle = box.ink;
    s.font = SANS(14, 700);
    if (lines[1]) s.fillText(lines[1], c.width / 2, c.height - 16);
    return c.toDataURL();
  };
  return {
    front: front.toDataURL(),
    back: back.toDataURL(),
    left: spine(title.toUpperCase(), entry.price ? `REG. ${entry.price}` : 'SHAREWARE'),
    right: spine(title.toUpperCase(), sb ? 'SOUND BLASTER' : 'PC SPEAKER'),
    top: end([title.toUpperCase(), (entry.company ?? 'Sandbox Software').toUpperCase()]),
    bottom: end([title.toUpperCase(), `VGA · ${sb ? 'SOUND BLASTER' : 'PC SPEAKER'} · SHAREWARE`]),
  };
}

/** The box as six faces, sized by the --u custom property (pixels per inch). */
export function boxModel(faces: BoxFaces): HTMLElement {
  const face = (name: keyof BoxFaces) => h('div', { class: `bface ${name}` }, h('img', { src: faces[name], alt: '', draggable: false }));
  return h('div', { class: 'box3d' }, face('front'), face('back'), face('left'), face('right'), face('top'), face('bottom'));
}

export interface BoxViewerActions {
  manual?: () => void;
  insert?: () => void;
  /** What the insert button says (the disk by default). */
  insertLabel?: string;
  /** Things that came in the box, shown beside it. */
  extras?: HTMLElement;
}

/** Brings a box to the middle of the screen to turn, zoom and read. */
export function openBoxViewer(entry: Pick<CatalogEntry, 'title'>, faces: BoxFaces, actions: BoxViewerActions): Promise<void> {
  return new Promise((resolve) => {
    const model = boxModel(faces);
    const stage = h('div', { class: 'box-stage' }, model);
    let rx = -12;
    let ry = 32;
    let zoom = 1;
    let px = 0;
    let py = 0;
    let auto = true;
    let raf = 0;
    const apply = () => {
      model.style.transform = `translate(${px}px, ${py}px) scale(${zoom}) rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const spin = () => {
      if (auto) {
        ry += 0.25;
        apply();
      }
      raf = requestAnimationFrame(spin);
    };
    const close = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      overlay.remove();
      resolve();
    };
    const onKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation();
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') ry -= 15;
      else if (e.key === 'ArrowRight') ry += 15;
      else if (e.key === 'ArrowUp') rx += 10;
      else if (e.key === 'ArrowDown') rx -= 10;
      else if (e.key === '+' || e.key === '=') zoom = Math.min(4, zoom * 1.2);
      else if (e.key === '-') zoom = Math.max(0.4, zoom / 1.2);
      else return;
      auto = false;
      apply();
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey, true);

    // drag to turn; shift-drag or a second finger to pan; wheel or pinch to zoom
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    stage.addEventListener('pointerdown', (e) => {
      e.preventDefault(); // turn the box, don't drag its picture away
      stage.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      auto = false;
    });
    stage.addEventListener('pointermove', (e) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) zoom = Math.max(0.4, Math.min(4, zoom * (dist / pinch)));
        pinch = dist;
        px += dx / 2;
        py += dy / 2;
      } else if (e.shiftKey || e.buttons === 4 || zoom > 1.6) {
        px += dx;
        py += dy;
      } else {
        ry += dx * 0.4;
        rx = Math.max(-80, Math.min(80, rx - dy * 0.4));
      }
      apply();
    });
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = 0;
    };
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    stage.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        auto = false;
        zoom = Math.max(0.4, Math.min(4, zoom * Math.exp(-e.deltaY / 400)));
        apply();
      },
      { passive: false },
    );
    stage.addEventListener('dblclick', () => {
      rx = -12;
      ry = 32;
      zoom = 1;
      px = py = 0;
      auto = true;
      apply();
    });

    const overlay = h(
      'div',
      { class: 'box-viewer', role: 'dialog', 'aria-label': `${entry.title} box` },
      stage,
      actions.extras ?? null,
      h(
        'div',
        { class: 'box-viewer-bar' },
        h('strong', null, entry.title),
        h('span', { class: 'hint' }, 'Drag to turn · scroll to zoom · shift-drag to pan · double-click to reset'),
        actions.insert ? h('button', { class: 'primary', onclick: () => (close(), actions.insert!()) }, actions.insertLabel ?? 'Put the disk in drive A:') : null,
        actions.manual ? h('button', { onclick: () => (close(), actions.manual!()) }, 'Read the manual') : null,
        h('button', { onclick: close }, 'Close (Esc)'),
      ),
    );
    document.body.append(overlay);
    apply();
    raf = requestAnimationFrame(spin);
  });
}
