// The Junior Lab dial module's checks, printed by shell.ts: the mechanism angle walk (a wind gives 0 pulses, a return gives n, every digit,
// with finger play), the printed spring's torque and strain, the return speed with a damper, flexure strains, the fits between moving parts
// and the six case screws. Everything here is arithmetic on dialParams.json and the stack's numbers (DM): it checks the design, not a print.
import { DM, springAt } from './dialModule';
import { dialParams as P, travelDeg, walk } from './dialMechanism';

export interface Report {
  lines: string[];
  failed: string[];
  data: Record<string, unknown>;
}

const f1 = (n: number) => n.toFixed(1);

/** Return time of the plate from a full wind, with the spring, a constant drag and a viscous disc (explicit Euler, 0.1 ms). */
function returnRun(eta: number, gapMm: number, dragNmm: number, preloadDeg: number, windDeg: number) {
  const inertia = 9e-6; // kg m2: the plate (74 mm, 10 holes, about 12 g of PETG) plus a little for the cam it drags
  const r0 = 6.9e-3;
  const r1 = 16.9e-3;
  const c = (eta * 2 * Math.PI * (r1 ** 4 - r0 ** 4)) / (4 * (gapMm * 1e-3)); // N m s: shear of the grease under the cam web
  let th = (windDeg * Math.PI) / 180;
  let w = 0;
  let t = 0;
  let wMax = 0;
  const dt = 1e-4;
  while (th > 0 && t < 30) {
    const T = springAt(preloadDeg + (th * 180) / Math.PI).torque * 1e-3 - dragNmm * 1e-3 - c * w; // N m
    w += (T / inertia) * dt;
    if (w < 0) w = 0;
    th -= w * dt;
    t += dt;
    wMax = Math.max(wMax, w);
  }
  return { t, wMax: (wMax * 180) / Math.PI, c };
}

export function dialReport(levels: Record<string, number>, screws: [number, number][], SCREW: { length: number; count: number; insertLen: number }): Report {
  const lines: string[] = [];
  const failed: string[] = [];
  const data: Record<string, unknown> = { levels };
  lines.push('\n== dial module (Junior Lab): mechanism check, one-way clutch');
  // 1. the angle walk
  const rows: string[] = [];
  let okAll = true;
  const margins: number[] = [];
  for (const d of [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]) {
    const n = d === 0 ? 10 : d;
    const t = travelDeg(d);
    const res: string[] = [];
    for (const play of [-0.5, 0, 3, 6, 10]) {
      const w = walk(t + play);
      const wantN = play < 0 ? n : n; // the finger stop is hit at the travel; short by 0.5 deg still passes the ridge (8 deg ahead)
      const ok = w.windPulses === 0 && w.returnPulses === wantN;
      okAll = okAll && ok;
      if (!ok) failed.push(`digit ${d} at play ${play}: wind ${w.windPulses}, return ${w.returnPulses}`);
      if (play === 0) margins.push(w.lastPulseFromRestDeg);
      res.push(`${w.windPulses}/${w.returnPulses}`);
    }
    rows.push(`digit ${d}: travel ${t} deg, ${n} pitches; wind/return pulses at finger play -0.5, 0, 3, 6, 10 deg: ${res.join('  ')}`);
  }
  lines.push(...rows.map((r) => '  ' + r));
  // short and long: a finger that stops 9 deg short of the stop loses a pulse (the pawl has not crossed the last ridge), as it should
  const short = walk(travelDeg(5) - 9);
  lines.push(`  stopping 9 deg short of the finger stop gives ${short.returnPulses} pulses instead of 5 (the pawl never crossed the last ridge)`);
  if (short.returnPulses !== 4) failed.push('a short wind should lose one pulse');
  lines.push(
    `  the last pulse of a return closes at least ${f1(Math.min(...margins))} deg of plate travel before the off-normal switch opens (the firmware also holds the off-normal level for 15 ms)`,
  );
  lines.push(
    `  pulse closed window ${P.pulseClosedFromDeg}..${P.pulseClosedToDeg} deg of every ${P.pitchDeg}; hold-back coast ${P.holdBackSnapDeg} deg (no window there); wind margin: the pawl crosses ridge k at ${P.pitchDeg}k - ${P.holdBackSnapDeg} deg`,
  );
  data.walk = { ok: okAll };

  // 2. the printed spring
  lines.push('printed spiral spring (PETG, E = 2000 N/mm2; PLA is not recommended: it creeps and cracks):');
  const s = DM.spring;
  const rest = springAt(s.preloadDeg);
  const full = springAt(s.preloadDeg + 300);
  lines.push(
    `  strip ${s.t} x ${s.h} mm, pitch ${s.pitch}, ${s.turns} turns, length ${f1(rest.length)} mm; torque ${f1(rest.torque)} N mm at rest (${s.preloadDeg} deg preload), ${f1(full.torque)} N mm fully wound; strain at full wind ${full.strainPct.toFixed(2)} % (PETG about 2 %, PLA about 1 %)`,
  );
  lines.push(
    `  finger force at the ring radius ${P.ringR} mm: ${(rest.torque / P.ringR).toFixed(2)} N at rest, ${(full.torque / P.ringR).toFixed(2)} N fully wound (a metal torsion spring seat is the fallback)`,
  );
  if (full.strainPct > 2.5) failed.push(`spring strain ${full.strainPct.toFixed(2)} % is above the PETG limit`);
  data.spring = { restNmm: rest.torque, fullNmm: full.torque, strainPct: full.strainPct, lengthMm: rest.length };

  // 3. return speed with a viscous disc under the cam web (guess: grease, 0.4 mm gap) and friction from the leaves
  lines.push(
    'return speed (estimate: spring, 5 N mm of friction from the leaves and pivot, a grease film of the viscosity shown under the cam web, gap 0.4 mm):',
  );
  const speeds: Record<string, unknown>[] = [];
  for (const eta of [5, 10, 20, 40]) {
    const r = returnRun(eta, 0.4, 5, s.preloadDeg, 300);
    const ppsMax = r.wMax / P.pitchDeg;
    const mean = 300 / r.t / P.pitchDeg;
    const okRate = ppsMax <= P.returnRateDegPerS[1] / P.pitchDeg + 0.5 && mean >= P.returnRateDegPerS[0] / P.pitchDeg - 0.5;
    lines.push(
      `  grease ${eta} Pa s: 300 deg in ${(r.t * 1000).toFixed(0)} ms, mean ${mean.toFixed(1)} pulses/s, peak ${ppsMax.toFixed(1)} pulses/s${okRate ? '  <-- inside 8 to 15 per second' : ''}`,
    );
    speeds.push({ etaPas: eta, ms: r.t * 1000, meanPps: mean, peakPps: ppsMax });
  }
  lines.push("  (the grease viscosity and the leaves' friction are guesses: the first print decides; thin it or add a shim to change the film)");
  data.speed = speeds;

  // 4. flexure strains: 1.5 t y / L^2
  const strain = (t: number, y: number, L: number) => (150 * t * y) / (L * L);
  const pt = (deg: number, rad: number): [number, number] => [rad * Math.sin((deg * Math.PI) / 180), -rad * Math.cos((deg * Math.PI) / 180)];
  const path = [pt(80, 5.8), pt(110, 10.0), pt(155, 17.1)];
  const pawlL = Math.hypot(path[1][0] - path[0][0], path[1][1] - path[0][1]) + Math.hypot(path[2][0] - path[1][0], path[2][1] - path[1][1]);
  const flex = [
    ['plate pawl (1.6 thick)', strain(1.6, 17.1 - DM.camCrest, pawlL), pawlL],
    ['hold-back leaf (1.6 thick)', strain(1.6, 0.3 + 0.8, 13), 13],
    ['brake leaf (1.6 thick)', strain(1.6, 0.8, 13), 13],
  ] as const;
  for (const [n, e, L] of flex) {
    lines.push(`  ${n}: arm ${f1(L)} mm, strain ${e.toFixed(2)} % at the crest (flat-printed, bends in the layer plane)`);
    if (e > 2.0) failed.push(`${n} strain ${e.toFixed(2)} %`);
  }

  // 5. fits between the parts (mm, from the drawn dimensions)
  const fits: [string, number][] = [
    ['plate underside to the cam wheel top', DM.plateBottom - DM.camTop],
    ['plate pawl bottom (z 8.0) to the cam web top', 8.0 - DM.camWebTop],
    ['cam web bottom to the spring top (the grease film)', DM.camBottom - DM.springTop],
    ['SW2 body face (r 24.0) to the lobe peak (r 23.6)', 24.0 - (DM.camOuter + 1.0)],
    ['SW2 body top (z 10.9) to the plate underside', DM.plateBottom - (DM.swCenterZ + 3)],
    ['hub tube (r 6.2) to the cam web bore (r 6.9)', 6.9 - 6.2],
    ['post (r 4.2) to the hub bore (r 4.5)', 4.5 - DM.postR],
    ['bushing top to the washer-side lip: free lift of the plate', 0.6],
    ['rest post (r 35.0) to the off-normal wall (r 35.5)', 35.5 - 35.0],
    ['pedestal tops (z 8.6) to the rest dog (z 9.0)', 9.0 - 8.6],
    ['finger plate rim (r 37) to the cover opening (r 38.2)', 38.2 - 37],
    ['dial base rim (r 43.2) to the case wall inside', 49.5 - 43.2 + 0.3],
    ['dial base to the battery holder (the base is its lid)', 0.2],
    ['SW3 body top (z 6.7) to the wall bottom (z 6.5): press, must be < 0.25 travel', 6.7 - 6.5],
  ];
  lines.push('fits of the moving parts (mm; the 1 mm lead/body rule is the clearance table below):');
  for (const [n, g] of fits) lines.push(`  ${g.toFixed(2).padStart(5)}  ${n}`);
  data.fits = fits;

  // 6. the six case screws
  lines.push(
    `case screws: ${SCREW.count} x M3 x ${SCREW.length}, heads on the back, into M3 heat-set inserts (${SCREW.insertLen} mm) in six bosses of the front cover:`,
  );
  screws.forEach(([x, z], i) =>
    lines.push(`  ${i < 2 ? 'top corner (through the board hole)' : i < 4 ? 'board lower hole' : 'lower outer corner'}: x ${f1(x)}, z ${f1(z)}`),
  );
  lines.push(
    `  head seat y ${f1(levels.fbB)}, tip y ${f1(levels.fbB + SCREW.length)}, insert mouth y 1.6 (the board's front face), cover roof underside y ${f1(levels.Hf - 2.2)}`,
  );
  data.screws = screws;
  return { lines, failed, data };
}
