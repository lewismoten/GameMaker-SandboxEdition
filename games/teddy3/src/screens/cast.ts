// cast.fli: "Starring...", the cast in close-up before the credits (after the sequel's): Teddy,
// the birthday boy, grinning; Teddy and Gwinn in the grass (then her zoomies); Doc Leo the hobo
// clown in this game's makeup, his rubber chicken in his fist; and THE CHEZ (the shared side
// view, games/kit/chez.ts) plugged in at a charging station, the current running down its cable
// by palette cycling. The portraits are the first two games' pixel art (castArt.ts), drawn over
// the family's photos.
import { encodeFli } from '../../../../web/src/formats/fli';
import { Pixels } from '../../../kit/pixels';
import { CLEAR, gradient, outline, outlined, speckle } from '../art/draw';
import { drawArt } from './castArt';
import { chezSide } from '../../../kit/chez';
import { CHEZ_INK } from '../sprites/chezHero';
import { CHICKEN, CHICKEN_BAWK } from '../../../teddy2/src/screens/castLeo';
import { GRASS_GWINN, GRASS_TEDDY, GRASS_TEDDY_PANT, GWINN_BLINK, GWINN_RUN1, GWINN_RUN2, JEANS } from '../../../teddy2/src/screens/castGwinn';
import { TEDDY, TEDDY_BLINK, TEDDY_PANT } from '../../../teddy2/src/screens/castTeddy';
import { drawLeo } from './castLeo';
import { CP, CastReel, H, W, big, c, cycled, poly, r, rope, say, type Pt } from './castKit';

/** Scene 1: Teddy, grinning up at the camera on the kitchen floor. */
function teddyScene(reel: CastReel): void {
  const bg = new Pixels(W, H);
  gradient(bg, 0, 0, W, 120, r('cream'), 1, 3);
  bg.rect(214, 0, 90, 132, c('paint', 3)).rect(214, 0, 2, 132, c('paint', 1)).rect(226, 14, 66, 50, c('paint', 2)).rect(226, 76, 66, 50, c('paint', 2));
  bg.rect(222, 70, 6, 3, c('metal', 3));
  speckle(bg, 0, 120, W, 80, r('stone'), 3, 1, 5, 0.15);
  for (let x = -40; x < W; x += 56) bg.line(x, 200, x + 40, 120, c('stone', 2));
  bg.rect(0, 120, W, 1, c('stone', 2)).rect(0, 156, W, 1, c('stone', 2));
  for (let f = 0; f < 40; f++) {
    const p = new Pixels(W, H);
    p.px.set(bg.px);
    const t = new Pixels(W, H, CLEAR);
    drawArt(t, TEDDY, c);
    if (f % 4 < 2) drawArt(t, TEDDY_PANT, c);
    if (f === 14 || f === 15 || f === 33) drawArt(t, TEDDY_BLINK, c);
    p.blit(outline(t, c('ink', 0)), 0, 0, CLEAR);
    big(p, 'TEDDY', 24, 250);
    say(p, 'RED-GOLD CORGI.', 52, undefined, 250);
    say(p, 'ALL EARS.', 64, undefined, 250);
    say(p, 'THE BIRTHDAY BOY.', 76, c('yellow', 3), 250);
    if (f >= 20) {
      say(p, 'HE THINKS IT IS', 150, undefined, 250);
      say(p, 'JUST ERRANDS.', 162, undefined, 250);
    }
    reel.add(p);
  }
}

/** Scene 2: Teddy and Gwinn in the grass. She is keeping a secret today (mostly). */
function gwinnScene(reel: CastReel): void {
  const bg = new Pixels(W, H);
  speckle(bg, 0, 0, W, H, r('grass'), 2, 1, 9, 0.35);
  for (let i = 0; i < 900; i++) {
    const x = (i * 97) % W;
    const y = (i * 61) % H;
    bg.line(x, y, x + ((i % 3) - 1), y - 3, c('grass', i % 2 ? 4 : 1));
  }
  const knee = new Pixels(W, H, CLEAR);
  bg.blit(outline(drawArt(knee, JEANS, c), c('ink', 0)), 0, 0, CLEAR);
  const purple: Pt[] = [
    [93, 126],
    [110, 124],
    [140, 122],
    [165, 120],
    [179, 124],
    [185, 135],
    [183, 150],
    [175, 162],
    [160, 168],
    [140, 171],
    [124, 173],
  ];
  const pink: Pt[] = [
    [196, 108],
    [205, 113],
    [210, 125],
    [207, 142],
    [205, 160],
    [203, 175],
    [195, 185],
    [180, 190],
    [165, 189],
    [150, 191],
    [130, 196],
    [112, 203],
  ];
  for (let f = 0; f < 52; f++) {
    const p = new Pixels(W, H);
    p.px.set(bg.px);
    const t = new Pixels(W, H, CLEAR);
    drawArt(t, GRASS_TEDDY, c);
    if (f % 6 >= 3 || f >= 40) drawArt(t, GRASS_TEDDY_PANT, c);
    const gone = f >= 40;
    if (!gone) {
      const bob = f >= 24 && f % 2 ? 1 : 0;
      drawArt(t, GRASS_GWINN, c, 0, bob);
      if (f === 9 || f === 17 || f === 33) drawArt(t, GWINN_BLINK, c, 0, bob);
    }
    p.blit(outline(t, c('ink', 0)), 0, 0, CLEAR);
    rope(p, purple, 4, 5, 'purple');
    if (!gone) rope(p, pink, 4, 8, 'pink', true);
    else {
      // zoomies: she bolts past Teddy, right in front of him, trailing her pink leash
      const x = 166 - (f - 40) * 20;
      const y = 100;
      rope(
        p,
        [
          [x + 38, y + 24],
          [x + 70, y + 46],
          [x + 110, y + 62],
          [x + 150, y + 80],
          [x + 170, y + 110],
        ],
        4,
        7,
        'pink',
        true,
      );
      const g = new Pixels(W, H, CLEAR);
      drawArt(g, f % 2 ? GWINN_RUN1 : GWINN_RUN2, c, x, y, true);
      for (let k = 0; k < 4; k++) g.rect(x + 152 + k * 12 + (f % 2) * 4, y + 14 + k * 9, 12 - k * 2, 2, c('paint', 3));
      p.blit(outline(g, c('ink', 0)), 0, 0, CLEAR);
    }
    big(p, 'GWINN', 4, 250);
    if (f < 24) {
      say(p, 'BIG SISTER. BIG IDEAS.', 170);
      say(p, 'KEEPING A BIG SECRET.', 182, c('yellow', 3));
    } else if (f < 40) {
      say(p, 'SIT, GWINN! SIT!', 170, c('yellow', 3));
      if (f >= 31) say(p, '...NOT YET.', 182);
    } else {
      say(p, 'SHE KNOWS ONE TRICK:', 170);
      say(p, 'ZOOMIES!', 182, c('yellow', 3));
    }
    reel.add(p);
  }
}

/** Scene 3: Doc Leo on Main Street, flags out, the rubber chicken squawking. */
function leoScene(reel: CastReel): void {
  const bg = new Pixels(W, H);
  gradient(bg, 0, 0, W, 90, r('sky'), 2, 7);
  bg.rect(0, 40, 70, 160, c('brick', 2)).rect(250, 30, 70, 170, c('brick', 1));
  for (let y = 40; y < H; y += 5) for (let x = (y / 5) % 2 ? 0 : 6; x < 70; x += 12) bg.rect(x, y, 1, 5, c('brick', 0));
  for (let y = 30; y < H; y += 5) for (let x = 250 + ((y / 5) % 2 ? 0 : 6); x < W; x += 12) bg.rect(x, y, 1, 5, c('brick', 0));
  bg.rect(8, 60, 50, 40, c('sky', 6)).frame(8, 60, 50, 40, c('paint', 3));
  bg.rect(262, 52, 46, 44, c('sky', 5)).frame(262, 52, 46, 44, c('paint', 3));
  // party balloons tied to the lamp post on the left (he blew up a hundred of them)
  bg.line(60, 40, 60, 200, c('metal', 2));
  for (let k = 0; k < 4; k++) {
    const bx = 44 + k * 10;
    bg.line(60, 60, bx, 28 + (k % 2) * 8, c('ink', 1));
    bg.disc(bx, 22 + (k % 2) * 8, 7, c(['red', 'yellow', 'blue', 'green'][k], 2)).disc(
      bx - 2,
      19 + (k % 2) * 8,
      2,
      c(['red', 'yellow', 'blue', 'green'][k], 3),
    );
  }
  bg.rect(0, 180, W, 20, c('stone', 2));
  for (let f = 0; f < 50; f++) {
    const p = new Pixels(W, H);
    p.px.set(bg.px);
    const bawk = f > 4 && f % 6 < 2;
    const l = new Pixels(W, H, CLEAR);
    const bob = f >= 22 && f % 2 ? 1 : 0;
    drawLeo(l, bob, f === 8 || f === 40);
    // his right arm up, in its jacket sleeve, the chicken in his fist and its leash hanging
    poly(
      l,
      [
        [194, 200],
        [198, 172],
        [212, 158],
        [226, 164],
        [222, 176],
        [210, 186],
        [212, 200],
      ],
      (x) => c('ink', x % 3 ? 1 : 0),
    );
    l.line(212, 158, 198, 172, c('blue', 0)).line(198, 172, 194, 200, c('blue', 0));
    rope(
      l,
      [
        [219, 138],
        [214, 150],
        [212, 168],
        [214, 186],
        [218, 204],
      ],
      3,
      3,
      'red',
    );
    drawArt(l, bawk ? CHICKEN_BAWK : CHICKEN, c, 196, 55);
    p.blit(outline(l, c('ink', 0)), 0, 0, CLEAR);
    if (bawk) outlined(p, 262, 50, 'BAWK!', c('yellow', 3), c('ink', 0), 1);
    big(p, 'DOC LEO', 6, 262);
    if (f < 22) {
      say(p, 'A HOBO CLOWN, AND HIS', 170);
      say(p, 'RUBBER CHICKEN ON A LEASH.', 182);
    } else {
      say(p, 'A SUNBURNED NOSE, AND A', 170, c('yellow', 3));
      say(p, 'FEDORA FULL OF JOKES.', 182, c('yellow', 3));
    }
    reel.add(p);
  }
}

/** Scene 4: THE CHEZ plugged in at a charging station; the current runs down the cable. */
function carScene(reel: CastReel): void {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 70, r('cream'), 3, 1);
  p.rect(0, 68, W, 2, c('cream', 0));
  for (let y = 70; y < 122; y += 5)
    for (let x = (y / 5) % 2 ? 0 : 7; x < W; x += 14) p.rect(x, y, 13, 4, c('stone', 2 + ((x * 3 + y) % 7 === 0 ? 1 : 0))).rect(x, y + 4, 13, 1, c('stone', 1));
  p.rect(0, 122, W, 78, c('asphalt', 1));
  speckle(p, 0, 122, W, 78, r('asphalt'), 1, 1, 13, 0.2);
  p.rect(250, 122, 70, 78, c('grass', 2));
  speckle(p, 250, 122, 70, 78, r('grass'), 2, 1, 7, 0.3);
  poly(
    p,
    [
      [246, 122],
      [252, 122],
      [228, 200],
      [220, 200],
    ],
    () => c('cream', 2),
  );
  p.line(0, 196, 210, 140, c('paint', 3));
  p.rect(8, 6, 116, 32, c('red', 1)).frame(8, 6, 116, 32, c('paint', 3));
  outlined(p, 34, 10, 'EV ONLY', c('paint', 3), c('red', 0), 1);
  outlined(p, 34, 23, 'CHARGING', c('paint', 3), c('red', 0), 1);
  p.ring(21, 22, 9, c('paint', 3)).rect(18, 17, 6, 8, c('paint', 3)).rect(19, 14, 1, 3, c('paint', 3)).rect(22, 14, 1, 3, c('paint', 3));
  p.rect(262, 168, 34, 8, c('stone', 3)).rect(262, 175, 34, 2, c('stone', 1));
  p.rect(268, 92, 22, 78, c('ink', 0)).rect(270, 94, 18, 74, c('ink', 1)).rect(272, 98, 14, 30, c('paint', 3)).rect(274, 102, 10, 12, c('ink', 0));
  const volt = r('volt');
  for (let k = 0; k < 4; k++) p.rect(276, 111 - k * 3, 6, 2, volt[k % volt.length]);
  p.rect(287, 130, 5, 8, c('ink', 0));
  // THE CHEZ from its passenger side (the shared side view), the charge port at the back
  const car = new Pixels(W, H, CLEAR);
  const port = chezSide(car, 34, 84, CHEZ_INK, 'left', 5);
  p.blit(outline(car, c('ink', 0)), 0, 0, CLEAR);
  // the cable: from the post round to the port, its colors cycling
  const path: Pt[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    path.push([Math.round(289 + (port.portX - 289) * t), Math.round(134 + (port.portY - 134) * t + Math.sin(t * Math.PI) * 30)]);
  }
  for (const [x, y] of path) p.rect(x - 1, y - 1, 3, 3, c('ink', 0));
  path.forEach(([x, y], i) => p.set(x, y, volt[Math.floor(i / 3) % volt.length]));
  p.rect(port.portX - 2, port.portY - 2, 5, 5, c('ink', 0)).rect(port.portX - 1, port.portY - 1, 3, 3, c('metal', 3));
  big(p, 'CITICAR', 4, 258);
  say(p, 'RED. 1976.', 26, undefined, 258);
  say(p, '100% ELECTRIC.', 38, undefined, 258);
  for (let f = 0; f < 40; f++) {
    const q = new Pixels(W, H);
    q.px.set(p.px);
    if (f >= 8) say(q, 'ITS NAME:', 56, c('yellow', 3), 258);
    if (f >= 8) say(q, 'THE CHEZ.', 68, c('yellow', 3), 258);
    if (f >= 18) say(q, 'ERRANDS DAY? IT RUNS THEM ALL.', 190, c('yellow', 3));
    reel.add(q, 1, cycled('volt', volt.length - (f % volt.length)));
  }
}

export function castFli(): Uint8Array {
  const reel = new CastReel();
  teddyScene(reel);
  gwinnScene(reel);
  leoScene(reel);
  carScene(reel);
  return encodeFli(reel.frames, CP.pal, { speed: 7, palettes: reel.pals });
}
