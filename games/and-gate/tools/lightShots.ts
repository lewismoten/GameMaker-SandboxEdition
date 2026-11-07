// PNGs of what the player sees around the moment the lamp lights and its light drops (never on the disk), from the
// built walkthrough on the real engine: the frame the light appears, then a few frames after.
//   cd web && npx vite-node ../games/and-gate/tools/lightShots.ts <outDir>
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { replay } from '../../kit/walkthrough';
import { FALLING } from '../src/monsters';

const out = process.argv[2];
if (!out) throw new Error('usage: lightShots.ts <outDir>');
mkdirSync(out, { recursive: true });
const walk = JSON.parse(readFileSync(new URL('../walkthrough.json', import.meta.url), 'utf8'));
let frame = 0;
let level = 0;
let lastScene = -1;
let sceneStart = 0;
const marks: Record<number, number> = {};
const wanted = [0, 10, 20, 30, 45, 70];
const want = new Map<number, string>();
await replay('and-gate', walk, {
  onWorld: (w, scene, f) => {
    frame = f;
    if (scene !== lastScene) {
      lastScene = scene;
      level++;
      sceneStart = f;
    }
    // the first frames of a scene may still hold the last level's monsters
    const lit = f - sceneStart < 30 ? 0 : w.mm.filter((m) => m.monnum === FALLING).length;
    if (lit > 0 && marks[level] === undefined) {
      marks[level] = f;
      for (const d of wanted) want.set(f + d, `L${level}-drop${d < 0 ? '-' : '+'}${String(Math.abs(d)).padStart(3, '0')}`);
    }
  },
  onFrame: (screen) => {
    const name = want.get(frame);
    if (!name) return;
    const px = new Pixels(320, 200);
    px.px.set(screen.pixels);
    writePng(join(out, `${name}.png`), px, screen.palette, 3);
  },
});
console.log('marks', marks);
process.exit(0);
