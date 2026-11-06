// Draws the frames the manual's "How this level is made" pages show (the torches, the flag, the fall's three kinds of loop,
// the fire, the sparks) into manual.json, in the figures marked <figure data-frames="name">. Run it again whenever the art
// changes (it replaces what the figures hold), then format the file.
//   cd web && npx vite-node ../games/flicker/tools/manual.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { fillFigures, framesFigure } from '../../kit/starter/framesSvg';
import { FIRE, FIRE_TICKS, SPARKS, fireFrame, sparkFrame } from '../src/camp';
import { BODY_TICKS, LIP_TICKS, SPLASH_TICKS, bodyFrame, lipFrame, splashFrame } from '../src/falls';
import { FLAG_TICKS, flagFrames } from '../src/flag';
import { FLICKER_A, FLICKER_A_TICKS, FLICKER_B, FLICKER_B_TICKS, PULSE, PULSE_TICKS, torchFrame } from '../src/flames';
import { buildLevels } from '../src/levels';

const { levels } = buildLevels();
const [hall, falls, camp] = levels.map((l) => l.pal);
const hb = hall.c('sky', 3);
const fb = falls.c('sky', 3);
const cb = camp.c('sky', 3);
const ring = (name: string, ticks: readonly number[], words?: string[]) => ticks.map((t, k) => `${name}.${k}${words ? `: ${words[k]}` : ''}, ${t} ticks`);
const torch = (label: string[], shapes: typeof PULSE) =>
  framesFigure(
    hall,
    shapes.map((s, k) => ({ pic: torchFrame(hall, hb, s), label: label[k] })),
    3,
  );
const flag = flagFrames(hall, hb);
const cols = ['L', 'M'] as const;
const figures = {
  pulse: torch(ring('pulse', PULSE_TICKS), PULSE),
  flickerA: torch(ring('flameA', FLICKER_A_TICKS), FLICKER_A),
  flickerB: torch(ring('flameB', FLICKER_B_TICKS), FLICKER_B),
  flag: framesFigure(
    hall,
    [0, 1, 2, 3].flatMap((k) => [
      { pic: flag.a[k], label: `flagA.${k}` },
      { pic: flag.b[k], label: `flagB.${k}, ${FLAG_TICKS[k]} ticks` },
    ]),
    2,
  ),
  fall: framesFigure(
    falls,
    [0, 1, 2, 3].map((k) => ({ pic: bodyFrame(falls, 'M', k), label: `fallM.${k}, ${BODY_TICKS[k]} ticks` })),
    3,
  ),
  columns: framesFigure(
    falls,
    cols.map((c) => ({ pic: bodyFrame(falls, c, 0), label: `fall${c}.0` })),
    3,
  ),
  lip: framesFigure(
    falls,
    [0, 1, 2, 3].map((k) => ({ pic: lipFrame(falls, 'M', k, fb), label: `lipM.${k}, ${LIP_TICKS[k]} ticks` })),
    3,
  ),
  splash: framesFigure(
    falls,
    [0, 1, 2, 3].map((k) => ({ pic: splashFrame(falls, 'M', k), label: `splashM.${k}, ${SPLASH_TICKS[k]} ticks` })),
    3,
  ),
  fire: framesFigure(
    camp,
    FIRE.map((s, k) => ({ pic: fireFrame(camp, cb, s), label: `fire.${k}, ${FIRE_TICKS[k]} ticks` })),
    2,
  ),
  sparks: framesFigure(
    camp,
    SPARKS.flatMap((s, i) => s.path.map((at, k) => ({ pic: sparkFrame(camp, cb, at), label: `spark${i}.${k}, ${s.ticks[k]} ticks` }))),
    2,
  ),
};
const file = new URL('../manual.json', import.meta.url);
const manual = JSON.parse(readFileSync(file, 'utf8')) as { pages: { html: string }[] };
for (const page of manual.pages) page.html = fillFigures(page.html, figures);
writeFileSync(file, JSON.stringify(manual, null, 2) + '\n');
console.log('manual.json: frames drawn');
