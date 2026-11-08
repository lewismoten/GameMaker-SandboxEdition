// PNGs of what the player sees near the waterfall (never on the disk), from the built walkthrough on the real engine.
//   cd web && npx vite-node ../games/flicker/tools/fallShots.ts <outDir> [every=25]
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { replay } from '../../kit/walkthrough';

const out = process.argv[2];
if (!out) throw new Error('usage: fallShots.ts <outDir> [every]');
const every = Number(process.argv[3] ?? 25);
mkdirSync(out, { recursive: true });
const walk = JSON.parse(readFileSync(new URL('../walkthrough.json', import.meta.url), 'utf8'));
let mx = 0;
let my = 0;
let sc = -1;
let n = 0;
await replay('flicker', walk, {
  onWorld: (w, scene) => {
    mx = w.mx;
    my = w.my;
    sc = scene;
  },
  onFrame: (screen) => {
    if (++n % every) return;
    const px = new Pixels(320, 200);
    px.px.set(screen.pixels);
    writePng(join(out, `s${sc}-f${String(n).padStart(5, '0')}-mx${mx}-my${my}.png`), px, screen.palette, 2);
  },
});
process.exit(0);
