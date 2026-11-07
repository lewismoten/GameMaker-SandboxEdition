// THE MOUNTAIN MOVED NEXT DOOR's two cartoons, drawn in code frame by frame (kit/reel.ts):
//   intro    Thanksgiving night: warm windows along the street, and the mountain tiptoes in, eyes shut, step by
//            step, and sits down in the empty lot. Then dawn, and fog fills the lot.
//   ending   moonlight: the mountain follows its little cloud home, saying excuse me to every house; then
//            sunrise: it sits down in its hollow, the picnic on top, the new doormat at its foot.
import { Reel } from '@lewismoten/gamemaker-sandbox-tools/kit/reel';
import { centered } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { scene } from '../../kit/starter/screens';
import { wisp } from './art/folk';
import { lookOf } from './palette';
import { bigMountain, street } from './pictures';

/** FLI speed in 1/70 s: 5 is 14 frames a second. */
export const REEL_SPEED = 5;

function banner(p: Pixels, pal: Pal, s: string): void {
  bevel(p, 40, 10, 240, 22, pal.r('parch'), 3, 2);
  p.rect(44, 14, 232, 14, pal.c('parch', 4));
  centered(p, 18, s, pal.c('ink', 0));
}

/** Stars over a night sky (only where the sky is). */
function stars(p: Pixels, pal: Pal, seed: number): void {
  const sky = new Set(pal.r('sky'));
  for (let i = 0; i < 40; i++) {
    const x = (i * 73 + seed * 31) % 320;
    const y = 36 + ((i * 41 + seed * 7) % 70);
    if (sky.has(p.get(x, y))) p.set(x, y, pal.c('white', i % 3 ? 2 : 3));
  }
}

/** Fog: dotted white over the lower part of the picture, `thick` 0..1. */
function fog(p: Pixels, pal: Pal, thick: number, x0: number, x1: number): void {
  const f = pal.r('fog');
  for (let y = 60; y < 170; y++)
    for (let x = x0; x < x1; x++) {
      const n = (Math.sin(x * 0.07 + y * 0.11) + Math.sin(x * 0.023 - y * 0.05)) * 0.25 + 0.5;
      if (n < thick && (x + y) % 2 === 0) p.set(x, y, f[n < thick * 0.5 ? 3 : 2]);
    }
}

export function introReel(pal: Pal, book: Book, tess: Pixels): Reel {
  const reel = new Reel(pal.pal);
  const night = lookOf(pal, 'night');
  const dawn = lookOf(pal, 'dawn');
  const bg = scene(pal, book, 170, 22);
  street(bg, pal, 170, 2, 120);
  street(bg, pal, 170, 280, 330);
  stars(bg, pal, 3);
  // 1. Thanksgiving night: the empty lot
  const lot = new Pixels(320, 200);
  lot.px.set(bg.px);
  banner(lot, pal, 'THANKSGIVING NIGHT');
  reel.fadeIn(lot, 6, night);
  reel.add(lot, 10, 1, night);
  // 2. the mountain tiptoes in from the right, eyes shut, a hop at every step
  for (let i = 0; i <= 18; i++) {
    const cx = 420 - i * 11;
    const hop = i % 3 === 1 ? 6 : 0;
    reel.frame(
      bg,
      (p) => {
        bigMountain(p, pal, { cx, ground: 170 - hop, half: 92, height: 104, eyes: 'shut', gates: i > 6, cloud: false });
        banner(p, pal, i < 9 ? 'TIPTOE... TIPTOE...' : 'EXCUSE ME... PARDON ME...');
      },
      i === 18 ? 8 : 2,
      1,
      night,
    );
  }
  // 3. it settles in the lot and sleeps; 4. dawn, and fog fills the lot
  const sat = new Pixels(320, 200);
  sat.px.set(bg.px);
  bigMountain(sat, pal, { cx: 222, ground: 170, half: 92, height: 104, eyes: 'shut', gates: true, cloud: false });
  for (let i = 0; i <= 8; i++) reel.frame(sat, (p) => banner(p, pal, 'ZZZ...'), 2, 1 - i / 10, night);
  for (let i = 0; i <= 10; i++) reel.frame(sat, (p) => (fog(p, pal, i / 10, 120, 330), banner(p, pal, 'THE NEXT MORNING')), 2, 1, dawn);
  reel.frame(
    sat,
    (p) => {
      fog(p, pal, 1, 120, 330);
      banner(p, pal, 'THE NEXT MORNING');
      scaleBlit(p, tess, 70, 90, 2);
    },
    14,
    1,
    dawn,
  );
  reel.fadeOut(6);
  return reel;
}

export function endingReel(pal: Pal, book: Book, cheer: Pixels): Reel {
  const reel = new Reel(pal.pal);
  const night = lookOf(pal, 'night');
  const sunrise = lookOf(pal, 'sunrise');
  const bg = scene(pal, book, 170, 23);
  stars(bg, pal, 5);
  street(bg, pal, 170, 2, 140);
  const cloud = wisp(pal, 0, 'happy');
  // 1. moonlight: the mountain follows Wisp out of town, step by enormous step
  for (let i = 0; i <= 20; i++) {
    const cx = 230 + i * 9;
    const hop = i % 3 === 1 ? 8 : 0;
    reel.frame(
      bg,
      (p) => {
        bigMountain(p, pal, { cx, ground: 170 - hop, half: 90, height: 100, eyes: 'open', gates: false, cloud: false });
        scaleBlit(p, cloud, Math.min(300, cx + 60), 52, 2);
        banner(p, pal, i < 10 ? 'STEP BY ENORMOUS STEP' : 'EXCUSE ME! SORRY! GOOD NIGHT!');
      },
      i === 20 ? 8 : 2,
      1,
      night,
    );
  }
  reel.fadeOut(6);
  // 2. sunrise: home in its hollow, sitting down, the picnic on top and the doormat at its foot
  const home = scene(pal, book, 170, 24);
  bigMountain(home, pal, { cx: 160, ground: 176, half: 120, height: 92, eyes: 'open', gates: false, cloud: true });
  const { c } = pal;
  // the picnic blanket on the summit
  for (let x = 128; x < 192; x++) for (let y = 80; y < 88; y++) home.set(x, y, (Math.floor(x / 6) + Math.floor(y / 4)) % 2 ? c('red', 2) : c('white', 3));
  // the doormat and its sign
  home.rect(118, 172, 84, 8, c('wood', 3)).frame(118, 172, 84, 8, c('ink', 0));
  bevel(home, 72, 146, 176, 20, pal.r('parch'), 3, 2);
  centered(home, 152, 'PLEASE WIPE YOUR FOOTHILLS', c('ink', 0));
  for (let i = 0; i <= 6; i++) reel.frame(home, () => undefined, 2, i / 6, sunrise);
  for (let i = 0; i < 12; i++) reel.frame(home, (p) => scaleBlit(p, cheer, 24, 100 - (i % 4 < 2 ? 6 : 0), 2), 2, 1, sunrise);
  reel.frame(home, (p) => (scaleBlit(p, cheer, 24, 100, 2), banner(p, pal, 'HOME AGAIN!')), 16, 1, sunrise);
  return reel;
}
