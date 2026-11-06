// Actual 320x200 PLAYGAME-port frames from the recorded walkthrough, including title, signs and both palettes.
// No predicted animation or posed hero. The two close frames in each scene show the falling/rippling pictures change.
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { replay } from '../../kit/walkthrough';
import type { Walkthrough } from '../../../web/src/walkthrough/format';
const out = process.argv[2];
if (!out) throw new Error('usage: shots.ts <outDir>');
mkdirSync(out, { recursive: true });
const walk = JSON.parse(readFileSync(new URL('../walkthrough.json', import.meta.url), 'utf8')) as Walkthrough;
const counts = new Map<number, number>();
let frame = 0;
const r = await replay('rain', walk, {
  onFrame(screen, scene) {
    frame++;
    const n = (counts.get(scene) ?? 0) + 1;
    counts.set(scene, n);
    if ((scene === undefined && frame === 160) || ([2, 3, 4].includes(scene) && [180, 184, 330].includes(n))) {
      const pic = new Pixels(320, 200);
      pic.px.set(screen.pixels);
      writePng(join(out, scene === undefined ? 'title.png' : `scene-${scene}-frame-${n}.png`), pic, screen.palette, 3);
    }
  },
});
if (!r.won || r.error) throw new Error(`shot replay did not win: ${String(r.error)}`);
console.log(`rain: actual replay frames in ${out}; scenes ${r.scenes.join(' ')}`);
