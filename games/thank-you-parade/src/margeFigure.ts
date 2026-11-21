// Marge's pilot outfit and flying poses.
import type { Pal } from './print';
import { face, type Outfit, type Pose, type XY } from './figureDrawing';

export function margeOutfit(pal: Pal): Outfit {
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
      p.rect(4, 19 + dy, 5, 2, white[3])
        .rect(2, 21 + dy, 3, 2, white[2])
        .set(1, 23 + dy, white[2]);
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
      p.rect(5, 14 + y, 3, 4, silver[2])
        .set(5, 17 + y, silver[1])
        .set(6, 14 + y, silver[3]); // curls out the back
      face(p, pal, pose.face, 12, 13 + y, skin);
      p.set(11, 12 + y, silver[1]).set(12, 12 + y, silver[1]); // a gray brow
      // the leather helmet with its ear flap and strap
      p.rect(6, 8 + y, 8, 4, leather[2])
        .rect(7, 7 + y, 6, 1, leather[2])
        .rect(6, 8 + y, 2, 4, leather[1]);
      p.rect(7, 12 + y, 3, 4, leather[2]).rect(8, 16 + y, 3, 1, leather[0]);
      p.set(10, 7 + y, leather[3]).set(9, 8 + y, leather[3]);
      // goggles pushed up on the helmet: brass rims, teal lenses
      p.rect(10, 9 + y, 5, 3, c('gold', 3))
        .rect(11, 10 + y, 3, 1, c('teal', 3))
        .set(12, 10 + y, c('teal', 4));
    },
  };
}

export function margePoses(): Record<string, Pose> {
  const stand: [XY, XY] = [
    [8, 0],
    [12, 0],
  ];
  return {
    stand: {
      face: 'smile',
      hands: [
        [8, 27],
        [13, 27],
      ],
      feet: stand,
    },
    blink: {
      face: 'blink',
      hands: [
        [8, 27],
        [13, 27],
      ],
      feet: stand,
    },
    look: {
      face: 'look',
      hands: [
        [8, 27],
        [13, 27],
      ],
      feet: stand,
    },
    hurt: {
      face: 'ouch',
      hands: [
        [5, 23],
        [16, 21],
      ],
      feet: [
        [6, 0],
        [13, 0],
      ],
    },
    jump: {
      face: 'cheer',
      hands: [
        [5, 22],
        [16, 21],
      ],
      feet: [
        [8, 4],
        [13, 5],
      ],
    },
    walk0: {
      face: 'smile',
      hands: [
        [7, 26],
        [15, 25],
      ],
      feet: [
        [6, 0],
        [14, 0],
      ],
    },
    walk1: {
      face: 'smile',
      hands: [
        [9, 27],
        [13, 27],
      ],
      feet: [
        [9, 3],
        [11, 0],
      ],
      dip: 1,
    },
    walk2: {
      face: 'smile',
      hands: [
        [13, 26],
        [8, 26],
      ],
      feet: [
        [14, 0],
        [6, 0],
      ],
    },
    walk3: {
      face: 'smile',
      hands: [
        [9, 27],
        [13, 27],
      ],
      feet: [
        [11, 0],
        [9, 3],
      ],
      dip: 1,
    },
    jumpup: {
      face: 'cheer',
      hands: [
        [6, 12],
        [18, 12],
      ],
      feet: [
        [8, 3],
        [12, 5],
      ],
    },
    fall: {
      face: 'oh',
      hands: [
        [4, 18],
        [17, 17],
      ],
      feet: [
        [7, 0],
        [13, 1],
      ],
    },
    cheer: {
      face: 'cheer',
      hands: [
        [6, 12],
        [18, 12],
      ],
      feet: stand,
    },
    dig0: {
      face: 'smile',
      hands: [
        [12, 30],
        [15, 31],
      ],
      feet: [
        [6, 0],
        [12, 0],
      ],
    },
    dig1: {
      face: 'smile',
      hands: [
        [11, 26],
        [14, 27],
      ],
      feet: [
        [6, 0],
        [12, 0],
      ],
    },
    throw0: {
      face: 'smile',
      hands: [
        [8, 26],
        [5, 16],
      ],
      feet: stand,
    },
    throw1: {
      face: 'cheer',
      hands: [
        [7, 25],
        [16, 15],
      ],
      feet: [
        [7, 0],
        [12, 0],
      ],
    },
    throw2: {
      face: 'smile',
      hands: [
        [8, 26],
        [16, 22],
      ],
      feet: stand,
    },
    climb0: {
      face: 'smile',
      back: true,
      hands: [
        [5, 12],
        [15, 16],
      ],
      feet: [
        [8, 2],
        [12, 0],
      ],
    },
    climb1: {
      face: 'smile',
      back: true,
      hands: [
        [5, 16],
        [15, 12],
      ],
      feet: [
        [8, 0],
        [12, 2],
      ],
    },
  };
}
