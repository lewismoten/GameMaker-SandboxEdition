// Hails: three worlds call the pod before it lands. Each hail is a page of HAILS.GIF (one
// tall picture, like the planet cards), shown through its own .BKD window at the head of
// that world's slide show: the hail, then the landing film, then the planet card.
//   Galileo       an old Earth probe whose brain is an RCA 1802 (the chip that flew to Jupiter)
//   Liberty       a cracked bell under a ring of thirteen stars
//   Boxcar Flats  Dr. Leo, PhD (Comedic Science), a hobo clown with a rubber chicken on a leash
import { encodeGif } from '../../../../web/src/formats/gif';
import { serializeBackdrop } from '../../../../web/src/formats/graphicScripts';
import { Canvas } from '../art/canvas';
import { WHITE, shared } from '../art/palette';
import { SCREEN, spaceBg } from './screens';

const C = (n: string) => SCREEN.ramps.get(n) ?? shared.get(n)!;

export interface Hail {
  /** the world it belongs to (universe.ts) */
  world: string;
  /** who is calling */
  from: string;
  title: string;
  sub: string;
  text: string;
  art: (c: Canvas) => void;
}

/** The pixel portrait key: one letter per color. */
const key = (): Record<string, number> => ({
  K: 0,
  H: C('grey')[3],
  h: C('grey')[2],
  b: C('brown')[1],
  s: C('sand')[6],
  S: C('sand')[4],
  w: WHITE,
  W: C('ice')[6],
  r: C('red')[4],
  R: C('red')[5],
  a: C('blue')[0],
  A: C('grey')[2],
  g: C('grey')[5],
  p: C('violet')[5],
  P: C('violet')[3],
  t: C('green')[4],
  T: C('green')[2],
  n: C('blue')[1],
  N: C('blue')[2],
  y: C('yellow')[6],
  Y: C('yellow')[4],
  o: C('orange')[5],
  x: C('red')[3],
});

// Dr. Leo, from the photos: a grey felt fedora, wire glasses, white around the eyes, a red
// nose and cheeks, a white mouth turned down sad, the hobo's ash beard, a purple shirt, a
// green tie and a navy corduroy jacket. 32 x 40, drawn three times bigger.
const LEO = [
  '..........KKKKKKKKKKKK..........',
  '.........KHHHHHHHHHHHHK.........',
  '........KHHHHHHKKHHHHHHK........',
  '........KHHHHHHhhHHHHHHK........',
  '........KHHHHHHHHHHHHHHK........',
  '........KbbbbbbbbbbbbbbK........',
  '........KhhhhhhhhhhhhhhK........',
  '..KKKKKKhhhhhhhhhhhhhhhhKKKKKK..',
  '.KhhhhhhhhhhhhhhhhhhhhhhhhhhhhK.',
  '..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..',
  '........KssssssssssssssK........',
  '.......SKsKKKKssssKKKKsKS.......',
  '.......SKswwwwwsswwwwwsKS.......',
  '.......SKgwwKwwggwwKwwgKS.......',
  '........KswwwwwsswwwwwsK........',
  '........KrrsssRRRRsssrrK........',
  '........KrrssRRwRRRssrrK........',
  '........KassssRRRRssssaK........',
  '........KaasswwwwwwssaaK........',
  '........KaawwwKKKKwwwaaK........',
  '........KaawwKwwwwKwwaaK........',
  '........KaaawwwwwwwwaaaK........',
  '.........KaaaawwwwaaaaK.........',
  '..........KaaaaaaaaaaK..........',
  '...........KKaaaaaaKK...........',
  '...........KPPKttKPPK...........',
  '......KKKKKnPPpKKpPPnKKKKK......',
  '....KKnnnnnnPppttppPnnnnnnKK....',
  '...KnnNnnnnnnPpttpPnnnnnNnnnK...',
  '..KnnnnNnnnnnPptTtpPnnnnNnnnnK..',
  '..KnnnnnNnnnnnPttpPnnnnNnnnnnK..',
  '.KnnnnnnnNnnnnPtTtPnnnNnnnnnnnK.',
  '.KnnnnnnnnNnnnPttpPnnNnnnnnnnnK.',
  '.KnnnnnnnnnNnnPtTtPnNnnnnnnnnnK.',
  'KnnnnnnnnnnnNnPpttPNnnnnnnnnnnnK',
  'KnnnnnnnnnnnnNPptTPnnnnnnnnnnnnK',
  'KnnnnnnnnnnnnnPpttPnnnnnnnnnnnnK',
  'KnnnnnnnnnnnnnPPtPPnnnnnnnnnnnnK',
  'KnnnnnnnnnnnnnPPKPPnnnnnnnnnnnnK',
  'KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
];

// The rubber chicken, in its red dog harness. 16 x 13, drawn twice bigger.
const CHICKEN = [
  '.....KKK........',
  '....KRRRK.......',
  '...KyyyyyK......',
  '..KyyKyyyyK.....',
  '.KoyyyyyyyyK....',
  'KooKyyyyyyyyKK..',
  '.KK.KyyyyyyyyyK.',
  '....KyxxxxyyyyyK',
  '....KyxyyxyyyyK.',
  '....KyxxxxyyyK..',
  '.....KyyyyyyK...',
  '......KoK.KoK...',
  '......KoK.KoK...',
];

function drawLeo(c: Canvas): void {
  // dusk over the flats, a boxcar on the rails behind him
  c.gradient(0, 0, 152, 150, [C('violet')[2], C('magenta')[3], C('orange')[4], C('orange')[6], C('yellow')[7]]);
  c.rect(0, 150, 152, 50, C('sand')[3]);
  for (let x = 0; x < 152; x += 3) c.set(x + ((x * 7) % 5), 160 + ((x * 13) % 30), C('sand')[1]);
  c.rect(0, 140, 152, 2, C('grey')[3]);
  for (let x = 2; x < 152; x += 10) c.rect(x, 142, 6, 3, C('brown')[1]);
  c.rect(0, 145, 152, 2, C('grey')[3]);
  // the boxcar: red planks, a sliding door, its wheels on the rail
  c.rect(4, 70, 144, 66, C('red')[2]);
  for (let x = 8; x < 148; x += 8) c.rect(x, 72, 1, 62, C('red')[1]);
  c.rect(4, 70, 144, 3, C('red')[4]);
  c.rect(52, 78, 48, 56, C('red')[1]);
  c.frame(52, 78, 48, 56, C('grey')[1]);
  c.text(10, 76, 'SANDBOX', C('ice')[6]);
  c.text(102, 76, 'R.R.', C('ice')[6]);
  for (const x of [16, 34, 118, 136]) {
    c.disc(x, 136, 6, C('grey')[1]);
    c.disc(x, 136, 2, C('grey')[4]);
  }
  c.sprite(new Canvas(32, 40, 255).draw(0, 0, LEO, key()), 28, 30, 3);
  // the leash runs from his pocket to the chicken
  c.line(108, 150, 118, 168, C('red')[4]);
  c.line(109, 150, 119, 168, C('red')[3]);
  c.sprite(new Canvas(16, 13, 255).draw(0, 0, CHICKEN, key()), 104, 160, 3);
}

function drawGalileo(c: Canvas): void {
  spaceBg(c, 314, false);
  // the probe: its big umbrella antenna (it never quite opened), the bus, two power booms
  // and the long magnetometer boom
  const g = C('grey');
  const y0 = 50;
  for (let k = -5; k <= 5; k++) c.line(76, y0 + 16, 76 + k * 6, y0 - 4 + Math.abs(k) * 2, g[5]);
  for (let k = -5; k < 5; k++) c.line(76 + k * 6, y0 - 4 + Math.abs(k) * 2, 82 + k * 6, y0 - 4 + Math.abs(k + 1) * 2, g[6]);
  c.rect(74, y0 + 14, 5, 22, g[4]);
  c.rect(66, y0 + 24, 21, 12, C('sand')[5]);
  c.frame(66, y0 + 24, 21, 12, C('sand')[2]);
  c.line(66, y0 + 34, 22, y0 + 52, g[3]);
  c.rect(16, y0 + 50, 10, 5, C('brown')[3]);
  c.line(86, y0 + 34, 120, y0 + 50, g[3]);
  c.rect(118, y0 + 48, 10, 5, C('brown')[3]);
  c.line(86, y0 + 28, 148, y0 + 14, g[2]);
  c.disc(148, y0 + 14, 1, C('cyan')[6]);
  // the computer board: an RCA 1802 on a green card, eight data lights and the Q light
  const bx = 14;
  const by = 128;
  c.panel(bx, by, 124, 60, C('green')[1], C('green')[3]);
  for (let x = bx + 4; x < bx + 120; x += 6) c.set(x, by + 3, C('yellow')[5]);
  c.rect(bx + 12, by + 10, 60, 18, g[1]);
  for (let x = bx + 14; x < bx + 72; x += 3) {
    c.set(x, by + 9, g[5]);
    c.set(x, by + 28, g[5]);
  }
  c.disc(bx + 15, by + 19, 1, g[3]);
  c.text(bx + 26, by + 15, '1802', g[6]);
  // eight data lights: 0x18, the high byte of 1802
  for (let k = 0; k < 8; k++) {
    const on = (0x18 >> (7 - k)) & 1;
    c.disc(bx + 12 + k * 9, by + 40, 2, on ? C('red')[6] : C('red')[1]);
  }
  c.disc(bx + 100, by + 18, 4, C('red')[6]);
  c.disc(bx + 99, by + 17, 1, WHITE);
  c.text(bx + 96, by + 26, 'Q', C('yellow')[6]);
  for (let k = 0; k < 8; k++) c.rect(bx + 10 + k * 9, by + 48, 4, 7, g[5]);
}

function drawLiberty(c: Canvas): void {
  // a blue field with thirteen stars in a ring, and the bell inside it
  c.rect(0, 0, 152, 200, C('blue')[1]);
  for (let k = 0; k < 7; k++) c.rect(0, 172 + k * 4, 152, 2, k % 2 ? WHITE : C('red')[4]);
  const cx = 76;
  const cy = 86;
  for (let k = 0; k < 13; k++) {
    const a = (k / 13) * Math.PI * 2 - Math.PI / 2;
    star(c, Math.round(cx + Math.cos(a) * 64), Math.round(cy + Math.sin(a) * 64), WHITE);
  }
  // the yoke
  c.rect(cx - 30, cy - 46, 60, 9, C('brown')[1]);
  c.rect(cx - 30, cy - 46, 60, 2, C('brown')[3]);
  c.rect(cx - 5, cy - 37, 10, 6, C('grey')[2]);
  // the bell: a bronze profile, lit from the left, flaring at the lip
  const bronze = [C('brown')[1], C('brown')[3], C('orange')[2], C('orange')[4], C('yellow')[5]];
  const top = cy - 31;
  const tall = 62;
  for (let y = 0; y < tall; y++) {
    const t = y / tall;
    const dome = y < 7 ? Math.sqrt(1 - ((7 - y) / 8) ** 2) : 1;
    const hw = (13 + t * 8 + t ** 5 * 12) * dome;
    for (let x = -Math.ceil(hw); x <= Math.ceil(hw); x++) {
      if (Math.abs(x) > hw) continue;
      const u = x / hw;
      const light = Math.max(0, Math.min(0.999, 0.75 - u * 0.55 - Math.abs(u) ** 4 * 0.4));
      const f = light * bronze.length;
      const i = Math.floor(f);
      const dith = (x + y) % 2 === 0 && f - i > 0.5;
      c.set(cx + x, top + y, bronze[Math.min(bronze.length - 1, dith ? i + 1 : i)]);
    }
  }
  c.rect(cx - 16, top + 14, 33, 2, C('brown')[0]);
  c.rect(cx - 33, top + tall - 2, 67, 2, C('brown')[0]);
  // the crack, up from the lip
  const crack: [number, number][] = [
    [-4, 61],
    [-5, 57],
    [-3, 53],
    [-5, 48],
    [-4, 44],
    [-6, 40],
  ];
  for (let k = 1; k < crack.length; k++) c.line(cx + crack[k - 1][0], top + crack[k - 1][1], cx + crack[k][0], top + crack[k][1], 0);
}

function star(c: Canvas, x: number, y: number, col: number): void {
  c.draw(x - 3, y - 3, ['...X...', '...X...', 'XXXXXXX', '.XXXXX.', '..XXX..', '.XX.XX.', 'X.....X'], { X: col });
}

export const HAILS: Hail[] = [
  {
    world: 'Galileo',
    from: 'PROBE TELEMETRY',
    title: 'GALILEO',
    sub: 'A PROBE FROM EARTH',
    text: 'Its brain is an RCA 1802, the chip that flew to Jupiter. Load 1802, light the Q lamp, count down, wink. Still running.',
    art: drawGalileo,
  },
  {
    world: 'Liberty',
    from: 'INCOMING HAIL',
    title: 'LIBERTY',
    sub: 'THE THIRTEEN STARS',
    text: 'The settlers keep a cracked bell here, under a ring of thirteen stars. PROCLAIM LIBERTY THROUGHOUT ALL THE LAND, it reads. Their archive keeps every letter a courier ever brought.',
    art: drawLiberty,
  },
  {
    world: 'Boxcar Flats',
    from: 'INCOMING HAIL',
    title: 'DR. LEO',
    sub: 'PhD COMEDIC SCIENCE',
    text: "\"A hobo takes a job if one's offered. A tramp won't. Got a parcel, courier? My chicken and I will walk it over.\" He puts his red nose on and tips his hat.",
    art: drawLeo,
  },
];

/** The memory dump on Galileo's page: LDI 18 PHI R1 LDI 02 PLO R1 SEQ DEC R1 GHI R1 BNZ 07 REQ BR 00. */
const DUMP = ['0000 F8 18 B1 F8', '0004 02 A1 7B 21', '0008 91 3A 07 7A', '000C 30 00'];

/** HAILS.GIF and a .BKD window per hail, named after its world's scene: W<n>H.BKD. */
export function hailPages(sceneOf: (world: string) => number): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  const atlas = new Canvas(320, 200 * HAILS.length);
  HAILS.forEach((h, i) => {
    const c = new Canvas();
    spaceBg(c, 700 + i);
    h.art(c);
    c.frame(0, 0, 152, 200, C('grey')[1]);
    // the comm screen
    c.panel(156, 4, 160, 192, C('space')[1], C('cyan')[2], C('cyan')[1]);
    c.rect(157, 5, 158, 11, C('cyan')[1]);
    c.text(162, 7, h.from, C('cyan')[7]);
    c.text(162, 24, h.title, C('yellow').slice(3).reverse(), { scale: 2, outline: 0 });
    c.text(162, 46, h.sub, C('orange')[6]);
    let y = 62;
    if (h.world === 'Galileo') {
      for (const line of DUMP) {
        c.text(162, y, line, C('green')[6]);
        y += 10;
      }
      y += 4;
    }
    if (c.para(162, y, 152, h.text, C('ice')[6], 10) > 182) throw new Error(`hail ${h.title}: too much text`);
    c.text(162, 184, 'ANY KEY TO GO ON', C('grey')[3]);
    atlas.blit(c, 0, i * 200);
    out.set(`w${sceneOf(h.world)}h.bkd`, serializeBackdrop({ x: 0, y: i * 200, gif: 'hails.gif' }));
  });
  out.set('hails.gif', encodeGif({ width: atlas.w, height: atlas.h, pixels: atlas.px, palette: SCREEN.pal }));
  return out;
}
