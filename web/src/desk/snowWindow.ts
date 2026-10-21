// A window on the wall where it is snowing outside, as it was in the winter of 1992:
// a sky as light or dark as it is outside the visitor's own window right now (the moon and
// stars come out after dark), hills and pines, the neighbors' roofs, and flakes drifting
// down past the panes. Curtains hang either side of it.
import './snowWindow.css';
import { h } from '../editor/ui';
import { daylight } from './daylight';

type RGB = [number, number, number];
const mix = (night: RGB, day: RGB, t: number) => `rgb(${night.map((n, i) => Math.round(n + (day[i] - n) * t)).join(',')})`;

interface Flake {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
}

// a 36" x 48" window, upright like a real double-hung one
const W = 320;
const H = 427;
const GROUND = H - 230; // the hills and houses are drawn for a 230-pixel-high view

export function snowyWindow(): HTMLElement {
  const canvas = h('canvas', { width: W, height: H, 'aria-hidden': 'true' });
  const el = h(
    'div',
    { class: 'snow-window', role: 'img' },
    h('div', { class: 'sw-rod', 'aria-hidden': 'true' }),
    h('div', { class: 'sw-frame' }, canvas, h('div', { class: 'sw-bars', 'aria-hidden': 'true' })),
    h('div', { class: 'sill' }),
    h('div', { class: 'sw-curtain left', 'aria-hidden': 'true' }),
    h('div', { class: 'sw-curtain right', 'aria-hidden': 'true' }),
  );
  const ctx = canvas.getContext('2d')!;
  const rnd = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  const stars = Array.from({ length: 60 }, (_, i) => [rnd(i) * W, rnd(i + 99) * H * 0.6, rnd(i + 7) < 0.2 ? 1.4 : 0.8]);
  const flakes: Flake[] = Array.from({ length: 180 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.6 + Math.random() * 1.9,
    speed: 0.25 + Math.random() * 0.6,
    drift: Math.random() * Math.PI * 2,
  }));

  const pine = (x: number, base: number, size: number, color: string, snow: string) => {
    ctx.fillStyle = color;
    for (let i = 0; i < 3; i++) {
      const y = base - size * (0.35 + i * 0.3);
      const w = size * (0.42 - i * 0.1);
      ctx.beginPath();
      ctx.moveTo(x - w, y + size * 0.3);
      ctx.lineTo(x, y - size * 0.12);
      ctx.lineTo(x + w, y + size * 0.3);
      ctx.fill();
    }
    ctx.fillStyle = snow;
    ctx.beginPath();
    ctx.moveTo(x - size * 0.08, base - size * 0.95);
    ctx.lineTo(x, base - size * 1.08);
    ctx.lineTo(x + size * 0.08, base - size * 0.95);
    ctx.fill();
  };

  const house = (x: number, base: number, w: number, hgt: number, lit: boolean) => {
    const d = light;
    ctx.fillStyle = mix([46, 38, 52], [128, 98, 92], d);
    ctx.fillRect(x, base - hgt, w, hgt);
    // chimney, then the snowy roof
    ctx.fillStyle = mix([40, 32, 40], [110, 80, 70], d);
    ctx.fillRect(x + w * 0.7, base - hgt - w * 0.42, w * 0.1, w * 0.3);
    ctx.fillStyle = mix([176, 186, 206], [250, 252, 255], d);
    ctx.beginPath();
    ctx.moveTo(x - 7, base - hgt + 2);
    ctx.lineTo(x + w / 2, base - hgt - w * 0.42);
    ctx.lineTo(x + w + 7, base - hgt + 2);
    ctx.fill();
    ctx.fillStyle = lit ? '#ffd77a' : mix([60, 60, 72], [92, 104, 124], d);
    ctx.fillRect(x + w * 0.2, base - hgt * 0.62, w * 0.18, w * 0.18);
    ctx.fillRect(x + w * 0.6, base - hgt * 0.62, w * 0.18, w * 0.18);
    ctx.fillStyle = mix([30, 24, 30], [86, 62, 52], d);
    ctx.fillRect(x + w * 0.42, base - hgt * 0.45, w * 0.14, hgt * 0.45);
  };

  const scenery = () => {
    const d = light;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, mix([10, 14, 34], [140, 166, 196], d));
    sky.addColorStop(0.7, mix([44, 52, 84], [214, 222, 234], d));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // the moon and the stars after dark
    if (d < 0.5) {
      ctx.globalAlpha = 1 - d * 2;
      ctx.fillStyle = '#fff';
      for (const [x, y, r] of stars) ctx.fillRect(x, y, r, r);
      // a crescent: the full moon with its shadowed side cut away, so the sky shows there
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.arc(257, 145, 13, 0, Math.PI * 2);
      ctx.clip('evenodd');
      ctx.fillStyle = '#f4f0dc';
      ctx.beginPath();
      ctx.arc(250, 150, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    // far hills, then pines along them
    ctx.save();
    ctx.translate(0, GROUND);
    ctx.fillStyle = mix([70, 80, 110], [200, 210, 226], d);
    ctx.beginPath();
    ctx.moveTo(0, 150);
    ctx.quadraticCurveTo(80, 112, 170, 140);
    ctx.quadraticCurveTo(250, 118, W, 136);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();
    const tree = mix([22, 34, 40], [70, 96, 92], d);
    const treeSnow = mix([150, 160, 182], [244, 247, 252], d);
    for (const [x, s] of [
      [24, 34],
      [44, 26],
      [210, 30],
      [232, 40],
      [300, 28],
    ])
      pine(x, 160, s, tree, treeSnow);
    const lit = d < 0.6;
    house(66, 186, 64, 36, lit);
    house(160, 192, 82, 40, lit && light < 0.4);
    // drifts on the ground
    ctx.fillStyle = mix([150, 160, 186], [244, 247, 252], d);
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, 190);
    ctx.quadraticCurveTo(80, 176, 160, 194);
    ctx.quadraticCurveTo(240, 180, W, 192);
    ctx.lineTo(W, H);
    ctx.fill();
    ctx.restore();
  };

  let light = daylight();
  const label = () => el.setAttribute('aria-label', `A window: snow is falling outside, ${light > 0.5 ? 'in daylight' : light > 0 ? 'at dusk' : 'at night'}`);
  label();
  let t = 0;
  const draw = (move: boolean) => {
    scenery();
    ctx.fillStyle = '#fff';
    for (const f of flakes) {
      if (move) {
        f.y += f.speed;
        f.x += Math.sin((t + f.drift * 40) / 40) * 0.3;
        if (f.y > H) {
          f.y = -2;
          f.x = Math.random() * W;
        }
      }
      ctx.globalAlpha = 0.6 + f.r / 5;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  const frame = () => {
    if (!el.isConnected) return;
    t += 1;
    if (t % 600 === 0) {
      light = daylight();
      label();
    }
    draw(true);
    requestAnimationFrame(frame);
  };
  // the light outside also brightens the wall beside the window (deskStage.css)
  const shine = () => el.closest<HTMLElement>('.desk')?.style.setProperty('--window-light', (0.04 + light * 0.16).toFixed(3));
  // Start once the window is on the page; stop when the desk goes away. Without motion the
  // snow hangs still in the air.
  requestAnimationFrame(() => {
    shine();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) draw(false);
    else requestAnimationFrame(frame);
  });
  return el;
}
