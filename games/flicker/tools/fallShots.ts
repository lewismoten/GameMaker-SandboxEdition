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
if (!Number.isSafeInteger(every) || every <= 0) throw new Error('every must be a positive integer');
mkdirSync(out, { recursive: true });
const walk = JSON.parse(readFileSync(new URL('../walkthrough.json', import.meta.url), 'utf8'));
let mx = 0;
let my = 0;
let n = 0;
await replay('flicker', walk, {
  onWorld: (w) => {
    mx = w.mx;
    my = w.my;
  },
  onFrame: (screen, scene) => {
    if (++n % every || scene !== 3) return; // The Falls is scene 3.
    const px = new Pixels(320, 200);
    px.px.set(screen.pixels);
    writePng(join(out, `s${scene}-f${String(n).padStart(5, '0')}-mx${mx}-my${my}.png`), px, screen.palette, 2);
  },
});
process.exit(0);
