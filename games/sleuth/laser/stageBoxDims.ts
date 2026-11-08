// Final Curtain's Stage Box (laser kit): every dimension, in millimeters, and the check that the mechanism works.
// Interior coordinates: x left to right (0..120), y front to back (0 = the front panel's inner face), z up (0 = the top of
// the stage floor, negative below it). Plates are 3 mm; everything scales from `t`.
//
// The mechanism ("peg-and-comb stack"): three plates stand side by side in floor slots behind the front panel, each
// sliding left. C (the dagger's bar) is first, then D1 (front curtain), then D2 (rear curtain). Each plate has a skirt
// hanging below the floor. The drawer carries a comb: three fingers lie in the gaps in front of the three skirts, so the
// drawer cannot leave the back until all three skirts have slid out of the fingers' way. A plate can only slide as far
// as the plate in front of it has already gone: a two-block peg on that plate sits in a slot in the next one.

export interface Dims {
  t: number;
  Wi: number; // interior width (x)
  Di: number; // interior depth (y)
  Wo: number;
  Do: number;
  Ho: number;
  zP: (z: number) => number; // interior z to the front panel's z from its bottom edge
  travel: number; // how far each plate slides
  play: number; // sliding clearance per side
  slotW: number;
  web: number;
  yC: number;
  yD1: number;
  yD2: number;
  yW: number; // the backdrop's front face
  yDF: number; // drawer front wall's front face
  fingerY: number[]; // front edge of each comb finger
  fingerW: number;
  skirt: { x0: number; x1: number; z0: number };
  tip: number; // comb finger tip x
  spine: [number, number];
  combTab: [number, number];
  plate: { x0: number; x1: number; h: number };
  pull: { x0: number; x1: number; top: number };
  pegX: number;
  pegW: number;
  pegZ: [number, number]; // C's peg, then D1's peg
  pegZ2: [number, number];
  window: { x0: number; x1: number; z0: number; z1: number; crown: number };
  lever: { x: number; z: number; R: number; half: number; post: number };
  cBar: { x0: number; x1: number; h: number };
  drawer: { w: number; h: number; len: number; x0: number; top: number };
  ceilZ: number; // ceiling underside
  floorTabs: [number, number][]; // y ranges of the floor and ceiling tabs
  wTabs: [number, number][]; // z ranges of the backdrop's tabs
}

export function dims(t = 3): Dims {
  const Wi = 120;
  const Di = 90;
  const play = 0.2;
  const slotW = t + 2 * play;
  const web = t + 0.6;
  const yC = web + slotW / 2;
  const pitch = slotW + web;
  const yD2 = yC + 2 * pitch;
  const yW = yD2 + slotW / 2 + web + 0.2;
  const dh = 22;
  const baseTop = -(t + 1 + dh + 1);
  const ceilZ = 84;
  const Ho = t + -baseTop + ceilZ + t + t;
  return {
    t,
    Wi,
    Di,
    Wo: Wi + 2 * t,
    Do: Di + 2 * t,
    Ho,
    zP: (z) => z - baseTop + t,
    travel: 26,
    play,
    slotW,
    web,
    yC,
    yD1: yC + pitch,
    yD2,
    yW,
    yDF: yW + t + 0.2,
    fingerY: [0.3, yC + slotW / 2 + 0.3, yC + pitch + slotW / 2 + 0.3],
    fingerW: t,
    skirt: { x0: 69, x1: 81, z0: -10 },
    tip: 78,
    spine: [92, 98],
    combTab: [90, 100],
    plate: { x0: 30, x1: 90, h: 80 },
    pull: { x0: 78, x1: 86, top: 97 },
    pegX: 73,
    pegW: 6,
    pegZ: [10, 15],
    pegZ2: [20, 25],
    window: { x0: 34, x1: 86, z0: 30, z1: 62, crown: 76 },
    lever: { x: 98, z: 40, R: 26, half: 30, post: 4 },
    cBar: { x0: 69, x1: 117, h: 28 },
    drawer: { w: 100, h: dh, len: Di + t - (yW + t + 0.2), x0: 10, top: -(t + 1) },
    ceilZ,
    floorTabs: [
      [8, 22],
      [62, 76],
    ],
    wTabs: [
      [6, 24],
      [56, 74],
    ],
  };
}

/** The mechanism's ordering rules, checked by walking every reachable position of (C, D1, D2) in 0.25 mm steps. */
export function checkMechanism(d: Dims) {
  const reach = d.travel + 0.3; // the floor slot lets a plate slide this far
  const lag = 0.2; // a plate can be this far ahead of the one in front of it
  const clear = d.skirt.x1 - d.tip + 0.2; // a skirt clears a finger once it has slid this far
  const overlap = d.skirt.x1 - d.tip;
  const step = 0.25;
  const n = Math.round(reach / step);
  const ok = (a: number, b: number, c: number) => b <= a + lag + 1e-9 && c <= b + lag + 1e-9 && a <= reach && b <= reach && c <= reach;
  const seen = new Set<number>();
  const id = (a: number, b: number, c: number) => (a * (n + 1) + b) * (n + 1) + c;
  const stack: [number, number, number][] = [[0, 0, 0]];
  seen.add(0);
  let firstUnlocked: [number, number, number] | undefined;
  let orderBroken = false;
  while (stack.length) {
    const [a, b, c] = stack.pop()!;
    const p = [a * step, b * step, c * step];
    if (p.every((v) => v >= clear)) firstUnlocked ??= [a, b, c];
    if (p[1] > lag + 1e-9 && p[0] < p[1] - lag - 1e-9) orderBroken = true; // D1 ahead of C
    if (p[2] > lag + 1e-9 && p[1] < p[2] - lag - 1e-9) orderBroken = true; // D2 ahead of D1
    for (const [da, db, dc] of [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ]) {
      const q: [number, number, number] = [a + da, b + db, c + dc];
      if (q.some((v) => v < 0 || v > n) || !ok(q[0] * step, q[1] * step, q[2] * step) || seen.has(id(...q))) continue;
      seen.add(id(...q));
      stack.push(q);
    }
  }
  // the lever: the post's travel in x and z over its swing, and the room the slot in C must give it
  const { R, half, post } = d.lever;
  const sw = Math.sin((half * Math.PI) / 180);
  const leverTravel = 2 * R * sw;
  const zSpan = R * (1 - Math.cos((half * Math.PI) / 180));
  return {
    reach,
    clear,
    overlap,
    unlockedReachable: !!firstUnlocked,
    unlockedAt: firstUnlocked?.map((v) => v * step),
    orderBroken,
    leverTravel,
    leverEnough: leverTravel >= d.travel - 1e-6,
    postSlot: { w: post + 2 * d.play, h: zSpan + post + 2 * d.play },
    states: seen.size,
  };
}
