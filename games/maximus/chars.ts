// The four ways Max gets around, as .CHR/.CBL pairs: on foot (COURIER), the courier pod in
// space (POD), the diving bell under the seas (DIVER) and the rover (ROVER). They share
// sequence numbers, so ammunition counted in one carries over to the others.
import { Pixels, rng } from '../kit/pixels';
import { CLEAR, Mask, fill, shade } from './art';
import { WHITE, shared } from './palette';
import { CHARBL } from '../../web/src/formats/blocks';
import type { Character } from '../../web/src/formats/character';
import { INF_REPEAT } from '../../web/src/formats/character';
import { BlockList, NONE, character, setSeq, type F } from './chrkit';
import { MON, SEQ, SND, itemBlock } from './common';
import { drawCourier, split, type Pose } from './courier';
import { drawDiver, drawPod, drawRover } from './vehicles';

export interface CharSet {
  name: string;
  chr: Character;
  cbl: ReturnType<BlockList['full']>;
  used: number;
}

/** Facing left: both blocks mirrored. */
const L = 4;

/** Start values shared by every character (the first scene's .CHR sets them for the game). */
function meters(c: Character): void {
  c.meter.fill(INF_REPEAT);
  c.meter[0] = 100; // hit points
  c.meter[1] = 3; // lives
  c.meter[3] = 1; // credits (shown as meter - 1)
  for (let i = 20; i < 30; i++) c.meter[i] = 0; // star-shards
  c.meter[SEQ.plasma] = 20;
  c.meter[SEQ.nova] = 3;
  c.meter[SEQ.shield] = 3;
  c.meter[SEQ.mine] = 6;
  c.meter[SEQ.medkit] = 2;
  c.meter[SEQ.flak] = 10;
}

/** The weapon sequences every vehicle has (the frames that fire are the same). */
function weapons(c: Character, pose: (name: string) => F, extra: { fireY?: number } = {}): void {
  const fy = extra.fireY ?? 0;
  setSeq(c, SEQ.fire, { key: 'space', sound: SND.fire, joy: [9, 1], frames: [{ birth: MON.bolt, y: fy }, pose('fire'), { ...pose('fire2'), pause: 3 }] });
  setSeq(c, SEQ.plasma, {
    key: 'z',
    sound: SND.plasma,
    bloc: itemBlock('plasma'),
    joy: [9, 2],
    frames: [{ birth: MON.plasma, y: fy }, pose('lance'), { ...pose('lance2'), pause: 5 }],
  });
  setSeq(c, SEQ.nova, {
    key: 'x',
    sound: SND.nova,
    bloc: itemBlock('nova'),
    norepeat: true,
    frames: [pose('nova'), ...Array.from({ length: 8 }, (_, k) => ({ birth: MON.nova + k, y: fy })), { ...pose('nova'), pause: 4 }],
  });
  setSeq(c, SEQ.shield, {
    key: 'c',
    sound: SND.shield,
    bloc: itemBlock('shield'),
    norepeat: true,
    frames: [
      { birth: MON.shield, y: fy },
      { ...pose('shield'), pause: 4 },
    ],
  });
  setSeq(c, SEQ.mine, {
    key: 'v',
    sound: SND.mine,
    bloc: itemBlock('mine'),
    norepeat: true,
    frames: [
      { birth: MON.mine, y: 20 },
      { ...pose('mine'), pause: 4 },
    ],
  });
  setSeq(c, SEQ.medkit, {
    key: 'h',
    sound: SND.medkit,
    bloc: itemBlock('medkit'),
    norepeat: true,
    frames: [
      { ...pose('medkit'), pause: 3 },
      { birth: MON.healPod, y: fy },
      { ...pose('medkit'), pause: 3 },
    ],
  });
  setSeq(c, SEQ.flak, {
    key: 'w',
    sound: SND.flak,
    bloc: itemBlock('flak'),
    frames: [
      { birth: MON.flakL, y: fy },
      { birth: MON.nova, y: fy },
      { birth: MON.flakR, y: fy },
      { ...pose('flak'), pause: 4 },
    ],
  });
}

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
  setSeq(c, SEQ.pickup, { key: 'p', sound: SND.pickup, joy: [5, 2], frames: [F('kneel', { pause: 3 }), F('kneelItem', { pause: 3 })] });
  setSeq(c, SEQ.drop, { key: 'd', sound: SND.drop, frames: [F('kneelItem', { pause: 3 }), F('kneel', { pause: 2 })] });
  const steps = [5, 5, 4, 5, 5, 4];
  setSeq(c, SEQ.right, { key: 'right', joy: [3, 0], frames: walkPics.map(([t, b], k) => ({ top: t, bottom: b, x: steps[k] })) });
  setSeq(c, SEQ.left, { key: 'left', joy: [7, 0], frames: walkPics.map(([t, b], k) => ({ top: t, bottom: b, x: -steps[k], o: L })) });
  setSeq(c, SEQ.up, { key: 'up', sound: SND.jump, momentum: true, norepeat: true, joy: [1, 0], frames: [F('jet', { y: -12 }), F('jet2', { pause: 1 })] });
  setSeq(c, SEQ.down, { key: 'down', sound: SND.crouch, momentum: true, joy: [5, 4], frames: ball.map((b) => ({ top: NONE, bottom: b, y: 2, pause: 2 })) });
  weapons(c, (n) => F(n === 'flak' ? 'flak' : n));
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
    frames: [F('hail1', { pause: 3 }), F('hail2', { pause: 3 }), F('hail1', { pause: 3 }), F('hail2', { pause: 3 }), F('stand', { pause: 2 })],
  });

  // The spare slots: more frames for the idle and the walk cycle would be invisible, so
  // they hold the courier's victory poses (used on the title and ending art).
  return { name: 'courier', chr: c, cbl: cb.full(), used: cb.blocks.length };
}

/** A 20x40 explosion in four steps plus debris, as character blocks. */
function explosionFrames(cb: BlockList): number[] {
  const out: number[] = [];
  for (let k = 0; k < 3; k++) {
    const p = drawBoom(k);
    out.push(cb.add(p.crop(0, 0, 20, 20)), cb.add(p.crop(0, 20, 20, 20)));
  }
  out.push(cb.add(drawBoom(3).crop(0, 20, 20, 20)));
  return out;
}

export function drawBoom(k: number, w = 20, h = 40): Pixels {
  const c = new Pixels(w, h, CLEAR);
  const flame = shared.get('flame')!;
  const r = rng(11 + k);
  const cy = h * 0.6;
  if (k < 3) {
    const rad = [6, 9, 8][k];
    const m = new Mask(w, h);
    for (let i = 0; i < 9; i++) m.ellipse(w / 2 + (r() - 0.5) * rad, cy + (r() - 0.5) * rad * 1.6, rad * (0.4 + r() * 0.5), rad * (0.4 + r() * 0.5));
    shade(c, m, k === 2 ? flame.slice(0, 4) : flame.slice(1, 6), { dither: true, seed: k });
    if (k < 2) fill(c, new Mask(w, h).ellipse(w / 2, cy, rad * 0.35, rad * 0.35), WHITE);
    if (k === 2) {
      const smoke = new Mask(w, h);
      for (let i = 0; i < 5; i++) smoke.ellipse(w / 2 + (r() - 0.5) * 14, cy - 8 + (r() - 0.5) * 10, 3, 3);
      shade(c, smoke, shared.get('metal')!.slice(0, 4));
    }
  } else {
    for (let i = 0; i < 14; i++) c.set(2 + r() * (w - 4), h - 3 - r() * 8, shared.get('metal')![Math.floor(r() * 4)]);
    for (let i = 0; i < 6; i++) c.set(2 + r() * (w - 4), h - 2 - r() * 4, flame[2 + Math.floor(r() * 3)]);
  }
  return c;
}

export { drawPod, drawDiver, drawRover };

// ---------------------------------------------------------------- vehicles

type VehicleKind = 'pod' | 'diver' | 'rover';

/** Pod, diving bell and rover: one block tall (only the bottom block is drawn). */
export function vehicle(kind: VehicleKind): CharSet {
  const cb = new BlockList(CHARBL);
  const one = (p: Pixels) => cb.add(p);
  const c = character();
  meters(c);
  const boom = [0, 1, 2, 3].map((k) => one(drawBoom(k, 20, 20)));
  const B = (bottom: number, extra: Partial<F> = {}): F => ({ top: NONE, bottom, ...extra });

  if (kind === 'pod') {
    const dirs = ['r', 'l', 'u', 'd'] as const;
    const thrust = Object.fromEntries(dirs.map((d) => [d, [0, 1, 2].map((f) => one(drawPod(d, { flicker: f, glow: f & 1 })))])) as Record<
      (typeof dirs)[number],
      number[]
    >;
    const idle = [0, 1].map((g) => one(drawPod('idle', { glow: g })));
    const diag = (['ur', 'ul', 'dr', 'dl'] as const).map((d) => one(drawPod(d, { flicker: 1 })));
    const hurt = one(drawPod('idle', { hurt: true }));
    const fire = one(drawPod('idle', { glow: 1 }));
    setSeq(c, SEQ.idle, { frames: [B(idle[0], { pause: 9 }), B(idle[1], { pause: 9 })] });
    setSeq(c, SEQ.die, { sound: SND.die, frames: [B(hurt, { pause: 2 }), ...boom.map((b) => B(b, { pause: 3 })), B(NONE, { pause: 10 })] });
    setSeq(c, SEQ.hurt, { sound: SND.hurt, momentum: true, frames: [B(hurt, { pause: 1 }), B(idle[0])] });
    setSeq(c, SEQ.pickup, { key: 'p', sound: SND.pickup, frames: [B(fire, { pause: 3 }), B(idle[1], { pause: 2 })] });
    setSeq(c, SEQ.drop, { key: 'd', sound: SND.drop, frames: [B(fire, { pause: 3 })] });
    const move = (d: (typeof dirs)[number], x: number, y: number, joy: number) => ({
      key: ({ r: 'right', l: 'left', u: 'up', d: 'down' } as const)[d],
      momentum: true,
      joy: [joy, 0] as [number, number],
      sound: SND.thrust,
      frames: thrust[d].map((b) => B(b, { x, y })),
    });
    setSeq(c, SEQ.right, move('r', 1, 0, 3));
    setSeq(c, SEQ.left, move('l', -1, 0, 7));
    setSeq(c, SEQ.up, move('u', 0, -1, 1));
    setSeq(c, SEQ.down, move('d', 0, 1, 5));
    weapons(c, (n) => B(n.startsWith('fire') || n.startsWith('lance') ? fire : idle[1]), { fireY: 20 });
    setSeq(c, SEQ.dashR, {
      key: 'e',
      sound: SND.dash,
      bloc: itemBlock('dash'),
      momentum: true,
      norepeat: true,
      frames: [B(diag[0], { x: 7, pause: 2 }), B(thrust.r[2], { x: 4 })],
    });
    setSeq(c, SEQ.dashL, {
      key: 'q',
      sound: SND.dash,
      bloc: itemBlock('dash'),
      momentum: true,
      norepeat: true,
      frames: [B(diag[1], { x: -7, pause: 2 }), B(thrust.l[2], { x: -4 })],
    });
    setSeq(c, SEQ.hover, { key: 'f', sound: SND.hover, bloc: itemBlock('hover'), momentum: true, frames: [B(diag[2]), B(diag[3])] });
    setSeq(c, SEQ.hail, {
      key: 't',
      sound: SND.hail,
      norepeat: true,
      frames: [B(idle[1], { pause: 3 }), B(fire, { pause: 3 }), B(idle[1], { pause: 3 }), B(fire, { pause: 3 })],
    });
  } else if (kind === 'diver') {
    const R = [0, 1, 2].map((p) => one(drawDiver({ prop: p, bubbles: p + 1 })));
    const up = [0, 1, 2].map((p) => one(drawDiver({ prop: p, tilt: -1, bubbles: 2 })));
    const lamp = one(drawDiver({ lamp: true }));
    const idle = [one(drawDiver({ prop: 0 })), one(drawDiver({ prop: 0, bubbles: 1 })), one(drawDiver({ prop: 0, bubbles: 3 }))];
    const hurt = one(drawDiver({ hurt: true }));
    setSeq(c, SEQ.idle, { frames: [B(idle[0], { pause: 12 }), B(idle[1], { pause: 6 }), B(idle[2], { pause: 6 })] });
    setSeq(c, SEQ.die, { sound: SND.die, frames: [B(hurt, { pause: 2 }), ...boom.map((b) => B(b, { pause: 3 })), B(NONE, { pause: 10 })] });
    setSeq(c, SEQ.hurt, { sound: SND.hurt, momentum: true, frames: [B(hurt, { pause: 1 }), B(idle[0])] });
    setSeq(c, SEQ.pickup, { key: 'p', sound: SND.pickup, frames: [B(lamp, { pause: 3 }), B(idle[0], { pause: 2 })] });
    setSeq(c, SEQ.drop, { key: 'd', sound: SND.drop, frames: [B(lamp, { pause: 3 })] });
    setSeq(c, SEQ.right, { key: 'right', momentum: true, sound: SND.swim, joy: [3, 0], frames: R.map((b) => B(b, { x: 1, pause: 2 })) });
    setSeq(c, SEQ.left, { key: 'left', momentum: true, sound: SND.swim, joy: [7, 0], frames: R.map((b) => B(b, { x: -1, pause: 2, o: L })) });
    setSeq(c, SEQ.up, { key: 'up', momentum: true, joy: [1, 0], frames: up.map((b) => B(b, { y: -1, pause: 2 })) });
    setSeq(c, SEQ.down, { key: 'down', momentum: true, joy: [5, 0], frames: R.map((b) => B(b, { y: 1, pause: 2 })) });
    weapons(c, (n) => B(n.startsWith('fire') || n.startsWith('lance') ? lamp : idle[1]), { fireY: 20 });
    setSeq(c, SEQ.dashR, {
      key: 'e',
      sound: SND.dash,
      bloc: itemBlock('hydro'),
      momentum: true,
      norepeat: true,
      frames: [B(R[0], { x: 6 }), B(R[1], { x: 3 }), B(R[2], { pause: 2 })],
    });
    setSeq(c, SEQ.dashL, {
      key: 'q',
      sound: SND.dash,
      bloc: itemBlock('hydro'),
      momentum: true,
      norepeat: true,
      frames: [B(R[0], { x: -6, o: L }), B(R[1], { x: -3, o: L }), B(R[2], { o: L, pause: 2 })],
    });
    setSeq(c, SEQ.hover, {
      key: 'f',
      sound: SND.hover,
      bloc: itemBlock('hover'),
      momentum: true,
      frames: [B(idle[1], { pause: 2 }), B(idle[2], { pause: 2 })],
    });
    setSeq(c, SEQ.hail, { key: 't', sound: SND.hail, norepeat: true, frames: [B(lamp, { pause: 3 }), B(idle[0], { pause: 3 }), B(lamp, { pause: 3 })] });
  } else {
    const W = [0, 1, 2].map((w) => one(drawRover({ wheel: w, bounce: w === 1 ? 1 : 0 })));
    const idle = [one(drawRover({})), one(drawRover({ bounce: 1 }))];
    const flash = one(drawRover({ flash: true }));
    const spring = one(drawRover({ spring: true, wheel: 1 }));
    const hurt = one(drawRover({ hurt: true }));
    setSeq(c, SEQ.idle, { frames: [B(idle[0], { pause: 20 }), B(idle[1], { pause: 3 })] });
    setSeq(c, SEQ.die, { sound: SND.die, frames: [B(hurt, { pause: 2 }), ...boom.map((b) => B(b, { pause: 3 })), B(NONE, { pause: 10 })] });
    setSeq(c, SEQ.hurt, { sound: SND.hurt, momentum: true, frames: [B(hurt, { y: -5, pause: 1 }), B(idle[0])] });
    setSeq(c, SEQ.pickup, { key: 'p', sound: SND.pickup, frames: [B(idle[1], { pause: 3 }), B(idle[0], { pause: 2 })] });
    setSeq(c, SEQ.drop, { key: 'd', sound: SND.drop, frames: [B(idle[1], { pause: 3 })] });
    setSeq(c, SEQ.right, { key: 'right', sound: SND.rover, joy: [3, 0], frames: W.map((b) => B(b, { x: 7 })) });
    setSeq(c, SEQ.left, { key: 'left', sound: SND.rover, joy: [7, 0], frames: W.map((b) => B(b, { x: -7, o: L })) });
    setSeq(c, SEQ.up, {
      key: 'up',
      sound: SND.jump,
      bloc: itemBlock('spring'),
      momentum: true,
      norepeat: true,
      joy: [1, 0],
      frames: [B(spring, { y: -14 }), B(spring)],
    });
    setSeq(c, SEQ.down, { key: 'down', joy: [5, 0], frames: [B(idle[1], { pause: 2 })] });
    weapons(c, (n) => B(n.startsWith('fire') || n.startsWith('lance') ? flash : idle[0]), { fireY: 20 });
    setSeq(c, SEQ.dashR, {
      key: 'e',
      sound: SND.dash,
      bloc: itemBlock('dash'),
      momentum: true,
      norepeat: true,
      frames: [B(W[0], { x: 9 }), B(W[1], { x: 5 }), B(W[2], { pause: 2 })],
    });
    setSeq(c, SEQ.dashL, {
      key: 'q',
      sound: SND.dash,
      bloc: itemBlock('dash'),
      momentum: true,
      norepeat: true,
      frames: [B(W[0], { x: -9, o: L }), B(W[1], { x: -5, o: L }), B(W[2], { o: L, pause: 2 })],
    });
    setSeq(c, SEQ.hover, { key: 'f', sound: SND.hover, bloc: itemBlock('hover'), momentum: true, frames: [B(spring, { y: -2 }), B(idle[1], { y: -1 })] });
    setSeq(c, SEQ.hail, { key: 't', sound: SND.hail, norepeat: true, frames: [B(idle[1], { pause: 3 }), B(idle[0], { pause: 3 }), B(idle[1], { pause: 3 })] });
  }
  return { name: kind, chr: c, cbl: cb.full(), used: cb.blocks.length };
}
