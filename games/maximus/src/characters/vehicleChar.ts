// POD, DIVER and ROVER (.CHR/.CBL): the vehicles, one block tall, with the effects painted
// over them (shield bubbles, tractor beams, speed streaks, sonar rings, dust, splashes).
import { Pixels } from '../../../kit/pixels';
import { S, WHITE } from '../art/palette';
import { CHARBL } from '../../../../web/src/formats/blocks';
import { BlockList, NONE, character, setSeq, type F } from './chrkit';
import { SEQ, SND, itemBlock } from '../ids';
import { drawDiver, drawPod, drawRover } from '../sprites/vehicles';
import { beam, blink, charge, dropping, dust, shielded, smoke, sonar, sparkles, splash, streak, turn } from '../sprites/fx';
import { L, drawBoom, meters, type CharSet, weapons } from './charShared';

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
    setSeq(c, SEQ.drop, { key: 'o', sound: SND.drop, frames: [B(tractor[2], { pause: 2 }), B(tractor[0], { pause: 2 })] });
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
      key: 'o',
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
    setSeq(c, SEQ.drop, { key: 'o', sound: SND.drop, frames: [B(claw[2], { pause: 3 }), B(idle[1], { pause: 2 })] });
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
