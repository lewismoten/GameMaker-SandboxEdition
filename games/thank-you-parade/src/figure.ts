// The game's two heroes, drawn for this game in the poster style: flat inks, one ink line around the whole figure.
//   Penny   the Hornets' drum major: a tall navy shako with a brass plate and a red-and-white plume, a vermilion coat with
//           a white cross-belt and brass buttons, navy trousers with a brass stripe, and her mace (a brass-headed baton).
//   Marge   the crop duster pilot who tows the THANK YOU banner: a leather flying helmet with goggles pushed up, silver curls,
//           a white scarf, a leather jacket with a fleece collar, khaki trousers and boots.
// Each pose is drawn whole at 20x40 and cut into the top and bottom blocks the character file (kit/starter/heroChar.ts) asks
// for by name, facing right (the file mirrors them for walking left).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import { inkLine, type Pal } from './print';

const T = 255;
type XY = [number, number];
export type Face = 'smile' | 'blink' | 'ouch' | 'cheer' | 'oh' | 'look';

/** One pose: where the hands and feet are (feet as [x, lift]), the face, and whether we see the back (climbing). */
export interface Pose {
  face: Face;
  back?: boolean;
  hands: [XY, XY]; // the far hand, the near hand
  feet: [XY, XY]; // the far foot, the near foot: [x, lift off the ground]
  /** The whole figure a pixel lower (a step's dip). */
  dip?: number;
  /** Penny's mace: the point its brass head reaches, held in the near hand (none when absent). */
  mace?: XY;
}

/** A thick stroke from (x0, y0) to (x1, y1), `w` pixels across. */
function limb(p: Pixels, x0: number, y0: number, x1: number, y1: number, w: number, c: number): void {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
  const h = Math.floor(w / 2);
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n);
    const y = Math.round(y0 + ((y1 - y0) * i) / n);
    p.rect(x - h, y - h, w, w, c);
  }
}

/** What one hero wears: the colors and the head, drawn by the hero's own code. */
interface Outfit {
  coat: number[];
  coatEdge?: number[];
  trousers: number[];
  stripe: number;
  boots: number[];
  skin: number[];
  cuff: number;
  /** The head and hat (or helmet), with the face, onto `p` with the figure lowered by `dy`. */
  head: (p: Pixels, pose: Pose, dy: number) => void;
  /** Details on the coat (belts, buttons, a scarf), after the arms behind and before the near arm. */
  coatDetail: (p: Pixels, pose: Pose, dy: number) => void;
  /** Top of the torso and bottom of the hips (Penny's coat is longer than Marge's jacket). */
  torso: [number, number];
}

function face(p: Pixels, pal: Pal, f: Face, ex: number, ey: number, skin: number[]): void {
  const ink = pal.c('ink', 0);
  switch (f) {
    case 'blink':
      p.rect(ex - 1, ey + 1, 2, 1, ink);
      break;
    case 'ouch':
      p.set(ex - 1, ey, ink).set(ex, ey + 1, ink).set(ex - 1, ey + 2, ink);
      p.rect(ex, ey + 3, 2, 2, ink);
      break;
    case 'cheer':
      p.set(ex - 1, ey + 1, ink).set(ex, ey, ink).set(ex + 1, ey + 1, ink);
      p.rect(ex - 1, ey + 3, 3, 2, ink).set(ex, ey + 4, pal.c('red', 3));
      break;
    case 'oh':
      p.rect(ex, ey - 1, 1, 2, ink);
      p.rect(ex, ey + 3, 2, 2, ink);
      break;
    case 'look':
      p.rect(ex - 2, ey, 1, 2, ink);
      p.rect(ex - 1, ey + 4, 2, 1, skin[0]);
      break;
    default:
      p.rect(ex, ey, 1, 2, ink);
      p.set(ex - 1, ey + 4, skin[0]).set(ex, ey + 4, skin[0]).set(ex + 1, ey + 3, skin[0]);
  }
  // a dash of blush, printed as two dots
  if (f !== 'ouch') p.set(ex - 2, ey + 3, pal.c('pink', 2));
}

function draw(pal: Pal, o: Outfit, pose: Pose): Pixels {
  const p = new Pixels(20, 40, T);
  const dy = pose.dip ?? 0;
  const ink = pal.c('ink', 0);
  const [top, hip] = o.torso;
  const sh: XY = [10, top + 1 + dy];
  // legs: the far one in the trousers' shadow, then the near one
  pose.feet.forEach(([fx, lift], i) => {
    const hx = i ? 11 : 9;
    const fy = 37 - lift;
    const tr = o.trousers;
    limb(p, hx, hip + dy, fx, fy - 1, 3, i ? tr[2] : tr[1]);
    if (i) limb(p, hx + 1, hip + 1 + dy, fx + 1, fy - 1, 1, o.stripe);
    const b = o.boots;
    p.rect(fx - 1, fy, 4, 3, i ? b[1] : b[0]);
    p.rect(fx + (pose.back ? -1 : 2), fy + 1, 1, 2, i ? b[1] : b[0]);
    if (i) p.set(fx, fy, b[3] ?? b[2]);
  });
  // the far arm, behind the body
  const far = pose.hands[0];
  limb(p, sh[0] - 1, sh[1], far[0], far[1] + dy, 3, o.coat[1]);
  p.rect(far[0] - 1, far[1] + dy - 1, 3, 3, o.cuff);
  // the torso
  const c = o.coat;
  p.rect(6, top + dy, 9, hip - top + 1, c[2]);
  p.rect(6, top + dy, 2, hip - top + 1, c[1]);
  p.rect(13, top + 1 + dy, 1, hip - top - 1, c[3]);
  if (o.coatEdge) p.rect(6, hip + dy, 9, 1, o.coatEdge[1]);
  o.coatDetail(p, pose, dy);
  o.head(p, pose, dy);
  // the near arm, and the mace in its hand
  const near = pose.hands[1];
  if (pose.mace) {
    const [mx, my] = pose.mace;
    const hx = near[0];
    const hy = near[1] + dy;
    const bx = Math.round(hx - (mx - hx) * 0.35);
    const by = Math.round(hy - (my - hy) * 0.35);
    limb(p, bx, by, mx, my + dy, 1, pal.c('blue', 1));
    for (let k = 1; k < 5; k++) p.set(Math.round(hx + ((mx - hx) * k) / 5), Math.round(hy + ((my + dy - hy) * k) / 5), pal.c('gold', 3)); // the cord
    p.disc(mx, my + dy, 1.6, pal.c('gold', 3)).set(mx - 1, my + dy - 1, pal.c('gold', 5));
    p.set(bx, by, pal.c('gold', 4));
  }
  limb(p, sh[0], sh[1], near[0], near[1] + dy, 3, c[3]);
  p.rect(sh[0] - 1, sh[1] - 1, 3, 2, c[3]);
  p.rect(near[0] - 1, near[1] + dy - 1, 3, 3, o.cuff);
  void ink;
  return inkLine(p, pal.c('ink', 0));
}

// ---- Penny

function pennyOutfit(pal: Pal): Outfit {
  const { c, r } = pal;
  const ink = c('ink', 0);
  const skin = r('skin');
  const gold = r('gold');
  const red = r('red');
  const navy = r('blue');
  const white = r('white');
  return {
    coat: red,
    coatEdge: gold,
    trousers: navy,
    stripe: gold[3],
    boots: [ink, c('ink', 1), c('ink', 2), white[3]],
    skin,
    cuff: white[3],
    torso: [18, 29],
    coatDetail: (p, pose, dy) => {
      if (pose.back) {
        // the cross-belts make an X on her back
        limb(p, 7, 19 + dy, 13, 27 + dy, 1, white[3]);
        limb(p, 13, 19 + dy, 7, 27 + dy, 1, white[3]);
        return;
      }
      limb(p, 8, 19 + dy, 13, 27 + dy, 2, white[3]); // the cross-belt
      for (const y of [20, 23, 26]) p.set(13, y + dy, gold[4]); // brass buttons
      p.rect(6, 27 + dy, 9, 1, white[2]); // the belt
      p.rect(7, 18 + dy, 4, 2, gold[3]).rect(7, 18 + dy, 4, 1, gold[5]); // the epaulette
      p.rect(5, 26 + dy, 2, 4, red[1]); // the coat's tails
    },
    head: (p, pose, dy) => {
      const y = dy;
      // the face (or the back of her head), ears and ponytail
      if (pose.back) {
        p.rect(7, 11 + y, 7, 7, r('hair')[1]);
        p.rect(9, 15 + y, 3, 4, r('hair')[0]).set(10, 14 + y, red[3]);
      } else {
        p.rect(7, 11 + y, 7, 7, skin[2]).rect(13, 12 + y, 1, 5, skin[3]);
        p.rect(7, 11 + y, 3, 3, r('hair')[1]);
        p.rect(4, 12 + y, 3, 4, r('hair')[1]).set(6, 12 + y, red[3]).set(4, 15 + y, r('hair')[0]); // the ponytail and its ribbon
        p.rect(8, 14 + y, 2, 2, skin[1]); // the ear
        face(p, pal, pose.face, 12, 13 + y, skin);
        p.rect(8, 17 + y, 5, 1, gold[3]); // the chin strap
      }
      // the shako: a navy drum, a brass band and plate, a black visor, and the plume
      p.rect(6, 3 + y, 9, 8, navy[2]).rect(6, 3 + y, 2, 8, navy[1]).rect(13, 3 + y, 1, 8, navy[3]);
      p.rect(6, 3 + y, 9, 1, navy[3]);
      p.rect(6, 9 + y, 9, 1, gold[3]);
      if (!pose.back) {
        p.rect(10, 5 + y, 3, 3, gold[3]).set(11, 6 + y, gold[5]);
        p.rect(11, 10 + y, 5, 1, ink);
      }
      const px = pose.back ? 10 : 9;
      // the plume: a white base and a tall vermilion feather that curls forward
      p.rect(px, 1 + y, 3, 2, white[3]).rect(px + 1, 0 + y, 4, 2, red[3]).set(px + 4, 1 + y, red[2]).set(px + 2, 0 + y, red[4]).set(px - 1, 2 + y, white[2]);
    },
  };
}

/** Penny's poses: hands, feet, faces and the mace (held up and forward as she marches). */
function pennyPoses(): Record<string, Pose> {
  const stand: [XY, XY] = [
    [8, 0],
    [12, 0],
  ];
  return {
    stand: { face: 'smile', hands: [[9, 27], [14, 25]], feet: stand, mace: [16, 14] },
    blink: { face: 'blink', hands: [[9, 27], [14, 25]], feet: stand, mace: [16, 14] },
    look: { face: 'look', hands: [[9, 27], [14, 25]], feet: stand, mace: [16, 14] },
    hurt: { face: 'ouch', hands: [[5, 23], [16, 21]], feet: [[6, 0], [13, 0]] },
    jump: { face: 'cheer', hands: [[5, 22], [16, 20]], feet: [[8, 4], [13, 5]], mace: [18, 13] },
    walk0: { face: 'smile', hands: [[7, 26], [15, 24]], feet: [[6, 0], [14, 0]], mace: [16, 14] },
    walk1: { face: 'smile', hands: [[9, 27], [14, 24]], feet: [[9, 3], [11, 0]], dip: 1, mace: [16, 13] },
    walk2: { face: 'smile', hands: [[12, 26], [14, 25]], feet: [[14, 0], [6, 0]], mace: [16, 14] },
    walk3: { face: 'smile', hands: [[9, 27], [14, 24]], feet: [[11, 0], [9, 3]], dip: 1, mace: [16, 13] },
    jumpup: { face: 'cheer', hands: [[6, 12], [18, 12]], feet: [[8, 3], [12, 5]], mace: [18, 3] },
    fall: { face: 'oh', hands: [[4, 18], [17, 17]], feet: [[7, 0], [13, 1]] },
    cheer: { face: 'cheer', hands: [[6, 12], [18, 12]], feet: stand, mace: [17, 3] },
    dig0: { face: 'smile', hands: [[12, 30], [15, 31]], feet: [[6, 0], [12, 0]] },
    dig1: { face: 'smile', hands: [[11, 26], [14, 27]], feet: [[6, 0], [12, 0]] },
    throw0: { face: 'smile', hands: [[8, 26], [5, 16]], feet: stand, mace: [2, 9] },
    throw1: { face: 'cheer', hands: [[7, 25], [16, 15]], feet: [[7, 0], [12, 0]], mace: [18, 6] },
    throw2: { face: 'smile', hands: [[8, 26], [16, 22]], feet: stand },
    climb0: { face: 'smile', back: true, hands: [[5, 12], [15, 16]], feet: [[8, 2], [12, 0]] },
    climb1: { face: 'smile', back: true, hands: [[5, 16], [15, 12]], feet: [[8, 0], [12, 2]] },
  };
}

// ---- Marge

function margeOutfit(pal: Pal): Outfit {
  const { c, r } = pal;
  const ink = c('ink', 0);
  const skin = r('skinB');
  const leather = r('leather');
  const white = r('white');
  const silver = r('silver');
  return {
    coat: leather,
    trousers: r('parch').map((_, i, a) => a[Math.max(0, i - 1)]),
    stripe: c('parch', 1),
    boots: [leather[0], leather[1], leather[2], leather[3]],
    skin,
    cuff: skin[2],
    torso: [19, 28],
    coatDetail: (p, pose, dy) => {
      const paper = c('paper', 3);
      if (pose.back) {
        p.rect(7, 19 + dy, 7, 2, paper); // the fleece collar
        p.rect(9, 21 + dy, 3, 4, white[3]).rect(10, 25 + dy, 1, 2, white[2]); // the scarf hanging down her back
        return;
      }
      p.rect(8, 19 + dy, 6, 2, paper).set(13, 21 + dy, paper); // the fleece collar
      p.rect(12, 22 + dy, 1, 6, leather[0]); // the zip
      p.rect(6, 27 + dy, 9, 2, leather[1]); // the waistband
      // the white scarf, its tail streaming back over her shoulder
      p.rect(9, 18 + dy, 4, 2, white[3]);
      p.rect(4, 19 + dy, 5, 2, white[3]).rect(2, 21 + dy, 3, 2, white[2]).set(1, 23 + dy, white[2]);
    },
    head: (p, pose, dy) => {
      const y = dy;
      if (pose.back) {
        p.rect(7, 9 + y, 7, 9, leather[2]).rect(7, 9 + y, 7, 1, leather[3]);
        p.rect(6, 15 + y, 2, 3, silver[2]).rect(13, 15 + y, 2, 3, silver[2]);
        p.rect(7, 11 + y, 7, 1, ink); // the goggle strap
        return;
      }
      p.rect(7, 11 + y, 7, 7, skin[2]).rect(13, 12 + y, 1, 5, skin[3]);
      p.rect(5, 14 + y, 3, 4, silver[2]).set(5, 17 + y, silver[1]).set(6, 14 + y, silver[3]); // curls out the back
      face(p, pal, pose.face, 12, 13 + y, skin);
      p.set(11, 12 + y, silver[1]).set(12, 12 + y, silver[1]); // a gray brow
      // the leather helmet with its ear flap and strap
      p.rect(6, 8 + y, 8, 4, leather[2]).rect(7, 7 + y, 6, 1, leather[2]).rect(6, 8 + y, 2, 4, leather[1]);
      p.rect(7, 12 + y, 3, 4, leather[2]).rect(8, 16 + y, 3, 1, leather[0]);
      p.set(10, 7 + y, leather[3]).set(9, 8 + y, leather[3]);
      // goggles pushed up on the helmet: brass rims, teal lenses
      p.rect(10, 9 + y, 5, 3, c('gold', 3)).rect(11, 10 + y, 3, 1, c('teal', 3)).set(12, 10 + y, c('teal', 4));
    },
  };
}

function margePoses(): Record<string, Pose> {
  const stand: [XY, XY] = [
    [8, 0],
    [12, 0],
  ];
  return {
    stand: { face: 'smile', hands: [[8, 27], [13, 27]], feet: stand },
    blink: { face: 'blink', hands: [[8, 27], [13, 27]], feet: stand },
    look: { face: 'look', hands: [[8, 27], [13, 27]], feet: stand },
    hurt: { face: 'ouch', hands: [[5, 23], [16, 21]], feet: [[6, 0], [13, 0]] },
    jump: { face: 'cheer', hands: [[5, 22], [16, 21]], feet: [[8, 4], [13, 5]] },
    walk0: { face: 'smile', hands: [[7, 26], [15, 25]], feet: [[6, 0], [14, 0]] },
    walk1: { face: 'smile', hands: [[9, 27], [13, 27]], feet: [[9, 3], [11, 0]], dip: 1 },
    walk2: { face: 'smile', hands: [[13, 26], [8, 26]], feet: [[14, 0], [6, 0]] },
    walk3: { face: 'smile', hands: [[9, 27], [13, 27]], feet: [[11, 0], [9, 3]], dip: 1 },
    jumpup: { face: 'cheer', hands: [[6, 12], [18, 12]], feet: [[8, 3], [12, 5]] },
    fall: { face: 'oh', hands: [[4, 18], [17, 17]], feet: [[7, 0], [13, 1]] },
    cheer: { face: 'cheer', hands: [[6, 12], [18, 12]], feet: stand },
    dig0: { face: 'smile', hands: [[12, 30], [15, 31]], feet: [[6, 0], [12, 0]] },
    dig1: { face: 'smile', hands: [[11, 26], [14, 27]], feet: [[6, 0], [12, 0]] },
    throw0: { face: 'smile', hands: [[8, 26], [5, 16]], feet: stand },
    throw1: { face: 'cheer', hands: [[7, 25], [16, 15]], feet: [[7, 0], [12, 0]] },
    throw2: { face: 'smile', hands: [[8, 26], [16, 22]], feet: stand },
    climb0: { face: 'smile', back: true, hands: [[5, 12], [15, 16]], feet: [[8, 2], [12, 0]] },
    climb1: { face: 'smile', back: true, hands: [[5, 16], [15, 12]], feet: [[8, 0], [12, 2]] },
  };
}

/** The (top, bottom) block names each pose fills, in the order the character file was always built in. */
const PAIRS: [string, string, string][] = [
  ['stand', 'stand.top', 'stand'],
  ['blink', 'blink.top', 'stand'],
  ['hurt', 'hurt.top', 'hurt'],
  ['jump', 'cheer.top', 'jump'],
  ['walk0', 'stand.top', 'walk0'],
  ['walk1', 'stand.top', 'walk1'],
  ['walk2', 'stand.top', 'walk2'],
  ['walk3', 'stand.top', 'walk3'],
  ['jumpup', 'up.top', 'jumpup'],
  ['fall', 'oh.top', 'fall'],
  ['cheer', 'cheer2.top', 'cheer'],
  ['look', 'look.top', 'stand'],
  ['dig0', 'stand.top', 'dig0'],
  ['dig1', 'stand.top', 'dig1'],
  ['throw0', 'stand.top', 'throw0'],
  ['throw1', 'cheer.top', 'throw1'],
  ['throw2', 'stand.top', 'throw2'],
  ['climb0', 'back.top', 'climb0'],
  ['climb1', 'back.top', 'climb1'],
];

function heroBook(pal: Pal, o: Outfit, poses: Record<string, Pose>): Book {
  const book = new Book('cbl');
  for (const [pose, top, bottom] of PAIRS) {
    const whole = draw(pal, o, poses[pose]);
    if (!book.has(top)) book.add(top, whole.crop(0, 0, 20, 20));
    if (!book.has(bottom)) book.add(bottom, whole.crop(0, 20, 20, 20));
  }
  return book;
}

/** Penny's character blocks (.CBL). */
export const buildPennyBlocks = (pal: Pal): Book => heroBook(pal, pennyOutfit(pal), pennyPoses());

/** Marge's character blocks (.CBL). */
export const buildMargeBlocks = (pal: Pal): Book => heroBook(pal, margeOutfit(pal), margePoses());

/** A pose drawn whole, 20x40 (for title screens and cartoons, where the walking top and the stride belong together). */
export function figure(pal: Pal, who: 'penny' | 'marge', pose: string): Pixels {
  return who === 'penny' ? draw(pal, pennyOutfit(pal), pennyPoses()[pose]) : draw(pal, margeOutfit(pal), margePoses()[pose]);
}
