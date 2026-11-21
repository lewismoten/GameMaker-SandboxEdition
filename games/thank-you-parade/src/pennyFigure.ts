// Penny's drum-major outfit and marching poses.
import type { Pal } from './print';
import { face, limb, type Outfit, type Pose, type XY } from './figureDrawing';

export function pennyOutfit(pal: Pal): Outfit {
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
        p.rect(4, 12 + y, 3, 4, r('hair')[1])
          .set(6, 12 + y, red[3])
          .set(4, 15 + y, r('hair')[0]); // the ponytail and its ribbon
        p.rect(8, 14 + y, 2, 2, skin[1]); // the ear
        face(p, pal, pose.face, 12, 13 + y, skin);
        p.rect(8, 17 + y, 5, 1, gold[3]); // the chin strap
      }
      // the shako: a navy drum, a brass band and plate, a black visor, and the plume
      p.rect(6, 3 + y, 9, 8, navy[2])
        .rect(6, 3 + y, 2, 8, navy[1])
        .rect(13, 3 + y, 1, 8, navy[3]);
      p.rect(6, 3 + y, 9, 1, navy[3]);
      p.rect(6, 9 + y, 9, 1, gold[3]);
      if (!pose.back) {
        p.rect(10, 5 + y, 3, 3, gold[3]).set(11, 6 + y, gold[5]);
        p.rect(11, 10 + y, 5, 1, ink);
      }
      const px = pose.back ? 10 : 9;
      // the plume: a white base and a tall vermilion feather that curls forward
      p.rect(px, 1 + y, 3, 2, white[3])
        .rect(px + 1, 0 + y, 4, 2, red[3])
        .set(px + 4, 1 + y, red[2])
        .set(px + 2, 0 + y, red[4])
        .set(px - 1, 2 + y, white[2]);
    },
  };
}

/** Penny's poses: hands, feet, faces and the mace (held up and forward as she marches). */
export function pennyPoses(): Record<string, Pose> {
  const stand: [XY, XY] = [
    [8, 0],
    [12, 0],
  ];
  return {
    stand: {
      face: 'smile',
      hands: [
        [9, 27],
        [14, 25],
      ],
      feet: stand,
      mace: [16, 14],
    },
    blink: {
      face: 'blink',
      hands: [
        [9, 27],
        [14, 25],
      ],
      feet: stand,
      mace: [16, 14],
    },
    look: {
      face: 'look',
      hands: [
        [9, 27],
        [14, 25],
      ],
      feet: stand,
      mace: [16, 14],
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
        [16, 20],
      ],
      feet: [
        [8, 4],
        [13, 5],
      ],
      mace: [18, 13],
    },
    walk0: {
      face: 'smile',
      hands: [
        [7, 26],
        [15, 24],
      ],
      feet: [
        [6, 0],
        [14, 0],
      ],
      mace: [16, 14],
    },
    walk1: {
      face: 'smile',
      hands: [
        [9, 27],
        [14, 24],
      ],
      feet: [
        [9, 3],
        [11, 0],
      ],
      dip: 1,
      mace: [16, 13],
    },
    walk2: {
      face: 'smile',
      hands: [
        [12, 26],
        [14, 25],
      ],
      feet: [
        [14, 0],
        [6, 0],
      ],
      mace: [16, 14],
    },
    walk3: {
      face: 'smile',
      hands: [
        [9, 27],
        [14, 24],
      ],
      feet: [
        [11, 0],
        [9, 3],
      ],
      dip: 1,
      mace: [16, 13],
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
      mace: [18, 3],
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
      mace: [17, 3],
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
      mace: [2, 9],
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
      mace: [18, 6],
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
