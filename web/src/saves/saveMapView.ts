// The level of a saved game in the "Saves & scores" panel: the whole map (saveData saveMap), to
// look around by dragging or with Shift+arrows, zoom, and move the hero by dragging him (or
// clicking a spot, or the arrow keys). A dashed frame shows the screen F6 opens on. The map wraps
// around at its edges, as the game's does.
import { h } from '../editor/core/ui';
import type { SaveMap } from '../project/saveData';

const BLEN = 20;
/** The screen the game shows while playing (CropScreen): 312 x 196. */
const SCREEN_W = 312;
const SCREEN_H = 196;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 6;

/** Where the view looks (the map pixel at its center) and how big a map pixel is (CSS pixels). */
export interface Camera {
  cx: number;
  cy: number;
  zoom: number;
}

export interface MapViewOptions {
  map: SaveMap;
  /** The accessible name ("Teddy in Level 2 at block 6, 39"), kept up to date by setHero's caller. */
  label: string;
  /** The id of the text that tells how to use it (aria-describedby). */
  describedBy?: string;
  camera?: Camera;
  onCamera?(c: Camera): void;
  /** Puts the hero's feet on block (x, y); returns why he can't go there, or undefined when he went. */
  onMove(x: number, y: number): string | undefined;
}

export interface MapView {
  el: HTMLElement;
  /** The hero (and the screen F6 opens on) after he moved. */
  setHero(hero: { x: number; y: number }, view: { x: number; y: number }, label: string): void;
  focus(): void;
}

const wrap = (v: number, n: number) => ((v % n) + n) % n;
const v8 = (n: number) => (n << 2) | (n >> 4);

function toCanvas(pixels: Uint8Array, width: number, height: number, palette: Uint8Array, seeThrough = false): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(width, height);
  const out = new Uint32Array(img.data.buffer);
  const lut = new Uint32Array(256);
  for (let i = 0; i < 256; i++) lut[i] = 0xff000000 | (v8(palette[i * 3 + 2]) << 16) | (v8(palette[i * 3 + 1]) << 8) | v8(palette[i * 3]);
  // a sprite's 255 is see-through
  if (seeThrough) lut[255] = 0;
  for (let i = 0; i < pixels.length; i++) out[i] = lut[pixels[i]];
  ctx.putImageData(img, 0, 0);
  return c;
}

export function saveMapView(o: MapViewOptions): MapView {
  const { map } = o;
  const MW = map.width / BLEN;
  const MH = map.height / BLEN;
  const level = toCanvas(map.pixels, map.width, map.height, map.palette);
  const heroPic = toCanvas(map.heroSprite, BLEN, BLEN * 2, map.palette, true);
  let hero = { ...map.hero };
  let screen = { ...map.view };
  let label = o.label;

  const canvas = h('canvas', {
    class: 'sv-map-canvas',
    tabindex: 0,
    role: 'application',
    'aria-roledescription': 'level map',
    'aria-label': label,
    'aria-describedby': o.describedBy,
  }) as HTMLCanvasElement;
  const hint = h('p', { class: 'sv-map-hint', 'aria-hidden': 'true' });
  const box = h('div', { class: 'sv-map' }, canvas, hint);
  const ctx = canvas.getContext('2d')!;
  let cssW = 0;
  let cssH = 0;
  // the camera: until the box has a size, as asked (or the F6 screen, fitted)
  let cam: Camera | undefined = o.camera ? { ...o.camera } : undefined;
  const fitScreen = (): Camera => ({
    cx: screen.x * BLEN + SCREEN_W / 2,
    cy: screen.y * BLEN + SCREEN_H / 2,
    zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, cssW / SCREEN_W || 1.5)),
  });
  const camera = () => (cam ??= fitScreen());
  const tellCamera = () => o.onCamera?.({ ...camera() });

  /** A drag of the hero in progress: the block his feet would go to. */
  let ghost: { x: number; y: number; fits: boolean } | undefined;
  let mode: 'none' | 'pan' | 'hero' | 'press' = 'none';

  const origin = () => {
    const c = camera();
    return { x: c.cx - cssW / 2 / c.zoom, y: c.cy - cssH / 2 / c.zoom, z: c.zoom };
  };
  /** The map pixel under a point of the canvas (unwrapped: may be outside 0..width). */
  const toMap = (clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect();
    const o0 = origin();
    return { x: o0.x + (clientX - r.left) / o0.z, y: o0.y + (clientY - r.top) / o0.z };
  };
  const blockAt = (p: { x: number; y: number }) => ({ x: wrap(Math.floor(p.x / BLEN), MW), y: wrap(Math.floor(p.y / BLEN), MH) });
  const fits = (x: number, y: number) => map.fits[y * MW + x] === 1;

  /** Draws something at map pixel (x, y) in every wrapped copy that shows. */
  const eachCopy = (x: number, y: number, w: number, hgt: number, draw: (sx: number, sy: number) => void) => {
    const o0 = origin();
    const vw = cssW / o0.z;
    const vh = cssH / o0.z;
    const x0 = x + Math.ceil((o0.x - x - w) / map.width) * map.width;
    const y0 = y + Math.ceil((o0.y - y - hgt) / map.height) * map.height;
    for (let ty = y0; ty < o0.y + vh; ty += map.height) for (let tx = x0; tx < o0.x + vw; tx += map.width) draw((tx - o0.x) * o0.z, (ty - o0.y) * o0.z);
  };

  const draw = () => {
    if (!cssW || !cssH) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cssW, cssH);
    const z = camera().zoom;
    // the level, as often as it shows (it wraps)
    // on whole pixels, so the copies meet without a seam
    const snap = (v: number) => Math.round(v * dpr) / dpr;
    eachCopy(0, 0, map.width, map.height, (sx, sy) =>
      ctx.drawImage(level, snap(sx), snap(sy), snap(sx + map.width * z) - snap(sx), snap(sy + map.height * z) - snap(sy)),
    );
    // the screen F6 opens on
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 2;
    eachCopy(screen.x * BLEN, screen.y * BLEN, SCREEN_W, SCREEN_H, (sx, sy) => {
      ctx.strokeStyle = 'rgba(0,0,0,.7)';
      ctx.strokeRect(sx + 1, sy + 1, SCREEN_W * z, SCREEN_H * z);
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.strokeRect(sx, sy, SCREEN_W * z, SCREEN_H * z);
    });
    ctx.restore();
    // the hero, faded while he is being dragged
    const hx = hero.x * BLEN + map.heroOffset.x;
    const hy = hero.y * BLEN + map.heroOffset.y;
    ctx.globalAlpha = ghost ? 0.35 : 1;
    eachCopy(hx, hy, BLEN, BLEN * 2, (sx, sy) => ctx.drawImage(heroPic, sx, sy, BLEN * z, BLEN * 2 * z));
    ctx.globalAlpha = 1;
    if (ghost) {
      const g = ghost;
      eachCopy(g.x * BLEN, (g.y - 1) * BLEN, BLEN, BLEN * 2, (sx, sy) => {
        ctx.globalAlpha = g.fits ? 0.9 : 0.5;
        ctx.drawImage(heroPic, sx, sy, BLEN * z, BLEN * 2 * z);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.strokeRect(sx - 1, sy - 1, BLEN * z + 2, BLEN * 2 * z + 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = g.fits ? '#3ddc84' : '#ff4d4d';
        ctx.strokeRect(sx - 1, sy - 1, BLEN * z + 2, BLEN * 2 * z + 2);
        if (!g.fits) {
          // a cross: he can't stand here
          ctx.beginPath();
          ctx.moveTo(sx + 3, sy + 3);
          ctx.lineTo(sx + BLEN * z - 3, sy + BLEN * 2 * z - 3);
          ctx.moveTo(sx + BLEN * z - 3, sy + 3);
          ctx.lineTo(sx + 3, sy + BLEN * 2 * z - 3);
          ctx.stroke();
        }
      });
    }
  };
  let frame = 0;
  const redraw = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      draw();
    });
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const first = !cssW;
    cssW = r.width;
    cssH = r.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    if (first && !o.camera) cam = fitScreen();
    draw();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  // stop watching once the panel is drawn again without it
  const gone = new MutationObserver(() => {
    if (!canvas.isConnected) (ro.disconnect(), gone.disconnect());
  });
  queueMicrotask(() => box.parentElement && gone.observe(box.closest('dialog') ?? document.body, { childList: true, subtree: true }));

  const setZoom = (z: number, at?: { clientX: number; clientY: number }) => {
    const c = camera();
    const nz = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
    if (at) {
      // keep the map pixel under the pointer where it is
      const p = toMap(at.clientX, at.clientY);
      c.cx = p.x - (p.x - c.cx) * (c.zoom / nz);
      c.cy = p.y - (p.y - c.cy) * (c.zoom / nz);
    }
    c.zoom = nz;
    tellCamera();
    redraw();
  };
  const panBy = (dx: number, dy: number) => {
    const c = camera();
    c.cx = wrap(c.cx + dx, map.width);
    c.cy = wrap(c.cy + dy, map.height);
    tellCamera();
    redraw();
  };
  const centerOnHero = () => {
    const c = camera();
    c.cx = hero.x * BLEN + BLEN / 2;
    c.cy = hero.y * BLEN;
    tellCamera();
    redraw();
  };
  /** Pans just enough to keep the hero in view. */
  const keepHeroInView = () => {
    const c = camera();
    const m = BLEN * 2;
    const halfW = cssW / 2 / c.zoom;
    const halfH = cssH / 2 / c.zoom;
    const near = (v: number, center: number, n: number) => center + ((((v - center + n / 2) % n) + n) % n) - n / 2;
    const x = near(hero.x * BLEN + BLEN / 2, c.cx, map.width);
    const y = near(hero.y * BLEN, c.cy, map.height);
    if (x < c.cx - halfW + m) c.cx = x + halfW - m;
    if (x > c.cx + halfW - m) c.cx = x - halfW + m;
    if (y < c.cy - halfH + m) c.cy = y + halfH - m;
    if (y > c.cy + halfH - m) c.cy = y - halfH + m;
    tellCamera();
  };

  const say = (text: string) => (hint.textContent = text);
  const defaultHint = 'Drag the hero to move him · drag the map to look around';
  say(defaultHint);
  const describe = (g: { x: number; y: number; fits: boolean }) =>
    g.fits ? `Block ${g.x}, ${g.y}: he fits here` : `Block ${g.x}, ${g.y}: solid (his feet or the block above)`;

  const tryMove = (x: number, y: number) => {
    say(o.onMove(x, y) ?? defaultHint);
  };

  // ---- pointer: drag the hero, drag (or middle-drag) to pan, pinch or Ctrl+wheel to zoom, click to place
  const pointers = new Map<number, { x: number; y: number }>();
  let start = { x: 0, y: 0 };
  /** From the pointer to the middle of the hero's feet block, while he is dragged. */
  let grab = { x: 0, y: 0 };
  let pinch: { d: number; z: number } | undefined;
  const onHero = (p: { x: number; y: number }) => {
    const hx = hero.x * BLEN + map.heroOffset.x;
    const hy = hero.y * BLEN + map.heroOffset.y;
    const dx = wrap(p.x - hx, map.width);
    const dy = wrap(p.y - hy, map.height);
    return dx < BLEN && dy < BLEN * 2;
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      // a second finger: pinch to zoom (and stop any drag)
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: camera().zoom };
      ghost = undefined;
      mode = 'pan';
      redraw();
      return;
    }
    start = { x: e.clientX, y: e.clientY };
    const p = toMap(e.clientX, e.clientY);
    if (e.button === 1 || e.shiftKey || e.altKey) mode = 'pan';
    else if (onHero(p)) {
      mode = 'hero';
      const hx = hero.x * BLEN + BLEN / 2;
      const hy = hero.y * BLEN + BLEN / 2;
      grab = { x: wrap(hx - p.x + map.width / 2, map.width) - map.width / 2, y: wrap(hy - p.y + map.height / 2, map.height) - map.height / 2 };
      ghost = { ...hero, fits: fits(hero.x, hero.y) };
      say(describe(ghost));
      redraw();
    } else mode = 'press';
    canvas.classList.toggle('panning', mode === 'pan');
  });
  canvas.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) {
      // hovering: show what a press would do
      const p = toMap(e.clientX, e.clientY);
      canvas.classList.toggle('over-hero', onHero(p));
      return;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const z = camera().zoom;
      const mid = { clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 };
      setZoom((pinch.z * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d, mid);
      // and pan with the fingers' middle
      const dx = (e.clientX - prev.x) / 2;
      const dy = (e.clientY - prev.y) / 2;
      panBy(-dx / z, -dy / z);
      return;
    }
    if (mode === 'press' && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4) {
      mode = 'pan';
      canvas.classList.add('panning');
      say(defaultHint);
    }
    if (mode === 'pan') {
      const z = camera().zoom;
      panBy(-(e.clientX - prev.x) / z, -(e.clientY - prev.y) / z);
    } else if (mode === 'hero') {
      // his feet follow the pointer from where he was picked up
      const p = toMap(e.clientX, e.clientY);
      const b = blockAt({ x: p.x + grab.x, y: p.y + grab.y });
      if (!ghost || ghost.x !== b.x || ghost.y !== b.y) {
        ghost = { ...b, fits: fits(b.x, b.y) };
        say(describe(ghost));
        redraw();
      }
    }
  });
  const end = (e: PointerEvent, cancelled: boolean) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size) return;
    pinch = undefined;
    canvas.classList.remove('panning');
    const was = mode;
    mode = 'none';
    if (cancelled) {
      ghost = undefined;
      say(defaultHint);
      redraw();
      return;
    }
    if (was === 'hero' && ghost) {
      const g = ghost;
      ghost = undefined;
      redraw();
      if (g.x === hero.x && g.y === hero.y) say(defaultHint);
      else tryMove(g.x, g.y);
    } else if (was === 'press') {
      // a click on the map: his feet go there
      const b = blockAt(toMap(e.clientX, e.clientY));
      tryMove(b.x, b.y);
    }
  };
  // the middle button pans here (not the browser's autoscroll)
  canvas.addEventListener('mousedown', (e) => e.button === 1 && e.preventDefault());
  canvas.addEventListener('pointerup', (e) => end(e, false));
  canvas.addEventListener('pointercancel', (e) => end(e, true));
  canvas.addEventListener('lostpointercapture', (e) => end(e, true));
  canvas.addEventListener(
    'wheel',
    (e) => {
      // a pinch on a touchpad comes as Ctrl+wheel; a plain wheel scrolls the panel
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(camera().zoom * Math.exp(-e.deltaY / 200), e);
    },
    { passive: false },
  );

  // ---- keys: arrows move the hero (to the next block he fits in), Shift+arrows pan, C centers, +/- zoom
  canvas.addEventListener('keydown', (e) => {
    const dir: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const d = dir[e.key];
    if (d && e.shiftKey) {
      e.preventDefault();
      const step = (e.ctrlKey || e.metaKey ? 8 : 1) * BLEN;
      panBy(d[0] * step, d[1] * step);
      return;
    }
    if (d && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      for (let n = 1; n < Math.max(MW, MH); n++) {
        const x = wrap(hero.x + d[0] * n, MW);
        const y = wrap(hero.y + d[1] * n, MH);
        if (fits(x, y)) return tryMove(x, y);
      }
      say('There is nowhere he fits that way.');
      return;
    }
    if (e.key === 'c' || e.key === 'C' || e.key === 'Home') {
      e.preventDefault();
      centerOnHero();
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      setZoom(camera().zoom * 1.25);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      setZoom(camera().zoom / 1.25);
    } else if (e.key === '0') {
      e.preventDefault();
      cam = fitScreen();
      tellCamera();
      redraw();
    }
  });

  const tools = h(
    'div',
    { class: 'sv-map-tools', role: 'toolbar', 'aria-label': 'Map view' },
    h('button', { type: 'button', onclick: () => (centerOnHero(), canvas.focus()), title: 'Center on the hero (C)' }, '◎ Center on hero'),
    h(
      'button',
      { type: 'button', onclick: () => ((cam = fitScreen()), tellCamera(), redraw()), title: 'Show the screen the game opens on after F6 (0)' },
      'F6 screen',
    ),
    h('button', { type: 'button', class: 'sv-map-zoom', 'aria-label': 'Zoom out', title: 'Zoom out (−)', onclick: () => setZoom(camera().zoom / 1.25) }, '−'),
    h('button', { type: 'button', class: 'sv-map-zoom', 'aria-label': 'Zoom in', title: 'Zoom in (+)', onclick: () => setZoom(camera().zoom * 1.25) }, '+'),
  );
  box.append(tools);

  return {
    el: box,
    setHero(next, view, nextLabel) {
      hero = { ...next };
      screen = { ...view };
      label = nextLabel;
      canvas.setAttribute('aria-label', label);
      keepHeroInView();
      redraw();
    },
    focus: () => canvas.focus({ preventScroll: true }),
  };
}
