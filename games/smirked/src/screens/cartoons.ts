// The cartoons (FLIs drawn here, frame by frame): the title (the cover drawn for the game,
// art/cover.ts: bats cross the moon, the windows flicker, lightning, the sword shaking, and the
// name drops), the story (you and Lily walk up to MILD SCARES FOR ALL AGES; you feel heroic;
// the fog machine hisses), the level cards, how to play, losing (fainting onto a couch like a
// Victorian woman seeing a ghost), and the endings (Lily's Bravery Badge and your souvenir
// sword at the front desk, you bonding with the emergency exit sign, THE END under the moon).
// Each reel opens on black and fades by palette (kit/reel.ts); only what moves is stored.
import { Pixels } from '../../../kit/pixels';
import { medianCutPalette, Quantizer } from '../../../kit/quantize';
import { Reel } from '../../../kit/reel';
import { fadeOutLength } from '../../../kit/fadeOut';
import { blob } from '../../../snowbound/src/art/draw';
import { centered, micro, microWidth, outlined, textWidth } from '../../../snowbound/src/art/font';
import { scaleBlit } from '../../../snowbound/src/screens/scenery';
import { coverRgb } from '../art/cover';
import { buildScreenPalette, type Pal } from '../art/pal';
import { exitSignArt, hallBackdrop, houseBackdrop } from './screens';
import { AUTHOR, CARDS } from './text';

const W = 320;
const H = 200;
/** Clear pixels in sprites. */
const T = 255;
/** 1/70 s per frame: about 12 frames a second. */
export const SPEED = 6;

export interface Cast {
  /** Your sprites (the .CBL's pictures). */
  hero: Map<string, Pixels>;
  /** Your sprites with the foam sword (SWORD.CBL's). */
  sword: Map<string, Pixels>;
  /** Everybody else's (the .MBL's pictures). */
  mons: Map<string, Pixels>;
  /** A background block's picture. */
  block: (name: string) => Pixels;
}

/** A four-point twinkle of size 0..3. */
function twinkle(p: Pixels, pal: Pal, x: number, y: number, size: number, ramp = 'yellow'): void {
  if (size <= 0) return;
  p.set(x, y, pal.c(ramp, 2));
  for (let k = 1; k <= size; k++) {
    const col = pal.c(ramp, Math.max(0, 2 - k));
    p.set(x + k, y, col)
      .set(x - k, y, col)
      .set(x, y + k, col)
      .set(x, y - k, col);
  }
}

/** The bar along the bottom with one or two lines of the song. */
function caption(p: Pixels, pal: Pal, lines: string[]): void {
  p.rect(0, 172, W, H - 172, pal.c('ink', 0));
  lines.forEach((l, i) => centered(p, 176 + i * 12, l, pal.c(i ? 'yellow' : 'white', 2)));
}

/** Words said over (x, y), outlined. */
function say(p: Pixels, pal: Pal, x: number, y: number, words: string, ramp = 'yellow', k = 2): void {
  outlined(p, Math.round(Math.max(2, Math.min(W - 2 - textWidth(words), x - textWidth(words) / 2))), y, words, pal.c(ramp, k), pal.c('ink', 0));
}

const sprite = (set: Map<string, Pixels>, name: string) => {
  const s = set.get(name);
  if (!s) throw new Error(`No sprite ${name}`);
  return s;
};

/** A puff of fog at (cx, cy), size k. */
function fog(p: Pixels, pal: Pal, cx: number, cy: number, k: number): void {
  for (let i = 0; i < 6; i++) blob(p, cx + Math.cos(i * 1.1) * k * 3, cy - Math.abs(Math.sin(i * 1.7)) * k * 2, 4 + k, 3 + k * 0.6, pal.r('fog'), 1, 3);
}

// ---- the title: the cover ---------------------------------------------------------------------

/** How many pictures of the cover the title animates through. */
const COVER_FRAMES = 14;

/** The title cartoon (cover.fli: the cover comes to life, an iris closes, a fade to black) and the cover with the name on it (title.gif's pixels and palette). */
export function coverFli(): { fli: Uint8Array; title: Pixels; pal: Uint8Array } {
  const frames = Array.from({ length: COVER_FRAMES }, (_, k) => coverRgb((k / (COVER_FRAMES - 1)) * 0.92));
  // inks for the lettering first (black, pumpkin orange, its shadow, unicorn lavender, cream), then the cover's colors
  const INKS: [number, number, number][] = [
    [0, 0, 0],
    [255, 170, 40],
    [110, 20, 20],
    [220, 190, 255],
    [255, 250, 236],
  ];
  const pal = medianCutPalette(frames, INKS);
  const q = new Quantizer(pal, 10);
  const pics = frames.map((f) => {
    const p = new Pixels(W, H);
    p.px.set(q.apply(f, W, H));
    return p;
  });
  const name = (p: Pixels, drop: number, sub: boolean) => {
    outlined(p, 160 - textWidth('I SCREAMED,', 2) / 2, drop, 'I SCREAMED,', 1, 0, 2, 2);
    outlined(p, 160 - textWidth('SHE SMIRKED', 2) / 2, drop + 20, 'SHE SMIRKED', 3, 0, 2, 2);
    if (sub) {
      p.rect(0, 186, W, 14, 0);
      centered(p, 189, `${AUTHOR} (c) 1995 Shareware`, 4);
    }
  };
  const r = new Reel(pal);
  r.fadeIn(pics[0], 6);
  pics.forEach((p, i) => r.add(p, i === 0 ? 4 : 2));
  const last = pics[pics.length - 1];
  // the name is the title picture's: the cartoon closes on an iris and fades to black instead
  r.irisOut(58, 140, 8).fadeOut(fadeOutLength(SPEED));
  const title = new Pixels(W, H);
  title.px.set(last.px);
  name(title, 8, true);
  return { fli: r.fli(SPEED), title, pal };
}

// ---- the story: up to the haunted house ------------------------------------------------------

/** The sign by the path: MILD SCARES FOR ALL AGES. */
function mildSign(p: Pixels, pal: Pal, x: number, y: number): void {
  const c = pal.c;
  p.rect(x + 26, y + 26, 4, 30, c('board', 1));
  p.rect(x, y, 56, 28, c('board', 3)).frame(x, y, 56, 28, c('board', 0));
  outlined(p, x + 28 - textWidth('MILD') / 2, y + 3, 'MILD', c('velvet', 1), c('ink', 0));
  outlined(p, x + 28 - textWidth('SCARES!') / 2, y + 14, 'SCARES!', c('velvet', 1), c('ink', 0));
}

export function storyFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const Hh = (n: string) => sprite(cast.hero, n);
  const M = (n: string) => sprite(cast.mons, n);
  const lines = (k: number) =>
    k < 18
      ? ['Okay, in my defense... the sign', 'said "mild scares for all ages!"']
      : k < 34
        ? ['So I take Lily,', "my girlfriend's kid,"]
        : k < 50
          ? ['I feel heroic...', 'at least till I fled.']
          : ['Fog machine hisses-', 'I scream like a cat!'];
  const scene = (p: Pixels, k: number) => {
    mildSign(p, pal, 20, 110);
    // you and Lily walk up the path; you stop to look heroic; the fog hisses out of the door
    const walking = k < 30;
    const mx = walking ? -30 + k * 6 : 150;
    const lx = walking ? -60 + k * 6 : Math.min(200, 120 + (k - 30) * 2);
    scaleBlit(p, M(walking || k % 12 < 6 ? `lily${k % 2}` : 'lilySmirk'), lx, 118, 2);
    let pose = walking ? `side${k % 3}` : k < 50 ? (k % 16 < 12 ? 'brave' : 'blink') : `scream${k % 2}`;
    if (k >= 50 && k % 8 >= 6) pose = 'ouch';
    scaleBlit(p, Hh(pose), mx + (k >= 50 ? (k % 2) * 2 : 0), 96, 3);
    if (k >= 30 && k < 50) say(p, pal, mx + 30, 78, 'HEROIC.', 'yellow');
    if (k >= 48) fog(p, pal, 165, 140 + Math.min(0, 0), Math.min(8, k - 48));
    if (k >= 50) say(p, pal, mx + 30, 70, 'AAAAAH!', 'white');
    if (k >= 56) say(p, pal, lx + 20, 104, '...really?', 'hoodie', 3);
    caption(p, pal, lines(k));
  };
  const first = houseBackdrop(pal, 150, 0);
  scene(first, 0);
  r.fadeIn(first, 4);
  for (let k = 0; k < 68; k++) r.frame(houseBackdrop(pal, 150, k), (p) => scene(p, k));
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the level cards ------------------------------------------------------------------------

export interface CardView {
  /** The level's view (16 x 6 blocks), in the level's palette. */
  map: Pixels;
  pal: Pal;
}

/** The strip of level on a card: y 54 to 174. */
const STRIP = 54;

export function cardFli(i: number, card: CardView, cast: Cast): Uint8Array {
  const pal = card.pal;
  const c = pal.c;
  const ink = c('ink', 0);
  const info = CARDS[i];
  /** Where this level falls in the game (the last one says so), small under the place line. */
  const count = `${i === CARDS.length - 1 ? 'FINAL LEVEL:' : 'LEVEL'} ${i + 1} OF ${CARDS.length}${i === 0 ? ' - F5 SAVES, F6 LOADS' : ''}`;
  const bg = new Pixels(W, H, ink);
  bg.blit(card.map, 0, STRIP);
  const frame = (p: Pixels, k: number) => {
    p.rect(0, 0, W, STRIP, ink).rect(0, 174, W, 26, ink);
    p.rect(0, STRIP - 1, W, 1, c('pumpkin', 1)).rect(0, 174, W, 1, c('pumpkin', 1));
    const drop = [-24, -14, -2, 10, 6, 8][Math.min(5, k)];
    outlined(p, 160 - textWidth(info.title, 2) / 2, drop, info.title, c('pumpkin', 2), c('velvet', 0), 2);
    if (k >= 5) centered(p, 32, info.where, c('white', 2));
    if (k >= 5) micro(p, 160 - Math.ceil(microWidth(count) / 2), 45, count, c('white', 2));
    if (k >= 9) centered(p, 178, `"${info.lines[0]}`, c('white', 2));
    if (k >= 15) centered(p, 189, ` ${info.lines[1]}"`, c('white', 2));
  };
  const Hh = (name: string) => sprite(cast.hero, name);
  const S = (name: string) => sprite(cast.sword, name);
  const M = (name: string) => sprite(cast.mons, name);
  const words = (p: Pixels, x: number, y: number, w: string) => outlined(p, Math.round(x - textWidth(w) / 2), y, w, c('yellow', 2), ink);
  const actors: ((p: Pixels, k: number) => void)[] = [
    // 1. the fog hall: you tiptoe up, the fog machine hisses, you scream; Lily smirks
    (p, k) => {
      const x = Math.min(140, 10 + k * 9);
      scaleBlit(p, M(k < 18 ? `lily${k % 2}` : 'lilySmirk'), Math.min(220, 60 + k * 9), STRIP + 60, 2);
      if (k >= 14) fog(p, pal, 176, STRIP + 100, Math.min(7, k - 13));
      scaleBlit(p, Hh(k < 14 ? `side${k % 3}` : `scream${k % 2}`), x, STRIP + 50, 2);
      if (k >= 15) words(p, x + 20, STRIP + 24, 'AAAAH!');
    },
    // 2. the zombie parade: GET DOWN! you dive at the witch; she goes flat
    (p, k) => {
      const x = Math.min(150, 10 + k * 10);
      scaleBlit(p, M(k < 16 ? 'witch0' : 'flat0'), 196, STRIP + 50, 2);
      scaleBlit(p, Hh(k < 12 ? `side${k % 3}` : 'tackle0'), x, STRIP + 50, 2);
      if (k >= 12) words(p, x + 30, STRIP + 20, 'GET DOWN!');
      if (k >= 20) words(p, 216, STRIP + 4, '...sorry.');
    },
    // 3. the woods: the werewolf guy growls behind you; you walk straight into a web; ACHOO
    (p, k) => {
      const x = Math.min(170, 20 + k * 9);
      scaleBlit(p, M(`wolf${k % 2}`), Math.max(-30, x - 70), STRIP + 50, 2);
      scaleBlit(p, Hh(k < 16 ? `side${k % 3}` : k % 4 < 2 ? 'ouch' : 'scream0'), x, STRIP + 50, 2);
      if (k >= 6 && k < 16) words(p, x - 50, STRIP + 24, 'GRRR!');
      if (k >= 17) words(p, x + 20, STRIP + 20, 'ACHOO!');
    },
    // 4. the last hall: the cardboard knight; you duel with the $12 foam sword; his helmet flies
    (p, k) => {
      const x = Math.min(110, 10 + k * 8);
      if (k < 18) scaleBlit(p, M(`knight${k % 2}`), 200 - Math.min(40, k * 3), STRIP + 50, 2);
      else {
        scaleBlit(p, M(`knightRuns${k % 2}`), 160 + (k - 18) * 10, STRIP + 50, 2);
        scaleBlit(p, M('helmet0'), 170, STRIP + 40 - Math.min(30, (k - 18) * 6), 2);
      }
      scaleBlit(p, S(k >= 14 && k < 20 ? 'tackle0' : k < 14 ? `side${k % 3}` : 'brave'), x, STRIP + 50, 2);
      if (k >= 14) words(p, 160, STRIP + 4, k < 20 ? 'BONK!' : 'GOOD DUEL!');
    },
  ];
  const r = new Reel(pal.pal);
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  actors[i](first, 0);
  frame(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 28; k++) r.frame(bg, (p) => (actors[i](p, k), frame(p, k)));
  return r.fli(SPEED);
}

// ---- how to play: tackle, then say sorry --------------------------------------------------------

export function howtoFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = hallBackdrop(pal, 120, 7);
  const Hh = (n: string) => sprite(cast.hero, n);
  const M = (n: string) => sprite(cast.mons, n);
  const scene = (p: Pixels, k: number) => {
    if (k < 28) {
      // a zombie shuffles at you; SPACE: GET DOWN! and it's over
      const zx = Math.max(140, 260 - k * 8);
      scaleBlit(p, M(k < 18 ? `zombie${k % 2 ? 1 : 0}` : `zombieDown${k % 2}`), zx, 116, 3);
      scaleBlit(p, Hh(k >= 12 && k < 20 ? 'tackle0' : 'side0'), 40 + (k >= 12 && k < 20 ? (k - 12) * 8 : 0), 100, 3);
      if (k >= 12 && k < 20) say(p, pal, 120, 70, 'GET DOWN!');
    } else {
      // the witch you flattened: walk over her and say sorry
      scaleBlit(p, M('flat0'), 180, 120, 3);
      const x = Math.min(170, 40 + (k - 28) * 8);
      scaleBlit(p, Hh(x < 170 ? `side${k % 3}` : 'ask'), x, 100, 3);
      if (x >= 170) say(p, pal, 200, 70, 'SORRY! +1');
    }
    caption(p, pal, k < 28 ? ['SPACE tackles: GET DOWN!', 'Zombies and witches go over.'] : ['Walk over a flat witch to', `say sorry. Five open the door.`]);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 56; k++) r.frame(bg, (p) => scene(p, k));
  r.fadeOut(3);
  return r.fli(SPEED);
}

// ---- losing: a Victorian faint onto a couch -------------------------------------------------------

/** A fainting couch: velvet, one curled arm. */
function faintingCouch(p: Pixels, pal: Pal, x: number, y: number): void {
  const c = pal.c;
  p.rect(x, y + 20, 120, 24, c('velvet', 2)).rect(x, y + 20, 120, 4, c('velvet', 3));
  blob(p, x + 8, y + 18, 12, 18, pal.r('velvet'), 1, 3);
  p.rect(x + 6, y + 44, 6, 8, c('board', 1)).rect(x + 108, y + 44, 6, 8, c('board', 1));
  for (let k = 0; k < 6; k++) p.set(x + 20 + k * 16, y + 30, c('gold', 1));
}

export function lostFli(cast: Cast): Uint8Array {
  const pal = buildScreenPalette();
  const r = new Reel(pal.pal);
  const bg = hallBackdrop(pal, 150, 11);
  faintingCouch(bg, pal, 120, 100);
  const scene = (p: Pixels, k: number) => {
    const f = Math.min(3, Math.max(0, Math.floor((k - 10) / 5)));
    scaleBlit(p, sprite(cast.hero, k < 10 ? (k % 4 < 2 ? 'ouch' : 'scream0') : `faint${f}`), 140, 60, 3);
    if (k < 10) say(p, pal, 170, 40, 'OH!', 'white');
    if (k >= 30) scaleBlit(p, sprite(cast.mons, 'lilySmirk'), 40, 108, 3);
    if (k >= 36) say(p, pal, 70, 84, 'You okay?', 'hoodie', 3);
    caption(p, pal, k < 30 ? ['I was supposed to impress,', 'but I nearly flatlined-'] : ['Like a Victorian fainting', 'into a couch. Try again!']);
  };
  const first = new Pixels(W, H);
  first.px.set(bg.px);
  scene(first, 0);
  r.fadeIn(first, 3);
  for (let k = 0; k < 60; k++) r.frame(bg, (q) => scene(q, k));
  r.fadeOut(4);
  return r.fli(SPEED);
}

// ---- the endings -----------------------------------------------------------------------------

/** won1.fli (the front desk: her Bravery Badge, your souvenir sword), won2.fli (the exit sign), won3.fli (THE END). */
export function wonFlis(cast: Cast): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const S = (n: string) => sprite(cast.sword, n);
  const M = (n: string) => sprite(cast.mons, n);
  {
    // the front desk: the guy pins a Bravery Badge on Lily; you hold up your foam sword
    const r = new Reel(pal.pal);
    const bg = hallBackdrop(pal, 150, 13);
    bg.rect(90, 110, 140, 44, c('board', 2)).rect(90, 110, 140, 4, c('board', 4));
    outlined(bg, 160 - textWidth('FRONT DESK') / 2, 126, 'FRONT DESK', c('gold', 2), c('ink', 0));
    // the guy behind the desk, in a vampire cape
    bg.disc(160, 84, 12, c('skin', 2)).rect(146, 96, 28, 16, c('black', 1)).rect(150, 74, 20, 6, c('black', 0));
    bg.set(155, 84, c('ink', 0)).set(165, 84, c('ink', 0)).rect(156, 90, 8, 1, c('ink', 0)).set(157, 91, c('white', 2)).set(163, 91, c('white', 2));
    const scene = (p: Pixels, k: number) => {
      const badge = k >= 20;
      scaleBlit(p, M(badge ? (k % 10 < 5 ? 'lilySmirk' : 'lily0') : 'lily0'), 40, 106, 3);
      if (badge) {
        p.disc(62, 140, 4, c('gold', 2)).rect(60, 144, 2, 6, c('red', 2)).rect(63, 144, 2, 6, c('red', 2));
        for (let t = 0; t < 3; t++) twinkle(p, pal, 54 + t * 8, 128 + ((k + t) % 3) * 4, [0, 1, 2][(k + t) % 3]);
      }
      scaleBlit(p, S(k >= 34 ? 'brave' : 'down0'), 240, 90, 3);
      if (k >= 34) say(p, pal, 270, 70, '$12!', 'white');
      if (badge && k < 34) say(p, pal, 70, 86, 'BRAVERY BADGE', 'gold', 2);
      caption(p, pal, k < 34 ? ['She gets a Bravery Badge', 'from the front desk,'] : ['I get a souvenir sword...', '']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 50; k++) r.frame(bg, (p) => scene(p, k));
    r.fadeOut(3);
    files['won1.fli'] = r.fli(SPEED);
  }
  {
    // the emergency exit sign: you, big, hugging the wall under it; hearts
    const r = new Reel(pal.pal);
    const bg = hallBackdrop(pal, 170, 9);
    const scene = (p: Pixels, k: number) => {
      exitSignArt(p, pal, 130, 16, k % 14 !== 13);
      scaleBlit(p, S(k < 16 ? 'up0' : k % 8 < 4 ? 'brave' : 'blink'), 112, 52, 5);
      if (k >= 16)
        for (let h = 0; h < 4; h++) {
          const hx = 60 + h * 64 + Math.round(Math.sin((k + h * 5) / 3) * 6);
          const hy = 120 - ((k * 3 + h * 23) % 70);
          p.disc(hx - 3, hy, 4, c('exitred', 1)).disc(hx + 3, hy, 4, c('exitred', 1));
          for (let y = 0; y < 7; y++) p.rect(hx - 7 + y, hy + 1 + y, 14 - y * 2, 1, c('exitred', 1));
        }
      caption(p, pal, k < 24 ? ['I bonded...', 'With the emergency...'] : ['...exit sign!', '']);
    };
    const first = new Pixels(W, H);
    first.px.set(bg.px);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 48; k++) r.frame(bg, (p) => scene(p, k));
    r.fadeOut(3);
    files['won2.fli'] = r.fli(SPEED);
  }
  {
    // THE END: out front under the moon, Lily with her badge, you with your sword, walking home
    const r = new Reel(pal.pal);
    const scene = (p: Pixels, k: number) => {
      outlined(p, 160 - textWidth('THE END', 3) / 2, 52, 'THE END', c('pumpkin', 2), c('ink', 0), 3, c('velvet', 0));
      const x = 120 + k * 2;
      scaleBlit(p, M(`lily${k % 2}`), x + 40, 128, 2);
      p.disc(x + 54, 144, 2, c('gold', 2));
      scaleBlit(p, S(`side${k % 3}`), x, 112, 3);
      for (let t = 0; t < 5; t++) twinkle(p, pal, 30 + ((t * 61 + k * 3) % 260), 20 + ((t * 29 + k * 5) % 30), [0, 1, 2, 3, 2, 1][(k + t) % 6], 'moon');
      caption(p, pal, k < 22 ? ['So yeah. The date went well.', 'No trauma. Except mine.'] : ['Just me... and my sword...', 'and the exit sign.']);
    };
    const first = houseBackdrop(pal, 160, 0);
    scene(first, 0);
    r.fadeIn(first, 3);
    for (let k = 0; k < 46; k++) r.frame(houseBackdrop(pal, 160, k), (p) => scene(p, k));
    files['won3.fli'] = r.fli(SPEED);
  }
  return files;
}

export { T };
