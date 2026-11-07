// Plays a standing jump and a running jump on the built disk and prints, per tick, the hero's sequence, frame, lower block and height.
// With an output folder it also writes jump-strip.png: one picture per tick (standing jump above, running jump below, on grass).
//   cd web && npx vite-node ../games/shadows/tools/jumpProbe.ts [outDir]
import { join } from 'node:path';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { writePng } from '@lewismoten/gamemaker-sandbox-tools/kit/png';
import { heroPicture } from '../../kit/starter/hero';
import { groundColors } from '../src/blocks';
import { buildAssets } from '../src/assets';
import { buildLevels } from '../src/levels';
import { SCAN } from '../../kit/starter/ids';
import { GameSim } from './sim';

const { pal } = buildLevels();
const hero = buildAssets(pal).solid.hero;
const names = [...hero.index.keys()];
const out = process.argv[2];
const TICKS = 32;
const strip = new Pixels(TICKS * 22, 2 * 112, groundColors(pal, 'grass').base);
async function probe(label: string, keys: number[], ticks: number, row: number): Promise<void> {
  const sim = new GameSim(undefined, 1);
  for (let i = 0; i < 20; i++) await sim.tick();
  console.log(`--- ${label}`);
  const rows: string[] = [];
  for (let t = 0; t < ticks; t++) {
    if (t === 2) for (const k of keys) sim.press(k);
    if (t === 3) sim.release(SCAN.space); // a quick tap
    await sim.tick();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (sim as any).w.chr;
    const fr = c.sequences[c.cseq].frames[c.cframe];
    strip.rect(t * 22, row * 112 + 104, 22, 8, groundColors(pal, 'grass').dark);
    const lift = 19 * 20 - (c.y[0] * 20 + c.y[1]);
    if (fr) strip.blit(heroPicture(hero, names[fr.pic1] ?? 'stand.top', names[fr.pic2]), t * 22 + 1 + (c.x[0] - 13) * 0, row * 112 + 64 - lift, 255);
    rows.push(`${t} seq${c.cseq} f${c.cframe} ${names[fr?.pic2] ?? fr?.pic2} y=${c.y[0]}.${c.y[1]} x=${c.x[0]}.${c.x[1]}`);
  }
  console.log(rows.join('\n'));
}
await probe('standing', [SCAN.space], TICKS, 0);
await probe('running', [SCAN.right, SCAN.space], TICKS, 1);
if (out) writePng(join(out, 'jump-strip.png'), strip, pal.pal, 3);
