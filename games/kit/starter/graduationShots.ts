// PNGs of what a graduation game shows, from its built disk (never written to it): the title and menu pictures,
// three frames of the sting, and (with a walk step) the player's real view from the recorded walkthrough on the engine.
//   cd web && npx vite-node ../games/kit/starter/graduationShots.ts <game id> <outDir> [prefix] [walkEvery]
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyFliFrame, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { replay } from '../walkthrough';

const [id, out, prefix = '', every] = process.argv.slice(2);
if (!id || !out) throw new Error('usage: graduationShots.ts <game id> <outDir> [prefix] [walkEvery]');
mkdirSync(out, { recursive: true });
const disk = new URL(`../../${id}/disk/`, import.meta.url);
const read = (n: string) => new Uint8Array(readFileSync(new URL(n, disk)));
const pic = (px: Uint8Array, w: number, h: number) => {
  const p = new Pixels(w, h);
  p.px.set(px);
  return p;
};
for (const n of ['title', 'menu']) {
  const g = decodeGif(read(`${n}.gif`));
  writePng(join(out, `${prefix}${id}-${n}.png`), pic(g.pixels, g.width, g.height), g.palette, 2);
}
for (const f of ['starter.fli', 'gradstng.fli']) {
  let bytes: Uint8Array;
  try {
    bytes = read(f);
  } catch {
    continue;
  }
  const anim = parseFli(bytes);
  const c = newFliCanvas(anim);
  for (let i = 0; i < anim.frameCount; i++) {
    applyFliFrame(anim, i, c);
    if ([10, 22, 34].includes(i)) writePng(join(out, `${prefix}${id}-sting${i}.png`), pic(c.pixels, anim.width, anim.height), c.palette, 2);
  }
}
if (every) {
  const walk = JSON.parse(readFileSync(new URL(`../../${id}/walkthrough.json`, import.meta.url), 'utf8'));
  let n = 0;
  let scene = -1;
  let mx = 0;
  await replay(id, walk, {
    onWorld: (w, s) => {
      scene = s;
      mx = w.mx;
    },
    onFrame: (screen, s) => {
      if (s < 2 || ++n % Number(every)) return;
      writePng(join(out, `${prefix}${id}-walk-s${scene}-x${String(mx).padStart(4, '0')}.png`), pic(screen.pixels, 320, 200), screen.palette, 2);
    },
  });
}
process.exit(0);
