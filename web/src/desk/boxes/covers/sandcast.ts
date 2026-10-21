// Sandcastle Knight's cover: the Fourth of July, fireworks over the backyard, and Teddy the
// corgi knight (tin helmet, red plume) guarding his sandbox castle, its tower flying a
// thirteen-star flag, while Gwin eyes his tennis ball.
import { dog, GWIN, TEDDY } from './dog';
import { type Ctx, blob, ell, fill, finish, glow, lin, poly, rad, seeded, stars, stroke } from './paint';

/** A firework burst. */
function burst(c: Ctx, r: () => number, x: number, y: number, rr: number, color: string): void {
  glow(c, x, y, rr * 1.4, color, 0.45);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2 + r() * 0.1;
    const l = rr * (0.75 + r() * 0.3);
    const ex = x + Math.cos(a) * l;
    const ey = y + Math.sin(a) * l + l * 0.08;
    stroke(c, lin(c, x, y, ex, ey, [
      [0, 'rgba(0,0,0,0)'],
      [1, color],
    ]), 2.5, [x + Math.cos(a) * l * 0.2, y + Math.sin(a) * l * 0.2, ex, ey]);
    fill(c, '#fff', () => c.arc(ex, ey, 2.2, 0, Math.PI * 2));
  }
  c.restore();
}

/** The 1777 flag: thirteen stripes and a ring of thirteen stars. */
function flag(c: Ctx, x: number, y: number, fw: number): void {
  const fh = fw * 0.62;
  stroke(c, '#e8e0d0', 3, [x, y + fh + 40, x, y - 4]);
  c.save();
  c.translate(x + 1, y);
  c.transform(1, 0.08, 0, 1, 0, 0); // a little ripple
  for (let i = 0; i < 13; i++) {
    c.fillStyle = i % 2 ? '#fff' : '#c8102e';
    c.fillRect(0, (i * fh) / 13, fw, fh / 13 + 0.5);
  }
  c.fillStyle = '#0a3161';
  c.fillRect(0, 0, fw * 0.42, fh * (7 / 13));
  c.fillStyle = '#fff';
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI * 2;
    c.fillRect(fw * 0.21 + Math.cos(a) * fh * 0.17 - 1, fh * 0.27 + Math.sin(a) * fh * 0.17 - 1, 2, 2);
  }
  c.restore();
}

/** A sand tower with crenellations. */
function tower(c: Ctx, x: number, y: number, tw: number, th: number): void {
  poly(c, [x - tw / 2, y, x - tw / 2 + 4, y - th, x + tw / 2 - 4, y - th, x + tw / 2, y]);
  fill(c, lin(c, x - tw / 2, 0, x + tw / 2, 0, [
    [0, '#8a5a2a'],
    [0.35, '#f2c886'],
    [1, '#9a6a34'],
  ]));
  const n = 4;
  for (let i = 0; i < n; i++) {
    const bx = x - tw / 2 + 4 + (i * (tw - 8)) / (n - 0.5);
    poly(c, [bx, y - th, bx, y - th - 12, bx + tw / (n * 2), y - th - 12, bx + tw / (n * 2), y - th]);
    fill(c, '#e0b070');
  }
  blob(c, [x - 6, y - th * 0.5, x + 6, y - th * 0.5, x + 6, y - th * 0.3, x - 6, y - th * 0.3]);
  fill(c, '#3a2410');
}

const paint = (c: Ctx, w: number, h: number): void => {
  const r = seeded('sandcast-cover');
  c.fillStyle = lin(c, 0, 0, 0, 380, [
    [0, '#060c28'],
    [0.6, '#1c2a6a'],
    [0.85, '#a04a5a'],
    [1, '#ffa060'],
  ]);
  c.fillRect(0, 0, w, 380);
  stars(c, w, 260, 60, 'sandcast');
  burst(c, r, 120, 120, 80, '#ff4050');
  burst(c, r, 470, 90, 96, '#80b0ff');
  burst(c, r, 320, 210, 60, '#fff4c0');
  burst(c, r, 560, 230, 46, '#ff4050');
  // the back fence and the trees
  blob(c, [-30, 360, 60, 270, 160, 300, 260, 250, 380, 290, 480, 240, 640, 300, 640, 380, -30, 380]);
  fill(c, '#0c1a20');
  for (let i = 0; i < 16; i++) {
    const px = i * 40;
    poly(c, [px, 380, px, 318, px + 17, 306, px + 34, 318, px + 34, 380]);
    fill(c, lin(c, 0, 306, 0, 380, [
      [0, '#6a5a6a'],
      [1, '#2a2430'],
    ]));
  }
  // the lawn and the sandbox
  c.fillStyle = lin(c, 0, 370, 0, h, [
    [0, '#1a3a1a'],
    [1, '#2e6a24'],
  ]);
  c.fillRect(0, 370, w, h - 370);
  poly(c, [10, 420, 590, 420, 640, h, -40, h]);
  fill(c, '#7a4a20');
  poly(c, [26, 432, 574, 432, 620, h, -20, h]);
  fill(c, lin(c, 0, 432, 0, h, [
    [0, '#c8945a'],
    [1, '#f0c888'],
  ]));
  // the castle
  const base = 470;
  poly(c, [190, base, 200, 380, 420, 380, 430, base]);
  fill(c, lin(c, 190, 0, 430, 0, [
    [0, '#8a5a2a'],
    [0.4, '#eec080'],
    [1, '#8a5a2a'],
  ]));
  blob(c, [282, base, 282, 420, 310, 404, 338, 420, 338, base]);
  fill(c, '#3a2410');
  tower(c, 200, base, 56, 120);
  tower(c, 420, base, 56, 120);
  tower(c, 310, 386, 64, 110);
  flag(c, 310, 230, 54);
  glow(c, 310, 300, 140, '#ffc070', 0.25);
  // Teddy's tennis ball
  ell(c, 120, 600, 15, 15);
  fill(c, rad(c, 114, 594, 18, [
    [0, '#f8ffb0'],
    [1, '#a8c020'],
  ]));
  stroke(c, '#fff', 2, [108, 592, 118, 600, 130, 606]);
  // Gwin peeking from the fence corner, Teddy the knight front and center
  dog(c, 70, 470, 0.62, GWIN);
  dog(c, 250, 630, 1.3, { ...TEDDY, helmet: true });
  // his toy shovel, planted like a sword
  stroke(c, '#d81e1e', 9, [490, 640, 520, 470]);
  poly(c, [508, 476, 534, 470, 548, 420, 522, 404, 500, 444]);
  fill(c, lin(c, 500, 0, 548, 0, [
    [0, '#c81818'],
    [0.5, '#ff6a50'],
    [1, '#901010'],
  ]));
  finish(c, w, h, 'sandcast', 0.5);
};
export default paint;
