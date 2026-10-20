// The four ways Max gets around, as .CHR/.CBL pairs: on foot (COURIER), the courier pod in
// space (POD), the diving bell under the seas (DIVER) and the rover (ROVER). They share
// sequence numbers, so ammunition counted in one carries over to the others.
import { Pixels, rng } from '../kit/pixels';
import { CLEAR, Mask, fill, shade } from './art';
import { S, WHITE, shared } from './palette';
import { CHARBL } from '../../web/src/formats/blocks';
import type { Character } from '../../web/src/formats/character';
import { INF_REPEAT } from '../../web/src/formats/character';
import { BlockList, NONE, character, setSeq, type F } from './chrkit';
import { MON, SEQ, SND, itemBlock } from './common';
import { drawCourier, split, type Pose } from './courier';
import { drawDiver, drawPod, drawRover } from './vehicles';
import { beam, blink, charge, dropping, dust, shielded, smoke, sonar, sparkles, splash, streak, turn } from './fx';

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

/**
 * The weapon sequences every vehicle has (the frames that fire are the same). Each starts
 * with a picture frame that lasts a tick: these sequences are uninterruptible, and PLAYGAME
 * only reads waiting keys when such a sequence stands on its first frame - a sequence
 * whose first frame fires (and so takes no time) would never let go of a held key.
 */
function weapons(c: Character, pose: (name: string) => F, extra: { fireY?: number } = {}): void {
  const fy = extra.fireY ?? 0;
  setSeq(c, SEQ.fire, { key: 'space', sound: SND.fire, joy: [9, 1], frames: [pose('fire'), { birth: MON.bolt, y: fy }, { ...pose('fire2'), pause: 3 }] });
  setSeq(c, SEQ.plasma, {
    key: 'z',
    sound: SND.plasma,
    bloc: itemBlock('plasma'),
    joy: [9, 2],
    frames: [pose('lance'), { birth: MON.plasma, y: fy }, { ...pose('lance2'), pause: 5 }],
  });
  setSeq(c, SEQ.nova, {
    key: 'x',
    sound: SND.nova,
    bloc: itemBlock('nova'),
    norepeat: true,
    frames: [pose('nova'), ...Array.from({ length: 8 }, (_, k) => ({ birth: MON.nova + k, y: fy })), { ...pose('nova2'), pause: 4 }],
  });
  setSeq(c, SEQ.shield, {
    key: 'c',
    sound: SND.shield,
    bloc: itemBlock('shield'),
    norepeat: true,
    frames: [
      { ...pose('shield'), pause: 2 },
      { birth: MON.shield, y: fy },
      { ...pose('shield2'), pause: 4 },
    ],
  });
  setSeq(c, SEQ.mine, {
    key: 'v',
    sound: SND.mine,
    bloc: itemBlock('mine'),
    norepeat: true,
    frames: [
      { ...pose('mine'), pause: 2 },
      { birth: MON.mine, y: 20 },
      { ...pose('mine2'), pause: 4 },
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
      { ...pose('medkit2'), pause: 3 },
    ],
  });
  setSeq(c, SEQ.flak, {
    key: 'w',
    sound: SND.flak,
    bloc: itemBlock('flak'),
    frames: [pose('flak'), { birth: MON.flakL, y: fy }, { birth: MON.nova, y: fy }, { birth: MON.flakR, y: fy }, { ...pose('flak'), pause: 4 }],
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
    key: 'p',
    sound: SND.pickup,
    joy: [5, 2],
    frames: [F('land', { pause: 1 }), F('kneel', { pause: 3 }), F('kneelItem', { pause: 3 })],
  });
  setSeq(c, SEQ.drop, { key: 'd', sound: SND.drop, frames: [F('kneelItem', { pause: 3 }), F('kneel', { pause: 2 })] });
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
  const B = (bottom: number, extra: Partial<F> = {}): F => ({ top: NONE, bottom, ...extra });
  const boomPics = [0, 1, 2, 3].map((k) => drawBoom(k, 20, 20));
  /** Named frames every vehicle provides for its weapon sequences. */
  const W: Record<string, number> = {};
  const weaponFrames = (base: Pixels, flash: Pixels) => {
    W.fire = one(flash);
    W.fire2 = one(sparkles(flash, 1, 'laser'));
    W.lance = one(sparkles(flash, 0, 'plasma'));
    W.lance2 = one(charge(flash, 1, 'plasma'));
    W.nova = one(charge(base, 0));
    W.nova2 = one(charge(base, 1));
    W.shield = one(shielded(base, 0));
    W.shield2 = one(shielded(base, 1));
    W.mine = one(dropping(base, 0, 'mine'));
    W.mine2 = one(dropping(base, 2, 'mine'));
    W.medkit = one(dropping(base, 0, 'cross'));
    W.medkit2 = one(sparkles(base, 2, 'heart'));
    W.flak = one(sparkles(base, 3, 'laser'));
  };
  const pose = (n: string) => B(W[n] ?? W.fire);

  if (kind === 'pod') {
    const dirs = ['r', 'l', 'u', 'd'] as const;
    const thrust = Object.fromEntries(dirs.map((d) => [d, [0, 1, 2].map((f) => one(drawPod(d, { flicker: f, glow: f & 1 })))])) as Record<
      (typeof dirs)[number],
      number[]
    >;
    const diag = Object.fromEntries(
      (['ur', 'ul', 'dr', 'dl'] as const).map((d) => [d, [0, 1].map((f) => one(drawPod(d, { flicker: f + 1, glow: f })))]),
    ) as Record<string, number[]>;
    const base = drawPod('idle', { glow: 1 });
    const idle = [one(drawPod('idle', { glow: 0 })), one(base), one(blink(base, 0)), one(blink(base, 1)), one(blink(base, 2))];
    const hurt = [one(drawPod('idle', { hurt: true })), one(smoke(drawPod('idle', {}), 0))];
    weaponFrames(
      base,
      drawPod('idle', { glow: 1 }).map((x, y, c2) => (x === 10 && y < 4 ? S('laser', 3) : c2)),
    );
    const tractor = [0, 1, 2].map((k) => one(beam(base, k)));
    const hail = [0, 1, 2].map((k) => one(sonar(base, k)));
    // the left dash is the right one mirrored (the flame ends up behind either way)
    const dashR = [one(streak(drawPod('r', { flicker: 2 }), 0)), one(streak(drawPod('r', { flicker: 1 }), 1))];
    const boom = [...boomPics.map((p) => one(p)), one(turn(smoke(base, 1), 1))];
    setSeq(c, SEQ.idle, {
      frames: [
        B(idle[0], { pause: 9 }),
        B(idle[1], { pause: 9 }),
        B(idle[2], { pause: 4 }),
        B(idle[1], { pause: 9 }),
        B(idle[3], { pause: 4 }),
        B(idle[4], { pause: 4 }),
      ],
    });
    const spin = one(turn(smoke(drawPod('ur', { flicker: 2 }), 2), 1));
    setSeq(c, SEQ.die, {
      sound: SND.die,
      frames: [
        B(hurt[0], { pause: 2 }),
        B(boom[4], { pause: 2 }),
        B(spin, { pause: 2 }),
        ...boom.slice(0, 4).map((b) => B(b, { pause: 3 })),
        B(NONE, { pause: 10 }),
      ],
    });
    setSeq(c, SEQ.hurt, { sound: SND.hurt, momentum: true, frames: [B(hurt[0], { pause: 1 }), B(hurt[1])] });
    const docked = one(sparkles(beam(base, 1), 2, 'gold'));
    setSeq(c, SEQ.pickup, { key: 'p', sound: SND.pickup, frames: [...tractor, docked].map((t) => B(t, { pause: 2 })) });
    setSeq(c, SEQ.drop, { key: 'd', sound: SND.drop, frames: [B(tractor[2], { pause: 2 }), B(tractor[0], { pause: 2 })] });
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
    weapons(c, pose, { fireY: 20 });
    setSeq(c, SEQ.dashR, {
      key: 'e',
      sound: SND.dash,
      bloc: itemBlock('dash'),
      momentum: true,
      norepeat: true,
      frames: [B(dashR[0], { x: 7, pause: 2 }), B(dashR[1], { x: 4 })],
    });
    setSeq(c, SEQ.dashL, {
      key: 'q',
      sound: SND.dash,
      bloc: itemBlock('dash'),
      momentum: true,
      norepeat: true,
      frames: [B(dashR[0], { x: -7, pause: 2, o: L }), B(dashR[1], { x: -4, o: L })],
    });
    // cruise: hold F to coast without the auto-brake, the diagonal jets ticking over
    setSeq(c, SEQ.hover, {
      key: 'f',
      sound: SND.hover,
      bloc: itemBlock('hover'),
      momentum: true,
      frames: [...diag.ur, ...diag.ul, ...diag.dr, ...diag.dl].map((b) => B(b)),
    });
    setSeq(c, SEQ.hail, { key: 't', sound: SND.hail, norepeat: true, frames: [...hail, ...hail].map((h) => B(h, { pause: 3 })) });
  } else if (kind === 'diver') {
    const R = [0, 1, 2].map((p) => one(drawDiver({ prop: p, bubbles: p + 1 })));
    const up = [0, 1, 2].map((p) => one(drawDiver({ prop: p, tilt: -1, bubbles: 2 })));
    const down = [0, 1, 2].map((p) => one(drawDiver({ prop: p, tilt: 1, bubbles: 1 })));
    const base = drawDiver({ lamp: true });
    const idle = [
      one(drawDiver({ prop: 0 })),
      one(drawDiver({ prop: 0, bubbles: 1 })),
      one(drawDiver({ prop: 0, bubbles: 3 })),
      one(base),
      one(blink(base, 2)),
      one(blink(base, 0)),
      one(blink(base, 1)),
      one(blink(base, 3)),
    ];
    const hurt = [one(drawDiver({ hurt: true })), one(smoke(drawDiver({}), 0)), one(smoke(drawDiver({}), 1))];
    weaponFrames(
      base,
      drawDiver({ lamp: true, prop: 1 }).map((x, y, c2) => (x > 17 && y > 8 && y < 12 ? WHITE : c2)),
    );
    const claw = [0, 1, 2, 3].map((k) => one(beam(base, k)));
    const ping = [0, 1, 2, 3].map((k) => one(sonar(base, k)));
    const dash = [0, 1, 2].map((k) => one(streak(drawDiver({ prop: k, bubbles: 4 }), k)));
    const splashes = [0, 1, 2].map((k) => one(splash(base, k)));
    const glow = [one(charge(base, 2)), one(shielded(base, 2))];
    const boom = [...boomPics.map((p) => one(p)), one(turn(drawDiver({ bubbles: 5 }), 2))];
    setSeq(c, SEQ.idle, {
      frames: [
        B(idle[0], { pause: 12 }),
        B(idle[1], { pause: 6 }),
        B(idle[2], { pause: 6 }),
        B(idle[3], { pause: 8 }),
        B(idle[4], { pause: 3 }),
        B(idle[5], { pause: 3 }),
        B(idle[6], { pause: 3 }),
        B(idle[7], { pause: 3 }),
        B(idle[3], { pause: 8 }),
      ],
    });
    setSeq(c, SEQ.die, {
      sound: SND.die,
      frames: [B(hurt[0], { pause: 2 }), B(boom[4], { pause: 3 }), ...boom.slice(0, 4).map((b) => B(b, { pause: 3 })), B(NONE, { pause: 10 })],
    });
    setSeq(c, SEQ.hurt, { sound: SND.hurt, momentum: true, frames: [B(hurt[0], { pause: 1 }), B(hurt[1]), B(hurt[2])] });
    setSeq(c, SEQ.pickup, { key: 'p', sound: SND.pickup, frames: claw.map((t) => B(t, { pause: 2 })) });
    setSeq(c, SEQ.drop, {
      key: 'd',
      sound: SND.drop,
      frames: [B(claw[2], { pause: 3 }), B(splashes[0], { pause: 2 }), B(splashes[2], { pause: 2 }), B(one(splash(drawDiver({ prop: 2 }), 3)), { pause: 2 })],
    });
    // the bell swims at a steady pace (water drags: no build-up of speed as in space)
    setSeq(c, SEQ.right, { key: 'right', sound: SND.swim, joy: [3, 0], frames: R.map((b) => B(b, { x: 4 })) });
    setSeq(c, SEQ.left, { key: 'left', sound: SND.swim, joy: [7, 0], frames: R.map((b) => B(b, { x: -4, o: L })) });
    const upLamp = one(drawDiver({ tilt: -1, lamp: true, prop: 1, bubbles: 3 }));
    const downLamp = one(drawDiver({ tilt: 1, lamp: true, prop: 2, bubbles: 4 }));
    setSeq(c, SEQ.up, { key: 'up', joy: [1, 0], frames: [...up, upLamp].map((b) => B(b, { y: -4 })) });
    setSeq(c, SEQ.down, { key: 'down', joy: [5, 0], frames: [...down, downLamp].map((b) => B(b, { y: 4 })) });
    weapons(c, pose, { fireY: 20 });
    setSeq(c, SEQ.dashR, {
      key: 'e',
      sound: SND.dash,
      bloc: itemBlock('hydro'),
      momentum: true,
      norepeat: true,
      frames: [B(dash[0], { x: 6 }), B(dash[1], { x: 3 }), B(dash[2], { pause: 2 })],
    });
    setSeq(c, SEQ.dashL, {
      key: 'q',
      sound: SND.dash,
      bloc: itemBlock('hydro'),
      momentum: true,
      norepeat: true,
      frames: [B(dash[0], { x: -6, o: L }), B(dash[1], { x: -3, o: L }), B(dash[2], { o: L, pause: 2 })],
    });
    setSeq(c, SEQ.hover, {
      key: 'f',
      sound: SND.hover,
      bloc: itemBlock('hover'),
      momentum: true,
      frames: [B(idle[1], { pause: 2 }), B(idle[2], { pause: 2 }), B(splashes[1], { pause: 2 }), B(glow[0], { pause: 2 }), B(glow[1], { pause: 2 })],
    });
    setSeq(c, SEQ.hail, { key: 't', sound: SND.hail, norepeat: true, frames: [...ping, ...ping].map((h) => B(h, { pause: 3 })) });
  } else {
    const wheel = [0, 1, 2, 3, 4, 5].map((w) => one(drawRover({ wheel: w, bounce: w === 1 || w === 4 ? 1 : 0 })));
    const base = drawRover({});
    const idle = [one(base), one(drawRover({ bounce: 1 })), one(blink(base, 0)), one(blink(base, 1)), one(blink(base, 2)), one(blink(base, 3))];
    const flash = drawRover({ flash: true });
    const spring = [
      one(drawRover({ spring: true, wheel: 1 })),
      one(drawRover({ spring: true, wheel: 2, bounce: 1 })),
      one(drawRover({ spring: true, wheel: 0, bounce: -1 })),
    ];
    const hurt = [one(drawRover({ hurt: true })), one(smoke(base, 0)), one(smoke(base, 1))];
    weaponFrames(base, flash);
    const claw = [0, 1, 2, 3].map((k) => one(beam(base, k)));
    const beacon = [0, 1, 2, 3].map((k) => one(sonar(base, k)));
    const dashR = [0, 1, 2].map((k) => one(streak(drawRover({ wheel: k }), k)));
    const brake = [0, 1, 2, 3].map((k) => one(dust(drawRover({ bounce: k === 1 ? 1 : 0, wheel: k }), k)));
    const hoverJets = [0, 1, 2].map((k) => one(sparkles(drawRover({ spring: true, bounce: -1 }), k, 'flame')));
    const tumble = [1, 2, 3].map((k) => one(turn(smoke(base, k - 1), k)));
    const boom = boomPics.map((p) => one(p));
    setSeq(c, SEQ.idle, {
      frames: [
        B(idle[0], { pause: 20 }),
        B(idle[1], { pause: 3 }),
        B(idle[2], { pause: 4 }),
        B(idle[3], { pause: 4 }),
        B(idle[4], { pause: 4 }),
        B(idle[5], { pause: 4 }),
        B(idle[0], { pause: 20 }),
      ],
    });
    setSeq(c, SEQ.die, {
      sound: SND.die,
      frames: [B(hurt[0], { pause: 2 }), ...tumble.map((b) => B(b, { pause: 2 })), ...boom.map((b) => B(b, { pause: 3 })), B(NONE, { pause: 10 })],
    });
    setSeq(c, SEQ.hurt, {
      sound: SND.hurt,
      momentum: true,
      frames: [B(hurt[0], { y: -5, pause: 1 }), B(hurt[1]), B(hurt[2]), B(one(smoke(drawRover({ bounce: 1 }), 2)))],
    });
    setSeq(c, SEQ.pickup, { key: 'p', sound: SND.pickup, frames: claw.map((t) => B(t, { pause: 2 })) });
    setSeq(c, SEQ.drop, { key: 'd', sound: SND.drop, frames: [B(claw[2], { pause: 3 }), B(idle[1], { pause: 2 })] });
    setSeq(c, SEQ.right, { key: 'right', sound: SND.rover, joy: [3, 0], frames: wheel.map((b) => B(b, { x: 7 })) });
    setSeq(c, SEQ.left, { key: 'left', sound: SND.rover, joy: [7, 0], frames: wheel.map((b) => B(b, { x: -7, o: L })) });
    const air = [0, 1, 2].map((k) => one(drawRover({ wheel: k, bounce: -1, spring: k === 1 })));
    setSeq(c, SEQ.up, {
      key: 'up',
      sound: SND.jump,
      bloc: itemBlock('spring'),
      momentum: true,
      norepeat: true,
      joy: [1, 0],
      frames: [B(spring[0], { y: -14 }), B(spring[1]), B(spring[2]), ...air.map((a) => B(a))],
    });
    setSeq(c, SEQ.down, { key: 'down', sound: SND.crouch, joy: [5, 0], frames: brake.map((b) => B(b, { pause: 2 })) });
    weapons(c, pose, { fireY: 20 });
    setSeq(c, SEQ.dashR, {
      key: 'e',
      sound: SND.dash,
      bloc: itemBlock('dash'),
      momentum: true,
      norepeat: true,
      frames: [B(dashR[0], { x: 9 }), B(dashR[1], { x: 5 }), B(dashR[2], { pause: 2 })],
    });
    setSeq(c, SEQ.dashL, {
      key: 'q',
      sound: SND.dash,
      bloc: itemBlock('dash'),
      momentum: true,
      norepeat: true,
      frames: [B(dashR[0], { x: -9, o: L }), B(dashR[1], { x: -5, o: L }), B(dashR[2], { o: L, pause: 2 })],
    });
    setSeq(c, SEQ.hover, {
      key: 'f',
      sound: SND.hover,
      bloc: itemBlock('hover'),
      momentum: true,
      frames: [B(hoverJets[0], { y: -2 }), B(hoverJets[1], { y: -1 }), B(hoverJets[2], { y: -2 })],
    });
    setSeq(c, SEQ.hail, { key: 't', sound: SND.hail, norepeat: true, frames: [...beacon, ...beacon].map((h) => B(h, { pause: 3 })) });
  }
  return { name: kind, chr: c, cbl: cb.full(), used: cb.blocks.length };
}
