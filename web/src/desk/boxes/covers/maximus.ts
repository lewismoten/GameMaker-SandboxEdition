// Maximus: The Hundred Worlds' cover: courier Max's pod streaking past alien worlds, the ten
// gem-colored star-shards flung across the nebula from the dark forge-star at its heart.
import { type Ctx, blob, ell, fill, finish, glow, lin, poly, rad, rays, seeded, stars, stroke } from './paint';

const SHARDS = ['#ff4060', '#ff9a30', '#ffe040', '#60ff80', '#40e0ff', '#4070ff', '#b060ff', '#ff60d0', '#ffffff', '#a0ffe0'];

/** A star-shard: a long crystal, lit from inside. */
function shard(c: Ctx, x: number, y: number, s: number, rot: number, color: string): void {
  glow(c, x, y, s * 3.2, color, 0.55);
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  poly(c, [0, -s * 1.6, s * 0.5, -s * 0.3, s * 0.32, s * 1.2, 0, s * 1.5, -s * 0.36, s * 1.1, -s * 0.5, -s * 0.4]);
  fill(
    c,
    lin(c, -s * 0.5, 0, s * 0.5, 0, [
      [0, color],
      [0.45, '#fff'],
      [0.55, color],
      [1, 'rgba(0,0,0,0.6)'],
    ]),
  );
  poly(c, [0, -s * 1.6, s * 0.1, s * 1.4, -s * 0.12, s * 1.3]);
  fill(c, 'rgba(255,255,255,0.5)');
  c.restore();
}

/** A planet with its day side toward the light at (lx, ly). */
function planet(c: Ctx, x: number, y: number, rr: number, colors: [string, string, string], lx: number, ly: number): void {
  const a = Math.atan2(ly - y, lx - x);
  ell(c, x, y, rr, rr);
  fill(
    c,
    rad(c, x + Math.cos(a) * rr * 0.45, y + Math.sin(a) * rr * 0.45, rr * 1.5, [
      [0, colors[0]],
      [0.45, colors[1]],
      [1, colors[2]],
    ]),
  );
}

/** The courier pod: a stubby capsule with a bubble window, Max at the controls. */
function pod(c: Ctx, x: number, y: number, s: number, rot: number): void {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  // the engine trail
  poly(c, [-60, -16, -330, -4, -330, 4, -60, 16]);
  fill(
    c,
    lin(c, -60, 0, -330, 0, [
      [0, 'rgba(120,230,255,0.9)'],
      [1, 'rgba(60,120,255,0)'],
    ]),
  );
  glow(c, -70, 0, 70, '#80e0ff', 0.9);
  // fins
  for (const sy of [-1, 1]) {
    poly(c, [-40, sy * 20, -84, sy * 64, -64, sy * 66, 0, sy * 26]);
    fill(
      c,
      lin(c, 0, 0, 0, sy * 66, [
        [0, '#f0a020'],
        [1, '#8a4a00'],
      ]),
    );
  }
  blob(c, [-66, -30, 30, -42, 90, -10, 90, 10, 30, 42, -66, 30, -76, 0]);
  fill(
    c,
    lin(c, 0, -42, 0, 42, [
      [0, '#ffffff'],
      [0.35, '#c8d4e8'],
      [1, '#3a4664'],
    ]),
  );
  stroke(c, '#f0a020', 8, [-50, 0, 18, 0]);
  // the parcel emblem: couriers deliver
  poly(c, [-40, 6, -14, 6, -14, 26, -40, 26]);
  fill(c, '#c89050');
  stroke(c, '#6a3a10', 2, [-27, 6, -27, 26]);
  // window, with Max in his courier cap
  ell(c, 42, -6, 26, 22);
  fill(
    c,
    lin(c, 20, -28, 60, 16, [
      [0, '#aef4ff'],
      [1, '#0a3050'],
    ]),
  );
  ell(c, 44, -2, 11, 12);
  fill(c, '#e8b48a');
  poly(c, [30, -8, 58, -8, 62, -2, 30, -2]);
  fill(c, '#f0a020');
  ell(c, 44, -10, 13, 8);
  fill(c, '#1a3a8a');
  ell(c, 34, -18, 6, 12, 0.6);
  fill(c, 'rgba(255,255,255,0.6)');
  c.restore();
}

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('maximus-cover');
  c.fillStyle = lin(c, 0, 0, w * 0.3, h, [
    [0, '#05061a'],
    [0.6, '#120a34'],
    [1, '#04030e'],
  ]);
  c.fillRect(0, 0, w, h);
  // nebula clouds
  for (const [nx, ny, nr, col] of [
    [120, 200, 260, '#6a1a8a'],
    [480, 140, 240, '#0a5a7a'],
    [300, 420, 300, '#3a1060'],
    [540, 560, 220, '#8a2a4a'],
  ] as const)
    glow(c, nx, ny, nr, col, 0.55);
  stars(c, w, h, 220, 'maximus');
  // the dark forge-star, its broken light leaking at the rim
  const cx = 330;
  const cy = 290;
  rays(c, cx, cy, 420, 18, '#ffb040', 0.18);
  glow(c, cx, cy, 170, '#ff8a20', 0.8);
  ell(c, cx, cy, 82, 82);
  fill(
    c,
    rad(c, cx - 20, cy - 20, 90, [
      [0, '#2a1a10'],
      [1, '#050302'],
    ]),
  );
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = '#ffd080';
  c.lineWidth = 3;
  c.beginPath();
  c.arc(cx, cy, 83, -2.6, 0.4);
  c.stroke();
  c.restore();
  // worlds: a green one far off, a ringed giant, and a lava world filling the corner
  planet(c, 90, 330, 34, ['#c8ffb0', '#3a9a4a', '#062010'], cx, cy);
  const ring = (from: number, to: number) => {
    c.save();
    c.translate(520, 380);
    c.rotate(-0.35);
    c.scale(1, 0.26);
    c.lineWidth = 14;
    c.strokeStyle = 'rgba(240,210,160,0.75)';
    c.beginPath();
    c.arc(0, 0, 118, from, to);
    c.stroke();
    c.restore();
  };
  ring(Math.PI, Math.PI * 2);
  planet(c, 520, 380, 70, ['#ffe0b0', '#b07040', '#1a0a04'], cx, cy);
  ring(0, Math.PI);
  planet(c, 120, h + 150, 330, ['#e88a40', '#8a2008', '#140200'], cx, cy);
  // lava cracks across the near world
  for (let i = 0; i < 12; i++) {
    const x0 = r() * 300 - 20;
    const y0 = h - 170 + r() * 160;
    const pts = [x0, y0];
    for (let k = 1; k < 5; k++) pts.push(x0 + k * (14 + r() * 16), y0 + (r() - 0.5) * 24);
    c.save();
    c.globalCompositeOperation = 'lighter';
    stroke(c, 'rgba(255,170,40,0.55)', 3, pts);
    c.restore();
  }
  glow(c, 120, h - 180, 300, '#ff5010', 0.25);
  // the ten shards, flung outward from the heart
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const d = 130 + (i % 3) * 70 + r() * 30;
    const sx = cx + Math.cos(a) * d * 1.25;
    const sy = cy + Math.sin(a) * d;
    if (sy < 60) continue;
    shard(c, sx, sy, 13 + (i % 4) * 4, a + Math.PI / 2, SHARDS[i]);
  }
  shard(c, 404, 470, 22, 0.5, SHARDS[4]);
  pod(c, 300, 520, 1.15, -0.32);
  // an asteroid or two in the foreground
  blob(c, [520, 610, 560, 590, 600, 616, 590, 660, 540, 668]);
  fill(
    c,
    lin(c, 520, 590, 590, 668, [
      [0, '#8a7a90'],
      [1, '#1a1420'],
    ]),
  );
  finish(c, w, h, 'maximus');
};
export default paint;
