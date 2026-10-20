// A window on the wall where it is snowing outside, as it was in the winter of 1992:
// a sky as light or dark as it is outside the visitor's own window right now, the
// neighbors' roofs, and flakes drifting down past the panes.
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

export function snowyWindow(): HTMLElement {
  const canvas = h('canvas', { width: 220, height: 260, 'aria-hidden': 'true' });
  const el = h('div', { class: 'snow-window', role: 'img', 'aria-label': 'A window: snow is falling outside' }, canvas, h('div', { class: 'sill' }));
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;
  const flakes: Flake[] = Array.from({ length: 90 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.6 + Math.random() * 1.8,
    speed: 0.25 + Math.random() * 0.6,
    drift: Math.random() * Math.PI * 2,
  }));

  const scenery = () => {
    const d = light;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, mix([18, 22, 40], [150, 172, 198], d));
    sky.addColorStop(1, mix([62, 70, 98], [222, 228, 236], d));
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    // the neighbors' houses, roofs white with snow, one window lit
    ctx.fillStyle = mix([42, 36, 52], [120, 104, 112], d);
    ctx.fillRect(18, 170, 70, 60);
    ctx.fillRect(122, 182, 84, 50);
    ctx.fillStyle = mix([170, 180, 200], [250, 252, 255], d);
    ctx.beginPath();
    ctx.moveTo(10, 172);
    ctx.lineTo(53, 140);
    ctx.lineTo(96, 172);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(114, 184);
    ctx.lineTo(164, 150);
    ctx.lineTo(214, 184);
    ctx.fill();
    // a neighbor's window, lit once it gets dark
    ctx.fillStyle = d < 0.6 ? '#ffd77a' : mix([60, 60, 70], [90, 100, 120], d);
    ctx.fillRect(40, 192, 14, 14);
    if (d < 0.6) ctx.fillRect(150, 196, 12, 12);
    // drifts on the ground
    ctx.fillStyle = mix([150, 160, 182], [244, 247, 252], d);
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.quadraticCurveTo(60, 222, 120, 236);
    ctx.quadraticCurveTo(180, 224, W, 238);
    ctx.lineTo(W, H);
    ctx.fill();
  };

  let light = daylight();
  let raf = 0;
  let t = 0;
  const frame = () => {
    if (!el.isConnected) return;
    t += 1;
    if (t % 600 === 0) light = daylight();
    scenery();
    ctx.fillStyle = '#fff';
    for (const f of flakes) {
      f.y += f.speed;
      f.x += Math.sin((t + f.drift * 40) / 40) * 0.3;
      if (f.y > H) {
        f.y = -2;
        f.x = Math.random() * W;
      }
      ctx.globalAlpha = 0.6 + f.r / 5;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  };
  // Start once the window is on the page; stop when the desk goes away.
  requestAnimationFrame(() => (raf = requestAnimationFrame(frame)));
  matchMedia('(prefers-reduced-motion: reduce)').matches && cancelAnimationFrame(raf);
  return el;
}
