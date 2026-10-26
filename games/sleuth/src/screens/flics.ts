// The cartoons (.FLI): the Paragon in the rain, the death scene, the man with the
// umbrella, the curtain, Ada's three theories, the curtain call and the lights going out.
// Slide shows (.LST) string them together with text pages, which is how a flashback is
// told in Game-Maker.
import { encodeFli } from '../../../../web/src/formats/fli';
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { encodeFliFadeOut } from '../../../kit/fadeOut';
import { clipEntries, fliClips } from '../../../kit/fliClips';
import { SANDLOGO } from '../../../kit/sandlogo';
import { dimmed } from '../../../kit/reel';
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, blob, centered, microC, outlined, pool, scaleBlit, shadeAt } from '../art/draw';
import { P, c, ramp as r } from '../art/pal';
import { W, H, actor, dagger, facade, rain, stageView } from './art';
import { symbol } from '../blocks/items';

const fli = (frames: Pixels[], speed: number, palettes?: Uint8Array[]) =>
  encodeFli(
    frames.map((f) => Uint8Array.from(f.px)),
    P.pal,
    { speed, palettes },
  );

/** The palette lit up by a lightning flash. */
function flash(k: number): Uint8Array {
  const p = Uint8Array.from(P.pal);
  for (let i = 0; i < 768; i++) p[i] = Math.min(63, Math.round(p[i] + (63 - p[i]) * k));
  return p;
}

const copy = (p: Pixels) => {
  const q = new Pixels(p.w, p.h);
  q.px.set(p.px);
  return q;
};

/** The title cartoon: rain on the Paragon, the bulbs chasing, a lightning strike; the lights
 * flicker and go out, and the dark street fades to black (the title shows the Paragon lit). */
function introFli(): Uint8Array {
  const frames: Pixels[] = [];
  const pals: Uint8Array[] = [];
  const dark = dimmed(P.pal, 0.3);
  for (let i = 0; i < 64; i++) {
    const p = facade(i, 1);
    rain(p, 100 + i, 200);
    if (i < 30) {
      p.rect(70, 160, 180, 26, c('black', 0)).frame(70, 160, 180, 26, c('gold', 2));
      centered(p, 165, 'PORT ELLERY', c('paper', 5), 1);
      centered(p, 175, 'OCTOBER 31, 1936', c('gold', 4), 1);
    }
    frames.push(p);
    const out = i === 48 || i === 50 || i >= 52;
    pals.push(i === 38 || i === 40 ? flash(0.7) : i === 39 ? flash(0.35) : out ? dark : P.pal);
  }
  return encodeFliFadeOut(
    frames.map((f) => Uint8Array.from(f.px)),
    P.pal,
    { speed: 6, palettes: pals },
  );
}

/** The death scene: Rowena raises the dagger, Count Corvin falls, the curtain comes down. */
function storyFli(): Uint8Array {
  const frames: Pixels[] = [];
  const victor = actor('victor', 70);
  const fallen = actor('victor', 70, 'fall');
  for (let i = 0; i < 64; i++) {
    const curtain = i < 46 ? 0 : Math.min(1, (i - 46) / 14);
    const p = stageView(curtain, 1);
    const lx = Math.min(150, 40 + i * 4);
    if (curtain < 1) {
      if (i < 34) p.blit(victor, 180, 106, CLEAR);
      else p.blit(fallen, 168, 150, CLEAR);
      const raise = i >= 26 && i < 34;
      const lila = actor('lila', 68, raise ? 'raise' : 'stand');
      p.blit(lila, lx, 108, CLEAR);
      if (raise) dagger(p, lx + 31, 104, true);
      if (i >= 32 && i < 36) pool(p, 190, 130, 30, 20, r('ghost'), 0, 2);
      // re-draw the curtain over the actors
      if (curtain > 0) {
        const q = stageView(curtain, 1);
        const w = Math.round(curtain * 120);
        for (let y = 4; y < 180; y++)
          for (let x = 40; x < 40 + w; x++) {
            p.set(x, y, q.get(x, y));
            p.set(319 - x, y, q.get(319 - x, y));
          }
      }
    }
    if (i >= 58) {
      p.rect(90, 84, 140, 20, c('black', 0));
      centered(p, 90, '9:48 P.M.', c('paper', 5), 1);
    }
    frames.push(p);
  }
  return fli(frames, 6);
}

/** Edgar's memory: a man in evening dress with a dripping umbrella, past the lobby bar. */
function umbrellaManFli(): Uint8Array {
  const frames: Pixels[] = [];
  const base = new Pixels(W, H);
  // the lobby: marble, the auditorium doors, the bar in front
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      base.set(
        x,
        y,
        y < 110 ? shadeAt(r('panel'), 2, 4, ((x % 40) / 40) * 0.6, x, y) : (Math.floor(x / 16) + Math.floor(y / 8)) % 2 ? c('tile', 4) : c('black', 1),
      );
  for (const x of [60, 220]) {
    base.rect(x, 30, 50, 80, c('velvet', 1)).frame(x - 2, 28, 54, 82, c('gold', 3));
    base.rect(x + 24, 30, 2, 80, c('gold', 2));
  }
  base.rect(0, 150, W, 50, c('panel', 1)).rect(0, 150, W, 4, c('gold', 3));
  for (let x = 20; x < W; x += 50) base.rect(x, 128, 6, 22, c('green', 2)).rect(x + 12, 132, 6, 18, c('auburn', 2));
  const man = actor('pike', 76);
  // nobody sees his face: shadow it
  man.map((x, y, col) => (col !== CLEAR && y < 40 ? c('black', (x + y) % 3 === 0 ? 2 : 1) : col));
  for (let i = 0; i < 40; i++) {
    const p = copy(base);
    const x = -30 + i * 7;
    p.blit(man, x, 74, CLEAR);
    // the umbrella, furled, dripping
    p.line(x + 40, 112, x + 46, 150, c('black', 0)).line(x + 41, 112, x + 47, 150, c('navy', 2));
    for (let d = 0; d < 3; d++) p.set(x + 46 - d * 6, 152 + ((i * 5 + d * 7) % 20), c('rain', 5));
    p.rect(0, 0, W, 22, c('black', 0));
    centered(p, 7, '9:05 P.M.  THE LOBBY BAR', c('gold', 4), 1);
    frames.push(p);
  }
  return fli(frames, 5);
}

/** End of Act One: the curtain falls. */
function curtainFli(): Uint8Array {
  const frames: Pixels[] = [];
  for (let i = 0; i <= 24; i++) {
    const p = stageView(Math.min(1, i / 16), 0);
    if (i > 18) {
      outlined(p, 160 - 7 * 12, 80, 'END OF', c('gold', 4), c('black', 0), 3);
      outlined(p, 160 - 7 * 12, 108, 'ACT ONE', c('gold', 4), c('black', 0), 3);
    }
    frames.push(p);
  }
  return fli(frames, 6);
}

/** A theory cartoon: a cream caption band at the top (PLAYGAME writes there), the scene below. */
function theoryFrame(): Pixels {
  const p = new Pixels(W, H, c('black', 0));
  p.rect(28, 30, 264, 66, c('paper', 4)).frame(28, 30, 264, 66, c('gold', 2));
  return p;
}

/** ONE: the swap at the prop table in the dark wing. */
function swapFli(): Uint8Array {
  const frames: Pixels[] = [];
  for (let i = 0; i < 40; i++) {
    const p = theoryFrame();
    // drawn at half size, then doubled: the prop table in the dark wing
    const q = new Pixels(160, 50, CLEAR);
    q.rect(10, 34, 140, 5, c('wood', 2)).rect(10, 34, 140, 1, c('wood', 4)).rect(14, 39, 3, 11, c('wood', 1)).rect(143, 39, 3, 11, c('wood', 1));
    symbol(q, 20, 22, 'mask', c('gold', 3), c('black', 0));
    q.rect(118, 28, 6, 6, c('gold', 2)); // a goblet
    q.disc(132, 31, 2, c('velvet', 4)); // a rose
    // the trick dagger leaves, the real one arrives, in a gloved hand
    const t = i / 39;
    const out = Math.min(1, t * 2);
    const inn = Math.max(0, t * 2 - 1);
    const hand = (x: number, y: number) => blob(q, x, y, 5, 4, r('black'), 1, 2);
    if (t < 0.5) {
      dagger(q, 80 + Math.round(out * 50), 32 - Math.round(out * 20), false);
      if (out > 0.1) hand(82 + out * 50, 26 - out * 20);
    } else {
      dagger(q, 30 + Math.round(inn * 50), 12 + Math.round(inn * 20), true);
      if (inn < 0.9) hand(32 + inn * 50, 6 + inn * 20);
    }
    scaleBlit(p, q, 0, 100, 2);
    microC(p, 160, 104, 'STAGE RIGHT, 9:00 - 9:20', c('ghost', 2));
    frames.push(p);
  }
  return fli(frames, 6);
}

/** TWO: a drop of poison in the goblet. */
function poisonFli(): Uint8Array {
  const frames: Pixels[] = [];
  for (let i = 0; i < 36; i++) {
    const p = theoryFrame();
    // the goblet
    p.rect(140, 120, 40, 30, c('gold', 3)).rect(142, 122, 36, 8, c('wood', 1));
    p.rect(156, 150, 8, 24, c('gold', 2)).rect(144, 174, 32, 6, c('gold', 3));
    // a vial tips over it
    const tilt = Math.min(1, i / 14);
    const vx = 196 - Math.round(tilt * 14);
    const vy = 102 + Math.round(tilt * 4);
    p.rect(vx, vy, 10, 20, c('green', 3)).rect(vx + 2, vy - 4, 6, 4, c('wood', 2));
    if (i > 14) for (let d = 0; d < 3; d++) p.rect(176 - d * 4, 112 + ((i * 6 + d * 9) % 14), 2, 3, c('green', 4));
    if (i > 20) p.rect(142, 122, 36, 8, c('green', 1));
    microC(p, 160, 190, "COUNT CORVIN'S GOBLET", c('glow', 3));
    frames.push(p);
  }
  return fli(frames, 6);
}

/** THREE: the lights go out and a figure slips across the stage. */
function darkFli(): Uint8Array {
  const frames: Pixels[] = [];
  const victor = actor('victor', 60);
  const shadow = actor('edgar', 64);
  shadow.map((_, __, col) => (col === CLEAR ? CLEAR : c('black', 2)));
  for (let i = 0; i < 40; i++) {
    const p = theoryFrame();
    const lights = i < 10 || i > 34;
    if (lights) pool(p, 160, 160, 130, 40, r('glow'), 0, 1);
    for (let x = 30; x < 290; x += 12) blob(p, x, 196, 4, 2, r('glow'), lights ? 2 : 0, lights ? 4 : 1);
    if (lights) p.blit(victor, 170, 130, CLEAR);
    else {
      // only shapes in the dark
      victor.px.forEach((col, k) => col !== CLEAR && p.set(170 + (k % victor.w), 130 + Math.floor(k / victor.w), c('black', 1)));
      p.blit(shadow, 60 + i * 4, 126, CLEAR);
    }
    microC(p, 160, 104, lights ? 'ACT III' : 'BLACKOUT?', c('ghost', 2));
    frames.push(p);
  }
  return fli(frames, 6);
}

/** The curtain call: the company bows; Ada watches from the wings. */
function wonFli(): Uint8Array {
  const frames: Pixels[] = [];
  const cast = (['lila', 'edgar', 'felix', 'agatha'] as const).map((w) => [actor(w, 64, 'stand'), actor(w, 64, 'bow')]);
  const ada = actor('ada', 64);
  for (let i = 0; i < 48; i++) {
    const open = i < 16 ? 1 - i / 16 : 0;
    const p = stageView(0, 1);
    cast.forEach(([stand, bow], k) => p.blit(i > 22 && (i + k) % 12 < 6 ? bow : stand, 70 + k * 46, 114, CLEAR));
    p.blit(ada, 250, 114, CLEAR);
    // the curtain rising: redraw closed curtain over the top part
    if (open > 0) {
      const q = stageView(1, 1);
      const h = Math.round(open * 176);
      for (let y = 4; y < 4 + h; y++) for (let x = 40; x < 280; x++) p.set(x, y, q.get(x, y));
    }
    if (i > 30) {
      // flowers thrown from the house
      const R = rng(i);
      for (let k = 0; k < 6; k++) p.disc(60 + R() * 200, 150 + R() * 26, 2, c(['velvet', 'paper', 'plum'][k % 3], 5));
    }
    frames.push(p);
  }
  return fli(frames, 6);
}

/** Lost: the marquee goes dark, one bank of bulbs at a time. */
function lostFli(): Uint8Array {
  const frames: Pixels[] = [];
  for (let i = 0; i < 30; i++) {
    const p = facade(i, i < 14 ? 1 : 0);
    rain(p, 300 + i, 260);
    if (i >= 14) for (let y = 118; y < 150; y++) for (let x = 92; x < 236; x++) if (p.get(x, y) === c('glow', 1)) p.set(x, y, c('navy', 0));
    frames.push(p);
  }
  return fli(frames, 6);
}

/** The cartoons, and the title and story lists that play the long ones in clips of about 4 seconds (Esc skips between clips). */
export function buildFlics(): Record<string, Uint8Array> {
  const intro = fliClips('intro.fli', introFli());
  const story = fliClips('story.fli', storyFli());
  return {
    ...intro,
    ...story,
    // the Sandbox Software logo first, then the game's own intro
    'title.lst': serializeSlideList([{ name: SANDLOGO, pause: 0 }, ...clipEntries(intro, 0), { name: 'title.gif', pause: 10 }]),
    'story.lst': serializeSlideList([...clipEntries(story, 0), { name: 'story.gif', pause: 0 }, { name: 'story.txt' }]),
    'umbman.fli': umbrellaManFli(),
    'curtain.fli': curtainFli(),
    'swap.fli': swapFli(),
    'poison.fli': poisonFli(),
    'dark.fli': darkFli(),
    'won.fli': wonFli(),
    'lost.fli': lostFli(),
  };
}
