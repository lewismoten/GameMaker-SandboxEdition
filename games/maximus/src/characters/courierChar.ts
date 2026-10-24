// COURIER.CHR / COURIER.CBL: Max on foot, two blocks tall: walking, jet hops, crouching,
// firing every weapon, waving, and the explosion.
import { CHARBL } from '../../../../web/src/formats/blocks';
import { BlockList, NONE, character, setSeq, type F } from './chrkit';
import { SEQ, SND, itemBlock } from '../ids';
import { drawCourier, split, type Pose } from '../sprites/courier';
import { L, explosionFrames, meters, type CharSet, weapons } from './charShared';

// ---------------------------------------------------------------- courier (on foot)

export function courier(): CharSet {
  const cb = new BlockList(CHARBL);
  /** Top from one pose, bottom from another (arms raised leave the legs alone). */
  const P = (p: Pose, legs?: Pose): [number, number] => {
    const [t] = split(drawCourier(p));
    const [, b] = split(drawCourier(legs ?? p));
    return [cb.add(t), cb.add(b)];
  };
  const noArm: Pose = {};
  const stand: Pose = { arm: [10, 20] };
  const walk: Pose[] = [
    { near: [28, 5], far: [-22, -35], arm: [-18, -8], backArm: [22, 35] },
    { near: [12, -10], far: [-8, -48], arm: [6, 15] },
    { near: [-8, -20], far: [10, 0], arm: [20, 35], backArm: [-18, -8] },
    { near: [-22, -35], far: [28, 5], arm: [20, 35], backArm: [-18, -8] },
    { near: [-8, -48], far: [12, -10], arm: [6, 15] },
    { near: [10, 0], far: [-8, -20], arm: [-18, -8], backArm: [22, 35] },
  ];
  const poses: Record<string, [number, number]> = {
    stand: P(stand),
    glint1: P({ ...stand, glint: 0.65 }, stand),
    jet: P({ arm: [60, 120], near: [35, -20], far: [15, -35], flame: 9 }),
    jet2: P({ arm: [55, 110], near: [35, -20], far: [15, -35], flame: 5 }, { arm: [60, 120], near: [35, -20], far: [15, -35], flame: 9 }),
    hover: P({ arm: [40, 60], near: [8, -5], far: [-6, -12], flame: 3 }),
    fire: P({ arm: [80, 90], gun: 'blaster', flash: 2.5 }, noArm),
    fire2: P({ arm: [80, 90], gun: 'blaster' }, noArm),
    lance: P({ arm: [75, 90], gun: 'lance', flash: 3.5, far: [-12, -5] }, noArm),
    lance2: P({ arm: [80, 90], gun: 'lance', far: [-12, -5] }, noArm),
    nova: P({ arm: [100, 120], holding: 'nova', backArm: [-60, -80] }, noArm),
    flak: P({ arm: [150, 175], gun: 'none', backArm: [140, 160], drop: 1 }, noArm),
    shield: P({ arm: [95, 100], backArm: [80, 90], glint: 0.9 }, noArm),
    medkit: P({ arm: [70, 100], holding: 'medkit' }, noArm),
    mine: P({ drop: 6, near: [60, -30], far: [50, -40], arm: [30, 10], lean: 3 }, { drop: 6, near: [60, -30], far: [50, -40], arm: [40, 30], lean: 3 }),
    kneel: P({ drop: 6, near: [60, -30], far: [50, -40], arm: [40, 30], lean: 3 }),
    kneelItem: P(
      { drop: 6, near: [60, -30], far: [50, -40], arm: [45, 60], lean: 3, holding: 'item' },
      { drop: 6, near: [60, -30], far: [50, -40], arm: [40, 30], lean: 3 },
    ),
    hurt: P({ hurt: true, arm: [-40, -60], near: [10, 0], far: [-10, 0], lean: -2 }),
    hail1: P({ arm: [150, 160], backArm: [5, 10] }, noArm),
    hail2: P({ arm: [170, 200], backArm: [5, 10] }, noArm),
    dash: P({ lean: 4, near: [55, 10], far: [-45, -10], arm: [-70, -50], streak: true }),
    die2: P({ drop: 8, near: [80, -40], far: [70, -50], arm: [60, 80], lean: 5 }),
    cheer: P({ arm: [165, 180], backArm: [160, 175] }, noArm),
    cheer2: P({ arm: [140, 150], backArm: [-140, -150] }, noArm),
    land: P({ drop: 4, near: [40, -20], far: [30, -30], arm: [30, 50], lean: 2 }),
  };
  const walkPics = walk.map((p) => P(p));
  const ball = [0, 1, 2, 3].map((k) => cb.add(drawCourier({ ball: k }).crop(0, 20, 20, 20)));
  const boom = explosionFrames(cb);
  const F = (name: string, extra: Partial<F> = {}): F => ({ top: poses[name][0], bottom: poses[name][1], ...extra });

  const c = character();
  meters(c);
  setSeq(c, SEQ.idle, { frames: [F('stand', { pause: 40 }), F('glint1', { pause: 3 }), F('stand', { pause: 60 }), F('glint1', { pause: 2 })] });
  setSeq(c, SEQ.die, {
    sound: SND.die,
    frames: [
      F('hurt', { pause: 3 }),
      F('die2', { pause: 4 }),
      { top: boom[0], bottom: boom[1], pause: 2 },
      { top: boom[2], bottom: boom[3], pause: 2 },
      { top: boom[4], bottom: boom[5], pause: 3 },
      { top: NONE, bottom: boom[6], pause: 4 },
      { top: NONE, bottom: NONE, pause: 10 },
    ],
  });
  // a short flinch with a little recoil hop (it lifts you out of lava and off spikes)
  setSeq(c, SEQ.hurt, { sound: SND.hurt, momentum: true, frames: [F('hurt', { y: -5, pause: 1 }), F('stand', { pause: 1 })] });
  setSeq(c, SEQ.pickup, {
    key: 'g',
    sound: SND.pickup,
    joy: [5, 2],
    frames: [F('land', { pause: 1 }), F('kneel', { pause: 3 }), F('kneelItem', { pause: 3 })],
  });
  setSeq(c, SEQ.drop, { key: 'b', sound: SND.drop, frames: [F('kneelItem', { pause: 3 }), F('kneel', { pause: 2 })] });
  const steps = [5, 5, 4, 5, 5, 4];
  setSeq(c, SEQ.right, { key: 'right', joy: [3, 0], frames: walkPics.map(([t, b], k) => ({ top: t, bottom: b, x: steps[k] })) });
  setSeq(c, SEQ.left, { key: 'left', joy: [7, 0], frames: walkPics.map(([t, b], k) => ({ top: t, bottom: b, x: -steps[k], o: L })) });
  setSeq(c, SEQ.up, {
    key: 'up',
    sound: SND.jump,
    momentum: true,
    norepeat: true,
    joy: [1, 0],
    frames: [F('jet', { y: -12 }), F('jet2', { pause: 1 })],
  });
  setSeq(c, SEQ.down, { key: 'down', sound: SND.crouch, momentum: true, joy: [5, 4], frames: ball.map((b) => ({ top: NONE, bottom: b, y: 2, pause: 2 })) });
  weapons(c, (n) => F(poses[n] ? n : n.replace(/2$/, '')));
  setSeq(c, SEQ.dashR, {
    key: 'e',
    sound: SND.dash,
    bloc: itemBlock('dash'),
    momentum: true,
    norepeat: true,
    frames: [F('dash', { x: 9 }), F('dash', { x: 5 }), F('dash', { pause: 2 })],
  });
  setSeq(c, SEQ.dashL, {
    key: 'q',
    sound: SND.dash,
    bloc: itemBlock('dash'),
    momentum: true,
    norepeat: true,
    frames: [F('dash', { x: -9, o: L }), F('dash', { x: -5, o: L }), F('dash', { o: L, pause: 2 })],
  });
  setSeq(c, SEQ.hover, {
    key: 'f',
    sound: SND.hover,
    bloc: itemBlock('hover'),
    momentum: true,
    frames: [F('hover', { y: -2 }), F('jet2', { y: -1 }), F('hover', { y: -2 }), F('jet2', { y: -1 })],
  });
  setSeq(c, SEQ.hail, {
    key: 't',
    sound: SND.hail,
    norepeat: true,
    frames: [
      F('hail1', { pause: 3 }),
      F('hail2', { pause: 3 }),
      F('hail1', { pause: 3 }),
      F('hail2', { pause: 3 }),
      F('cheer', { pause: 4 }),
      F('cheer2', { pause: 4 }),
      F('stand', { pause: 2 }),
    ],
  });

  // The spare slots: more frames for the idle and the walk cycle would be invisible, so
  // they hold the courier's victory poses (used on the title and ending art).
  return { name: 'courier', chr: c, cbl: cb.full(), used: cb.blocks.length };
}
