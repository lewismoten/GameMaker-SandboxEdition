// Draws the figures of art course 4 ("Characters that move") into src/artCourses/figures/: a small traveler drawn as
// real indexed 20x20 frames (four facings, a climb view and a four-frame walk cycle), then mirrored, and tested as a silhouette.
// Run from web/: npx vite-node scripts/artCourseFigures4.ts
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { C, save, strip } from './artCourseKit';

type View = 'front' | 'back' | 'right' | 'climb';
const sky = (): Pixels => new Pixels(20, 20, C.sky);

/** One 20x20 frame. `pose` 0..3 is the walk cycle: contact, passing, contact (other foot), passing. */
function traveler(view: View, pose = 0, pocket = false): Pixels {
  const p = sky();
  const stride = [3, 0, -3, 0][pose];
  const swing = [1, 0, -1, 0][pose];
  if (view === 'right') {
    // far arm and leg first (darker), then body, near leg and arm over them
    const leg = (x: number, lift: number, c: number) => p.rect(x, 14, 2, 5 - lift, c).rect(x, 18 - lift, 3, 1, C.ink);
    leg(8 - stride, pose === 1 ? 1 : 0, C.w0);
    p.rect(9 + Math.round(stride * 0.6), 9, 2, 4, C.j0).rect(9 + Math.round(stride * 0.6), 13, 2, 1, C.sk0);
    p.rect(7, 8, 6, 6, C.j1).rect(7, 13, 6, 1, C.j0);
    leg(9 + stride, pose === 3 ? 1 : 0, C.w1);
    p.rect(9 - Math.round(stride * 0.6), 9, 2, 4, C.j2).rect(9 - Math.round(stride * 0.6), 13, 2, 1, C.sk1);
    p.rect(7, 3, 6, 5, C.sk1).rect(11, 5, 1, 1, C.ink).rect(13, 5, 1, 1, C.sk1);
    p.rect(6, 1, 8, 3, C.b1).rect(6, 3, 8, 1, C.b0).rect(11, 3, 4, 1, C.b0);
    p.rect(4, 10, 3, 4, C.r1).rect(4, 10, 3, 1, C.r2);
    return p;
  }
  if (view === 'climb') {
    p.rect(3, 0, 2, 20, C.w1).rect(15, 0, 2, 20, C.w1);
    for (let y = 2; y < 20; y += 5) p.rect(5, y, 10, 1, C.w2);
    const up = pose % 2 === 0;
    p.rect(5, up ? 4 : 8, 2, 6, C.j2).rect(5, up ? 3 : 7, 2, 1, C.sk1);
    p.rect(13, up ? 8 : 4, 2, 6, C.j2).rect(13, up ? 7 : 3, 2, 1, C.sk1);
    p.rect(7, 8, 6, 6, C.j1).rect(7, 13, 6, 1, C.j0);
    p.rect(8, 14, 2, up ? 3 : 5, C.w1).rect(10, 14, 2, up ? 5 : 3, C.w1);
    p.rect(8, up ? 16 : 18, 2, 1, C.ink).rect(10, up ? 18 : 16, 2, 1, C.ink);
    p.rect(7, 3, 6, 5, C.w0).rect(6, 1, 8, 3, C.b1).rect(6, 3, 8, 1, C.b0);
    return p;
  }
  // front and back: legs take turns, arms swing the other way
  p.rect(7, 14, 3, 5 - (swing > 0 ? 1 : 0), C.w1).rect(10, 14, 3, 5 - (swing < 0 ? 1 : 0), C.w1);
  p.rect(7, swing > 0 ? 17 : 18, 3, 1, C.ink).rect(10, swing < 0 ? 17 : 18, 3, 1, C.ink);
  p.rect(5, 8 + swing, 2, 5, C.j2).rect(5, 13 + swing, 2, 1, C.sk1);
  p.rect(13, 8 - swing, 2, 5, C.j2).rect(13, 13 - swing, 2, 1, C.sk1);
  p.rect(6, 8, 8, 6, C.j1).rect(6, 13, 8, 1, C.j0);
  if (view === 'front') {
    p.rect(7, 3, 6, 5, C.sk1).rect(8, 5, 1, 1, C.ink).rect(11, 5, 1, 1, C.ink);
    p.rect(6, 1, 8, 3, C.b1).rect(6, 3, 8, 1, C.b0);
    if (pocket) p.rect(6, 9, 3, 3, C.yel).rect(7, 10, 1, 1, C.j1);
  } else {
    p.rect(7, 3, 6, 5, C.w0).rect(6, 1, 8, 3, C.b1).rect(6, 3, 8, 1, C.b0);
    for (let i = 0; i < 6; i++) p.set(7 + i, 9 + i, C.r1);
    p.rect(12, 12, 3, 3, C.r1).rect(12, 12, 3, 1, C.r2);
  }
  return p;
}

function figFrames(): void {
  // Standing, then the two steps: three frames are enough to walk, and the first is the one the character rests on.
  save('char-frames', strip([traveler('front', 1), traveler('front', 0), traveler('front', 2)], 4), 6);
}

function figDirections(): void {
  save(
    'char-directions',
    strip([traveler('front', 1, true), traveler('back', 1), traveler('right', 1), traveler('right', 1).flipX(), traveler('climb', 0)], 4),
    5,
  );
}

function figWalk(): void {
  save(
    'char-walk',
    strip(
      [0, 1, 2, 3].map((i) => traveler('right', i)),
      4,
    ),
    6,
  );
}

function figMirror(): void {
  const r = traveler('right', 0);
  const front = traveler('front', 1, true);
  save('char-mirror', strip([r, r.flipX(), front, front.flipX()], 6), 5);
}

function figSilhouette(): void {
  // Too busy at 20x20: checker shading everywhere and low contrast against the sky.
  const busy = (f: Pixels): Pixels =>
    f.crop(0, 0, 20, 20).map((x, y) => {
      const c = f.get(x, y);
      if (c === C.sky || c === C.ink) return c;
      return (x + y) % 2 ? C.b2 : [C.sk1, C.w3, C.j2, C.b1][(x * 3 + y) % 4];
    });
  const set = [traveler('front', 1), traveler('back', 1), traveler('right', 0), traveler('right', 0).flipX(), traveler('climb', 0)];
  const out = new Pixels(5 * 24 - 4, 20 * 3 + 12, C.bg);
  set.forEach((f, i) => {
    out.blit(busy(f), i * 24, 0);
    out.blit(f, i * 24, 26);
    out.blit(
      f.crop(0, 0, 20, 20).map((x, y) => (f.get(x, y) === C.sky ? C.sky : C.ink)),
      i * 24,
      52,
    );
  });
  save('char-readable', out, 5);
}

figFrames();
figDirections();
figWalk();
figMirror();
figSilhouette();
